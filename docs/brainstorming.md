# Gubs Card Game - Initial Brainstorming

## Project Overview
Web-based implementation of the Gubs card game with full front and backend.

## Game Concept Notes

### Player System
- **Cards in hand**: Private cards held by each player
- **Cards in play**: Visible cards on the playing field
- Each player manages both hand and played cards (could be subclasses of Player)

### Card Types Identified

#### Playable Cards
- **Gub** (8 cards): Main scoring cards - move to play area, add to total points
- **Spear** (4 cards): Moves a Gub or protection card to discard pile
- **Mushroom** (6 cards): Protect Gub from attacks
- **Toad Rider** (2 cards): Protect Gub from attacks

#### Event Cards
- **G, U, B** (1 each): Letter cards for win condition logic
  - When drawn, cards are immediately used
  - If tied, player with lowest amount of cards in hand wins
- **Flash Flood** (1 card): Discard all unprotected (naked) Gubs

### Game Flow

#### Deck System
- Draw cards from deck
- Discard pile for used cards
- Shuffle mechanism implemented

### Win Conditions
- Collect G-U-B letter cards
- If tie: Player with fewest cards in hand wins

## Development Goals

### Phase 1: Core Game Logic
1. ✓ Make the deck structure
2. ✓ Make the player structure
3. Deal initial cards to players
4. Show initially dealt cards

### Phase 2: Web Implementation
- Frontend: Browser-based UI for card display and gameplay
- Backend: Game state management, multiplayer support
- Real-time updates for multiplayer

## Technical Notes
- Current prototype in Python ([main.py](main.py))
- Card shuffling algorithm implemented
- Basic Card and Deck classes created
- Total deck: 24 cards (8 Gubs + 4 Spears + 6 Mushrooms + 2 Toad Riders + 4 Event cards)

## Future Considerations
- Multiplayer networking
- Card animations
- Visual design matching theme
- Mobile responsiveness
