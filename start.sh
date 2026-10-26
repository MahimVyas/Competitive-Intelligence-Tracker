#!/usr/bin/env bash
# =============================================================================
# Competitive Intelligence Tracker - One-Command Startup
# =============================================================================
# Starts backend (FastAPI) + frontend (Next.js) with zero external dependencies.
# Uses SQLite by default — no PostgreSQL or Docker required.
#
# Usage:  chmod +x start.sh && ./start.sh
# =============================================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "============================================================"
echo "  🚀 Competitive Intelligence Tracker - Starting Up"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# 1. Backend setup
# ---------------------------------------------------------------------------
echo "📦 Setting up backend (FastAPI + SQLite)..."

if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "   Creating Python virtual environment..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"

echo "   Installing Python dependencies..."
pip install --upgrade pip -q

# Install core dependencies one-by-one so a single C-extension build failure
# (common on Python 3.15 / bleeding-edge) doesn't abort the whole setup.
# asyncpg/greenlet are intentionally omitted — SQLite (aiosqlite) is the default.
CORE_PKGS=(
  fastapi==0.115.0
  uvicorn[standard]==0.32.1
  pydantic==2.9.2
  pydantic-settings==2.4.0
  "sqlalchemy[asyncio]==2.0.39"
  alembic==1.13.2
  python-dotenv==1.0.1
  httpx==0.27.0
  google-generativeai==0.8.0
  resend==2.50.0
  beautifulsoup4==4.12.3
  tenacity==8.5.0
  loguru==0.7.2
)

for pkg in "${CORE_PKGS[@]}"; do
  echo "      • $pkg"
  if ! pip install "$pkg" -q 2>/dev/null; then
    echo "      ⚠️  $pkg failed (trying --only-binary)..."
    if ! pip install "$pkg" --only-binary=:all: -q 2>/dev/null; then
      echo "      ⚠️  $pkg skipped — no Python 3.15 wheel available"
    fi
  fi
done

echo "   Installing optional dependencies..."
pip install aiosqlite==0.21.0 -q 2>/dev/null || echo "   ⚠️  aiosqlite skipped"
pip install playwright -q 2>/dev/null || echo "   ⚠️  playwright skipped (Jina Reader is the primary scraper)"

echo "   Initializing database tables..."
cd "$BACKEND_DIR"
python -c "
import asyncio
from app.core.database import init_db
asyncio.run(init_db())
print('   ✅ Database tables created')
" 2>&1
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# 2. Start backend
# ---------------------------------------------------------------------------
echo ""
echo "🔥 Starting FastAPI backend on http://localhost:8000..."
cd "$BACKEND_DIR"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "   Waiting for backend to become healthy..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "   ❌ Backend failed to start. Check backend.log"
    exit 1
  fi
  sleep 1
done

# ---------------------------------------------------------------------------
# 3. Frontend setup
# ---------------------------------------------------------------------------
echo ""
echo "📦 Setting up frontend (Next.js)..."

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "   Installing npm dependencies..."
  cd "$FRONTEND_DIR"
  npm install -q
fi

# ---------------------------------------------------------------------------
# 4. Start frontend
# ---------------------------------------------------------------------------
echo ""
echo "🌐 Starting Next.js frontend on http://localhost:3000..."
cd "$FRONTEND_DIR"
npm run dev > "$ROOT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

# ---------------------------------------------------------------------------
# 5. Done
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  ✅ Everything is running!"
echo "============================================================"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "   Logs:"
echo "     Backend:  $ROOT_DIR/backend.log"
echo "     Frontend: $ROOT_DIR/frontend.log"
echo ""
echo "   Press Ctrl+C to stop all services."
echo "============================================================"

# Wait for user interrupt, then cleanup
cleanup() {
  echo ""
  echo "🛑 Shutting down services..."
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
  echo "   Done. Goodbye!"
  exit 0
}
trap cleanup INT TERM

# Keep script running
wait
