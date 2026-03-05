# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Run both backend and frontend concurrently (from root)
npm run dev

# Install all dependencies (root, backend, frontend)
npm run install:all

# Backend only (from backend/)
npm run dev       # Development with nodemon auto-reload
npm start         # Production

# Frontend only (from frontend/)
npm run dev       # Vite dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Architecture Overview

This is a full-stack multiplayer card game implementing the Gubs card game. It uses a monorepo structure with separate `backend/` and `frontend/` directories.

### Tech Stack
- **Frontend**: React 19 + Vite + React Router + Socket.IO Client
- **Backend**: Node.js + Express 5 + Socket.IO
- **State Management**: React Context API (SocketContext, GameContext, PlayerContext)
- **Real-time**: Socket.IO for multiplayer synchronization

### Backend Architecture (`backend/src/`)

**Core Models** (`models/`):
- `Game.js` - Game state orchestration (players, turns, deck, win conditions)
- `Player.js` - Player state (hand, play area with gubs/barricades/traps, scoring)
- `Deck.js` - Deck management (shuffle, draw)
- `Card.js` - Card definitions and properties

**Game Flow**:
- REST API (`routes/gameRoutes.js`, `controllers/gameController.js`) handles game creation/retrieval
- Socket.IO (`socket/socketHandlers.js`) handles real-time gameplay events
- Games stored in-memory via `Map<gameId, Game>` in gameController (no database yet)

### Frontend Architecture (`frontend/src/`)

**Context Providers** (wrap order matters):
```
SocketProvider → GameProvider → PlayerProvider
```

**Pages**: `Home.jsx` (create/join) → `Lobby.jsx` (ready up) → `Game.jsx` (gameplay)

**Game Components** (`components/game/`): Card, Hand, Deck, PlayArea, PlayerBoard, GameEndScreen

### Socket.IO Events

Key client→server events: `game:join`, `game:start`, `game:drawCard`, `game:playCard`, `game:endTurn`

Key server→client events: `game:joined`, `gameState:update`, `card:drawn`, `turn:changed`, `game:ended`

### Game Rules

- 2-6 players, each starts with 1 Gub + 3 cards
- Turn: optional draw → play cards → discard to max 8
- Game ends when 3 letters (G, U, B) are drawn
- Score: free Gubs + protected Gubs; tiebreaker is Esteemed Elder possession

## Environment Variables

Backend `.env`: `PORT=3000` (or 5000)

Frontend `.env`: `VITE_API_URL`, `VITE_SOCKET_URL` pointing to backend

## Documentation

Detailed docs in `docs/`:
- `GameRules.md` - Complete Gubs rules
- `DataModels.md` - Card, Player, Game, Deck schemas
- `API-Documentation.md` - REST endpoints and Socket.IO events
- `TechnicalArchitecture.md` - Full architecture details
