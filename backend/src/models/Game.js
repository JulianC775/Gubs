const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const Deck = require('./Deck');

class Game {
  constructor() {
    this.id = uuidv4();
    this.roomCode = this.generateRoomCode();
    this.players = [];
    this.deck = null;
    this.status = 'lobby'; // 'lobby', 'active', 'ended'
    this.currentPlayerIndex = 0;
    this.turnNumber = 1;
    this.drawnLetters = [];
    this.winner = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.endedAt = null;
    this.maxPlayers = 6;
    this.minPlayers = 2;
  }

  /**
   * Generate a random 4-character room code
   * @returns {string}
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Add a player to the game
   * @param {string} playerName - Name of the player
   * @param {string} socketId - Socket ID for the player
   * @returns {Player} - The created player
   */
  addPlayer(playerName, socketId = null) {
    if (this.status !== 'lobby') {
      throw new Error('Cannot add player - game has already started');
    }

    if (this.players.length >= this.maxPlayers) {
      throw new Error(`Game is full (max ${this.maxPlayers} players)`);
    }

    if (!playerName || playerName.trim().length === 0) {
      throw new Error('Player name is required');
    }

    // Check for duplicate names
    if (this.players.some(p => p.name === playerName)) {
      throw new Error('Player name already taken');
    }

    const player = new Player(playerName, socketId);
    this.players.push(player);

    return player;
  }

  /**
   * Remove a player from the game
   * @param {string} playerId - ID of the player to remove
   * @returns {boolean} - Success status
   */
  removePlayer(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);

    if (playerIndex === -1) {
      return false;
    }

    this.players.splice(playerIndex, 1);

    // Adjust currentPlayerIndex if needed
    if (this.currentPlayerIndex >= this.players.length) {
      this.currentPlayerIndex = 0;
    }

    // If game is active and not enough players left, end the game
    if (this.status === 'active' && this.players.length < this.minPlayers) {
      this.endGame();
    }

    return true;
  }

  /**
   * Start the game
   * - Create and shuffle deck
   * - Deal 1 starting Gub to each player
   * - Deal 3 additional cards to each player
   * - Set first player's turn
   */
  startGame() {
    if (this.status !== 'lobby') {
      throw new Error('Game has already started');
    }

    if (this.players.length < this.minPlayers) {
      throw new Error(`Need at least ${this.minPlayers} players to start`);
    }

    // Initialize and shuffle deck
    this.deck = new Deck();

    // Deal 1 starting Gub to each player
    this.players.forEach(player => {
      const startingGub = this.deck.drawCard();
      if (startingGub && startingGub.type === 'Gub') {
        player.playGub(startingGub);
      } else {
        // If first card isn't a Gub, put it back and draw until we get one
        if (startingGub) this.deck.cards.push(startingGub);

        let gubFound = false;
        while (!gubFound && this.deck.cards.length > 0) {
          const card = this.deck.drawCard();
          if (card && card.type === 'Gub') {
            player.playGub(card);
            gubFound = true;
          } else if (card) {
            this.deck.cards.push(card);
          }
        }
      }
    });

    // Reshuffle deck after dealing starting Gubs
    this.deck.cards = this.deck.shuffle(this.deck.cards);

    // Deal 3 cards to each player
    for (let i = 0; i < 3; i++) {
      this.players.forEach(player => {
        const card = this.deck.drawCard();
        if (card) {
          player.addCardToHand(card);
        }
      });
    }

    // Set first player's turn
    this.players[0].isCurrentTurn = true;

    // Update game status
    this.status = 'active';
    this.startedAt = new Date();
  }

  /**
   * Get the current player
   * @returns {Player|null}
   */
  getCurrentPlayer() {
    if (this.players.length === 0) {
      return null;
    }
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get a player by ID
   * @param {string} playerId - ID of the player
   * @returns {Player|null}
   */
  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId) || null;
  }

  /**
   * Move to the next player's turn
   */
  nextTurn() {
    if (this.status !== 'active') {
      throw new Error('Game is not active');
    }

    // Clear current player's turn flag
    this.players[this.currentPlayerIndex].isCurrentTurn = false;

    // Move to next player (wrap around)
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // Set next player's turn flag
    this.players[this.currentPlayerIndex].isCurrentTurn = true;

    // Increment turn number
    this.turnNumber++;
  }

  /**
   * Player draws a card from the deck
   * @param {string} playerId - ID of the player drawing
   * @returns {Object} - { card, isEvent, isLetter, gameEnded }
   */
  playerDrawCard(playerId) {
    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error('Player not found');
    }

    if (!player.isCurrentTurn) {
      throw new Error('Not your turn');
    }

    if (this.deck.getCardsRemaining() === 0) {
      throw new Error('Deck is empty');
    }

    const card = this.deck.drawCard();

    if (!card) {
      throw new Error('Failed to draw card');
    }

    const isEvent = card.type === 'Event';
    const isLetter = card.subtype === 'Letter';

    // Track drawn letters
    if (isLetter) {
      this.drawnLetters.push(card.name);
    }

    // If not an Event, add to player's hand
    if (!isEvent) {
      player.addCardToHand(card);
    }

    // Check if game ended (3 letters drawn)
    const gameEnded = this.isGameOver();

    if (gameEnded) {
      this.endGame();
    }

    return {
      card,
      isEvent,
      isLetter,
      gameEnded
    };
  }

  /**
   * Player plays a card
   * @param {string} playerId - ID of the player
   * @param {string} cardId - ID of the card to play
   * @param {Object} target - Target for the card (playerId, gubId, etc.)
   * @returns {Object} - Result of the card play
   */
  playerPlayCard(playerId, cardId, target = null) {
    const player = this.getPlayer(playerId);

    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player has the card
    if (!player.hasCard(cardId)) {
      throw new Error('Card not in hand');
    }

    // For now, just remove from hand and return
    // Full card effect logic will be implemented in gameEngine.js (Phase 1.6)
    const card = player.removeCardFromHand(cardId);

    return {
      success: true,
      card,
      playerId,
      target
    };
  }

  /**
   * Check if the game is over (all 3 letters drawn)
   * @returns {boolean}
   */
  isGameOver() {
    return this.drawnLetters.length >= 3;
  }

  /**
   * End the game and determine winner
   */
  endGame() {
    if (this.status === 'ended') {
      return;
    }

    this.status = 'ended';
    this.endedAt = new Date();
    this.winner = this.determineWinner();
  }

  /**
   * Determine the winner based on scores and tiebreakers
   * @returns {Object} - { winner: Player, tiebreaker: string, scores: [] }
   */
  determineWinner() {
    if (this.players.length === 0) {
      return null;
    }

    // Calculate scores for all players
    const playerScores = this.players.map(player => ({
      player,
      score: player.calculateScore(),
      hasElder: player.hasEsteemedElder(),
      handCount: player.hand.length
    }));

    // Sort by score (descending)
    playerScores.sort((a, b) => b.score - a.score);

    const topScore = playerScores[0].score;

    // Find all players with top score
    const topPlayers = playerScores.filter(ps => ps.score === topScore);

    if (topPlayers.length === 1) {
      // Clear winner
      return {
        winner: topPlayers[0].player,
        tiebreaker: null,
        scores: playerScores
      };
    }

    // Tiebreaker 1: Esteemed Elder
    const playersWithElder = topPlayers.filter(ps => ps.hasElder);

    if (playersWithElder.length === 1) {
      return {
        winner: playersWithElder[0].player,
        tiebreaker: 'esteemed-elder',
        scores: playerScores
      };
    }

    // If multiple have Elder or none have Elder, use hand count
    const candidates = playersWithElder.length > 0 ? playersWithElder : topPlayers;

    // Tiebreaker 2: Fewest cards in hand
    candidates.sort((a, b) => a.handCount - b.handCount);

    const winner = candidates[0];
    const tiebreaker = playersWithElder.length > 0 ? 'hand-count-after-elder' : 'hand-count';

    return {
      winner: winner.player,
      tiebreaker,
      scores: playerScores
    };
  }

  /**
   * Get the current game state (summary for all players)
   * @returns {Object} - Game state summary
   */
  getGameState() {
    return {
      id: this.id,
      roomCode: this.roomCode,
      status: this.status,
      turnNumber: this.turnNumber,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayer: this.getCurrentPlayer()?.name || null,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        score: p.calculateScore(),
        handCount: p.hand.length,
        isCurrentTurn: p.isCurrentTurn,
        isReady: p.isReady
      })),
      deck: this.deck ? this.deck.toJSON() : null,
      drawnLetters: this.drawnLetters,
      winner: this.winner ? {
        name: this.winner.winner.name,
        score: this.winner.winner.calculateScore(),
        tiebreaker: this.winner.tiebreaker
      } : null,
      maxPlayers: this.maxPlayers,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt
    };
  }

  /**
   * Serialize game state to JSON
   * @param {string} requestingPlayerId - ID of player requesting (for privacy)
   * @returns {Object}
   */
  toJSON(requestingPlayerId = null) {
    return {
      id: this.id,
      roomCode: this.roomCode,
      status: this.status,
      players: this.players.map(player =>
        player.toJSON(player.id === requestingPlayerId)
      ),
      deck: this.deck ? this.deck.toJSON() : null,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayer: this.getCurrentPlayer()?.name,
      turnNumber: this.turnNumber,
      drawnLetters: this.drawnLetters,
      winner: this.winner ? {
        name: this.winner.winner.name,
        score: this.winner.winner.calculateScore(),
        tiebreaker: this.winner.tiebreaker
      } : null,
      maxPlayers: this.maxPlayers,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      endedAt: this.endedAt
    };
  }

  /**
   * Get game duration in milliseconds
   * @returns {number}
   */
  getDuration() {
    if (!this.startedAt) {
      return 0;
    }

    const endTime = this.endedAt || new Date();
    return endTime - this.startedAt;
  }
}

module.exports = Game;
