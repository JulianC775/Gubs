# Gubs - Data Models & Schema

## Card Model

### Card Object Structure
```javascript
{
  id: String,              // Unique identifier (e.g., "gub-1", "mushroom-3")
  name: String,            // Card name (e.g., "Gub", "Esteemed Elder")
  type: String,            // "gub", "barricade", "trap", "tool", "hazard", "interrupt", "event"
  subtype: String,         // Specific card name for special cards
  imageUrl: String,        // Path to card image
  description: String,     // Card effect description
  isImmediate: Boolean,    // Whether card must be played immediately when drawn

  // Special properties for specific card types
  isProtected: Boolean,    // For Gubs - whether they have barricades
  isTrapped: Boolean,      // For Gubs - whether they are trapped
  protectionCards: [],     // Array of barricade card IDs on this Gub
  trapCard: String,        // ID of trap card on this Gub (if any)

  // Special Gub properties
  isEsteemed: Boolean,     // True for Esteemed Elder
  isImmune: Boolean        // Immune to most effects (Esteemed Elder)
}
```

### Card Types Reference

#### Gubs (type: "gub")
- Regular Gub (quantity: 8+)
- Esteemed Elder (quantity: 1, special: immune to all except Lightning)

#### Barricades (type: "barricade")
- Mushroom (quantity: ~6)
- Toad Rider (quantity: ~2)
- Others TBD from full deck

#### Traps (type: "trap")
- Sud Spout
- Spear (can also destroy barricades)

#### Tools (type: "tool")
- Age-Old Cure (rescue from discard)
- Retreat (retrieve all your cards)
- Rings (transfer freed Gub to your side)

#### Hazards (type: "hazard")
- Spear (destroy barricade or trap Gub)
- Lightning (can destroy Esteemed Elder)
- Smahl Thief (steal opponent's Gub)
- Gargok Plague (force hand shuffle)

#### Interrupts (type: "interrupt")
- Cricket Song (wild card)
- Flop Boat (redirect events back to deck)

#### Events (type: "event")
- G Letter Card (subtype: "letter-g")
- U Letter Card (subtype: "letter-u")
- B Letter Card (subtype: "letter-b")
- Flash Flood (destroy all unprotected Gubs)

## Player Model

### Player Object Structure
```javascript
{
  id: String,                    // Unique player ID
  name: String,                  // Player display name
  socketId: String,              // Socket.IO connection ID

  // Game state
  hand: [Card],                  // Array of card objects in hand (max 8 at turn end)
  playArea: {
    gubs: [Card],                // Gubs in play (Free and Protected)
    barricades: [Card],          // Standalone barricades (rare)
    other: [Card]                // Other cards in play area
  },

  // Turn tracking
  isCurrentTurn: Boolean,        // Whether it's this player's turn
  hasSkippedDraw: Boolean,       // Track if player skipped last turn
  consecutiveSkips: Number,      // Can't skip draw 2 turns in a row

  // Scoring
  score: Number,                 // Current score (Free + Protected Gubs)
  freeGubs: Number,              // Count of unprotected Gubs
  protectedGubs: Number,         // Count of protected Gubs
  trappedGubs: Number,           // Count of trapped Gubs (don't score)

  // Session info
  isConnected: Boolean,          // Connection status
  isReady: Boolean,              // Ready to start game
  joinedAt: Date                 // When player joined
}
```

### Player Methods (Backend)
```javascript
// Hand management
player.drawCard(card)
player.playCard(cardId, target)
player.discardCard(cardId)
player.discardToLimit()          // Discard down to 8 cards

// Score calculation
player.calculateScore()          // Count Free + Protected Gubs

// Validation
player.canPlayCard(cardId)
player.hasCard(cardId)
```

## Deck Model

### Deck Object Structure
```javascript
{
  cards: [Card],                 // Array of remaining cards
  discardPile: [Card],           // Array of discarded cards
  drawnLetters: [String],        // ["G", "U", "B"] as they're drawn

  // Letter card tracking
  letterPositions: {
    g: Number,                   // Position of G card
    u: Number,                   // Position of U card
    b: Number                    // Position of B card
  }
}
```

### Deck Methods (Backend)
```javascript
// Deck management
deck.shuffle()
deck.insertLetterCards()         // Place G, U, B at top/middle/bottom
deck.drawCard()                  // Draw and return top card
deck.addToDiscard(card)

// State
deck.remainingCards()            // Count cards left
deck.isGameEnding()              // Check if all letters drawn
```

## Game Model

### Game Object Structure
```javascript
{
  id: String,                    // Unique game ID
  roomCode: String,              // Short code for joining (e.g., "ABCD")

  // Players
  players: [Player],             // Array of player objects (2-6)
  maxPlayers: Number,            // 6 by default
  currentPlayerIndex: Number,    // Index of current turn player

  // Game state
  status: String,                // "waiting", "playing", "ended"
  deck: Deck,                    // Deck object

  // Turn tracking
  turnNumber: Number,            // Current turn count
  turnStartedAt: Date,           // When current turn started

  // Game end tracking
  drawnLetters: [String],        // ["G", "U", "B"] as drawn
  winner: String,                // Player ID of winner (when game ends)
  finalScores: Object,           // { playerId: score } when game ends

  // Metadata
  createdAt: Date,
  startedAt: Date,
  endedAt: Date,
  createdBy: String              // Player ID of creator
}
```

### Game Methods (Backend)
```javascript
// Game flow
game.addPlayer(player)
game.removePlayer(playerId)
game.startGame()                 // Deal cards, set up deck
game.endGame()                   // Calculate winner

// Turn management
game.nextTurn()                  // Move to next player
game.getCurrentPlayer()

// Actions
game.playerDrawCard(playerId)
game.playerPlayCard(playerId, cardId, targetPlayerId, targetCardId)
game.playerEndTurn(playerId)

// Validation
game.canPlayerAct(playerId)
game.isValidAction(action)

// Scoring
game.calculateAllScores()
game.determineWinner()           // Apply tiebreaker rules
```

## Game State (for Socket.IO sync)

### Full Game State Update
```javascript
{
  gameId: String,
  status: String,
  turnNumber: Number,
  currentPlayerId: String,
  drawnLetters: [String],

  // Each player sees different data
  players: [
    {
      id: String,
      name: String,
      handCount: Number,         // Other players only see count
      playArea: {
        gubs: [Card],            // Visible to all
        // etc.
      },
      score: Number,
      isCurrentTurn: Boolean,
      isConnected: Boolean
    }
  ],

  // Current player sees their own hand
  yourHand: [Card],              // Only sent to current player

  // Deck info
  cardsRemaining: Number,
  discardPileTop: Card           // Top card of discard pile
}
```

### Partial State Updates (Event-based)
```javascript
// Card drawn event
{
  event: "card-drawn",
  playerId: String,
  isEventCard: Boolean,
  cardData: Card,                // Only if Event card (visible to all)
  newHandCount: Number
}

// Card played event
{
  event: "card-played",
  playerId: String,
  card: Card,
  targetPlayerId: String,        // If targeting another player
  targetCardId: String,          // If targeting specific card
  effectResolved: Object         // Result of card effect
}

// Turn changed event
{
  event: "turn-changed",
  newCurrentPlayerId: String,
  turnNumber: Number
}

// Game ended event
{
  event: "game-ended",
  winner: Player,
  finalScores: Object,
  tiebreaker: String             // "esteemed-elder" or "hand-size"
}
```

## Database Schema (MongoDB)

### Games Collection
```javascript
{
  _id: ObjectId,
  roomCode: String,              // Indexed, unique
  players: [
    {
      playerId: String,
      playerName: String,
      finalScore: Number,
      // ... other player data
    }
  ],
  status: String,
  winner: String,
  createdAt: Date,
  endedAt: Date,

  // Full game state snapshot (for game history)
  finalState: Object
}
```

### Players Collection (Optional - for user accounts)
```javascript
{
  _id: ObjectId,
  username: String,              // Unique, indexed
  email: String,
  passwordHash: String,

  // Statistics
  stats: {
    gamesPlayed: Number,
    gamesWon: Number,
    totalGubsCollected: Number,
    winRate: Number
  },

  createdAt: Date,
  lastLogin: Date
}
```

## Redis Schema (for active games)

### Active Game State
- Key: `game:{gameId}`
- Type: Hash
- TTL: 24 hours (games expire after 1 day of inactivity)
- Data: Serialized Game object

### Active Player Session
- Key: `player:{socketId}`
- Type: Hash
- TTL: 1 hour (refresh on activity)
- Data: Player connection info

## Validation Rules

### Card Play Validation
```javascript
// Check if player can play card
function canPlayCard(player, card, game) {
  // Must be player's turn
  if (!player.isCurrentTurn) return false;

  // Must have card in hand
  if (!player.hasCard(card.id)) return false;

  // Event cards can't be in hand (auto-played)
  if (card.type === "event") return false;

  // Card-specific validations
  // ... (e.g., need target for Spear, etc.)

  return true;
}
```

### Game State Validation
```javascript
// Check if game can start
function canStartGame(game) {
  // Need at least 2 players
  if (game.players.length < 2) return false;

  // All players must be ready
  if (!game.players.every(p => p.isReady)) return false;

  // Game must be in waiting status
  if (game.status !== "waiting") return false;

  return true;
}
```

## Next Steps

1. Implement these models in backend (`src/models/`)
2. Create schema validation (use Joi or similar)
3. Set up database connections
4. Build service layer for game logic
5. Create TypeScript interfaces for frontend (mirror these models)
