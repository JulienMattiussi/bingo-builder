.PHONY: help install install-backend install-frontend start start-backend start-frontend start-db stop-db stop-test-db restart-db restart-test-db start-test-db db-logs db-status build build-backend build-frontend lint lint-backend lint-frontend lint-fix lint-fix-backend lint-fix-frontend format format-backend format-frontend format-check typecheck typecheck-backend typecheck-frontend test test-backend test-frontend test-watch test-coverage coverage clean clean-all clean-test-data dev logs deploy preview check fix setup

help: ## Display available commands
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Database commands
start-db: ## Start MongoDB with Docker Compose
	docker compose up -d
	@echo "MongoDB started on port 27017"

stop-db: ## Stop MongoDB containers
	docker compose down
	@echo "MongoDB stopped"

stop-test-db: ## Stop test MongoDB container only
	docker compose stop mongodb-test
	@echo "Test MongoDB stopped"

restart-db: ## Restart MongoDB containers
	docker compose restart
	@echo "MongoDB restarted"

restart-test-db: ## Restart test MongoDB container only
	docker compose restart mongodb-test
	@echo "Test MongoDB restarted"

db-logs: ## View MongoDB logs
	docker compose logs -f mongodb

db-status: ## Check MongoDB status
	docker compose ps

start-test-db: ## Start test MongoDB container only
	docker compose up -d mongodb-test
	@echo "Test MongoDB started on port 27018"

# Installation commands

install: ## Install all dependencies (backend + frontend + e2e)
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing E2E test dependencies..."
	cd e2e && npm install
	@echo "Installing Playwright browsers..."
	cd e2e && npx playwright install chromium

install-backend: ## Install backend dependencies only
	cd backend && npm install

install-frontend: ## Install frontend dependencies only
	cd frontend && npm install

install-e2e: ## Install E2E test dependencies only
	cd e2e && npm install
	cd e2e && npx playwright install chromium

start: ## Start both backend and frontend in dev mode (requires 2 terminals)
	@echo "Please run 'make start-backend' in one terminal and 'make start-frontend' in another"

start-backend: ## Start the backend server
	cd backend && npm run dev

start-frontend: ## Start the frontend application
	cd frontend && npm run dev

build: build-backend build-frontend ## Build both backend and frontend for production

build-backend: ## Build backend (generate OpenAPI spec + compile TypeScript)
	cd backend && npm run build

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

# Test commands

test: test-backend test-frontend test-e2e ## Run all tests

test-backend: ## Run backend tests
	cd backend && npm run test

test-frontend: ## Run frontend tests
	cd frontend && npm run test

test-e2e: ## Run E2E tests with Playwright (uses test DB on port 27018)
	@echo "⚠️  Make sure test database is running: make start-test-db"
	cd e2e && npm run test

test-e2e-ui: ## Run E2E tests with Playwright UI
	cd e2e && npm run test:ui

test-e2e-headed: ## Run E2E tests in headed mode (visible browser)
	cd e2e && npm run test:headed

test-e2e-debug: ## Debug E2E tests with Playwright
	cd e2e && npm run test:debug

test-watch: ## Run tests in watch mode
	@echo "Run 'make test-watch-backend' or 'make test-watch-frontend' for specific watch mode"

test-watch-backend: ## Run backend tests in watch mode
	cd backend && npm run test:watch

test-watch-frontend: ## Run frontend tests in watch mode
	cd frontend && npm run test:watch

test-coverage: coverage ## Run tests with coverage report (alias)

coverage: ## Run tests with coverage report and check thresholds (75%)
	@echo "Running backend tests with coverage..."
	cd backend && npm run test:coverage
	@echo ""
	@echo "Running frontend tests with coverage..."
	cd frontend && npm run test:coverage
	@echo ""
	@echo "✅ Coverage reports generated in backend/coverage/ and frontend/coverage/"

clean-test-data: ## Clean test data (TestPlayer, TestUser, E2EPlayer) from production database
	cd backend && npm run clean-test-data

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
