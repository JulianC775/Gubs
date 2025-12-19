const Game = require('../models/Game');

// In-memory storage for games (will migrate to Redis/database later)
const games = new Map();

/**
 * Create a new game
 * @route POST /api/games
 * @body { playerName: string, maxPlayers?: number }
 */
const createGame = async (req, res) => {
  try {
    const { playerName, maxPlayers = 6 } = req.body;

    // Validate player name
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Player name is required'
      });
    }

    // Validate maxPlayers
    if (maxPlayers < 2 || maxPlayers > 6) {
      return res.status(400).json({
        success: false,
        error: 'Max players must be between 2 and 6'
      });
    }

    // Create new game instance
    const game = new Game();
    game.maxPlayers = maxPlayers;

    // Add the creator as the first player
    try {
      game.addPlayer(playerName.trim());
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Store game in memory
    games.set(game.id, game);

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        gameId: game.id,
        roomCode: game.roomCode,
        game: game.toJSON()
      }
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    });
  }
};

/**
 * Get a game by ID
 * @route GET /api/games/:gameId
 */
const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = games.get(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }

    res.json({
      success: true,
      data: game.toJSON()
    });
  } catch (error) {
    console.error('Error getting game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve game'
    });
  }
};

/**
 * Get all active games (for future use)
 */
const getAllGames = async (req, res) => {
  try {
    const allGames = Array.from(games.values()).map(game => ({
      id: game.id,
      roomCode: game.roomCode,
      status: game.status,
      playerCount: game.players.length,
      maxPlayers: game.maxPlayers,
      createdAt: game.createdAt
    }));

    res.json({
      success: true,
      data: allGames
    });
  } catch (error) {
    console.error('Error getting games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve games'
    });
  }
};

module.exports = {
  createGame,
  getGame,
  getAllGames,
  games // Export for testing/debugging
};
