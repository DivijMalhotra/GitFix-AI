import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging

from rag.indexer import RepositoryIndexer
from rag.retriever import CodeRetriever
from llm.analyzer import BugAnalyzer
from llm.chat import DebugChat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Debugger Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

indexer = RepositoryIndexer()
retriever = CodeRetriever()
analyzer = BugAnalyzer()
chat_engine = DebugChat()


# ─── Models ───────────────────────────────────────────────

class IndexRequest(BaseModel):
    repo_id: str
    owner: str
    name: str
    github_token: str
    default_branch: str = "main"

class AnalyzeRequest(BaseModel):
    session_id: str
    repo_id: str
    error_message: str
    stack_trace: Optional[str] = None
    logs: Optional[str] = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    repo_id: str
    messages: List[ChatMessage]
    context: Optional[dict] = None


# ─── Routes ───────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-engine"}


@app.post("/index")
async def index_repository(req: IndexRequest):
    """Clone repo and store code embeddings in vector DB."""
    try:
        logger.info(f"Indexing repo: {req.owner}/{req.name}")
        result = await indexer.index(
            repo_id=req.repo_id,
            owner=req.owner,
            name=req.name,
            github_token=req.github_token,
            default_branch=req.default_branch,
        )
        return result
    except Exception as e:
        logger.error(f"Indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
async def analyze_bug(req: AnalyzeRequest):
    """Retrieve relevant code and analyze bug with LLM."""
    try:
        logger.info(f"Analyzing bug for repo {req.repo_id}")

        # 1. Semantic search for relevant code
        query = f"{req.error_message}\n{req.stack_trace or ''}"
        chunks = await retriever.search(repo_id=req.repo_id, query=query, k=8)

        if not chunks:
            raise HTTPException(status_code=400, detail="No indexed code found. Please index the repository first.")

        # 2. LLM analysis + patch generation
        result = await analyzer.analyze(
            error_message=req.error_message,
            stack_trace=req.stack_trace,
            logs=req.logs,
            code_chunks=chunks,
        )

        return {
            "analysis": result["analysis"],
            "patch": result["patch"],
            "relevantChunks": chunks,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(req: ChatRequest):
    """Conversational debugging with code context."""
    try:
        latest_message = req.messages[-1].content if req.messages else ""
        chunks = await retriever.search(repo_id=req.repo_id, query=latest_message, k=5)

        response = await chat_engine.chat(
            messages=[{"role": m.role, "content": m.content} for m in req.messages],
            code_chunks=chunks,
            context=req.context,
        )
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/index/{repo_id}")
async def delete_index(repo_id: str):
    """Remove all embeddings for a repository."""
    try:
        await indexer.delete(repo_id=repo_id)
        return {"message": f"Index deleted for repo {repo_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
