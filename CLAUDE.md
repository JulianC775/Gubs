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

Full-stack multiplayer card game (Gubs). Monorepo with `backend/` and `frontend/` directories.

### Tech Stack
- **Frontend**: React 19 + Vite + React Router + Socket.IO Client
- **Backend**: Node.js + Express 5 + Socket.IO
- **State Management**: React Context API (SocketContext, GameContext, PlayerContext)
- **Real-time**: Socket.IO for multiplayer synchronization

### Backend Architecture (`backend/src/`)

**Core Models** (`models/`):
- `Game.js` - Game state; `toJSON()` returns `{ id, roomCode, status, players, deck, currentPlayerIndex, turnNumber, drawnLetters, winner: { id, name, score, tiebreaker } }`
- `Player.js` - `toJSON(isOwner)` returns hand only if isOwner=true; playArea has `{ gubs, protectedGubs, trappedGubs, activeEffects }`
- `Deck.js` - `drawCard()`, `addToDiscard()`, `addToRemoved()`, `getCardsRemaining()`, `shuffle()`
- `Card.js` - Both `id` (base card id, e.g. "mushroom") and `instanceId` (unique per instance, e.g. "mushroom_timestamp_rand"); `toJSON()` returns both

**Game Flow**:
- REST API (`routes/gameRoutes.js`, `controllers/gameController.js`) handles game creation/retrieval
- Socket.IO (`socket/socketHandlers.js`) handles all real-time gameplay events
- Games stored in-memory via `Map<gameId, Game>` exported from gameController (no database yet)
- `games` Map is shared between gameController and socketHandlers via `require('../controllers/gameController')`

**Card Data** (`data/cards.json`): Object with a top-level `cards` array. Letter cards (G, U, B) have `type: 'Event'` and `subtype: 'Letter'`.

**Key Backend Rules**:
- Cards are matched by `card.id === cardId || card.instanceId === cardId` — always prefer instanceId on client
- `game.winner` after `endGame()` = `{ winner: Player, tiebreaker, scores: [...] }` (nested Player object, NOT plain JSON) — always format before emitting
- `game.toJSON()` includes `winner: { id, name, score, tiebreaker }` but NOT a `scores` array

### Frontend Architecture (`frontend/src/`)

**Context Providers** (wrap order in `main.jsx`):
```
SocketProvider → GameProvider → PlayerProvider
```

**Pages**: `Home.jsx` (create/join) → `Lobby.jsx` (ready up) → `Game.jsx` (gameplay)

**Routing** (`App.jsx`):
- `/` → Home
- `/lobby/:roomCode` → Lobby
- `/game/:roomCode` → Game (uses roomCode for display; actual gameId comes from GameContext)

**Game Components** (`components/game/`): Card, Hand, Deck, PlayArea, PlayerBoard, GameEndScreen

**State Management Details**:
- `GameContext`: stores gameId, roomCode, players (with playArea), currentPlayerIndex, turnNumber, drawnLetters, deck, status, winner, scores
- `PlayerContext`: stores playerId, playerName, hand (full card objects), playArea, score, isReady, isHost
- Hand is managed separately in PlayerContext (not from gameState:update, which sends `hand: null` for non-owners)
- `GAME_STATE_UPDATE` preserves `scores` from `GAME_ENDED` (gameState:update doesn't include scores array)

**Card Selection in Game.jsx**:
- `selectedCard` is the full card object (has both `id` and `instanceId`)
- Always use `selectedCard.instanceId` for comparisons and for `cardId` when emitting `game:playCard`
- `selectedCardId` prop passed to Hand must be `selectedCard?.instanceId`

### Socket.IO Events

**Client → Server**:
- `game:join` `{ roomCode, playerName }` — joins/rejoins a lobby room
- `player:setReady` `{ gameId, playerId, isReady }`
- `game:start` `{ gameId, playerId }` — host only, requires ≥2 ready players
- `game:rejoin` `{ gameId, playerId }` — reconnect after page refresh
- `game:getState` `{ gameId }`
- `game:drawCard` `{ gameId, playerId }`
- `game:playCard` `{ gameId, playerId, cardId (instanceId), target: { playerId?, gubId?, cardId?, action?, asCard?, eventCard? } }`
- `game:endTurn` `{ gameId, playerId }`

**Server → Client**:
- `game:joined` `{ success, gameId, playerId, game }` — sent only to joining socket
- `player:joined` `{ player, players, game }` — broadcast to room
- `player:ready` `{ playerId, isReady, game }` — broadcast to room
- `game:started` `{ game }` — broadcast to room; navigate to `/game/${game.roomCode}`
- `hand:update` `{ playerId, hand }` — sent to individual socket (initial hands after start, after events)
- `card:drawn` `{ card, isEvent, isLetter }` — sent to drawing player's socket only
- `game:cardDrawn` `{ playerId, isEvent, isLetter, card (if event), cardsRemaining }` — broadcast
- `event:triggered` `{ eventCard, drawingPlayerId, drawingPlayerName, result }` — broadcast
- `letter:drawn` `{ letter, drawnLetters }` — broadcast
- `game:ended` `{ winner: { id, name, score, tiebreaker }, scores: [{ playerId, name, score, gubCount, hasEsteemedElder }] }` — broadcast
- `turn:changed` `{ previousPlayerId, currentPlayerId, currentPlayerName, currentPlayerIndex, turnNumber }` — broadcast
- `gameState:update` `game.toJSON()` — broadcast after every action
- `player:disconnected` `{ playerId, playerName, game }` — broadcast

### Game Rules

- 2-6 players, each starts with 1 Gub (not Elder) in play + 3 cards in hand
- Turn: optional draw → play cards → end turn (discard to max 8 if needed)
- Game ends when 3 letters (G, U, B) are drawn
- Score: free Gubs + protected Gubs; tiebreaker: Esteemed Elder → fewest cards in hand
- Barricades protect own Gubs; Spear destroys barricade or kills free Gub; Sud Spout traps (doesn't count to score); Smahl Thief steals; Lightning destroys Elder or whole hand; Flash Flood kills all unprotected Gubs; Gargok Plague shuffles/redraws all other players' hands; Retreat returns all your cards to hand; Age-Old Cure rescues from discard

## Environment Variables

Backend `backend/.env`: `PORT=5000`
Frontend `frontend/.env`: `VITE_API_URL=http://localhost:5000`, `VITE_SOCKET_URL=http://localhost:5000`

## Current Implementation Status (Phase per roadmap)

- Phase 0 (Setup): ✅
- Phase 1 (Game Engine): ✅ — all models and gameEngine.js complete
- Phase 2 (REST API): ✅ — createGame, getGame, getAllGames
- Phase 3 (Database): ❌ — using in-memory Map
- Phase 4 (Socket.IO): ✅ — all handlers implemented
- Phase 5 (Frontend UI): ✅ — all pages and components exist
- Phase 6 (Card Effects/Rules polish): 🔄 in progress
  - Missing: discard-to-8 UI, Lightning action selection UI, Cricket Song UI

## Known ESLint Issues (non-blocking)

Context files (`GameContext.jsx`, `PlayerContext.jsx`, `SocketContext.jsx`) have `react-refresh/only-export-components` warnings because they export both Provider components and hooks. These don't affect runtime — only HMR granularity.

## Documentation

Detailed docs in `docs/`:
- `GameRules.md` - Complete Gubs rules
- `DataModels.md` - Card, Player, Game, Deck schemas
- `API-Documentation.md` - REST endpoints and Socket.IO events
- `TechnicalArchitecture.md` - Full architecture details
- `ImplementationRoadmap.md` - Phase-by-phase build plan
