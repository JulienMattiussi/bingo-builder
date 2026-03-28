# Test Data Isolation

## Overview

E2E tests and unit tests now use completely separate infrastructure to ensure test data never affects your development environment.

**Key Features**:
- ✅ Separate MongoDB Docker container for tests (port 27018)
- ✅ Separate backend server for tests (port 3002)
- ✅ Separate frontend server for tests (port 5173)
- ✅ **Dev and test environments run simultaneously without conflicts**

## How It Works

### Separate MongoDB Instances

Two MongoDB containers run in Docker:

1. **Development Database** (`mongodb`)
   - Port: `27017`
   - Database: `bingo-builder`
   - Used by: Development servers

2. **Test Database** (`mongodb-test`)
   - Port: `27018`
   - Database: `bingo-test`
   - Used by: E2E tests only

### Separate Server Ports

| Environment | Backend Port | Frontend Port | MongoDB Port |
|-------------|--------------|---------------|--------------|
| Development | 3001         | 3000          | 27017        |
| E2E Tests   | 3002         | 5173          | 27018        |
| Unit Tests  | N/A          | N/A           | In-memory    |

### Database Configuration

The backend automatically selects the correct database:

- **Development/Production**: `mongodb://localhost:27017/bingo`
- **E2E Tests** (`NODE_ENV=test`): `mongodb://localhost:27018/bingo-test`
- **Unit Tests**: In-memory database via `mongodb-memory-server`

### E2E Test Isolation

1. **Global Setup**: Before E2E tests run, the test database is completely wiped clean
2. **Separate Servers**: E2E tests start backend (port 3002) and frontend (port 5173)
3. **No Conflicts**: Dev servers can run simultaneously on ports 3000/3001

## Setup

### Start Databases

```bash
# Start both dev and test databases
make start-db

# Or start them separately:
docker compose up -d mongodb        # Dev database
docker compose up -d mongodb-test   # Test database

# Or just test database
make start-test-db
```

### Verify Setup

```bash
# Check database status
make db-status

# Should show both containers running:
# - bingo-builder-mongodb (port 27017)
# - bingo-builder-mongodb-test (port 27018)
```

## Cleaning Test Data

If test data was created in your production database before this isolation was implemented (cards created by "TestPlayer", "TestUser", "E2EPlayer"), run:

```bash
make clean-test-data
```

Or directly:

```bash
cd backend && npm run clean-test-data
```

This script:
- Connects to your production database
- Finds all cards created by test users (TestPlayer, TestUser, E2EPlayer)
- Removes them
- Reports how many cards were deleted

## Files Changed

### Backend

- **`config/db.ts`**: Updated to use test database when `NODE_ENV=test`
- **`scripts/clean-test-data.js`**: Script to remove test data from production DB
- **`package.json`**: Added `clean-test-data` npm script
- **`.env.example`**: Added `MONGODB_TEST_URI` documentation

### E2E

- **`playwright.config.ts`**: 
  - Sets `NODE_ENV=test` for backend server
  - Configures `globalSetup` to clean test database before tests
- **`global-setup.ts`**: Drops the test database before each test run
- **`package.json`**: Added mongoose dependency for global setup

### Makefile

- **`clean-test-data`**: New target to clean test data from production DB

## Testing

### Running Tests with Dev Servers

**You can now run tests while your dev servers are running!**

```bash
# In one terminal: Run dev servers
make start        # Backend on :3001, Frontend on :3000

# In another terminal: Run E2E tests
make test-e2e     # Tests use :3002 and :5173, no conflicts!
```

### Running All Tests

```bash
# Ensure test database is running
make start-test-db

# Run all tests
make test         # Backend unit + Frontend unit + E2E

# Or run individually
make test-backend  # Unit tests (in-memory DB)
make test-frontend # Unit tests (no DB)
make test-e2e      # E2E tests (separate test DB on port 27018)
```

### Development Workflow

```bash
# 1. Start databases (one time setup)
make start-db

# 2. Start dev servers
make start
```

### Environment Files

**Development (.env)**:
```env
MONGODB_URI=mongodb://localhost:27017/bingo-builder
```

**Tests (.env.test)**:
```env
MONGODB_URI=mongodb://localhost:27018/bingo-test
```

> The environment file determines which database is used. No separate `MONGODB_TEST_URI` variable needed.

## Docker Commands

```bash
# Start all databases
make start-db
# or: docker compose up -d

# Start only test database
make start-test-db
# or: docker compose up -d mongodb-test

# Stop all databases
make stop-db
# or: docker compose down

# Stop only test database
make stop-test-db
# or: docker compose stop mongodb-test

# Check database status
make db-status
# or: docker compose ps

# View test database logs
docker compose logs -f mongodb-test
```

## Files Changed

### Infrastructure

- **`docker-compose.yml`**: Added `mongodb-test` service on port 27018
- **`backend/config/db.ts`**: Uses `MONGODB_URI` from environment file (.env or .env.test)
- **`backend/config/config.ts`**: Loads `.env.test` when `NODE_ENV=test`
- **`e2e/playwright.config.ts`**: 
  - Backend tests use port 3002
  - Frontend tests use port 5173
  - Servers can coexist with dev servers
- **`e2e/global-setup.ts`**: Connects to test database using `MONGODB_URI` from `.env.test`

### Configuration

- **`.env`**: Development configuration with port 27017
- **`.env.test`**: Test configuration with port 27018
- **`Makefile`**: Added test database commands

## Benefits

✅ **No Interruption**: Dev servers keep running while tests execute  
✅ **Complete Isolation**: Test data never affects development database  
✅ **Parallel Work**: Develop and test simultaneously  
✅ **Clean Tests**: Each E2E run starts with fresh database  
✅ **Fast Workflow**: No need to stop/restart servers  
✅ **Separate Ports**: Zero conflicts between dev and test environment

## Summary

✅ **Clean Tests**: Each E2E test run starts with a fresh database  
✅ **No Pollution**: Test data never affects your development database  
✅ **Predictable**: Tests always run in the same clean environment  
✅ **Isolated**: Unit tests, E2E tests, and development use separate databases
