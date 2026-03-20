# Bingo Builder Backend

Backend API for the Bingo Card Builder application.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or remote connection)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string:
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bingo-builder
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port you specified in `.env`).

## API Endpoints

### Cards

- `GET /api/cards` - Get all cards
- `GET /api/cards/:id` - Get a specific card
- `POST /api/cards` - Create a new card
- `PUT /api/cards/:id` - Update a card (unpublished only)
- `POST /api/cards/:id/publish` - Publish a card
- `DELETE /api/cards/:id` - Delete a card (unpublished only)

### Health Check

- `GET /api/health` - Check server status

## Card Schema

```json
{
  "title": "My Bingo Card",
  "rows": 5,
  "columns": 5,
  "tiles": [
    {
      "value": "Free Space",
      "position": 0
    },
    ...
  ],
  "isPublished": false
}
```
