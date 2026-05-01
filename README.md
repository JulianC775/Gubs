# Gubs Card Game

A real-time multiplayer card game for 2–6 players, playable in the browser. Based on the physical card game **Gubs** — build your colony, protect your Gubs, and outsmart your opponents before all three letters (G, U, B) are drawn from the deck.

## How to Play

- Each player starts with 1 Gub in play and 3 cards in hand
- On your turn: optionally draw a card, play cards, then discard down to 8 if needed
- Protect your Gubs with Barricades, attack opponents with Spears and Hazards, and use Tools strategically
- The game ends the moment the third letter card (G, U, or B) is drawn
- Most Free + Protected Gubs wins — tiebreaker goes to the Esteemed Elder, then fewest cards in hand

## Running Locally

```bash
# Install all dependencies
npm run install:all

# Start both backend and frontend together
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Tech Stack

- **Frontend**: React 19 + Vite + React Router + Socket.IO Client + @dnd-kit
- **Backend**: Node.js + Express 5 + Socket.IO
- **Real-time**: Socket.IO for multiplayer sync
- **State**: React Context API (Socket, Game, Player)

## Project Structure

```
Gubs/
├── backend/
│   └── src/
│       ├── models/          # Game, Player, Deck, Card
│       ├── services/        # gameEngine.js — all card effects & validation
│       ├── socket/          # socketHandlers.js — real-time event handling
│       ├── controllers/     # REST endpoints
│       └── data/            # cards.json — full 70-card deck definition
├── frontend/
│   └── src/
│       ├── pages/           # Home, Lobby, Game
│       ├── components/      # Card, Hand, PlayArea, PlayerBoard, Deck, etc.
│       ├── contexts/        # SocketContext, GameContext, PlayerContext
│       └── services/        # gameService, socketService
└── docs/                    # Rules, architecture, API docs, roadmap
```

## Cards Implemented

| Type | Cards |
|------|-------|
| Gubs | Gub (×13), Esteemed Elder (×1) |
| Barricades | Mushroom, Toad Rider, Velvet Moth |
| Traps | Sud Spout |
| Weapons | Spear, Lure, Super Lure |
| Tools | Smahl Thief, Age Old Cure, Retreat, Feather, Blindfold, Scout |
| Magic | Single/Double/Triple Ring, Haki Flute, Omen Beetle, Dangerous Alchemy |
| Hazards | Lightning, Cyclone |
| Interrupts | Cricket Song (wild card), Flop Boat (redirect events) |
| Events | Flash Flood, Gargok Plague, Traveling Merchant, Rumor of Wasps |
| Letters | G, U, B (end the game when all three drawn) |

## Features

- Create or join games with a 4-character room code
- Lobby with ready system — host starts when everyone is ready
- Drag-and-drop or click to play cards
- Real-time multiplayer via WebSockets — all game state synced instantly
- 5-second interrupt window for Flop Boat when events are drawn
- Full Esteemed Elder immunity rules enforced
- Discard-to-8 hand limit enforced
- Consecutive skip rule (can't skip drawing two turns in a row)
- Session recovery on page refresh
- Wood table background with dark glassmorphism UI

## Documentation

- [Game Rules](docs/GameRules.md)
- [Technical Architecture](docs/TechnicalArchitecture.md)
- [API Documentation](docs/API-Documentation.md)
- [Data Models](docs/DataModels.md)
