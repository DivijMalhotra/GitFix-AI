# 🤖 AI GitHub Debugging Assistant

An AI-powered debugging platform that analyzes bugs from GitHub repositories, identifies root causes, generates fixes, and automatically creates pull requests.

## Architecture

```
Frontend (Next.js 14)     →  Port 3000
Backend API (Node/Express) →  Port 4000
AI Engine (Python/FastAPI) →  Port 8000
Vector DB (ChromaDB)       →  Port 8001
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- GitHub OAuth App

### 1. Clone & Setup

```bash
git clone <repo>
cd ai-debugger
cp .env.example .env  # fill in your credentials
```

### 2. Start All Services

```bash
# Option A: Docker Compose (recommended)
docker-compose up

# Option B: Manual
# Terminal 1 - AI Engine
cd ai-engine && pip install -r requirements.txt && uvicorn main:app --port 8000

# Terminal 2 - Backend
cd backend && npm install && npm run dev

# Terminal 3 - Frontend
cd frontend && npm install && npm run dev
```

### 3. Configure GitHub OAuth

1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Create new app with callback: `http://localhost:4000/api/auth/github/callback`
3. Copy Client ID and Secret to `.env`

## Features

- 🔗 **GitHub OAuth** - Secure repository access
- 🗂️ **Repo Indexing** - Semantic code search with vector embeddings
- 🔍 **AI Bug Analysis** - Root cause identification with LLM
- 🩹 **Patch Generation** - Automated git diff creation
- 🚀 **Auto PR** - Branch, commit, push, and PR in one click
- 💬 **Conversational Debug** - Chat with your codebase
- 📋 **Issue Analyzer** - Parse GitHub issues directly

## Environment Variables

See `.env.example` for all required variables.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Monaco Editor |
| Backend | Node.js, Express, MongoDB, Octokit |
| AI Engine | Python, FastAPI, LangChain, sentence-transformers |
| Vector DB | ChromaDB |
| LLM | Claude / OpenAI / DeepSeek (configurable) |
