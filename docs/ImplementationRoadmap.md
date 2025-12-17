# Gubs - Implementation Roadmap

## Overview
This roadmap breaks down the entire project into manageable phases with specific, actionable steps. Each phase builds on the previous one, ensuring you always have a working product.

**Estimated Total Time**: 8-12 weeks (working part-time)

---

## Phase 0: Project Setup (Week 1)

### Goal
Get both frontend and backend projects initialized and running locally.

### Step-by-Step Tasks

#### 0.1 Backend Setup
- [ ] Create backend directory: `mkdir gubs-backend && cd gubs-backend`
- [ ] Initialize Node.js project: `npm init -y`
- [ ] Install dependencies:
  ```bash
  npm install express cors dotenv socket.io
  npm install --save-dev nodemon
  ```
- [ ] Create folder structure:
  ```
  src/
    models/
    controllers/
    routes/
    services/
    socket/
    config/
    middleware/
  ```
- [ ] Create `src/server.js` with basic Express server
- [ ] Add nodemon script to `package.json`:
  ```json
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
  ```
- [ ] Create `.env` file with `PORT=5000`
- [ ] Test: Run `npm run dev` - server should start on port 5000

#### 0.2 Frontend Setup

**Step 1: Create React App with Vite**
- [ ] From the project root directory (`Gubs/`), create the React app:
  ```bash
  npm create vite@latest frontend -- --template react
  ```
  - When prompted, select: **React** framework and **JavaScript** variant (or TypeScript if preferred)
  - This creates a `frontend/` directory in your monorepo

**Step 2: Navigate and Install Base Dependencies**
- [ ] Navigate to frontend directory:
  ```bash
  cd frontend
  ```
- [ ] Install base dependencies:
  ```bash
  npm install
  ```
  - This installs React, Vite, and all default dependencies from `package.json`

**Step 3: Install Additional Packages**
- [ ] Install Socket.IO client and Axios:
  ```bash
  npm install socket.io-client axios
  ```
  - `socket.io-client`: For real-time WebSocket communication with backend
  - `axios`: For making HTTP requests to REST API endpoints

**Step 4: Create Folder Structure**
- [ ] Create the following directories inside `src/`:
  ```bash
  # From frontend/ directory
  mkdir src/components src/pages src/hooks src/services src/utils src/styles
  ```
  Or manually create:
  ```
  src/
    components/     # Reusable UI components (Card, Hand, Deck, etc.)
    pages/          # Page-level components (Home, Lobby, Game)
    hooks/          # Custom React hooks (useGame, useSocket)
    services/       # API and Socket.IO service files
    utils/          # Helper functions (card utilities, etc.)
    styles/         # CSS or styling files
  ```

**Step 5: Create Environment Variables**
- [ ] Create `.env` file in `frontend/` directory:
  ```bash
  # From frontend/ directory
  echo "VITE_API_URL=http://localhost:5000" > .env
  echo "VITE_SOCKET_URL=http://localhost:5000" >> .env
  ```
  Or manually create `frontend/.env` with:
  ```
  VITE_API_URL=http://localhost:5000
  VITE_SOCKET_URL=http://localhost:5000
  ```
  - Note: Vite requires `VITE_` prefix for environment variables
  - These URLs point to your backend server

**Step 6: Update App.jsx (Basic Setup)**
- [ ] Replace default `src/App.jsx` content with a simple test:
  ```jsx
  function App() {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Gubs Card Game</h1>
        <p>Frontend is running!</p>
        <p>Backend API: {import.meta.env.VITE_API_URL}</p>
      </div>
    );
  }

  export default App;
  ```

**Step 7: Test the Frontend**
- [ ] Start the development server:
  ```bash
  npm run dev
  ```
  - Frontend should start on `http://localhost:5173` (or another port if 5173 is busy)
  - Browser should automatically open
  - You should see "Gubs Card Game" heading and "Frontend is running!" message

**Step 8: Verify Backend Connection (Optional)**
- [ ] Make sure backend is running (`npm run dev` in `backend/` directory)
- [ ] Test API connection by adding this to `src/App.jsx`:
  ```jsx
  import { useState, useEffect } from 'react';

  function App() {
    const [backendStatus, setBackendStatus] = useState('Checking...');

    useEffect(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/health`)
        .then(res => res.json())
        .then(data => setBackendStatus(`✓ Connected - ${data.status}`))
        .catch(() => setBackendStatus('✗ Cannot connect to backend'));
    }, []);

    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Gubs Card Game</h1>
        <p>Frontend is running!</p>
        <p>Backend Status: {backendStatus}</p>
      </div>
    );
  }

  export default App;
  ```
  - Refresh the page - you should see "✓ Connected - OK" if backend is running

**Troubleshooting:**
- If port 5173 is busy, Vite will use the next available port (check terminal output)
- If you get CORS errors, make sure backend has CORS enabled (already configured in step 0.1)
- If "Cannot connect to backend", verify backend is running on port 5000

#### 0.3 Version Control
- [ ] Initialize git in project root: `git init`
- [ ] Create `.gitignore`:
  ```
  node_modules/
  .env
  dist/
  build/
  .DS_Store
  ```
- [ ] Initial commit: `git add . && git commit -m "Initial project setup"`
- [ ] Create GitHub repository and push

**Checkpoint**: You should have both servers running - Express on :5000, React on :5173

---

## Phase 1: Core Game Engine (Backend) (Weeks 2-3) ✅

### Goal
Build the game logic without any database or frontend - pure JavaScript logic.

### Step-by-Step Tasks

#### 1.1 Card Model (`src/models/Card.js`) ✅
- [x] Create Card class with properties:
  - `id`, `name`, `type`, `subtype`, `description`, `imageUrl`
- [x] Add special properties: `isProtected`, `isTrapped`, `protectionCards`, `trapCard`
- [x] Create method: `toJSON()` for serialization
- [x] Test: Create a few card instances in a test file

#### 1.2 Card Data (`src/data/cards.json`) ✅
- [x] Create JSON file with all 72 cards from the game
- [x] Categories: Gubs (14), Barricades (mushroom, toad rider, velvet moth), Traps, Tools, Hazards, Interrupts, Events
- [x] Include: Letter cards (G, U, B), Flash Flood, etc.
- [x] Each card needs: `id`, `name`, `type`, `subtype`, `description`, `quantity`

#### 1.3 Deck Model (`src/models/Deck.js`) ✅
- [x] Create Deck class
- [x] Method: `constructor()` - loads all cards from cards.json
- [x] Method: `shuffle()` - Fisher-Yates shuffle algorithm
- [x] Method: `insertLetterCards()` - place G, U, B at top/middle/bottom thirds
- [x] Method: `drawCard()` - remove and return top card
- [x] Method: `addToDiscard(card)` - add card to discard pile
- [x] Property: `drawnLetters` - track which letters have been drawn
- [x] Test: Create deck, shuffle, draw cards, verify letter placement

#### 1.4 Player Model (`src/models/Player.js`) ✅
- [x] Create Player class
- [x] Properties: `id`, `name`, `hand`, `playArea`, `isCurrentTurn`, `consecutiveSkips`
- [x] Method: `addCardToHand(card)`
- [x] Method: `removeCardFromHand(cardId)` - returns card or null
- [x] Method: `playGub(card)` - add to playArea.gubs
- [x] Method: `playBarricade(card, targetGubId)` - protect a Gub
- [x] Method: `calculateScore()` - count free + protected Gubs
- [x] Method: `hasCard(cardId)` - check if card in hand
- [x] Test: Create player, add cards, play cards, calculate score

#### 1.5 Game Model (`src/models/Game.js`) ✅
- [x] Create Game class
- [x] Properties: `id`, `roomCode`, `players`, `deck`, `status`, `currentPlayerIndex`, `turnNumber`, `drawnLetters`
- [x] Method: `addPlayer(playerName)` - add player, deal starting Gub
- [x] Method: `startGame()` - deal 3 cards to each player, shuffle deck, insert letters
- [x] Method: `getCurrentPlayer()` - return current player object
- [x] Method: `nextTurn()` - increment currentPlayerIndex (wrap around)
- [x] Method: `playerDrawCard(playerId)` - validate, draw, handle events
- [x] Method: `playerPlayCard(playerId, cardId, targetPlayerId, targetCardId)` - validate and execute
- [x] Method: `isGameOver()` - check if all 3 letters drawn
- [x] Method: `determineWinner()` - calculate scores, apply tiebreakers
- [x] Test: Full game simulation with 2 dummy players

#### 1.6 Game Logic Service (`src/services/gameEngine.js`) ✅
- [x] Function: `validateCardPlay(game, playerId, cardId, target)` - check if valid
- [x] Function: `executeCardEffect(game, card, playerId, target)` - apply card effects
- [x] Card effect handlers:
  - [x] `playGub()`
  - [x] `playBarricade()` - protect a gub
  - [x] `playSpear()` - destroy barricade or trap Gub or kill a gub
  - [x] `playSmallThief()` - steal Gub
  - [x] `playLightning()` - can destroy Esteemed Elder or a players hand
  - [x] `playAgeOldCure()` - rescue a gub from discard pile
  - [x] `playRetreat()` - retrieve all cards in play to your hand
  - [x] Event card handlers
- [x] Test: Each card type individually

#### 1.7 Testing Game Engine
- [ ] Create `tests/gameEngine.test.js`
- [ ] Test: Create game, add players, start game
- [ ] Test: Draw cards, verify events trigger
- [ ] Test: Play Gubs, verify they enter play
- [ ] Test: Play Barricade, verify protection
- [ ] Test: Play Spear, verify destruction
- [ ] Test: Game end when 3rd letter drawn
- [ ] Test: Winner determination with tiebreakers
- [ ] Fix any bugs found

**Checkpoint**: You can run a full game in Node.js console from start to finish

---

## Phase 2: Basic REST API (Week 4)

### Goal
Create HTTP endpoints to create and manage games (no real-time yet).

### Step-by-Step Tasks

#### 2.1 Game Controller (`src/controllers/gameController.js`)
- [ ] `createGame(req, res)` - create game, return gameId and roomCode
- [ ] `getGame(req, res)` - return game state
- [ ] `joinGame(req, res)` - add player to game
- [ ] `startGame(req, res)` - start the game
- [ ] `deleteGame(req, res)` - remove game
- [ ] Each function should use try/catch and return consistent JSON

#### 2.2 Game Routes (`src/routes/gameRoutes.js`)
- [ ] `POST /api/games` → createGame
- [ ] `GET /api/games/:gameId` → getGame
- [ ] `POST /api/games/:gameId/join` → joinGame
- [ ] `POST /api/games/join/:roomCode` → joinGameByCode
- [ ] `POST /api/games/:gameId/start` → startGame
- [ ] `DELETE /api/games/:gameId` → deleteGame

#### 2.3 In-Memory Storage (`src/services/gameStore.js`)
Since no database yet, store active games in memory:
- [ ] Create Map to store games: `const games = new Map()`
- [ ] `createGame()` - generate ID, create Game instance, store in Map
- [ ] `getGame(gameId)` - retrieve from Map
- [ ] `deleteGame(gameId)` - remove from Map
- [ ] `generateRoomCode()` - create 4-character code

#### 2.4 Middleware (`src/middleware/validation.js`)
- [ ] `validateCreateGame` - check playerName provided
- [ ] `validateJoinGame` - check game exists, not full, not started
- [ ] Error handling middleware

#### 2.5 Update Server (`src/server.js`)
- [ ] Import and use CORS middleware
- [ ] Import and use express.json() middleware
- [ ] Import and use game routes
- [ ] Add error handling middleware
- [ ] Test with Postman/curl

#### 2.6 Testing REST API
- [ ] Test: Create game with Postman
- [ ] Test: Join game with different player
- [ ] Test: Get game state
- [ ] Test: Start game
- [ ] Test: Error cases (invalid game ID, full game, etc.)

**Checkpoint**: You can create, join, and start games via HTTP requests

---

## Phase 3: Database Integration (Week 5)

### Goal
Replace in-memory storage with MongoDB for persistence and Redis for active games.

### Step-by-Step Tasks

#### 3.1 MongoDB Setup
- [ ] Install MongoDB locally or use MongoDB Atlas (cloud)
- [ ] Install mongoose: `npm install mongoose`
- [ ] Create `.env` variable: `MONGODB_URI=mongodb://localhost:27017/gubs`

#### 3.2 MongoDB Schema (`src/models/GameSchema.js`)
- [ ] Create Mongoose schema for Game
- [ ] Fields: gameId, roomCode, players, status, winner, finalScores, createdAt, endedAt
- [ ] Create indexes on: roomCode, gameId
- [ ] Export model

#### 3.3 Database Config (`src/config/database.js`)
- [ ] Create MongoDB connection function
- [ ] Handle connection errors
- [ ] Export connection

#### 3.4 Redis Setup (Optional for Phase 3)
- [ ] Install Redis locally or use Redis Cloud
- [ ] Install redis: `npm install redis`
- [ ] Create Redis client in `src/config/redis.js`
- [ ] Store active games in Redis with TTL (24 hours)

#### 3.5 Update Game Store (`src/services/gameStore.js`)
- [ ] When game created: save to Redis (active) and MongoDB (record)
- [ ] When game retrieved: check Redis first, then MongoDB
- [ ] When game ends: update MongoDB with final state
- [ ] Clean up Redis after game ends (or let TTL expire)

#### 3.6 Testing Database
- [ ] Create game, verify in MongoDB
- [ ] Restart server, verify game still exists
- [ ] Complete game, verify final state saved

**Checkpoint**: Games persist across server restarts

---

## Phase 4: WebSocket/Socket.IO Integration (Week 6)

### Goal
Add real-time gameplay with Socket.IO.

### Step-by-Step Tasks

#### 4.1 Socket.IO Server Setup (`src/server.js`)
- [ ] Install socket.io: `npm install socket.io`
- [ ] Create HTTP server and attach Socket.IO
- [ ] Configure CORS for Socket.IO

#### 4.2 Socket Manager (`src/socket/socketManager.js`)
- [ ] Create Socket.IO connection handler
- [ ] Track socket ID to player ID mapping
- [ ] Handle disconnect events

#### 4.3 Game Event Handlers (`src/socket/gameHandlers.js`)
- [ ] `join-game` - player joins game room
- [ ] `draw-card` - player draws card
  - Validate it's player's turn
  - Draw card from deck
  - Check if Event card
  - Emit `card-drawn` to all players
  - If Letter card, emit `letter-drawn`
  - If 3rd letter, emit `game-ended`
- [ ] `play-card` - player plays card
  - Validate card play
  - Execute card effect
  - Emit `card-played` to all players
- [ ] `end-turn` - player ends turn
  - Check hand limit
  - Move to next player
  - Emit `turn-changed`
- [ ] `leave-game` - player leaves
  - Remove from game
  - Emit `player-left`

#### 4.4 Game State Broadcasting
- [ ] Create `broadcastGameState(gameId)` function
- [ ] Send different data to each player (hide other players' hands)
- [ ] Call after every game-changing action

#### 4.5 Testing Socket.IO
- [ ] Use Socket.IO client in browser console
- [ ] Test: Join game, draw cards, play cards
- [ ] Verify events received by all connected clients
- [ ] Test disconnection and reconnection

**Checkpoint**: Multiple clients can play a game in real-time

---

## Phase 5: Basic Frontend UI (Weeks 7-8)

### Goal
Create functional UI to play the game (simple styling for now).

### Step-by-Step Tasks

#### 5.1 Socket Service (`src/services/socket.js`)
- [ ] Create Socket.IO client connection
- [ ] Export socket instance
- [ ] Create helper functions: `joinGameRoom()`, `drawCard()`, `playCard()`, `endTurn()`

#### 5.2 API Service (`src/services/api.js`)
- [ ] Create axios instance with base URL
- [ ] Functions: `createGame()`, `joinGame()`, `getGame()`
- [ ] Export API functions

#### 5.3 useSocket Hook (`src/hooks/useSocket.js`)
- [ ] Custom hook to manage Socket.IO events
- [ ] Listen for: `game-state-update`, `card-drawn`, `card-played`, `turn-changed`, `game-ended`
- [ ] Store events in state and return to components

#### 5.4 useGame Hook (`src/hooks/useGame.js`)
- [ ] Manage game state (players, current turn, your hand, etc.)
- [ ] Functions: `drawCard()`, `playCard()`, `endTurn()`
- [ ] Sync with Socket.IO events

#### 5.5 Card Component (`src/components/Card/Card.jsx`)
- [ ] Display card image (or placeholder with card name)
- [ ] Props: `card`, `onClick`, `isPlayable`
- [ ] Show card type with color coding
- [ ] Hover effects

#### 5.6 Hand Component (`src/components/Hand/Hand.jsx`)
- [ ] Display all cards in player's hand
- [ ] Props: `cards`, `onCardClick`
- [ ] Horizontal scrollable layout
- [ ] Highlight playable cards

#### 5.7 PlayArea Component (`src/components/PlayArea/PlayArea.jsx`)
- [ ] Display player's Gubs and their protections/traps
- [ ] Show which Gubs are protected vs free vs trapped
- [ ] Visual stacking for Barricades on Gubs
- [ ] Display score (Free + Protected count)

#### 5.8 Deck Component (`src/components/Deck/Deck.jsx`)
- [ ] Show deck (cards remaining count)
- [ ] Show discard pile (top card)
- [ ] Show drawn letters (G, U, B)
- [ ] "Draw Card" button (only enabled on your turn)

#### 5.9 PlayerBoard Component (`src/components/PlayerBoard/PlayerBoard.jsx`)
- [ ] Show opponent's info: name, score, hand count
- [ ] Show opponent's play area (their Gubs)
- [ ] Indicate whose turn it is
- [ ] Use PlayArea component for opponent's Gubs

#### 5.10 Home Page (`src/pages/Home.jsx`)
- [ ] Title: "Gubs Card Game"
- [ ] Button: "Create Game"
- [ ] Input + Button: "Join Game by Code"
- [ ] When creating: call API, get room code, navigate to Lobby

#### 5.11 Lobby Page (`src/pages/Lobby.jsx`)
- [ ] Display room code prominently
- [ ] List all players
- [ ] Show ready status
- [ ] "Ready" button for each player
- [ ] "Start Game" button (when all ready)
- [ ] When game starts: navigate to Game page

#### 5.12 Game Page (`src/pages/Game.jsx`)
- [ ] Use useGame hook to get game state
- [ ] Layout:
  - Top: Opponent PlayerBoards (2-5 opponents)
  - Center: Deck, discard pile, drawn letters
  - Bottom: Your PlayArea and Hand
- [ ] Turn indicator
- [ ] "End Turn" button
- [ ] Card play logic: click card in hand → highlight valid targets → click target → play
- [ ] Show winner when game ends

#### 5.13 Basic Styling
- [ ] Use CSS or a simple framework (Tailwind recommended)
- [ ] Card dimensions: ~150px height
- [ ] Color code card types:
  - Gubs: green
  - Barricades: blue
  - Traps: red
  - Tools: yellow
  - Hazards: orange
  - Interrupts: purple
  - Events: pink
- [ ] Responsive layout (mobile-friendly)

#### 5.14 Testing Frontend
- [ ] Create game in one browser window
- [ ] Join game in incognito/different browser
- [ ] Start game, play full game
- [ ] Verify all events update UI correctly
- [ ] Test on mobile device

**Checkpoint**: You can play a full game from browser with basic UI

---

## Phase 6: Card Effects & Game Rules (Week 9)

### Goal
Implement ALL card effects and game rules accurately.

### Step-by-Step Tasks

#### 6.1 Implement All Card Types
For each card in cards.json:
- [ ] Gub cards - simple play to area
- [ ] Esteemed Elder - immune to all except Lightning
- [ ] Mushroom, Toad Rider - barricade logic
- [ ] Spear - destroy barricade OR trap Gub
- [ ] Sud Spout - trap Gub
- [ ] Lightning - destroy Esteemed Elder
- [ ] Smahl Thief - steal Gub (discard Sud Spout if stealing from under one)
- [ ] Age-Old Cure - rescue from discard pile
- [ ] Retreat - retrieve all your cards
- [ ] Rings - transfer freed Gub to your side
- [ ] Cricket Song - wild card (UI: let player choose what to represent)
- [ ] Flop Boat - redirect Event back to deck
- [ ] Gargok Plague - shuffle opponent's hand (preventable with Age-Old Cure)
- [ ] Flash Flood - discard all unprotected Gubs
- [ ] Letter cards - end game when all 3 drawn

#### 6.2 Targeting System (Frontend)
- [ ] When card needs target: highlight valid targets
- [ ] Click target to confirm
- [ ] Show "Cancel" to unselect card
- [ ] Visual feedback for selected card + target

#### 6.3 Card Play Validation (Backend)
- [ ] Validate card in player's hand
- [ ] Validate it's player's turn (except Interrupts)
- [ ] Validate target is legal:
  - Barricades must target your own unprotected Gub
  - Spear can target opponent's Barricade or unprotected Gub
  - Smahl Thief targets opponent's Gub (not Esteemed Elder, not trapped)
  - Etc.
- [ ] Return error with reason if invalid

#### 6.4 Interrupt Cards Logic
- [ ] Interrupts can be played on opponent's turn
- [ ] Cricket Song: UI to select what card to mimic
- [ ] Flop Boat: can interrupt Event cards (even on draw)

#### 6.5 Hand Limit Enforcement
- [ ] At end of turn, check if > 8 cards
- [ ] If yes: show discard UI, require player to discard down to 8
- [ ] Prevent ending turn until hand is 8 or fewer

#### 6.6 Tiebreaker Logic
- [ ] Count scores: Free + Protected Gubs
- [ ] If tied: check for Esteemed Elder
- [ ] If still tied: fewest cards in hand wins
- [ ] Display tiebreaker reason in end game UI

#### 6.7 Testing All Cards
- [ ] Create test scenarios for each card type
- [ ] Verify effects work correctly
- [ ] Test edge cases (e.g., Spear on Sud Spout, stealing from under Sud Spout)
- [ ] Verify Esteemed Elder immunity
- [ ] Test Flop Boat on Letter cards

**Checkpoint**: All 70 cards work correctly with proper rules

---

## Phase 7: Polish & UX Improvements (Week 10)

### Goal
Make the game enjoyable to play with good UX.

### Step-by-Step Tasks

#### 7.1 Card Images
- [ ] Create or find card images (70 cards)
- [ ] Use placeholder images or simple designs
- [ ] Tools: Figma, Canva, or AI image generation
- [ ] Store in `frontend/public/assets/cards/`
- [ ] Update cards.json with imageUrl paths

#### 7.2 Animations
- [ ] Card draw animation (slide from deck to hand)
- [ ] Card play animation (slide from hand to play area)
- [ ] Barricade stack animation
- [ ] Card destruction animation (fade out)
- [ ] Turn change transition
- [ ] Use CSS transitions or Framer Motion

#### 7.3 Sound Effects (Optional)
- [ ] Card shuffle sound
- [ ] Card draw sound
- [ ] Card play sound
- [ ] Win/lose sound
- [ ] Toggle to mute

#### 7.4 Game Log/History
- [ ] Component showing recent actions:
  - "Alice drew a card"
  - "Bob played Spear on Alice's Mushroom"
  - "Charlie's Gub was protected"
- [ ] Scrollable log, latest at bottom
- [ ] Different colors for different action types

#### 7.5 Tooltips & Help
- [ ] Hover over card to see description
- [ ] "How to Play" button that shows rules
- [ ] Tutorial mode or first-time walkthrough
- [ ] Visual indicators for playable cards

#### 7.6 Responsive Design
- [ ] Test on mobile devices
- [ ] Adjust layout for small screens
- [ ] Touch-friendly card selection
- [ ] Rotate phone prompt for landscape mode

#### 7.7 Loading States
- [ ] Show spinner while creating game
- [ ] Show "Waiting for players..." in lobby
- [ ] Show "Waiting for X's turn..." during game
- [ ] Skeleton loaders for card images

#### 7.8 Error Handling (Frontend)
- [ ] Display error messages in UI (not just console)
- [ ] "Could not connect to server" message
- [ ] "Invalid card play" feedback
- [ ] Reconnection logic if socket disconnects

#### 7.9 Accessibility
- [ ] Keyboard navigation for cards
- [ ] Screen reader support (aria-labels)
- [ ] Color blind mode (patterns instead of just colors)
- [ ] High contrast mode option

**Checkpoint**: Game is polished and fun to play

---

## Phase 8: Advanced Features (Week 11-12)

### Goal
Add features that enhance multiplayer and replayability.

### Step-by-Step Tasks

#### 8.1 Reconnection Logic
- [ ] Store player's socketId in database
- [ ] When player reconnects: match by playerName or token
- [ ] Restore game state for reconnected player
- [ ] Show "X has reconnected" message

#### 8.2 Spectator Mode
- [ ] Allow users to watch ongoing games
- [ ] Spectators see all cards (god view)
- [ ] Can't interact, only observe
- [ ] Join as spectator from lobby

#### 8.3 Game History
- [ ] Save completed games to MongoDB
- [ ] Page to view past games
- [ ] Show: players, winner, duration, final scores
- [ ] Replay functionality (show card plays in order)

#### 8.4 Player Statistics (if adding user accounts)
- [ ] Track wins/losses per player
- [ ] Total games played
- [ ] Win rate
- [ ] Favorite cards (most played)
- [ ] Leaderboard

#### 8.5 Chat System
- [ ] Add text chat to game
- [ ] Socket event: `send-message`
- [ ] Broadcast messages to all players in room
- [ ] Show in sidebar during game
- [ ] Optional: emoji reactions

#### 8.6 Custom Game Settings
- [ ] Allow creating games with:
  - Custom hand size limit
  - Custom starting Gubs (1-3)
  - Disable certain cards
  - Time limit per turn
- [ ] Store settings in game object
- [ ] Apply settings during game

#### 8.7 AI Opponent (Advanced)
- [ ] Create simple AI player
- [ ] Strategy: random plays, basic protection logic
- [ ] Allow playing vs AI for practice
- [ ] Multiple difficulty levels

#### 8.8 Notifications
- [ ] "It's your turn!" notification
- [ ] Browser notification API
- [ ] Sound alert when turn starts
- [ ] Mobile push notifications (future)

**Checkpoint**: Game has rich features and replayability

---

## Phase 9: Testing & Bug Fixes (Week 12)

### Goal
Comprehensive testing and bug fixing.

### Step-by-Step Tasks

#### 9.1 Unit Tests
- [ ] Test all models (Card, Deck, Player, Game)
- [ ] Test all card effects
- [ ] Test game logic (turn changes, win conditions)
- [ ] Use Jest, aim for >80% coverage

#### 9.2 Integration Tests
- [ ] Test API endpoints
- [ ] Test Socket.IO events
- [ ] Test database operations
- [ ] Use Supertest + Jest

#### 9.3 End-to-End Tests
- [ ] Test full game flow: create → join → play → end
- [ ] Test with multiple players
- [ ] Test edge cases
- [ ] Use Cypress or Playwright

#### 9.4 Manual Testing
- [ ] Play 10+ full games with friends
- [ ] Try to break the game (spam clicks, disconnect mid-game, etc.)
- [ ] Test on different devices and browsers
- [ ] Document all bugs found

#### 9.5 Bug Fixing
- [ ] Fix all critical bugs (game breaking)
- [ ] Fix high priority bugs (major UX issues)
- [ ] Fix medium priority bugs (minor issues)
- [ ] Document known low priority bugs for future

#### 9.6 Performance Testing
- [ ] Test with 6 players
- [ ] Monitor server memory usage
- [ ] Check for memory leaks (frontend and backend)
- [ ] Optimize slow operations

#### 9.7 Security Audit
- [ ] Check for SQL/NoSQL injection vulnerabilities
- [ ] Validate all user inputs
- [ ] Rate limiting on API and Socket.IO
- [ ] Ensure players can't cheat (play cards not in hand, etc.)

**Checkpoint**: Game is stable and tested

---

## Phase 10: Deployment (Week 12+)

### Goal
Deploy to production so others can play.

### Step-by-Step Tasks

#### 10.1 Environment Configuration
- [ ] Create production `.env` files
- [ ] Secure secret keys and database credentials
- [ ] Configure production URLs

#### 10.2 Database Setup
- [ ] Create MongoDB Atlas cluster (free tier)
- [ ] Create Redis Cloud instance (free tier)
- [ ] Update connection strings in `.env`
- [ ] Test connections

#### 10.3 Backend Deployment
- [ ] Choose platform: Heroku, Railway, Render, or DigitalOcean
- [ ] Configure build scripts
- [ ] Deploy backend
- [ ] Test API endpoints (use production URL)
- [ ] Monitor logs for errors

#### 10.4 Frontend Deployment
- [ ] Update API URLs to production backend
- [ ] Build frontend: `npm run build`
- [ ] Deploy to Vercel, Netlify, or AWS S3
- [ ] Test production frontend

#### 10.5 Domain & SSL
- [ ] (Optional) Purchase domain name
- [ ] Configure DNS
- [ ] Enable HTTPS (automatic with Vercel/Netlify)

#### 10.6 Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Google Analytics or Plausible)
- [ ] Monitor server uptime (UptimeRobot)
- [ ] Set up logging (Winston or Pino)

#### 10.7 CI/CD (Optional)
- [ ] Set up GitHub Actions
- [ ] Auto-deploy on push to main branch
- [ ] Run tests before deploy

#### 10.8 Launch
- [ ] Share with friends and family
- [ ] Post on social media
- [ ] Collect feedback
- [ ] Iterate based on feedback

**Checkpoint**: Game is live and playable by anyone!

---

## Ongoing Maintenance

### Weekly Tasks
- [ ] Monitor error logs
- [ ] Check server health
- [ ] Respond to user feedback

### Monthly Tasks
- [ ] Review analytics
- [ ] Plan new features
- [ ] Update dependencies
- [ ] Performance optimization

---

## Tips for Success

### 1. Start Small
- Don't try to build everything at once
- Complete each phase fully before moving to next
- Test frequently

### 2. Version Control
- Commit after each completed task
- Use meaningful commit messages
- Create branches for experimental features

### 3. Ask for Help
- Use Stack Overflow, Discord, Reddit
- AI assistants (like Claude!) for debugging
- Don't get stuck for hours - ask questions

### 4. Take Breaks
- This is a marathon, not a sprint
- Burnout is real - take days off
- Celebrate small wins

### 5. Documentation
- Comment your code
- Keep notes on design decisions
- Update README as you build

### 6. User Feedback
- Share early with friends
- Listen to feedback
- Iterate quickly

---

## Stretch Goals (Future Enhancements)

- [ ] User authentication (login system)
- [ ] Friend system (add friends, invite to games)
- [ ] Tournaments and ranked play
- [ ] Custom card creation
- [ ] Mobile app (React Native)
- [ ] Different game modes
- [ ] Achievements and badges
- [ ] In-game currency and cosmetics
- [ ] Voice chat integration
- [ ] Twitch/YouTube integration for streaming

---

## Resources

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Socket.IO Docs](https://socket.io/docs/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/docs/)

### Tutorials
- [Socket.IO Chat Tutorial](https://socket.io/get-started/chat)
- [MERN Stack Tutorial](https://www.mongodb.com/languages/mern-stack-tutorial)
- [React Game Development](https://react.dev/learn/tutorial-tic-tac-toe)

### Tools
- Postman (API testing)
- MongoDB Compass (database GUI)
- Redis Insight (Redis GUI)
- VS Code extensions (ESLint, Prettier)

---

## Current Phase Tracker

**Current Phase**: Phase 0 - Project Setup

**Next Milestone**: Get both servers running locally

**Estimated Completion**: [Your target date]

---

Good luck! Remember: building your first full-stack app is challenging but incredibly rewarding. Take it one step at a time, and you'll have an amazing game at the end! 🎮
