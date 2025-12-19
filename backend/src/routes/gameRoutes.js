const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// POST /api/games - Create a new game
router.post('/', gameController.createGame);

// GET /api/games/:gameId - Get game by ID
router.get('/:gameId', gameController.getGame);

// GET /api/games - Get all games
router.get('/', gameController.getAllGames);

module.exports = router;
