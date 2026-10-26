# Competitive Intelligence Tracker

Monitor competitor pricing, changelogs, and feature pages with AI-powered diff detection. Built with Next.js 14, FastAPI, PostgreSQL, Playwright, Google Gemini 2.5 Flash, and Resend.

UI aesthetic inspired by [kiro.dev](https://kiro.dev): dark mode, glassmorphism cards, violet/cyan glows, Inter + Geist Mono.

## Architecture

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Next.js 14  │─────▶│   FastAPI        │─────▶│  PostgreSQL     │
│  (frontend)  │      │  (backend)       │      │  (Supabase/DB)  │
└──────────────┘      └──────────────────┘      └─────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Playwright      │
                    │  + Jina Reader   │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Gemini 2.5 Flash│
                    │  (diff analysis) │
                    └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  Resend          │
                    │  (email digest)  │
                    └──────────────────┘
```

## Data Schema

| Table | Purpose |
|-------|---------|
| `competitors` | Tracked companies |
| `monitored_urls` | URLs per competitor (pricing / changelog / features) |
| `snapshots` | Cleaned markdown + SHA-256 hash per scrape |
| `diff_logs` | AI-analyzed changes (headline, bullets, category) |

## Getting Started

### 1. Clone & configure

```bash
git clone <repo> competitive-intelligence-tracker
cd competitive-intelligence-tracker

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your keys:
#   DATABASE_URL, GEMINI_API_KEY, RESEND_API_KEY

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Run with Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (docs at /docs)
- DB: localhost:5432

### 3. Run locally (no Docker)

**Backend**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### 4. Initialize the database

```bash
# Create tables (dev)
curl -X GET http://localhost:8000/health

# Or via Alembic
cd backend
alembic upgrade head
```

## Usage

1. Open http://localhost:3000
2. Add a competitor (name, website, monitored URLs like `/pricing`, `/changelog`)
3. Click "Scan All URLs" to run an immediate diff check
4. View detected changes on the Dashboard or Change Log pages
5. Receive email digests via Resend when changes are found

## How it works

1. **Scrape** — Playwright renders the page; Jina Reader (`r.jina.ai`) is the fast HTML→Markdown fallback.
2. **Clean** — Footers, cookie banners, and noise are stripped.
3. **Hash** — SHA-256 of cleaned markdown. If unchanged vs. previous snapshot, the run stops (saves LLM tokens).
4. **Analyze** — On change, Gemini 2.5 Flash compares old vs. new snapshots and returns structured JSON (headline, bullets, category).
5. **Persist** — New snapshot + diff log stored in PostgreSQL.
6. **Notify** — Resend sends an HTML digest email to configured recipients.

## Scheduler

GitHub Actions (`.github/workflows/daily-scan.yml`) triggers `/api/v1/scrape/trigger?all_urls=true` daily at 02:00 UTC.

Alternatively run the Python worker:
```bash
cd backend
python -m app.worker.scheduler
```

## Project Structure

```
.
├── backend/                 # FastAPI (Python)
│   ├── app/
│   │   ├── core/            # config, database
│   │   ├── models/          # SQLAlchemy ORM
│   │   ├── schemas/         # Pydantic v2
│   │   ├── crud/            # CRUD operations
│   │   ├── services/        # scraper, gemini, notifications
│   │   └── worker/          # daily scan loop
│   ├── alembic/             # DB migrations
│   └── requirements.txt
├── frontend/                # Next.js 14 App Router
│   ├── app/                 # pages (dashboard, competitors, diffs, settings)
│   ├── components/          # UI + dashboard + competitors
│   ├── lib/                 # api client, utils
│   └── tailwind.config.ts   # kiro.dev-inspired theme
├── .github/workflows/       # daily scan (GitHub Actions)
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Async PostgreSQL URL (`postgresql+asyncpg://...`) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GEMINI_MODEL` | Model name (default `gemini-2.5-flash`) | No |
| `RESEND_API_KEY` | Resend API key for email digests | No* |
| `RESEND_FROM_EMAIL` | Sender email | No |
| `DIGEST_RECIPIENTS` | Comma-separated recipient emails | No |
| `JINA_API_KEY` | Jina Reader API key (optional) | No |
| `SECRET_KEY` | App secret (change in prod) | No |

\* Email digests are skipped if `RESEND_API_KEY` is not set.

## License

MIT
