import os
import asyncio
import aiofiles
import logging
from pathlib import Path
from typing import List, Dict
import chromadb
from sentence_transformers import SentenceTransformer
import git

logger = logging.getLogger(__name__)

# File extensions to index
SUPPORTED_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs',
    '.cpp', '.c', '.h', '.cs', '.rb', '.php', '.swift', '.kt',
    '.vue', '.svelte', '.html', '.css', '.scss', '.json', '.yaml',
    '.yml', '.toml', '.md', '.sh', '.bash', '.env.example',
}

SKIP_DIRS = {
    'node_modules', '.git', '__pycache__', '.venv', 'venv',
    'dist', 'build', '.next', 'coverage', '.pytest_cache',
    'vendor', 'target', 'out', '.idea', '.vscode',
}

CLONE_BASE = os.environ.get('CLONE_BASE', '/tmp/repos')
CHROMA_HOST = os.environ.get('CHROMA_HOST', 'localhost')
CHROMA_PORT = int(os.environ.get('CHROMA_PORT', '8001'))


class RepositoryIndexer:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)

    async def index(self, repo_id: str, owner: str, name: str,
                    github_token: str, default_branch: str = 'main') -> Dict:
        clone_path = Path(CLONE_BASE) / repo_id
        clone_path.parent.mkdir(parents=True, exist_ok=True)

        # Clone or pull
        repo_url = f"https://x-access-token:{github_token}@github.com/{owner}/{name}.git"
        if clone_path.exists():
            logger.info(f"Pulling existing repo at {clone_path}")
            repo = git.Repo(clone_path)
            repo.remotes.origin.pull(default_branch)
        else:
            logger.info(f"Cloning {owner}/{name} to {clone_path}")
            git.Repo.clone_from(repo_url, clone_path, depth=1, branch=default_branch)

        # Collect files
        files = self._collect_files(clone_path)
        logger.info(f"Found {len(files)} files to index")

        # Chunk files
        chunks = []
        for file_path in files:
            file_chunks = await self._chunk_file(file_path, clone_path)
            chunks.extend(file_chunks)

        logger.info(f"Generated {len(chunks)} chunks")

        # Embed and store
        collection = self._get_or_create_collection(repo_id)
        await self._store_chunks(collection, chunks)

        return {
            'fileCount': len(files),
            'chunkCount': len(chunks),
            'clonePath': str(clone_path),
        }

    async def delete(self, repo_id: str):
        try:
            self.chroma.delete_collection(f"repo_{repo_id}")
        except Exception:
            pass

    def _collect_files(self, base_path: Path) -> List[Path]:
        files = []
        for path in base_path.rglob('*'):
            if path.is_file():
                # Skip unwanted directories
                parts = set(path.relative_to(base_path).parts)
                if parts & SKIP_DIRS:
                    continue
                if path.suffix in SUPPORTED_EXTENSIONS:
                    if path.stat().st_size < 500_000:  # skip files > 500KB
                        files.append(path)
        return files

    async def _chunk_file(self, file_path: Path, base_path: Path) -> List[Dict]:
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = await f.read()
        except Exception:
            return []

        relative_path = str(file_path.relative_to(base_path))
        chunks = []

        # Split into chunks of ~50 lines with 10-line overlap
        lines = content.split('\n')
        chunk_size = 50
        overlap = 10

        for i in range(0, len(lines), chunk_size - overlap):
            chunk_lines = lines[i:i + chunk_size]
            chunk_content = '\n'.join(chunk_lines)
            if chunk_content.strip():
                chunks.append({
                    'id': f"{relative_path}::{i}",
                    'filePath': relative_path,
                    'content': chunk_content,
                    'startLine': i + 1,
                    'endLine': min(i + chunk_size, len(lines)),
                    'language': file_path.suffix.lstrip('.'),
                })

        return chunks

    async def _store_chunks(self, collection, chunks: List[Dict]):
        if not chunks:
            return

        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            texts = [c['content'] for c in batch]
            embeddings = self.model.encode(texts, show_progress_bar=False).tolist()

            collection.add(
                ids=[c['id'] for c in batch],
                embeddings=embeddings,
                documents=texts,
                metadatas=[{
                    'filePath': c['filePath'],
                    'startLine': c['startLine'],
                    'endLine': c['endLine'],
                    'language': c['language'],
                } for c in batch],
            )

    def _get_or_create_collection(self, repo_id: str):
        name = f"repo_{repo_id}"
        try:
            self.chroma.delete_collection(name)
        except Exception:
            pass
        return self.chroma.create_collection(name)
