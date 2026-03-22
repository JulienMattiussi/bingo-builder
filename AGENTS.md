# Bingo Builder - Agent Coding Guidelines

This document provides essential coding rules and conventions for AI agents working on the Bingo Builder project. Follow these guidelines to maintain consistency and quality across the codebase.

---

## 🔧 Configuration System

### Convict-Based Configuration

**Backend**: Uses [Convict](https://github.com/mozilla/node-convict) for schema-based configuration management.

- **Location**: `backend/config/config.ts`
- **Schema-First**: All configuration values must be defined in the Convict schema with:
  - Documentation (`doc`)
  - Type/format validation (`format`)
  - Default values (`default`)
  - Environment variable mapping (`env`)

**Access Pattern**:
```typescript
import config from "./config/config.js";
const port = config.get("server.port");
const maxPlayers = config.get("limits.maxPlayersPerCard");
```

**Frontend**: Uses custom Config class with validation.

- **Location**: `frontend/src/config.ts`
- **Type-Safe**: Provides typed getters and validation at startup
- **Singleton**: Export single instance for consistent access

**Access Pattern**:
```typescript
import config from "../config";
const maxLength = config.cardTitleMaxLength;
const apiUrl = config.apiUrl;
```

### Environment Variables

**CRITICAL**: Use `VITE_` prefix for ALL shared configuration between frontend and backend.

**Structure**:
```env
# Backend-only (security-sensitive, NOT exposed to client)
MONGODB_URI=mongodb://localhost:27017/bingo-builder
MONGODB_TEST_URI=mongodb://localhost:27018/bingo-test

# Shared (VITE_ prefix - readable by both frontend and backend)
VITE_API_PORT=3001
VITE_PORT=3000
VITE_CARD_TITLE_MAX_LENGTH=25
VITE_TILE_MAX_LENGTH=40
VITE_PLAYER_NAME_MAX_LENGTH=10
VITE_MAX_PLAYERS_PER_CARD=6
```

**Why VITE_ prefix?**
- Vite only exposes `VITE_*` variables to the client bundle
- Backend can also read them via `process.env.VITE_*`
- **Single source of truth** - no duplication needed
- Backend-only secrets stay hidden from client

**Rules**:
1. ✅ **DO**: Use `VITE_` prefix for shared values (ports, limits, feature flags)
2. ✅ **DO**: Use plain names for backend-only secrets (database URIs, API keys)
3. ❌ **DON'T**: Duplicate variables with and without `VITE_` prefix
4. ❌ **DON'T**: Access `process.env` or `import.meta.env` directly - always use config classes

**Adding New Configuration**:
1. Add to `.env` and `.env.example` with `VITE_` prefix if shared
2. Update schema in `backend/config/config.ts` OR `frontend/src/config.ts`
3. Add TypeScript types in `frontend/vite-env.d.ts` for frontend vars
4. Update `Documentation/CONFIGURATION.md`

---

## 🛠️ Makefile Usage

**MANDATORY**: Always use Makefile commands instead of direct npm/docker commands.

### Why?
- Consistent command interface across the project
- Cross-environment compatibility (handles paths, environments correctly)
- Prevents common mistakes (wrong database, forgotten dependencies)
- Self-documenting: `make help` shows all available commands

### Essential Commands

**Development**:
```bash
make setup          # First-time setup (install + start DB)
make install        # Install all dependencies
make start-backend  # Start backend server
make start-frontend # Start frontend dev server
make dev           # Start both backend and frontend
```

**Database**:
```bash
make start-db       # Start MongoDB (port 27017)
make start-test-db  # Start test MongoDB (port 27018)
make stop-db        # Stop all MongoDB containers
make db-logs        # View MongoDB logs
```

**Code Quality**:
```bash
make lint          # Run ESLint on all code
make lint-fix      # Auto-fix linting issues
make format        # Format code with Prettier
make check         # Run all checks (format + lint)
make fix           # Format and auto-fix everything
```

**Testing**:
```bash
make test          # Run all tests (backend + frontend)
make test-backend  # Run backend tests only
make test-frontend # Run frontend tests only
make test-e2e      # Run E2E tests with Playwright
make test-e2e-ui   # Run E2E tests with Playwright UI
make coverage      # Run tests with coverage report
```

**Building**:
```bash
make build         # Build frontend for production
make preview       # Preview production build
```

**Rules**:
1. ✅ **DO**: Use `make <command>` for all development tasks
2. ✅ **DO**: Add new commands to Makefile when introducing new workflows
3. ❌ **DON'T**: Run `npm run dev` directly - use `make start-backend` or `make start-frontend`
4. ❌ **DON'T**: Run `docker compose up` directly - use `make start-db`
5. ❌ **DON'T**: Run tests with `npm test` - use `make test` or specific test commands

---

## 📚 Documentation Rules

### Documentation Structure

All documentation is organized in the `Documentation/` folder (except `README.md`):

```
Documentation/
├── CODE_QUALITY.md          # Linting, formatting, editor setup
├── CONFIGURATION.md         # Environment variables, Convict usage
├── TESTING_QUICK_REF.md     # Testing guide and examples
└── TEST_DATA_ISOLATION.md   # Test database isolation details
```

### When to Document

**ALWAYS document**:
- New configuration variables
- New API endpoints
- Breaking changes
- Complex business logic
- Architecture decisions
- Test patterns and conventions

**Update existing docs when**:
- Changing configuration schema
- Adding new Makefile commands
- Modifying test infrastructure
- Updating dependencies with breaking changes

### Documentation Style

**Format**: Markdown with clear headings and code examples

**Structure**:
```markdown
# Title

Brief overview paragraph.

## Section

Description of concept or feature.

### Subsection

Specific details.

**Example**:
```typescript
// Code example with comments
example.code();
```

**Rules**:
1. ✅ **DO**: Include code examples for technical concepts
2. ✅ **DO**: Use tables for environment variables and configuration
3. ✅ **DO**: Add "Why?" sections to explain design decisions
4. ✅ **DO**: Link between related documentation files
5. ❌ **DON'T**: Document obvious code - use JSDoc comments instead
6. ❌ **DON'T**: Create documentation that duplicates README.md
7. ❌ **DON'T**: Put technical documentation in README (keep it high-level)

### README.md

Keep `README.md` focused on:
- Project overview and features
- Quick start guide
- Essential commands (link to Makefile)
- Links to detailed documentation

---

## 📘 TypeScript Usage

### Strict TypeScript Everywhere

**Rules**:
1. ✅ **DO**: Use TypeScript for ALL `.ts` and `.tsx` files (no `.js` in src/)
2. ✅ **DO**: Enable strict mode in `tsconfig.json`
3. ✅ **DO**: Define interfaces for all data structures
4. ✅ **DO**: Use explicit return types for functions
5. ❌ **DON'T**: Use `any` type (use `unknown` if type is truly unknown)
6. ❌ **DON'T**: Skip type annotations on parameters
7. ❌ **DON'T**: Disable TypeScript errors with `@ts-ignore` (fix the issue)

### Type Organization

**Backend**:
- Models use Mongoose TypeScript integration
- Request/response interfaces in route files
- Shared types in separate files when reused

**Frontend**:
- Component props: Define `interface ComponentProps` above component
- Data models: `src/types/models.ts`
- Component props types: `src/types/props.ts`
- Vite env types: `vite-env.d.ts` (root of frontend)

**Example**:
```typescript
// Good
interface Card {
  _id: string;
  title: string;
  rows: number;
  columns: number;
  tiles: Tile[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function processCard(card: Card): CardStatus {
  // Implementation
  return { status: 'processed' };
}

// Bad
function processCard(card: any) {  // ❌ Uses 'any'
  return card.process();  // ❌ No type safety
}
```

### ES Modules

**Backend uses ES modules** (not CommonJS):
- Use `import/export`, not `require/module.exports`
- File extensions required: `.js` for imports (TypeScript compiles to `.js`)
- Use `import type` for type-only imports

```typescript
// Good
import express from "express";
import type { Request, Response } from "express";
import config from "./config/config.js"; // .js extension required

// Bad
const express = require("express"); // ❌ CommonJS
import config from "./config/config"; // ❌ Missing .js extension
```

---

## 🎨 Linting and Code Quality

### ESLint Configuration

**All code must pass ESLint** before commit.

**Commands**:
```bash
make lint      # Check all code
make lint-fix  # Auto-fix issues
```

**Configuration**: 
- Backend: `backend/.eslintrc.cjs`
- Frontend: `frontend/.eslintrc.cjs`

### Prettier Formatting

**All code must be formatted** with Prettier.

**Commands**:
```bash
make format       # Format all code
make format-check # Check if formatted
make fix          # Format + lint-fix everything
```

**Configuration**:
- Backend: `backend/.prettierrc`
- Frontend: `frontend/.prettierrc`

### Pre-Commit Workflow

**Before committing code**:
```bash
make check  # Run format-check + lint
# If issues found:
make fix    # Auto-fix formatting and linting
```

**Rules**:
1. ✅ **DO**: Run `make check` before committing
2. ✅ **DO**: Fix all ESLint errors (not warnings)
3. ✅ **DO**: Use `make fix` to auto-fix most issues
4. ❌ **DON'T**: Commit code with linting errors
5. ❌ **DON'T**: Disable ESLint rules without good reason
6. ❌ **DON'T**: Commit unformatted code

---

## 🧪 Testing System

### Test Infrastructure

**Framework**: Vitest (backend + frontend), Playwright (E2E)

**Test Organization**:
```
backend/tests/
├── models/           # Model validation tests
└── routes/           # API endpoint tests

frontend/src/tests/
├── components/       # Component tests
├── pages/            # Page component tests
└── utils/            # Utility function tests

e2e/tests/
├── home.spec.ts      # Home page E2E tests
├── create-card.spec.ts
├── play-card.spec.ts
└── profile.spec.ts
```

### Test Data Isolation

**CRITICAL**: Tests use separate database to prevent data pollution.

**Infrastructure**:
- **Dev Database**: `mongodb://localhost:27017/bingo-builder`
- **Test Database**: `mongodb://localhost:27018/bingo-test` (separate container)

**Environment**:
- Tests automatically set `NODE_ENV=test`
- Backend config uses `MONGODB_TEST_URI` when in test mode
- E2E tests run backend on port 3002, frontend on 5173

**Rules**:
1. ✅ **DO**: Start test database before running tests: `make start-test-db`
2. ✅ **DO**: Clean up test data after tests (use `afterEach` hooks)
3. ✅ **DO**: Use factories/fixtures for test data
4. ❌ **DON'T**: Connect to dev database from tests
5. ❌ **DON'T**: Hard-code port 3001 in tests (use config)
6. ❌ **DON'T**: Rely on test execution order

### Test Coverage

**Target**: 75% minimum coverage (currently exceeding this)

**Commands**:
```bash
make test           # Run all tests
make test-backend   # Backend only
make test-frontend  # Frontend only
make test-e2e       # E2E tests
make coverage       # With coverage report
```

**Coverage Requirements**:
- All new features must include tests
- All bug fixes must include regression tests
- Critical paths (auth, data persistence) need high coverage

### Writing Tests

**Good Test Structure**:
```typescript
describe("Feature Name", () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it("should do something specific", async () => {
    // Arrange
    const testData = createTestCard();
    
    // Act
    const result = await api.createCard(testData);
    
    // Assert
    expect(result.title).toBe(testData.title);
  });
});
```

**Rules**:
1. ✅ **DO**: Write descriptive test names ("should validate title max length")
2. ✅ **DO**: Test edge cases and error conditions
3. ✅ **DO**: Use arrange-act-assert pattern
4. ✅ **DO**: Mock external dependencies (API calls, timers)
5. ❌ **DON'T**: Test implementation details
6. ❌ **DON'T**: Write tests that depend on each other
7. ❌ **DON'T**: Skip cleanup in `afterEach`

---

## 📱 Frontend Responsive Design

### Mobile-First Approach

**Breakpoints**:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### Responsive Components

**Key Components**:
- `BingoGridEditor`: Mobile uses modal for tile editing, desktop uses inline
- `MobileActionBar`: Only visible on mobile for quick actions
- `PlayerList`: Adapts layout based on screen size
- All forms adjust layout for mobile viewing

**CSS Media Queries**:
```css
/* Mobile-first */
.component {
  /* Mobile styles (default) */
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
  }
}

@media (min-width: 1025px) {
  .component {
    /* Desktop styles */
  }
}
```

### Touch and Click Events

**Handle both touch and mouse**:
```typescript
// Good - works on mobile and desktop
onClick={handleClick}
onKeyPress={(e) => e.key === "Enter" && handleClick()}

// Consider using pointer events for advanced interactions
onPointerDown={handlePointerDown}
```

**Rules**:
1. ✅ **DO**: Test on mobile viewport (DevTools mobile emulation)
2. ✅ **DO**: Use relative units (rem, em, %) over fixed pixels
3. ✅ **DO**: Ensure touch targets are at least 44x44px
4. ✅ **DO**: Use flexbox/grid for responsive layouts
5. ✅ **DO**: Check `window.innerWidth` for conditional mobile behavior
6. ❌ **DON'T**: Use fixed widths for containers
7. ❌ **DON'T**: Forget to test scrolling on mobile
8. ❌ **DON'T**: Assume hover states work on mobile

---

## 🌐 Peer Communication System

### Architecture

**Purpose**: Real-time player synchronization for multiplayer bingo games.

**Components**:
1. **Backend**: In-memory peer registry (`backend/routes/peers.ts`)
2. **Frontend**: Peer connection manager (`frontend/src/utils/peerConnection.ts`)
3. **Polling**: HTTP polling for player list updates (no WebSockets)

### Backend Peer Registry

**Location**: `backend/routes/peers.ts`

**Endpoints**:
- `POST /api/peers/:cardId/register` - Register/update peer
- `GET /api/peers/:cardId/peers` - Get active peers for card
- `POST /api/peers/:cardId/heartbeat/:peerId` - Keep peer alive
- `DELETE /api/peers/:cardId/unregister/:peerId` - Remove peer

**Data Structure**:
```typescript
interface PeerData {
  name: string;
  timestamp: number;
  checkedCount: number;
}

// In-memory map
const activePeers = new Map<string, Map<string, PeerData>>();
```

**Cleanup**: Peers inactive for >2 minutes are automatically removed.

**Limits**: Maximum 6 players per card (configurable via `VITE_MAX_PLAYERS_PER_CARD`).

### Frontend Peer Connection

**Location**: `frontend/src/utils/peerConnection.ts`

**Usage**:
```typescript
import { createPeerConnection } from "../utils/peerConnection";

const peerConnection = createPeerConnection();

// Initialize
await peerConnection.initialize(cardId, playerName, checkedCount);

// Listen for events
peerConnection.onPlayerListUpdate((players) => {
  setActivePlayers(players);
});

peerConnection.onNotification((notification) => {
  showNotification(notification);
});

// Broadcast updates
peerConnection.broadcastTileValidation(newCheckedCount);

// Cleanup
peerConnection.disconnect();
```

**Key Features**:
- Generates unique peer ID (UUID)
- Polls every 3 seconds for player list updates
- Sends heartbeat every 5 seconds
- Broadcasts tile check/uncheck events
- Handles disconnection cleanup

### Integration in PlayCard

**Location**: `frontend/src/pages/PlayCard.tsx`

**Pattern**:
```typescript
const peerConnectionRef = useRef<ReturnType<typeof createPeerConnection> | null>(null);

useEffect(() => {
  // Initialize on mount when card and player name available
  if (card && playerName && !peerConnectionRef.current) {
    initializePeerConnection();
  }

  // Cleanup on unmount
  return () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.disconnect();
    }
  };
}, [card, playerName]);
```

### Rules for Peer Communication

1. ✅ **DO**: Initialize peer connection only after player name is set
2. ✅ **DO**: Clean up peer connection on component unmount
3. ✅ **DO**: Broadcast state changes (tile checks) to other players
4. ✅ **DO**: Handle connection errors gracefully (continue working offline)
5. ✅ **DO**: Use the singleton pattern (one connection per card/player)
6. ❌ **DON'T**: Create multiple peer connections for the same card
7. ❌ **DON'T**: Forget to unregister peer on page leave
8. ❌ **DON'T**: Expose peer IDs or player names in URLs (security)

### Adding New Peer Features

**To add new peer communication**:

1. **Backend**: Add new endpoint in `backend/routes/peers.ts`
2. **Frontend**: Add method to `PeerConnectionManager` class
3. **Integration**: Call method from `PlayCard.tsx` or other components
4. **Testing**: Add tests in `frontend/src/tests/utils/api.test.ts`
5. **Documentation**: Update this section

**Example** - Adding peer message broadcasting:
```typescript
// Backend (peers.ts)
router.post("/:cardId/message", (req, res) => {
  const { peerId, message } = req.body;
  // Store/broadcast message
});

// Frontend (peerConnection.ts)
broadcastMessage(message: string) {
  fetch(`/api/peers/${this.cardId}/message`, {
    method: "POST",
    body: JSON.stringify({ peerId: this.peerId, message }),
  });
}

// Integration (PlayCard.tsx)
peerConnection.broadcastMessage("Bingo!");
```

---

## 🚀 Summary Checklist

Before submitting code, verify:

- [ ] Configuration changes updated in `.env`, `.env.example`, and schemas
- [ ] Used Makefile commands instead of direct npm/docker commands
- [ ] Documentation updated in `Documentation/` folder
- [ ] All TypeScript files compile without errors
- [ ] Code passes `make check` (formatting + linting)
- [ ] Tests added/updated and passing (`make test`)
- [ ] Test data isolation maintained (separate database)
- [ ] Responsive design tested on mobile viewport
- [ ] Peer communication properly initialized and cleaned up
- [ ] No `console.log` or debug code left in production code
- [ ] Import paths use correct extensions (`.js` for backend ES modules)

---

## 📖 Additional Resources

- [Configuration Guide](Documentation/CONFIGURATION.md)
- [Code Quality Guide](Documentation/CODE_QUALITY.md)
- [Testing Quick Reference](Documentation/TESTING_QUICK_REF.md)
- [Test Data Isolation](Documentation/TEST_DATA_ISOLATION.md)
- [Makefile Commands](./#help) - Run `make help`

Follow these guidelines to maintain code quality and consistency across the Bingo Builder project. When in doubt, refer to existing code patterns and documentation.
