#!/usr/bin/env bash
# setup.sh — One-command project setup
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}   🤖  AI GitHub Debugging Assistant — Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── Copy env ─────────────────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠  Created .env from .env.example — fill in your credentials!${NC}"
else
  echo -e "${GREEN}✓  .env already exists${NC}"
fi

# ─── Backend ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}Installing backend dependencies…${NC}"
cd backend && npm install && cd ..
echo -e "${GREEN}✓  Backend ready${NC}"

# ─── Frontend ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}Installing frontend dependencies…${NC}"
cd frontend && npm install && cd ..
echo -e "${GREEN}✓  Frontend ready${NC}"

# ─── AI Engine ────────────────────────────────────────────
echo ""
echo -e "${CYAN}Setting up AI Engine Python environment…${NC}"
cd ai-engine
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
deactivate
cd ..
echo -e "${GREEN}✓  AI Engine ready${NC}"

# ─── Done ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅  Setup complete!${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit ${YELLOW}.env${NC} with your GitHub OAuth & LLM API keys"
echo -e "  2. Start services:"
echo -e "     ${CYAN}# Option A: Docker Compose (recommended)${NC}"
echo -e "     docker-compose up"
echo ""
echo -e "     ${CYAN}# Option B: Manual${NC}"
echo -e "     cd ai-engine && source .venv/bin/activate && uvicorn main:app --port 8000"
echo -e "     cd backend && npm run dev"
echo -e "     cd frontend && npm run dev"
echo ""
echo -e "  3. Open ${YELLOW}http://localhost:3000${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
