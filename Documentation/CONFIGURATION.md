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
| `MONGODB_URI` | string | mongodb://localhost:27017/bingo-builder | MongoDB connection URI (environment file determines dev vs test) | ❌ Backend-only |
| `CORS_ORIGIN` | string | http://localhost:3000 | Allowed CORS origin (frontend URL) | ❌ Backend-only |
| `VITE_CARD_TITLE_MAX_LENGTH` | number | 25 | Maximum card title length | ✅ |
| `VITE_TILE_MAX_LENGTH` | number | 40 | Maximum tile content length | ✅ |
| `VITE_PLAYER_NAME_MAX_LENGTH` | number | 10 | Maximum player name length | ✅ |
| `VITE_MAX_PLAYERS_PER_CARD` | number | 6 | Maximum players per card | ✅ |
| `RATE_LIMIT_API_WINDOW_MS` | number | 900000 | General API rate limit window (15 min default) | ❌ Backend-only |
| `RATE_LIMIT_API_MAX` | number | 100 | Maximum general API requests per window | ❌ Backend-only |
| `RATE_LIMIT_WRITE_WINDOW_MS` | number | 900000 | Write operations rate limit window (15 min default) | ❌ Backend-only |
| `RATE_LIMIT_WRITE_MAX` | number | 30 | Maximum write requests per window | ❌ Backend-only |
| `RATE_LIMIT_PEER_WINDOW_MS` | number | 60000 | Peer operations rate limit window (1 min default) | ❌ Backend-only |
| `RATE_LIMIT_PEER_MAX` | number | 60 | Maximum peer requests per window | ❌ Backend-only |
| `RATE_LIMIT_LIST_WINDOW_MS` | number | 60000 | List operations rate limit window (1 min default) | ❌ Backend-only |
| `RATE_LIMIT_LIST_MAX` | number | 20 | Maximum list requests per window | ❌ Backend-only |

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

### Development Configuration (.env)

```env
# Backend-only Configuration
# These are NOT exposed to the frontend for security
MONGODB_URI=mongodb://localhost:27017/bingo-builder
CORS_ORIGIN=http://localhost:3000

# Shared Configuration (VITE_ prefix)
# These are used by both frontend and backend
VITE_API_PORT=3001
VITE_PORT=3000

# Application Limits (shared between frontend and backend)
VITE_CARD_TITLE_MAX_LENGTH=25
VITE_TILE_MAX_LENGTH=40
VITE_PLAYER_NAME_MAX_LENGTH=10
VITE_MAX_PLAYERS_PER_CARD=6

# Rate Limiting (backend-only)
# API: 100 requests per 15 minutes
RATE_LIMIT_API_WINDOW_MS=900000
RATE_LIMIT_API_MAX=100
# Write operations: 30 requests per 15 minutes
RATE_LIMIT_WRITE_WINDOW_MS=900000
RATE_LIMIT_WRITE_MAX=30
# Peer operations: 60 requests per minute
RATE_LIMIT_PEER_WINDOW_MS=60000
RATE_LIMIT_PEER_MAX=60
# List operations: 20 requests per minute
RATE_LIMIT_LIST_WINDOW_MS=60000
RATE_LIMIT_LIST_MAX=20
```

### Test Configuration (.env.test)

Tests use a separate `.env.test` file (see [Testing](#testing) section for details):

```env
# Test Database (isolated on port 27018)
MONGODB_URI=mongodb://localhost:27018/bingo-test
CORS_ORIGIN=http://localhost:5173

# Test Server Ports (different from development)
VITE_API_PORT=3002
VITE_PORT=5173

# Application Limits (same as production)
VITE_CARD_TITLE_MAX_LENGTH=25
VITE_TILE_MAX_LENGTH=40
VITE_PLAYER_NAME_MAX_LENGTH=10
VITE_MAX_PLAYERS_PER_CARD=6

# Rate Limiting (backend-only) - same as dev/prod but disabled in tests via skip
RATE_LIMIT_API_WINDOW_MS=900000
RATE_LIMIT_API_MAX=100
RATE_LIMIT_WRITE_WINDOW_MS=900000
RATE_LIMIT_WRITE_MAX=30
RATE_LIMIT_PEER_WINDOW_MS=60000
RATE_LIMIT_PEER_MAX=60
RATE_LIMIT_LIST_WINDOW_MS=60000
RATE_LIMIT_LIST_MAX=20
```

### File Overview

| File | Purpose | Usage |
|------|---------|-------|
| `.env` | Development configuration | Loaded when `NODE_ENV=development` (default) |
| `.env.test` | Test configuration | Loaded when `NODE_ENV=test` |
| `.env.example` | Env template | Copy to `.env` or to `.env.test` for setup |

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
- Backend config loads `.env.test` in test mode for explicit test configuration
- Test configuration file: `.env.test` (template: `.env.example`)

### Test Configuration File

Tests use a separate `.env.test` file with test-specific settings:

```env
# Test Database (port 27018 - isolated from development)
MONGODB_URI=mongodb://localhost:27018/bingo-test
CORS_ORIGIN=http://localhost:5173

# Test Server Ports (different from development)
VITE_API_PORT=3002
VITE_PORT=5173

# Application Limits (same as production for consistency)
VITE_CARD_TITLE_MAX_LENGTH=25
VITE_TILE_MAX_LENGTH=40
VITE_PLAYER_NAME_MAX_LENGTH=10
VITE_MAX_PLAYERS_PER_CARD=6
```

**Why `.env.test`?**
- ✅ Explicit test configuration visible in one place
- ✅ No dependency on CI/CD environment variables
- ✅ Same pattern as development (`.env`) and production
- ✅ Easy for new developers to understand test setup

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

## Security Configuration

### CORS (Cross-Origin Resource Sharing)

The backend uses a **restricted CORS policy** to prevent unauthorized access from unknown origins.

**Configuration**:
```typescript
// backend/server.ts
const corsOptions = {
  origin: config.get("server.corsOrigin"), // Only allow specific origin
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
```

**Environment Variable**:
- `CORS_ORIGIN` - The allowed frontend URL (e.g., `http://localhost:3000` for dev)

**Production Setup**:
```env
# Production .env
CORS_ORIGIN=https://yourdomain.com
```

**Multiple Origins** (if needed):
Update `backend/server.ts` to accept an array or use wildcards carefully:
```typescript
const corsOptions = {
  origin: [
    config.get("server.corsOrigin"),
    "https://app.yourdomain.com",
    "https://www.yourdomain.com"
  ],
  credentials: true,
};
```

**Security Benefits**:
- ✅ Prevents unauthorized domains from accessing your API
- ✅ Protects against CSRF attacks from malicious sites
- ✅ Requires explicit configuration for each environment
- ✅ Works with authentication cookies and headers

**Testing CORS**:
```bash
# Should succeed (correct origin)
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3001/api/cards

# Should fail (wrong origin)
curl -H "Origin: http://evil-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3001/api/cards
```

### Request Body Size Limit

The backend limits request body size to prevent memory exhaustion attacks:

```typescript
app.use(express.json({ limit: "1mb" }));
```

This prevents attackers from sending extremely large payloads that could crash the server.

### Rate Limiting

The backend implements **multi-tier rate limiting** to protect against abuse and DDoS attacks:

**Implementation**: `backend/middleware/rateLimiter.ts`

#### Rate Limit Tiers

1. **General API Limiter** (applies to all `/api/` routes)
   - **Default Limit**: 100 requests per 15 minutes per IP
   - **Configuration**: `RATE_LIMIT_API_WINDOW_MS`, `RATE_LIMIT_API_MAX`
   - **Purpose**: Prevents general API abuse
   - **Applied to**: All API endpoints by default

2. **Write Operations Limiter** (stricter for data modification)
   - **Default Limit**: 30 requests per 15 minutes per IP
   - **Configuration**: `RATE_LIMIT_WRITE_WINDOW_MS`, `RATE_LIMIT_WRITE_MAX`
   - **Purpose**: Prevents spam card creation/updates
   - **Applied to**: POST, PUT, DELETE operations on `/api/cards`
   - **Endpoints**:
     - `POST /api/cards` - Create card
     - `PUT /api/cards/:id` - Update card
     - `POST /api/cards/:id/publish` - Publish card
     - `POST /api/cards/:id/unpublish` - Unpublish card
     - `DELETE /api/cards/:id` - Delete card
     - `POST /api/cards/delete-by-creator` - Bulk delete
     - `POST /api/cards/update-creator` - Bulk update

3. **Peer Operations Limiter** (prevents multiplayer flooding)
   - **Default Limit**: 60 requests per minute per IP
   - **Configuration**: `RATE_LIMIT_PEER_WINDOW_MS`, `RATE_LIMIT_PEER_MAX`
   - **Purpose**: Prevents peer registration spam
   - **Applied to**: All `/api/peers` operations
   - **Endpoints**:
     - `POST /api/peers/:cardId/register` - Register peer
     - `GET /api/peers/:cardId/peers` - Get peer list
     - `POST /api/peers/:cardId/heartbeat/:peerId` - Heartbeat
     - `DELETE /api/peers/:cardId/unregister/:peerId` - Unregister

4. **List Operations Limiter** (prevents scraping)
   - **Default Limit**: 20 requests per minute per IP
   - **Configuration**: `RATE_LIMIT_LIST_WINDOW_MS`, `RATE_LIMIT_LIST_MAX`
   - **Purpose**: Prevents automated card scraping
   - **Applied to**: `GET /api/cards` - List all cards

#### Rate Limit Response

When rate limit is exceeded:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

**Status Code**: `429 Too Many Requests`

**Headers**:
- `RateLimit-Limit` - Maximum requests allowed
- `RateLimit-Remaining` - Requests remaining in window
- `RateLimit-Reset` - Time when limit resets (Unix timestamp)

#### Testing Rate Limits

Rate limits are **automatically disabled** in test environment (`NODE_ENV=test`) to avoid breaking tests.

#### Production Tuning

All rate limit values are **configurable via environment variables**. Adjust limits by setting these variables in your production `.env` file:

**Environment Variables**:

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_API_WINDOW_MS` | 900000 (15 min) | General API rate limit window in milliseconds |
| `RATE_LIMIT_API_MAX` | 100 | Maximum general API requests per window |
| `RATE_LIMIT_WRITE_WINDOW_MS` | 900000 (15 min) | Write operations rate limit window |
| `RATE_LIMIT_WRITE_MAX` | 30 | Maximum write requests per window |
| `RATE_LIMIT_PEER_WINDOW_MS` | 60000 (1 min) | Peer operations rate limit window |
| `RATE_LIMIT_PEER_MAX` | 60 | Maximum peer requests per window |
| `RATE_LIMIT_LIST_WINDOW_MS` | 60000 (1 min) | List operations rate limit window |
| `RATE_LIMIT_LIST_MAX` | 20 | Maximum list requests per window |

**Production Example** (more permissive for paid users):

```env
# Production .env - more generous limits
RATE_LIMIT_API_WINDOW_MS=900000
RATE_LIMIT_API_MAX=200
RATE_LIMIT_WRITE_WINDOW_MS=900000
RATE_LIMIT_WRITE_MAX=50
RATE_LIMIT_PEER_WINDOW_MS=60000
RATE_LIMIT_PEER_MAX=120
RATE_LIMIT_LIST_WINDOW_MS=60000
RATE_LIMIT_LIST_MAX=30
```

**High-Traffic Example** (stricter for free tier):

```env
# Production .env - stricter limits
RATE_LIMIT_API_WINDOW_MS=900000
RATE_LIMIT_API_MAX=50
RATE_LIMIT_WRITE_WINDOW_MS=900000
RATE_LIMIT_WRITE_MAX=10
RATE_LIMIT_PEER_WINDOW_MS=60000
RATE_LIMIT_PEER_MAX=30
RATE_LIMIT_LIST_WINDOW_MS=60000
RATE_LIMIT_LIST_MAX=10
```

**Configuration**: `backend/config/config.ts` (Convict schema)  
**Implementation**: `backend/middleware/rateLimiter.ts`

**Benefits**:
- ✅ Prevents DDoS attacks
- ✅ Stops brute force attempts
- ✅ Prevents API scraping
- ✅ Reduces server load and costs
- ✅ Different limits for different operation types

### Backend-Only Variables

Variables without the `VITE_` prefix are **never exposed** to the frontend bundle:
- `MONGODB_URI` - Database connection string (contains credentials in production)
- `CORS_ORIGIN` - Allowed frontend URL
- `RATE_LIMIT_*` - All rate limiting configuration (8 variables for security thresholds)

**Why this matters**: Vite only includes `VITE_*` variables in the client bundle, preventing accidental exposure of sensitive data and security configuration.

### Production Checklist

Before deploying to production:

- [ ] Set `CORS_ORIGIN` to your production frontend URL
- [ ] Set `MONGODB_URI` with authentication credentials
- [ ] Set `NODE_ENV=production`
- [ ] Review and adjust rate limit values for your traffic patterns
- [ ] Use HTTPS for both frontend and backend
- [ ] Review all environment variables in `.env.example`
- [ ] Never commit actual `.env` files to version control
- [ ] Use a secrets manager for production (AWS Secrets Manager, HashiCorp Vault, etc.)

