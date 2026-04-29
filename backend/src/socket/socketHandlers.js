const { games } = require('../controllers/gameController');
const { validateCardPlay, executeCardEffect, executeEventCard } = require('../services/gameEngine');

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

        // Add player to game (pass socket.id for reconnection tracking)
        const player = game.addPlayer(playerName, socket.id);

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

        // Blindfold effect — skip this draw
        if (currentPlayer.skipNextDraw) {
          currentPlayer.skipNextDraw = false;
          socket.emit('error', { message: 'Your draw was skipped by Blindfold!' });
          return;
        }

        // Draw the card — reset consecutive skip counter
        currentPlayer.consecutiveSkips = 0;
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

        // If it's a non-letter Event card, open a 5s Flop Boat interrupt window
        if (result.isEvent && !result.isLetter) {
          game.pendingEvent = { card: result.card, drawingPlayerId: playerId };

          io.to(game.roomCode).emit('event:pending', {
            eventCard: result.card.toJSON(),
            drawingPlayerId: playerId,
            drawingPlayerName: currentPlayer.name,
            windowMs: 5000
          });

          // Execute after 5 seconds if not intercepted by Flop Boat
          game.pendingEventTimer = setTimeout(() => {
            if (!game.pendingEvent) return; // already handled
            const { card: eventCard, drawingPlayerId: drawerId } = game.pendingEvent;
            game.pendingEvent = null;
            game.pendingEventTimer = null;

            const eventResult = executeEventCard(game, eventCard, drawerId);
            game.deck.addToDiscard(eventCard);

            io.to(game.roomCode).emit('event:triggered', {
              eventCard: eventCard.toJSON(),
              drawingPlayerId: drawerId,
              drawingPlayerName: currentPlayer.name,
              result: eventResult
            });

            game.players.forEach(p => {
              const ps = Array.from(io.sockets.sockets.values()).find(s => s.data?.playerId === p.id);
              if (ps) ps.emit('hand:update', { playerId: p.id, hand: p.hand.map(c => c.toJSON()) });
            });

            io.to(game.roomCode).emit('gameState:update', game.toJSON());
          }, 5000);
        }

        // If letter was drawn, broadcast letter info
        if (result.isLetter) {
          io.to(game.roomCode).emit('letter:drawn', {
            letter: result.card.name,
            drawnLetters: game.drawnLetters
          });
        }

        // If game ended, broadcast game over
        if (result.gameEnded) {
          const winnerInfo = game.winner ? {
            id: game.winner.winner.id,
            name: game.winner.winner.name,
            score: game.winner.winner.calculateScore(),
            tiebreaker: game.winner.tiebreaker
          } : null;

          io.to(game.roomCode).emit('game:ended', {
            winner: winnerInfo,
            scores: game.players.map(p => ({
              playerId: p.id,
              name: p.name,
              score: p.calculateScore(),
              gubCount: p.playArea.gubs.length + p.playArea.protectedGubs.length,
              hasEsteemedElder: p.hasEsteemedElder()
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

        // Validate the card play first
        const validation = validateCardPlay(game, playerId, cardId, target);
        if (!validation.valid) {
          socket.emit('error', { message: validation.error });
          return;
        }

        // Get the card before removing from hand
        const card = player.hand.find(c => c.id === cardId || c.instanceId === cardId);
        if (!card) {
          socket.emit('error', { message: 'Card not found in hand' });
          return;
        }

        // Remove card from hand
        player.removeCardFromHand(cardId);

        // Execute the card effect
        const result = executeCardEffect(game, card, playerId, target);

        if (!result.success) {
          // If effect failed, return card to hand
          player.addCardToHand(card);
          socket.emit('error', { message: result.message });
          return;
        }

        // Discard the played card (unless it's a Gub, Barricade, Trap, or Ring)
        const isPersistent = ['Gub', 'Barricade', 'Trap'].includes(card.type) ||
                            card.name.includes('Ring');
        if (!isPersistent) {
          game.deck.addToDiscard(card);
        }

        // Private effects (peeked cards for Omen Beetle, revealed hand for Scout)
        if (result.effects?.type === 'omen-beetle-played') {
          socket.emit('card:privateResult', { type: 'peek', cards: result.effects.peekedCards });
        }
        if (result.effects?.type === 'scout-played') {
          socket.emit('card:privateResult', { type: 'scout', targetPlayerId: result.effects.targetPlayerId, hand: result.effects.revealedHand });
        }

        // Broadcast card played with effect details (strip private data)
        const publicEffects = result.effects?.type === 'omen-beetle-played' || result.effects?.type === 'scout-played'
          ? { ...result.effects, peekedCards: undefined, revealedHand: undefined }
          : result.effects;
        io.to(game.roomCode).emit('card:played', {
          playerId,
          playerName: player.name,
          card: card.toJSON(),
          target,
          effect: publicEffects,
          message: result.message
        });

        // Update each player's hand (only send their own hand)
        game.players.forEach(p => {
          const playerSocket = Array.from(io.sockets.sockets.values()).find(
            s => s.data?.playerId === p.id
          );
          if (playerSocket) {
            playerSocket.emit('hand:update', {
              playerId: p.id,
              hand: p.hand.map(c => c.toJSON())
            });
          }
        });

        // Broadcast updated game state
        io.to(game.roomCode).emit('gameState:update', game.toJSON());

        console.log(`Player ${player.name} played ${card.name}: ${result.message}`);
      } catch (error) {
        console.error('Error playing card:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Flop Boat — redirect pending Event back into the deck
    socket.on('game:flopBoat', ({ gameId, playerId, cardId }) => {
      try {
        const game = games.get(gameId);
        if (!game) { socket.emit('error', { message: 'Game not found' }); return; }

        if (!game.pendingEvent) {
          socket.emit('error', { message: 'No pending Event to redirect' });
          return;
        }

        const player = game.getPlayer(playerId);
        if (!player) { socket.emit('error', { message: 'Player not found' }); return; }

        const flopBoatCard = player.removeCardFromHand(cardId);
        if (!flopBoatCard) { socket.emit('error', { message: 'Flop Boat not in hand' }); return; }

        // Cancel the pending timer
        if (game.pendingEventTimer) {
          clearTimeout(game.pendingEventTimer);
          game.pendingEventTimer = null;
        }

        const { card: eventCard } = game.pendingEvent;
        game.pendingEvent = null;

        // Shuffle event back into deck
        const insertAt = Math.floor(Math.random() * (game.deck.cards.length + 1));
        game.deck.cards.splice(insertAt, 0, eventCard);

        // Discard Flop Boat
        game.deck.addToDiscard(flopBoatCard);

        io.to(game.roomCode).emit('event:redirected', {
          eventCard: eventCard.toJSON(),
          playerId,
          playerName: player.name
        });

        // Update Flop Boat player's hand
        socket.emit('hand:update', { playerId, hand: player.hand.map(c => c.toJSON()) });
        io.to(game.roomCode).emit('gameState:update', game.toJSON());

        console.log(`${player.name} used Flop Boat to redirect ${eventCard.name}`);
      } catch (error) {
        console.error('Error with Flop Boat:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Get discard pile contents (for Age Old Cure targeting)
    socket.on('game:getDiscardPile', ({ gameId }) => {
      try {
        const game = games.get(gameId);
        if (!game) { socket.emit('error', { message: 'Game not found' }); return; }
        socket.emit('game:discardPile', {
          cards: game.deck.discardPile.map(c => c.toJSON())
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Discard a card from hand (required when hand > 8 at end of turn)
    socket.on('game:discardCard', ({ gameId, playerId, cardId }) => {
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

        const currentPlayer = game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        const card = player.removeCardFromHand(cardId);
        if (!card) {
          socket.emit('error', { message: 'Card not found in hand' });
          return;
        }

        game.deck.addToDiscard(card);

        socket.emit('hand:update', {
          playerId: player.id,
          hand: player.hand.map(c => c.toJSON())
        });

        io.to(game.roomCode).emit('gameState:update', game.toJSON());

        console.log(`Player ${player.name} discarded ${card.name}`);
      } catch (error) {
        console.error('Error discarding card:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // End turn
    socket.on('game:endTurn', ({ gameId, playerId, didDraw = false }) => {
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

        // Consecutive skip enforcement
        if (!didDraw) {
          currentPlayer.consecutiveSkips = (currentPlayer.consecutiveSkips || 0) + 1;
          if (currentPlayer.consecutiveSkips > 1) {
            socket.emit('error', { message: 'You cannot skip drawing two turns in a row' });
            return;
          }
        } else {
          currentPlayer.consecutiveSkips = 0;
        }

        // Move to next turn
        game.nextTurn();

        const nextPlayer = game.getCurrentPlayer();

        // Broadcast turn change
        io.to(game.roomCode).emit('turn:changed', {
          previousPlayerId: playerId,
          currentPlayerId: nextPlayer.id,
          currentPlayerName: nextPlayer.name,
          currentPlayerIndex: game.currentPlayerIndex,
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
