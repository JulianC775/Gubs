# Gubs - API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication
Currently no authentication required for MVP. Future versions will use JWT tokens.

```javascript
// Future: All protected endpoints will require
Headers: {
  "Authorization": "Bearer <jwt-token>"
}
```

---

## REST API Endpoints

### Game Management

#### Create New Game
Creates a new game instance and returns game ID and room code.

**Endpoint**: `POST /games`

**Request Body**:
```json
{
  "playerName": "Alice",
  "maxPlayers": 6
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "gameId": "game_abc123xyz",
    "roomCode": "ABCD",
    "game": {
      "id": "game_abc123xyz",
      "roomCode": "ABCD",
      "status": "waiting",
      "maxPlayers": 6,
      "players": [
        {
          "id": "player_1",
          "name": "Alice",
          "isConnected": true,
          "isReady": false
        }
      ],
      "createdAt": "2025-11-19T10:30:00.000Z"
    }
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Player name is required"
}
```

---

#### Get Game State
Retrieves current state of a specific game.

**Endpoint**: `GET /games/:gameId`

**Parameters**:
- `gameId` (string, required): The game ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "game_abc123xyz",
    "roomCode": "ABCD",
    "status": "playing",
    "turnNumber": 5,
    "currentPlayerId": "player_2",
    "drawnLetters": ["G"],
    "players": [
      {
        "id": "player_1",
        "name": "Alice",
        "handCount": 5,
        "score": 3,
        "freeGubs": 2,
        "protectedGubs": 1,
        "trappedGubs": 1,
        "isCurrentTurn": false,
        "isConnected": true,
        "playArea": {
          "gubs": [
            {
              "id": "gub-1",
              "name": "Gub",
              "type": "gub",
              "isProtected": true,
              "protectionCards": ["mushroom-1"],
              "isTrapped": false
            },
            {
              "id": "gub-2",
              "name": "Gub",
              "type": "gub",
              "isProtected": false,
              "isTrapped": false
            }
          ]
        }
      },
      {
        "id": "player_2",
        "name": "Bob",
        "handCount": 4,
        "score": 2,
        "isCurrentTurn": true,
        "isConnected": true
      }
    ],
    "cardsRemaining": 45,
    "discardPileTop": {
      "id": "spear-1",
      "name": "Spear",
      "type": "hazard"
    }
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Game not found"
}
```

---

#### Join Existing Game
Add a player to an existing game.

**Endpoint**: `POST /games/:gameId/join`

**Parameters**:
- `gameId` (string, required): The game ID

**Request Body**:
```json
{
  "playerName": "Charlie"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "playerId": "player_3",
    "game": {
      "id": "game_abc123xyz",
      "status": "waiting",
      "players": [
        { "id": "player_1", "name": "Alice" },
        { "id": "player_2", "name": "Bob" },
        { "id": "player_3", "name": "Charlie" }
      ]
    }
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Game is full (max 6 players)"
}
```

**Error Response** (409 Conflict):
```json
{
  "success": false,
  "error": "Game has already started"
}
```

---

#### Join Game by Room Code
Join game using short room code instead of full game ID.

**Endpoint**: `POST /games/join/:roomCode`

**Parameters**:
- `roomCode` (string, required): 4-character room code (e.g., "ABCD")

**Request Body**:
```json
{
  "playerName": "Dave"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "playerId": "player_4",
    "gameId": "game_abc123xyz",
    "game": { /* game object */ }
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Invalid room code"
}
```

---

#### Start Game
Start the game (only creator or ready players can trigger).

**Endpoint**: `POST /games/:gameId/start`

**Request Body**:
```json
{
  "playerId": "player_1"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "game": {
      "id": "game_abc123xyz",
      "status": "playing",
      "currentPlayerId": "player_1",
      "turnNumber": 1,
      "startedAt": "2025-11-19T10:35:00.000Z"
    }
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Need at least 2 players to start"
}
```

---

#### Delete Game
Remove a game (only if not started or creator only).

**Endpoint**: `DELETE /games/:gameId`

**Request Body**:
```json
{
  "playerId": "player_1"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Game deleted successfully"
}
```

---

### Player Management

#### Set Player Ready Status
Mark player as ready to start.

**Endpoint**: `POST /games/:gameId/players/:playerId/ready`

**Request Body**:
```json
{
  "isReady": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "playerId": "player_1",
    "isReady": true
  }
}
```

---

#### Get Player Hand
Get the current player's hand (authenticated to that player only).

**Endpoint**: `GET /games/:gameId/players/:playerId/hand`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "hand": [
      {
        "id": "gub-5",
        "name": "Gub",
        "type": "gub",
        "imageUrl": "/assets/cards/gub.png",
        "description": "A Gub for your colony"
      },
      {
        "id": "mushroom-3",
        "name": "Mushroom",
        "type": "barricade",
        "imageUrl": "/assets/cards/mushroom.png",
        "description": "Protects a Gub from attacks"
      }
    ]
  }
}
```

---

## WebSocket Events (Socket.IO)

### Connection

#### Connect to Server
```javascript
// Client-side
import io from 'socket.io-client';
const socket = io('http://localhost:5000');
```

---

### Client → Server Events

#### Join Game Room
Join a specific game's room to receive real-time updates.

**Event**: `join-game`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1"
}
```

**Server Response**: `game-joined`
```json
{
  "success": true,
  "gameId": "game_abc123xyz",
  "playerId": "player_1"
}
```

**Error Response**: `error`
```json
{
  "event": "join-game",
  "error": "Invalid game ID"
}
```

---

#### Draw Card
Player draws a card from the deck.

**Event**: `draw-card`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1"
}
```

**Server Response**: `card-drawn` (to all players in room)
```json
{
  "playerId": "player_1",
  "isEventCard": false,
  "cardData": null,              // null if not Event card
  "newHandCount": 6,
  "cardsRemaining": 44
}
```

**If Event Card Drawn**: `event-card-drawn`
```json
{
  "playerId": "player_1",
  "card": {
    "id": "letter-g",
    "name": "G",
    "type": "event",
    "subtype": "letter-g"
  },
  "drawnLetters": ["G"],
  "gameEnding": false
}
```

**If Game Ending Letter Drawn**: `game-ended`
```json
{
  "finalLetter": "B",
  "drawnLetters": ["G", "U", "B"],
  "winner": {
    "id": "player_2",
    "name": "Bob",
    "score": 5
  },
  "finalScores": [
    { "id": "player_1", "name": "Alice", "score": 3 },
    { "id": "player_2", "name": "Bob", "score": 5 },
    { "id": "player_3", "name": "Charlie", "score": 2 }
  ],
  "tiebreaker": null
}
```

---

#### Play Card
Player plays a card from their hand.

**Event**: `play-card`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1",
  "cardId": "mushroom-3",
  "targetPlayerId": "player_1",    // Optional: for cards targeting players
  "targetCardId": "gub-5"          // Optional: for cards targeting specific cards
}
```

**Examples**:

1. **Playing a Gub** (no target needed):
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1",
  "cardId": "gub-7"
}
```

2. **Playing a Barricade** (target your own Gub):
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1",
  "cardId": "mushroom-3",
  "targetPlayerId": "player_1",
  "targetCardId": "gub-5"
}
```

3. **Playing Spear** (target opponent's Gub or Barricade):
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1",
  "cardId": "spear-2",
  "targetPlayerId": "player_2",
  "targetCardId": "mushroom-1"
}
```

**Server Response**: `card-played` (to all players)
```json
{
  "playerId": "player_1",
  "card": {
    "id": "mushroom-3",
    "name": "Mushroom",
    "type": "barricade"
  },
  "targetPlayerId": "player_1",
  "targetCardId": "gub-5",
  "effect": {
    "action": "barricade-added",
    "targetGub": "gub-5",
    "nowProtected": true
  },
  "playerHandCount": 5
}
```

**For Hazard Cards**: `card-played`
```json
{
  "playerId": "player_1",
  "card": { "id": "spear-2", "name": "Spear", "type": "hazard" },
  "targetPlayerId": "player_2",
  "targetCardId": "mushroom-1",
  "effect": {
    "action": "barricade-destroyed",
    "destroyedCard": "mushroom-1",
    "targetGub": "gub-3",
    "nowProtected": false
  }
}
```

**Error Response**: `play-card-error`
```json
{
  "error": "Not your turn",
  "playerId": "player_1"
}
```

```json
{
  "error": "Card not in hand",
  "cardId": "mushroom-3"
}
```

```json
{
  "error": "Invalid target",
  "reason": "Cannot target protected Gub with Spear"
}
```

---

#### End Turn
Player ends their turn.

**Event**: `end-turn`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1"
}
```

**Server Response**: `turn-changed` (to all players)
```json
{
  "previousPlayerId": "player_1",
  "currentPlayerId": "player_2",
  "turnNumber": 6
}
```

**If player has > 8 cards**: `discard-required`
```json
{
  "playerId": "player_1",
  "currentHandCount": 10,
  "maxAllowed": 8,
  "mustDiscard": 2
}
```

---

#### Discard Cards
Discard cards to get down to hand limit.

**Event**: `discard-cards`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1",
  "cardIds": ["gub-8", "mushroom-4"]
}
```

**Server Response**: `cards-discarded`
```json
{
  "playerId": "player_1",
  "discardedCount": 2,
  "newHandCount": 8
}
```

---

#### Leave Game
Player leaves the game.

**Event**: `leave-game`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "playerId": "player_1"
}
```

**Server Response**: `player-left` (to all remaining players)
```json
{
  "playerId": "player_1",
  "playerName": "Alice",
  "remainingPlayers": 3
}
```

---

### Server → Client Events

#### Game State Update
Full game state sent periodically or on major changes.

**Event**: `game-state-update`

**Payload**:
```json
{
  "gameId": "game_abc123xyz",
  "status": "playing",
  "turnNumber": 5,
  "currentPlayerId": "player_2",
  "drawnLetters": ["G"],
  "players": [/* player objects */],
  "cardsRemaining": 45,
  "discardPileTop": { /* card object */ }
}
```

---

#### Player Joined
New player joined the game.

**Event**: `player-joined`

**Payload**:
```json
{
  "player": {
    "id": "player_4",
    "name": "Eve",
    "isReady": false,
    "isConnected": true
  },
  "totalPlayers": 4
}
```

---

#### Player Disconnected
Player lost connection.

**Event**: `player-disconnected`

**Payload**:
```json
{
  "playerId": "player_2",
  "playerName": "Bob",
  "waitingForReconnect": true
}
```

---

#### Player Reconnected
Player reconnected to game.

**Event**: `player-reconnected`

**Payload**:
```json
{
  "playerId": "player_2",
  "playerName": "Bob"
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required (future) |
| 403 | Forbidden | Not allowed to perform action |
| 404 | Not Found | Game/Player not found |
| 409 | Conflict | Game already started, room full, etc. |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

### REST API
- 100 requests per minute per IP
- 1000 requests per hour per IP

### WebSocket
- 10 events per second per socket
- Prevents spam clicking

---

## Example Client Usage

### Creating and Joining a Game

```javascript
// Create game
const response = await fetch('http://localhost:5000/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerName: 'Alice',
    maxPlayers: 6
  })
});
const { data } = await response.json();
const { gameId, roomCode } = data;

// Connect to Socket.IO
const socket = io('http://localhost:5000');

// Join game room
socket.emit('join-game', { gameId, playerId: data.game.players[0].id });

// Listen for events
socket.on('game-state-update', (state) => {
  console.log('Game state:', state);
});

socket.on('card-drawn', (data) => {
  console.log('Card drawn:', data);
});

socket.on('card-played', (data) => {
  console.log('Card played:', data);
});
```

### Drawing and Playing Cards

```javascript
// Draw a card
socket.emit('draw-card', {
  gameId: 'game_abc123xyz',
  playerId: 'player_1'
});

// Play a Gub
socket.emit('play-card', {
  gameId: 'game_abc123xyz',
  playerId: 'player_1',
  cardId: 'gub-5'
});

// Play a Barricade on a Gub
socket.emit('play-card', {
  gameId: 'game_abc123xyz',
  playerId: 'player_1',
  cardId: 'mushroom-3',
  targetPlayerId: 'player_1',
  targetCardId: 'gub-5'
});

// End turn
socket.emit('end-turn', {
  gameId: 'game_abc123xyz',
  playerId: 'player_1'
});
```

---

## Testing Endpoints

### Using curl

```bash
# Create game
curl -X POST http://localhost:5000/api/games \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Alice","maxPlayers":6}'

# Get game state
curl http://localhost:5000/api/games/game_abc123xyz

# Join game
curl -X POST http://localhost:5000/api/games/game_abc123xyz/join \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob"}'
```

### Using Postman
Import the collection (to be created) or manually test each endpoint with the examples above.

---

## Notes for Implementation

1. **Validation**: All endpoints should validate input before processing
2. **Error Handling**: Return consistent error format across all endpoints
3. **Logging**: Log all game actions for debugging
4. **State Consistency**: Ensure Redis and MongoDB stay in sync
5. **Idempotency**: Some actions (like playing same card twice) should be prevented
6. **Security**: Validate player actually owns the cards they're trying to play
