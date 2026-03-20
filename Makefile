.PHONY: help install install-backend install-frontend start start-backend start-frontend start-db stop-db restart-db db-logs build build-backend build-frontend clean test

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Database commands
start-db: ## Start MongoDB with Docker Compose
	docker compose up -d
	@echo "MongoDB started on port 27017"

stop-db: ## Stop MongoDB container
	docker compose down
	@echo "MongoDB stopped"

restart-db: ## Restart MongoDB container
	docker compose restart
	@echo "MongoDB restarted"

db-logs: ## View MongoDB logs
	docker compose logs -f mongodb

db-status: ## Check MongoDB status
	docker compose ps

# Installation commands

install: ## Install all dependencies (backend + frontend)
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

install-backend: ## Install backend dependencies only
	cd backend && npm install

install-frontend: ## Install frontend dependencies only
	cd frontend && npm install

start: ## Start both backend and frontend in dev mode (requires 2 terminals)
	@echo "Please run 'make start-backend' in one terminal and 'make start-frontend' in another"

start-backend: ## Start the backend server
	cd backend && npm run dev

start-frontend: ## Start the frontend application
	cd frontend && npm run dev

build: ## Build both backend and frontend for production
	cd frontend && npm run build

build-frontend: ## Build frontend for production
	cd frontend && npm run build

clean: ## Clean dependencies and build artifacts
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf backend/package-lock.json
	rm -rf frontend/package-lock.json

clean-all: clean ## Clean everything including .env files
	rm -f backend/.env

dev: ## Start development (install + start backend in background)
	@echo "Starting backend server..."
	cd backend && npm run dev &
	@echo "Starting frontend server..."
	cd frontend && npm run dev

logs: ## View logs (if needed for debugging)
	@echo "Check terminal output for logs"
