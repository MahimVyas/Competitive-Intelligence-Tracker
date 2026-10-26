.PHONY: help dev backend frontend migrate up down install

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && pip install -r requirements.txt && playwright install chromium
	cd frontend && npm install

dev: ## Start backend + frontend in dev mode
	@echo "Starting backend on :8000 and frontend on :3000"
	cd backend && uvicorn app.main:app --reload --port 8000 & \
	cd ../frontend && npm run dev

migrate: ## Run Alembic migrations (backend)
	cd backend && alembic upgrade head

up: ## Start all services with Docker Compose
	docker compose up --build

down: ## Stop Docker Compose services
	docker compose down

db-shell: ## Open psql shell to local postgres
	docker exec -it ci-tracker-db psql -U ci_user -d ci_tracker
