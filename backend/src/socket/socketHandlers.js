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

    // Draw card
    socket.on('game:drawCard', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Validate it's the player's turn
        const currentPlayer = game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Draw the card
        const result = game.playerDrawCard(playerId);

        // Send the card to the player who drew it
        socket.emit('card:drawn', {
          card: result.card.toJSON(),
          isEvent: result.isEvent,
          isLetter: result.isLetter
        });

        // Broadcast to all players (without revealing the card unless it's an event/letter)
        io.to(game.roomCode).emit('game:cardDrawn', {
          playerId,
          playerName: currentPlayer.name,
          isEvent: result.isEvent,
          isLetter: result.isLetter,
          card: result.isEvent || result.isLetter ? result.card.toJSON() : null,
          cardsRemaining: game.deck.getCardsRemaining()
        });

        // If letter was drawn, broadcast letter info
        if (result.isLetter) {
          io.to(game.roomCode).emit('letter:drawn', {
            letter: result.card.name,
            drawnLetters: game.drawnLetters
          });
        }

        // If game ended, broadcast game over
        if (result.gameEnded) {
          io.to(game.roomCode).emit('game:ended', {
            winner: game.winner,
            finalScores: game.players.map(p => ({
              playerId: p.id,
              playerName: p.name,
              score: p.calculateScore(),
              gubs: p.playArea.gubs.length
            }))
          });
        }

        // Broadcast updated game state
        io.to(game.roomCode).emit('gameState:update', game.toJSON());

        console.log(`Player ${currentPlayer.name} drew a card`);
      } catch (error) {
        console.error('Error drawing card:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Play card
    socket.on('game:playCard', ({ gameId, playerId, cardId, target }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const player = game.getPlayer(playerId);
        if (!player) {
          socket.emit('error', { message: 'Player not found' });
          return;
        }

        // Play the card
        const result = game.playerPlayCard(playerId, cardId, target);

        // Broadcast card played to all players
        io.to(game.roomCode).emit('card:played', {
          playerId,
          playerName: player.name,
          card: result.card.toJSON(),
          target
        });

        // Update each player's hand (only send their own hand)
        game.players.forEach(p => {
          const playerSocket = Array.from(io.sockets.sockets.values()).find(
            s => s.data?.playerId === p.id
          );
          if (playerSocket) {
            playerSocket.emit('hand:update', {
              playerId: p.id,
              hand: p.hand.map(card => card.toJSON())
            });
          }
        });

        // Broadcast updated game state
        io.to(game.roomCode).emit('gameState:update', game.toJSON());

        console.log(`Player ${player.name} played ${result.card.name}`);
      } catch (error) {
        console.error('Error playing card:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // End turn
    socket.on('game:endTurn', ({ gameId, playerId }) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const currentPlayer = game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Check hand limit (max 8 cards)
        if (currentPlayer.hand.length > 8) {
          socket.emit('error', { message: 'You must discard down to 8 cards before ending your turn' });
          return;
        }

        // Move to next turn
        game.nextTurn();

        const nextPlayer = game.getCurrentPlayer();

        // Broadcast turn change
        io.to(game.roomCode).emit('turn:changed', {
          previousPlayerId: playerId,
          currentPlayerId: nextPlayer.id,
          currentPlayerName: nextPlayer.name,
          turnNumber: game.turnNumber
        });

        // Broadcast updated game state
        io.to(game.roomCode).emit('gameState:update', game.toJSON());

        console.log(`Turn changed to ${nextPlayer.name}`);
      } catch (error) {
        console.error('Error ending turn:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      if (socket.data?.roomCode && socket.data?.gameId && socket.data?.playerId) {
        const { gameId, playerId, roomCode } = socket.data;
        const game = games.get(gameId);

        if (game) {
          const player = game.players.find(p => p.id === playerId);
          if (player) {
            // Mark player as disconnected instead of removing them
            player.isConnected = false;
            player.socketId = null;

            console.log(`Player ${player.name} disconnected from game ${gameId}`);

            // Notify room that player disconnected
            io.to(roomCode).emit('player:disconnected', {
              playerId,
              playerName: player.name,
              game: game.toJSON()
            });
          }
        }
      }
    });
  });
}

module.exports = { initializeSocketHandlers };
