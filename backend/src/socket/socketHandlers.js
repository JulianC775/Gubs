const { games } = require('../controllers/gameController');

/**
 * Initialize Socket.IO event handlers
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
function initializeSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join game room
    socket.on('game:join', async ({ roomCode, playerName }) => {
      try {
        console.log(`Player ${playerName} attempting to join room ${roomCode}`);

        // Find game by room code
        let game = null;
        for (const [gameId, g] of games.entries()) {
          if (g.roomCode === roomCode) {
            game = g;
            break;
          }
        }

        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        if (game.status !== 'lobby') {
          socket.emit('error', { message: 'Game already started' });
          return;
        }

        // Add player to game
        const player = game.addPlayer(playerName);

        // Join socket room
        socket.join(roomCode);

        // Store player info in socket
        socket.data = {
          gameId: game.id,
          playerId: player.id,
          roomCode: roomCode
        };

        // Notify all players in room
        io.to(roomCode).emit('player:joined', {
          player: player.toJSON(),
          players: game.players.map(p => p.toJSON()),
          game: game.toJSON()
        });

        // Send game state to joining player
        socket.emit('game:joined', {
          success: true,
          gameId: game.id,
          playerId: player.id,
          game: game.toJSON()
        });

        console.log(`Player ${playerName} joined room ${roomCode}`);
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Player ready toggle
    socket.on('player:setReady', ({ gameId, playerId, isReady }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }

        player.isReady = isReady;

        // Notify all players in room
        io.to(game.roomCode).emit('player:ready', {
          playerId,
          isReady,
          game: game.toJSON()
        });

        console.log(`Player ${player.name} ready status: ${isReady}`);
      } catch (error) {
        console.error('Error setting ready:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Start game
    socket.on('game:start', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Check if player is host (first player)
        if (game.players[0]?.id !== playerId) {
          socket.emit('error', { message: 'Only host can start the game' });
          return;
        }

        // Check if enough players are ready
        const readyCount = game.players.filter(p => p.isReady).length;
        if (readyCount < 2) {
          socket.emit('error', { message: 'Need at least 2 ready players to start' });
          return;
        }

        // Start the game
        game.startGame();

        // Notify all players
        io.to(game.roomCode).emit('game:started', {
          game: game.toJSON()
        });

        // Send initial hand to each player
        game.players.forEach(player => {
          const playerSocket = Array.from(io.sockets.sockets.values()).find(
            s => s.data?.playerId === player.id
          );
          if (playerSocket) {
            playerSocket.emit('hand:update', {
              playerId: player.id,
              hand: player.hand.map(card => card.toJSON())
            });
          }
        });

        console.log(`Game ${gameId} started`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Rejoin game (after disconnect)
    socket.on('game:rejoin', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) {
          socket.emit('error', { message: 'Player not found in game' });
          return;
        }

        // Rejoin room
        socket.join(game.roomCode);

        // Update socket data
        socket.data = {
          gameId: game.id,
          playerId: player.id,
          roomCode: game.roomCode
        };

        // Send full game state
        socket.emit('gameState:update', game.toJSON());

        // Send player's hand
        socket.emit('hand:update', {
          playerId: player.id,
          hand: player.hand.map(card => card.toJSON())
        });

        console.log(`Player ${player.name} rejoined game ${gameId}`);
      } catch (error) {
        console.error('Error rejoining game:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Get current game state
    socket.on('game:getState', ({ gameId }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        socket.emit('gameState:update', game.toJSON());
      } catch (error) {
        console.error('Error getting game state:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      if (socket.data?.roomCode) {
        const { gameId, playerId, roomCode } = socket.data;

        // Notify room that player disconnected
        io.to(roomCode).emit('player:disconnected', {
          playerId,
          message: 'Player disconnected'
        });
      }
    });
  });
}

module.exports = { initializeSocketHandlers };
