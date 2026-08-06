import os
import logging
from typing import List, Dict
from rag.chroma_client import ChromaHttpClient
from fastembed import TextEmbedding

logger = logging.getLogger(__name__)

CHROMA_HOST = os.environ.get('CHROMA_HOST', 'localhost')
CHROMA_PORT = int(os.environ.get('CHROMA_PORT', '8001'))
CHROMA_SSL = os.environ.get('CHROMA_SSL', 'false').lower() == 'true'


class CodeRetriever:
    def __init__(self):
        # fastembed downloads the ONNX model on first use and caches it
        self.model = TextEmbedding('sentence-transformers/all-MiniLM-L6-v2')
        self.chroma = ChromaHttpClient(host=CHROMA_HOST, port=CHROMA_PORT, ssl=CHROMA_SSL)

    async def search(self, repo_id: str, query: str, k: int = 5) -> List[Dict]:
        try:
            collection = self.chroma.get_collection(f"repo_{repo_id}")
        except Exception:
            logger.warning(f"Collection not found for repo {repo_id}")
            return []

        # fastembed returns a generator; take the first (and only) embedding
        embedding = next(iter(self.model.embed([query]))).tolist()
        results = collection.query(
            query_embeddings=[embedding],
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
