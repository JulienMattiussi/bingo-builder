.PHONY: help install install-backend install-frontend start start-backend start-frontend start-db stop-db restart-db db-logs db-status build build-backend build-frontend lint lint-backend lint-frontend lint-fix lint-fix-backend lint-fix-frontend format format-backend format-frontend format-check typecheck typecheck-backend typecheck-frontend clean clean-all dev logs test test-backend test-frontend deploy preview check fix setup

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

# Code Quality commands

lint: lint-backend lint-frontend ## Run linter on all code

lint-backend: ## Lint backend code
	cd backend && npm run lint

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

lint-fix: lint-fix-backend lint-fix-frontend ## Auto-fix linting issues on all code

lint-fix-backend: ## Auto-fix backend linting issues
	cd backend && npm run lint:fix

lint-fix-frontend: ## Auto-fix frontend linting issues
	cd frontend && npm run lint:fix

format: format-backend format-frontend ## Format all code with Prettier

format-backend: ## Format backend code
	cd backend && npm run format

format-frontend: ## Format frontend code
	cd frontend && npm run format

format-check: ## Check if code is properly formatted
	cd backend && npm run format:check
	cd frontend && npm run format:check

typecheck: typecheck-backend typecheck-frontend ## Run TypeScript type checking on all code

typecheck-backend: ## Type check backend code
	cd backend && npx tsc --noEmit

typecheck-frontend: ## Type check frontend code
	cd frontend && npx tsc --noEmit

# Cleanup commands

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

# Testing commands (placeholder for future)

test: ## Run all tests
	@echo "No tests configured yet"

test-backend: ## Run backend tests
	@echo "No backend tests configured yet"

test-frontend: ## Run frontend tests
	@echo "No frontend tests configured yet"

# Production/Deployment commands

deploy: build ## Build and prepare for deployment
	@echo "Build complete. Ready for deployment."
	@echo "Frontend build output is in: frontend/dist"

preview: build-frontend ## Preview production build locally
	cd frontend && npm run preview

# Development workflow

check: format-check lint ## Run all checks (format + lint)
	@echo "✅ All checks passed!"

fix: format lint-fix ## Format and auto-fix all code
	@echo "✅ Code formatted and linted!"

setup: install start-db ## Complete first-time setup
	@echo "✅ Setup complete! Now run 'make start-backend' and 'make start-frontend'"
