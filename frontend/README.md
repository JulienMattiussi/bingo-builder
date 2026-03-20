# Bingo Builder Frontend

React 19 frontend for the Bingo Builder application.

## Features

- Create and edit bingo cards with customizable grid sizes
- Play published bingo cards online
- Track progress with localStorage
- Responsive design
- Share cards via URL

## Tech Stack

- React 19
- React Router v6
- Vite
- CSS3

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env` file to customize ports:
```bash
cp .env.example .env
```

Edit `.env` to set custom ports:
```env
# Frontend Dev Server Port
VITE_PORT=3000

# Backend API Port (must match backend PORT)
VITE_API_PORT=3001
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or your custom port)

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── pages/           # Page components
│   ├── Home.jsx
│   ├── CreateCard.jsx
│   ├── EditCard.jsx
│   └── PlayCard.jsx
├── utils/           # Utility functions
│   └── api.js       # API calls
├── App.jsx          # Main app component
├── App.css          # App styles
├── main.jsx         # Entry point
└── index.css        # Global styles
```

## API Configuration

The frontend connects to the backend API via Vite proxy configuration in `vite.config.js`.

**Port Configuration:**
- The backend API port is configured in the frontend `.env` file using `VITE_API_PORT`
- Make sure `VITE_API_PORT` matches the backend `PORT` environment variable
- Default API port: 3001

The proxy automatically routes `/api/*` requests to `http://localhost:${VITE_API_PORT}`.

## LocalStorage

Player progress (checked tiles) is stored in localStorage with keys like:
- `bingo-card-{cardId}` - Array of checked tile positions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
