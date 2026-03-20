import os
import logging
from typing import List, Dict
import chromadb
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

CHROMA_HOST = os.environ.get('CHROMA_HOST', 'localhost')
CHROMA_PORT = int(os.environ.get('CHROMA_PORT', '8001'))


class CodeRetriever:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

    async def search(self, repo_id: str, query: str, k: int = 5) -> List[Dict]:
        try:
            collection = self.chroma.get_collection(f"repo_{repo_id}")
        except Exception:
            logger.warning(f"Collection not found for repo {repo_id}")
            return []

        embedding = self.model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=embedding,
            n_results=min(k, collection.count()),
            include=['documents', 'metadatas', 'distances'],
        )

        chunks = []
        if results and results['ids']:
            for i, doc_id in enumerate(results['ids'][0]):
                meta = results['metadatas'][0][i]
                distance = results['distances'][0][i]
                score = 1 - distance  # cosine similarity

                chunks.append({
                    'filePath': meta.get('filePath', ''),
                    'content': results['documents'][0][i],
                    'startLine': meta.get('startLine', 0),
                    'endLine': meta.get('endLine', 0),
                    'language': meta.get('language', ''),
                    'score': round(score, 4),
                })

        # Sort by relevance score descending
        chunks.sort(key=lambda x: x['score'], reverse=True)
        return chunks[:5]
