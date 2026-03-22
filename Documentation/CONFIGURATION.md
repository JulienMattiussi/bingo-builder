# Environment Configuration with Convict

This project uses [Convict](https://github.com/mozilla/node-convict) for backend configuration management and a custom validation system for the frontend.

## Overview

Environment variables are validated, type-checked, and centrally managed through:
- **Backend**: Convict library with schema validation
- **Frontend**: Custom Config class with validation

**Key Design Decision**: All shared configuration uses `VITE_` prefixed variables that are accessible to both frontend and backend. Backend-only secrets (like database URIs) use standard names without the prefix to prevent accidental exposure to the client.

## Backend Configuration (Convict)

### Location
- Config schema: `backend/config/config.ts`
- Environment file: `.env` (root directory)

### Features
- ✅ Schema-based validation
- ✅ Type coercion (strings → numbers, etc.)
- ✅ Default values
- ✅ Environment-specific configuration
- ✅ Strict validation mode

### Usage

```typescript
import config from "./config/config.js";

// Get values with type safety
const port = config.get("server.port"); // number
const dbUri = config.get("database.uri"); // string
const maxPlayers = config.get("limits.maxPlayersPerCard"); // number
```

### Configuration Schema

```typescript
{
  env: "development" | "production" | "test",
  server: {
    port: number (default: 3001)
  },
  database: {
    uri: string,
    testUri: string
  },
  limits: {
    cardTitleMaxLength: number (default: 25),
    tileMaxLength: number (default: 40),
    playerNameMaxLength: number (default: 10),
    maxPlayersPerCard: number (default: 6)
  }
}
```

### Environment Variables (Backend)

| Variable | Type | Default | Description | Shared with Frontend? |
|----------|------|---------|-------------|-----------------------|
| `NODE_ENV` | string | development | Application environment | ❌ |
| `VITE_API_PORT` | number | 3001 | Server port | ✅ |
| `MONGODB_URI` | string | mongodb://localhost:27017/bingo-builder | MongoDB connection URI | ❌ Backend-only |
| `MONGODB_TEST_URI` | string | mongodb://localhost:27018/bingo-test | Test database URI | ❌ Backend-only |
| `VITE_CARD_TITLE_MAX_LENGTH` | number | 25 | Maximum card title length | ✅ |
| `VITE_TILE_MAX_LENGTH` | number | 40 | Maximum tile content length | ✅ |
| `VITE_PLAYER_NAME_MAX_LENGTH` | number | 10 | Maximum player name length | ✅ |
| `VITE_MAX_PLAYERS_PER_CARD` | number | 6 | Maximum players per card | ✅ |

## Frontend Configuration

### Location
- Config class: `frontend/src/config.ts`
- Environment file: `.env` (root directory)
- Type definitions: `frontend/vite-env.d.ts`

### Features
- ✅ Validation at startup
- ✅ Type-safe accessors
- ✅ Default values
- ✅ Singleton pattern

### Usage

```typescript
import config from "../config";

// Get values with type safety
const apiPort = config.apiPort; // number
const maxTitleLength = config.cardTitleMaxLength; // number
const apiUrl = config.apiUrl; // string (computed)

// Get all limits
const limits = config.limits; // readonly object
```

### Environment Variables (Frontend)

All frontend environment variables use the `VITE_` prefix. These same variables are also used by the backend for shared configuration:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_PORT` | number | 3001 | Backend API port (also used as backend server port) |
| `VITE_PORT` | number | 3000 | Frontend dev server port |
| `VITE_CARD_TITLE_MAX_LENGTH` | number | 25 | Maximum card title length |
| `VITE_TILE_MAX_LENGTH` | number | 40 | Maximum tile content length |
| `VITE_PLAYER_NAME_MAX_LENGTH` | number | 10 | Maximum player name length |
| `VITE_MAX_PLAYERS_PER_CARD` | number | 6 | Maximum players per card |

## .env File Structure

```env
# Backend-only Configuration
# These are NOT exposed to the frontend for security
MONGODB_URI=mongodb://localhost:27017/bingo-builder
MONGODB_TEST_URI=mongodb://localhost:27018/bingo-test

# Shared Configuration (VITE_ prefix)
# These are used by both frontend and backend
VITE_API_PORT=3001
VITE_PORT=3000

# Application Limits (shared between frontend and backend)
VITE_CARD_TITLE_MAX_LENGTH=25
VITE_TILE_MAX_LENGTH=40
VITE_PLAYER_NAME_MAX_LENGTH=10
VITE_MAX_PLAYERS_PER_CARD=6
```

### Why VITE_ Prefix for Shared Values?

Vite only exposes environment variables prefixed with `VITE_` to the client bundle. By using `VITE_` prefix for shared configuration:
- ✅ Backend can read them via `process.env.VITE_API_PORT`
- ✅ Frontend can read them via `import.meta.env.VITE_API_PORT`
- ✅ Single source of truth - no duplication needed
- ✅ Backend-only secrets stay hidden from client

## Testing

### Test Environment
- Tests automatically use `NODE_ENV=test`
- Test database uses separate port (27018) to prevent data contamination
- Backend config skips loading `.env` in test mode (uses environment variables set by test runner)

### Running Tests
```bash
# All tests
make test

# Backend only
make test-backend

# Frontend only
make test-frontend

# E2E tests only
make test-e2e
```

## Adding New Configuration

### Backend
1. Add to `.env` and `.env.example`
2. Update schema in `backend/config/config.ts`
3. Access via `config.get("path.to.value")`

### Frontend
1. Add `VITE_` prefixed variable to `.env` and `.env.example`
2. Update `ImportMetaEnv` interface in `frontend/vite-env.d.ts`
3. Update `ConfigSchema` in `frontend/src/config.ts`
4. Add getter method in `Config` class if needed

## Benefits

### Type Safety
- Variables are validated at startup, not runtime
- TypeScript types prevent incorrect access patterns
- Compilation fails if config is used incorrectly

### Validation
- All values validated against schema
- Invalid values cause startup failure (fail-fast)
- Clear error messages for configuration problems

### Centralization
- Single source of truth for configuration
- Easy to see all available settings
- Prevents scattered `process.env` calls

### Documentation
- Schema serves as living documentation
- Defaults are explicit and discoverable
- Type information helps developers

## Migration from Direct env Access

**Before:**
```typescript
const port = Number(process.env.PORT) || 3001;
const maxLength = Number(import.meta.env.VITE_CARD_TITLE_MAX_LENGTH) || 25;
```

**After:**
```typescript
// Backend
import config from "./config/config.js";
const port = config.get("server.port");

// Frontend
import config from "../config";
const maxLength = config.cardTitleMaxLength;
```

## Troubleshooting

### "Configuration validation failed"
- Check that all required environment variables are set
- Verify values are in correct format (numbers, URLs, etc.)
- Review error message for specific validation failure

### Values not updating
- Restart development server after changing `.env`
- Frontend: Clear Vite cache (`rm -rf frontend/.vite`)
- Backend: Check that dotenv is loading from correct path

### Test failures
- Ensure test environment variables are set correctly
- Check that test database is running (MongoDB on port 27018)
- Verify `NODE_ENV=test` is set for test runs
