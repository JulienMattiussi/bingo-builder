# Quick Reference: Test Database Isolation

## TL;DR

✅ **Dev and test environments are completely isolated**  
✅ **Run tests while dev servers are running - no conflicts!**

## Ports

| Service           | Port  | Database Port |
|-------------------|-------|---------------|
| **Dev Backend**   | 3001  | 27017         |
| **Dev Frontend**  | 3000  | 27017         |
| **Test Backend**  | 3002  | 27018         |
| **Test Frontend** | 5173  | 27018         |

## Quick Start

```bash
# 1. Start both databases (one time)
make start-db

# 2. Start dev servers
make start

# 3. Run tests (in another terminal)
make test-e2e

# ✅ Dev servers keep running!
```

## Common Commands

```bash
# Database management
make start-db          # Start both dev and test DBs
make start-test-db     # Start only test DB (port 27018)
make stop-test-db      # Stop only test DB
make db-status         # Check status of all DBs

# Testing
make test-e2e          # Run E2E tests (test DB required)
make test-backend      # Run backend unit tests (in-memory)
make test-frontend     # Run frontend unit tests
make test              # Run all tests

# Cleanup
make clean-test-data   # Remove test data from production DB
```

## What Changed

### Before (❌ Bad)
- Tests used same database as dev
- Had to stop dev servers to run tests
- Test data polluted dev database

### After (✅ Good)
- Tests use separate Docker MongoDB (port 27018)
- Tests run on different ports (3002, 5173)
- Dev and tests run simultaneously
- Complete isolation

## Verify Setup

```bash
# Check both databases are running
docker compose ps

# Should show:
# - bingo-builder-mongodb       (port 27017) - DEV
# - bingo-builder-mongodb-test  (port 27018) - TEST
```

## Troubleshooting

### E2E tests fail to connect to database

```bash
# Make sure test database is running
make start-test-db
```

### Test data appears in dev database

This should not happen anymore! But if it does:
```bash
# Clean it up
make clean-test-data

# Verify test DB is running on correct port
docker compose ps
```

### Port conflicts

If you see port conflicts, check what's running:
```bash
lsof -i :3002  # Test backend
lsof -i :5173  # Test frontend
lsof -i :27018 # Test database
```

## Files Modified

- `docker-compose.yml` - Added mongodb-test service
- `backend/config/db.ts` - Uses port 27018 for tests
- `e2e/playwright.config.ts` - Uses ports 3002/5173
- `e2e/global-setup.ts` - Connects to port 27018
- `Makefile` - Added test-db commands

See [TEST_DATA_ISOLATION.md](TEST_DATA_ISOLATION.md) for detailed documentation.
