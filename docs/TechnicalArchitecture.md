# Gubs - Technical Architecture

## Tech Stack Overview

### Frontend
- **Framework**: React
- **Language**: JavaScript/TypeScript (recommend TypeScript for type safety)
- **State Management**: TBD (Context API for simple, Redux/Zustand for complex)
- **Styling**: TBD (CSS Modules, Tailwind, styled-components, etc.)
- **Build Tool**: Vite or Create React App

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time Communication**: Socket.IO (for multiplayer game state synchronization)
- **Language**: JavaScript/TypeScript

### Database
- **Options to Consider**:
  - **PostgreSQL**: Best for complex game data, user accounts, game history
  - **MongoDB**: Good for flexible game state storage, quick prototyping
  - **Redis**: For session management, real-time game state caching
  - **SQLite**: Simplest for local development/testing
  - **Hybrid**: PostgreSQL/MongoDB for persistent data + Redis for active games

**Recommendation**: Start with **MongoDB** for flexibility + **Redis** for active game sessions

### Real-time Architecture
- **Socket.IO** for bidirectional event-based communication
- Events: card plays, draws, turn changes, game state updates
- Room-based architecture (each game is a room)

## Project Structure

### Frontend Structure
```
gubs-frontend/
├── public/
│   └── assets/
│       └── card-images/
├── src/
│   ├── components/
│   │   ├── Card/
│   │   ├── Hand/
│   │   ├── PlayArea/
│   │   ├── Deck/
│   │   └── PlayerBoard/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Lobby.jsx
│   │   └── Game.jsx
│   ├── hooks/
│   │   ├── useGameState.js
│   │   └── useSocket.js
│   ├── services/
│   │   ├── api.js
│   │   └── socket.js
│   ├── utils/
│   │   └── cardHelpers.js
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

### Backend Structure
```
gubs-backend/
├── src/
│   ├── models/
│   │   ├── Card.js
│   │   ├── Deck.js
│   │   ├── Player.js
│   │   └── Game.js
│   ├── controllers/
│   │   ├── gameController.js
│   │   └── playerController.js
│   ├── routes/
│   │   ├── gameRoutes.js
│   │   └── playerRoutes.js
│   ├── services/
│   │   ├── gameEngine.js
│   │   ├── cardService.js
│   │   └── deckService.js
│   ├── socket/
│   │   ├── gameHandlers.js
│   │   └── socketManager.js
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── validation.js
│   └── server.js
└── package.json
```

## Data Flow

### Game Creation Flow
1. Player creates game → POST `/api/games`
2. Backend creates game instance in database
3. Backend creates Socket.IO room
4. Returns game ID to frontend
5. Player joins Socket.IO room

### Game Join Flow
1. Player joins game → POST `/api/games/:id/join`
2. Backend adds player to game
3. Player connects to Socket.IO room
4. Broadcast updated game state to all players

### Gameplay Flow
1. Player performs action (draw/play card) → Socket.IO event
2. Backend validates action
3. Backend updates game state
4. Backend emits state update to all players in room
5. All clients update their UI

## Real-time Events (Socket.IO)

### Client → Server
- `join-game`: Player joins a game room
- `draw-card`: Player draws from deck
- `play-card`: Player plays a card
- `end-turn`: Player ends their turn
- `leave-game`: Player leaves game

### Server → Client
- `game-state-update`: Full game state update
- `player-joined`: New player joined
- `player-left`: Player disconnected
- `card-drawn`: Card was drawn (partial update)
- `card-played`: Card was played (partial update)
- `turn-changed`: Turn moved to next player
- `game-ended`: Game over with winner info

## API Endpoints (REST)

### Game Management
- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game state
- `POST /api/games/:id/join` - Join existing game
- `POST /api/games/:id/start` - Start the game
- `DELETE /api/games/:id` - Delete game

### Player Management
- `POST /api/players` - Create player profile
- `GET /api/players/:id` - Get player info
- `GET /api/players/:id/stats` - Get player statistics

## Security Considerations

### Authentication (Future Phase)
- JWT tokens for user sessions
- Socket.IO authentication middleware
- Secure game room access

### Validation
- Server-side validation for all game actions
- Prevent cheating (e.g., playing cards not in hand)
- Rate limiting on API endpoints

### Data Sanitization
- Input validation on all endpoints
- Prevent SQL/NoSQL injection
- XSS protection

## Development Phases

### Phase 1: Core Game Engine (Backend)
- Implement card, deck, player, game models
- Game logic (draw, play, win conditions)
- Unit tests for game rules

### Phase 2: Basic UI (Frontend)
- React components for cards, hand, play area
- Single-player/hot-seat mode
- Basic styling

### Phase 3: API & Database
- Set up database (MongoDB + Redis)
- REST API endpoints
- Connect frontend to backend

### Phase 4: Real-time Multiplayer
- Socket.IO integration
- Game rooms and lobbies
- Multiplayer game state sync

### Phase 5: Polish & Features
- Animations and transitions
- Sound effects
- Game history and statistics
- User accounts and authentication

## Performance Considerations

### Frontend
- Lazy load card images
- React.memo for expensive components
- Debounce socket events
- Optimize re-renders with proper state management

### Backend
- Use Redis for active game sessions (fast read/write)
- Database indexing on game IDs and player IDs
- Connection pooling for database
- Rate limiting to prevent spam

### Network
- Compress Socket.IO messages
- Send state diffs instead of full state when possible
- Implement reconnection logic

## Testing Strategy

### Frontend
- Jest + React Testing Library for component tests
- Cypress for E2E testing
- Mock Socket.IO for isolated testing

### Backend
- Jest for unit tests
- Supertest for API endpoint tests
- Mock database for isolated testing
- Integration tests for game logic

## Deployment (Future)

### Frontend
- Host on: Vercel, Netlify, or AWS S3 + CloudFront

### Backend
- Host on: Heroku, Railway, DigitalOcean, or AWS EC2

### Database
- MongoDB Atlas (cloud)
- Redis Cloud or AWS ElastiCache

## Development Tools

### Required
- Node.js (v18+)
- npm or yarn
- Git

### Recommended
- VS Code with extensions:
  - ESLint
  - Prettier
  - ES7+ React/Redux snippets
- Postman for API testing
- MongoDB Compass (if using MongoDB)
- Redux DevTools (if using Redux)

## Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_URL=<database-connection-string>
REDIS_URL=<redis-connection-string>
JWT_SECRET=<secret-key>
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Next Steps

1. Initialize projects: `npm create vite@latest gubs-frontend -- --template react`
2. Set up backend: `npm init` and install Express, Socket.IO
3. Set up database (MongoDB/Redis)
4. Start with core game engine implementation
5. Build basic UI components
6. Integrate frontend and backend
