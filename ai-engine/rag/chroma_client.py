"""
Minimal ChromaDB HTTP client using httpx.

Replaces the full `chromadb` Python package (which drags in pulsar-client,
kubernetes, opentelemetry-*, chroma-hnswlib, etc.) with lightweight REST
calls. Compatible with ChromaDB server 0.4.x.
"""
import httpx
from typing import Dict, List


class ChromaCollection:
    def __init__(self, base_url: str, collection_id: str, http: httpx.Client):
        self._url = base_url
        self._id = collection_id
        self._http = http

    def add(self, ids: List[str], embeddings: List[List[float]],
            documents: List[str], metadatas: List[Dict]) -> None:
        self._http.post(
            f"{self._url}/api/v1/collections/{self._id}/add",
            json={
                "ids": ids,
                "embeddings": embeddings,
                "documents": documents,
                "metadatas": metadatas,
            },
            timeout=120.0,
        ).raise_for_status()

    def query(self, query_embeddings: List[List[float]], n_results: int,
              include: List[str]) -> Dict:
        resp = self._http.post(
            f"{self._url}/api/v1/collections/{self._id}/query",
            json={
                "query_embeddings": query_embeddings,
                "n_results": n_results,
                "include": include,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()

    def count(self) -> int:
        resp = self._http.get(
            f"{self._url}/api/v1/collections/{self._id}/count",
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()


class ChromaHttpClient:
    """
    Lightweight drop-in replacement for chromadb.HttpClient.
    Uses only httpx for HTTP calls — no chromadb package required.
    """

    def __init__(self, host: str = "localhost", port: int = 8000):
        self._base = f"http://{host}:{port}"
        self._http = httpx.Client(timeout=httpx.Timeout(30.0))

    def delete_collection(self, name: str) -> None:
        resp = self._http.delete(
            f"{self._base}/api/v1/collections/{name}",
            timeout=10.0,
        )
        if resp.status_code == 404:
            return  # already gone — that's fine
        resp.raise_for_status()

    def create_collection(self, name: str) -> ChromaCollection:
        resp = self._http.post(
            f"{self._base}/api/v1/collections",
            json={"name": name, "get_or_create": False},
            timeout=10.0,
        )
        resp.raise_for_status()
        return ChromaCollection(self._base, resp.json()["id"], self._http)

    def get_collection(self, name: str) -> ChromaCollection:
        resp = self._http.get(
            f"{self._base}/api/v1/collections/{name}",
            timeout=10.0,
        )
        resp.raise_for_status()
        return ChromaCollection(self._base, resp.json()["id"], self._http)
