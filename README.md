# Bingo Builder

A full-stack web application to create and play bingo cards online with friends.

## Features

- 🎨 **Create Custom Bingo Cards**: Build bingo cards with customizable grid sizes (1x1 to 10x10)
- ✏️ **Edit Draft Cards**: Modify your cards before publishing them
- 🎮 **Play Online**: Share published cards with friends via URL
- 💾 **Local Progress Tracking**: Your checked tiles are saved in your browser
- 🗄️ **MongoDB Storage**: All cards are stored server-side in MongoDB

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- RESTful API design

### Frontend
- React 19
- React Router for navigation
- Vite for fast development
- LocalStorage for player state

## Project Structure

```
bingo-builder/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── tests/           # Backend unit & integration tests
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/       # React page components
│   │   ├── components/  # React components
│   │   ├── tests/       # Frontend unit tests
│   │   ├── utils/       # API utilities
│   │   ├── App.jsx      # Main app component
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── e2e/
    ├── tests/           # E2E tests with Playwright
    ├── playwright.config.ts
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (for MongoDB)
- npm or yarn
- make (optional, for using Makefile commands)

### Quick Start with Makefile

The easiest way to get started is using the provided Makefile:

```bash
# Start MongoDB database (using Docker)
make start-db

# Install all dependencies
make install

# Start backend (in one terminal)
make start-backend

# Start frontend (in another terminal)
make start-frontend
```

Run `make help` to see all available commands.

### Complete Makefile Commands

The project includes a comprehensive Makefile with the following commands:

**Setup & Installation:**
- `make setup` - Complete first-time setup (install + start MongoDB)
- `make install` - Install all dependencies (backend + frontend + e2e)
- `make install-backend` - Install backend dependencies only
- `make install-frontend` - Install frontend dependencies only
- `make install-e2e` - Install E2E test dependencies only

**Database Management:**
- `make start-db` - Start MongoDB with Docker Compose
- `make stop-db` - Stop MongoDB container
- `make restart-db` - Restart MongoDB container
- `make db-logs` - View MongoDB logs
- `make db-status` - Check MongoDB status

**Development:**
- `make start-backend` - Start the backend server
- `make start-frontend` - Start the frontend application
- `make dev` - Start backend and frontend together

**Code Quality:**
- `make lint` - Run linter on all code
- `make lint-fix` - Auto-fix linting issues
- `make format` - Format all code with Prettier
- `make format-check` - Check if code is properly formatted
- `make check` - Run all checks (format + lint)
- `make fix` - Format and auto-fix all code

**Building:**
- `make build` - Build frontend for production
- `make preview` - Preview production build locally
- `make deploy` - Build and prepare for deployment

**Cleanup:**
- `make clean` - Clean dependencies and build artifacts
- `make clean-all` - Clean everything including .env files

**Testing:**
- `make test` - Run all tests (unit + integration)
- `make test-backend` - Run backend tests
- `make test-frontend` - Run frontend tests
- `make test-e2e` - Run E2E tests with Playwright
- `make test-e2e-ui` - Run E2E tests with Playwright UI
- `make test-all` - Run all tests including E2E
- `make coverage` - Run tests with coverage report (75% threshold)

### MongoDB Setup

This project requires MongoDB. The easiest way is using Docker:

**Using Docker Compose (Recommended):**
```bash
# Start MongoDB
make start-db
# or
docker compose up -d

# Stop MongoDB
make stop-db
# or
docker compose down

# View MongoDB logs
make db-logs
```

**Alternative - Install MongoDB locally:**

If you prefer to install MongoDB locally instead of using Docker:
- **Ubuntu/Debian**: `sudo apt-get install mongodb`
- **macOS**: `brew install mongodb-community`
- **Other**: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
# Backend Server Port
PORT=3001

# MongoDB Connection URI
MONGDB_URI=mongodb://localhost:27017/bingo-builder
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. (Optional) Update the `.env` file to customize ports:
```env
# Frontend Dev Server Port
VITE_PORT=3000

# Backend API Port (must match backend PORT)
VITE_API_PORT=3001
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000` (or the port specified in `.env`)

## Configuration

### Port Configuration

The application uses environment variables to configure server ports:

**Backend (`.env`):**
- `PORT` - Backend server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string

**Frontend (`.env`):**
- `VITE_PORT` - Frontend dev server port (default: 3000)
- `VITE_API_PORT` - Backend API port for proxy (must match backend `PORT`)

**Important:** If you change the backend `PORT`, make sure to update `VITE_API_PORT` in the frontend `.env` to match.

### Changing Default Ports

To run on different ports, update both `.env` files:

```bash
# backend/.env
PORT=4001

# frontend/.env
VITE_PORT=4000
VITE_API_PORT=4001
```

Then restart both servers.

## Usage

### Creating a Card

1. Click "Create New Card" on the home page
2. Enter a title for your bingo card
3. Choose the grid size (rows and columns)
4. Fill in all the tile values
5. Click "Save Card" to save as a draft

### Editing a Card

1. From the home page, click "Edit" on any draft card
2. Modify the title, grid size, or tile values
3. Click "Save Changes" to update the draft
4. Click "Publish Card" to make it available for play (cannot be edited after publishing)

### Playing a Card

1. From the home page, click "Play" on any published card
2. Click on tiles to mark them as checked
3. Your progress is automatically saved in your browser
4. Click "Share Link" to copy the URL and share with friends
5. Click "Reset" to clear all checked tiles

## API Endpoints

- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get a specific card
- `POST /api/cards` - Create a new card
- `PUT /api/cards/:id` - Update a card (unpublished only)
- `POST /api/cards/:id/publish` - Publish a card
- `DELETE /api/cards/:id` - Delete a card (unpublished only)
- `GET /api/health` - Health check

## Development

### Using Makefile Commands

```bash
make help              # Display all available commands
make install           # Install all dependencies
make install-backend   # Install backend dependencies only
make install-frontend  # Install frontend dependencies only
make start-backend     # Start backend server
make start-frontend    # Start frontend application
make build             # Build for production
make clean             # Clean node_modules and build artifacts
```

### Manual Development

To run both backend and frontend simultaneously, open two terminal windows:

Terminal 1 (Backend):
```bash
cd backend && npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend && npm run dev
```

## Building for Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Code Quality

This project uses **ESLint** and **Prettier** to maintain code quality and consistent formatting.

### Linting and Formatting Commands

**Frontend:**
```bash
cd frontend
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

**Backend:**
```bash
cd backend
npm run lint          # Check for linting errors
npmTesting

This project has comprehensive testing with **75% minimum coverage** requirement:

### Test Coverage

- ✅ **Backend**: 80%+ coverage (unit + integration tests)
- ✅ **Frontend**: 98%+ coverage (component + utility tests)  
- ✅ **E2E**: Full user flow coverage with Playwright

### Running Tests

**Unit & Integration Tests:**
```bash
make test              # Run backend + frontend tests
make test-backend      # Run backend tests only
make test-frontend     # Run frontend tests only
make coverage          # Run with coverage report
```

**E2E Tests:**
```bash
make test-e2e          # Run E2E tests (headless)
make test-e2e-ui       # Run with Playwright UI
make test-e2e-headed   # Run with visible browser
make test-all          # Run all tests including E2E
```

**Watch Mode:**
```bash
cd backend && npm run test:watch
cd frontend && npm run test:watch
```

### Test Structure

- **Backend Tests** (`backend/tests/`):
  - Model validation tests
  - API route integration tests
  - MongoDB memory server for isolation

- **Frontend Tests** (`frontend/src/tests/`):
  - Component unit tests with React Testing Library
  - Utility function tests
  - API mock tests

- **E2E Tests** (`e2e/tests/`):
  - Home page navigation
  - Card creation flow
  - Card playing and interactions
  - Profile management

See [e2e/README.md](e2e/README.md) for detailed E2E testing documentation.

### Test Framework

- **Backend/Frontend**: [Vitest](https://vitest.dev/) with v8 coverage
- **E2E**: [Playwright](https://playwright.dev/) with Chromium

##  run lint:fix      # Auto-fix linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

See [CODE_QUALITY.md](CODE_QUALITY.md) for detailed information about code quality tools, editor integration, and configuration.

## License

MIT

## Author

Created for playing bingo with friends!
