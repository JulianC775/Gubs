/**
 * Simple manual test of the game engine
 * Run with: node src/test-game.js
 */

const Game = require('./models/Game');
const { executeCardEffect } = require('./services/gameEngine');

console.log('🎮 Starting Gubs Game Engine Test...\n');

// Test 1: Create a game
console.log('--- Test 1: Create Game ---');
const game = new Game();
console.log(`✓ Game created with ID: ${game.id}`);
console.log(`✓ Room code: ${game.roomCode}`);
console.log(`✓ Status: ${game.status}\n`);

// Test 2: Add players
console.log('--- Test 2: Add Players ---');
try {
  const player1 = game.addPlayer('Alice');
  const player2 = game.addPlayer('Bob');
  console.log(`✓ Added player: ${player1.name} (ID: ${player1.id})`);
  console.log(`✓ Added player: ${player2.name} (ID: ${player2.id})`);
  console.log(`✓ Total players: ${game.players.length}\n`);
} catch (error) {
  console.error(`✗ Error adding players: ${error.message}\n`);
}

// Test 3: Start game
console.log('--- Test 3: Start Game ---');
try {
  game.startGame();
  console.log(`✓ Game started`);
  console.log(`✓ Status: ${game.status}`);
  console.log(`✓ Current player: ${game.getCurrentPlayer().name}`);
  console.log(`✓ Deck has ${game.deck.getCardsRemaining()} cards remaining`);

  // Check starting Gubs
  game.players.forEach(player => {
    console.log(`✓ ${player.name} has ${player.playArea.gubs.length} starting Gub(s)`);
    console.log(`  - Hand: ${player.hand.length} cards`);
  });
  console.log();
} catch (error) {
  console.error(`✗ Error starting game: ${error.message}\n`);
}

// Test 4: Draw cards
console.log('--- Test 4: Draw Cards ---');
try {
  const currentPlayer = game.getCurrentPlayer();
  console.log(`${currentPlayer.name}'s turn to draw...`);

  const beforeHandSize = currentPlayer.hand.length;
  const result = game.playerDrawCard(currentPlayer.id);

  console.log(`✓ Drew card: ${result.card.name} (${result.card.type})`);
  console.log(`✓ Is Event: ${result.isEvent}`);
  console.log(`✓ Is Letter: ${result.isLetter}`);
  console.log(`✓ Hand size: ${beforeHandSize} → ${currentPlayer.hand.length}`);
  console.log(`✓ Cards remaining in deck: ${game.deck.getCardsRemaining()}\n`);
} catch (error) {
  console.error(`✗ Error drawing card: ${error.message}\n`);
}

// Test 5: Play a Gub
console.log('--- Test 5: Play a Gub ---');
try {
  const currentPlayer = game.getCurrentPlayer();

  // Find a Gub in hand
  const gubCard = currentPlayer.hand.find(c => c.type === 'Gub');

  if (gubCard) {
    const beforePlayAreaSize = currentPlayer.playArea.gubs.length;

    // Remove from hand and play
    currentPlayer.removeCardFromHand(gubCard.id);
    const result = executeCardEffect(game, gubCard, currentPlayer.id, {});

    console.log(`✓ ${currentPlayer.name} played ${gubCard.name}`);
    console.log(`✓ Play area: ${beforePlayAreaSize} → ${currentPlayer.playArea.gubs.length} Gubs`);
    console.log(`✓ Score: ${currentPlayer.calculateScore()}\n`);
  } else {
    console.log(`⚠ No Gub in hand to play\n`);
  }
} catch (error) {
  console.error(`✗ Error playing Gub: ${error.message}\n`);
}

// Test 6: Play a Barricade
console.log('--- Test 6: Play a Barricade ---');
try {
  const currentPlayer = game.getCurrentPlayer();

  // Find a Barricade in hand
  const barricade = currentPlayer.hand.find(c => c.type === 'Barricade');

  // Find an unprotected Gub to protect
  const targetGub = currentPlayer.playArea.gubs[0];

  if (barricade && targetGub) {
    currentPlayer.removeCardFromHand(barricade.id);
    const result = executeCardEffect(game, barricade, currentPlayer.id, {
      gubId: targetGub.id
    });

    console.log(`✓ ${currentPlayer.name} played ${barricade.name} on a Gub`);
    console.log(`✓ Free Gubs: ${currentPlayer.playArea.gubs.length}`);
    console.log(`✓ Protected Gubs: ${currentPlayer.playArea.protectedGubs.length}`);
    console.log(`✓ Score: ${currentPlayer.calculateScore()}\n`);
  } else {
    console.log(`⚠ No Barricade or Gub available\n`);
  }
} catch (error) {
  console.error(`✗ Error playing Barricade: ${error.message}\n`);
}

// Test 7: Next turn
console.log('--- Test 7: Next Turn ---');
try {
  const beforePlayer = game.getCurrentPlayer().name;
  game.nextTurn();
  const afterPlayer = game.getCurrentPlayer().name;

  console.log(`✓ Turn changed: ${beforePlayer} → ${afterPlayer}`);
  console.log(`✓ Turn number: ${game.turnNumber}\n`);
} catch (error) {
  console.error(`✗ Error changing turn: ${error.message}\n`);
}

// Test 8: Check for game ending (draw until 3 letters)
console.log('--- Test 8: Test Game Ending (Letter Cards) ---');
try {
  let drawCount = 0;
  const maxDraws = 72; // Prevent infinite loop

  while (!game.isGameOver() && drawCount < maxDraws) {
    const currentPlayer = game.getCurrentPlayer();
    const result = game.playerDrawCard(currentPlayer.id);

    if (result.isLetter) {
      console.log(`✓ Letter drawn: ${result.card.name} (${game.drawnLetters.length}/3)`);
    }

    game.nextTurn();
    drawCount++;
  }

  if (game.isGameOver()) {
    console.log(`✓ Game ended after ${drawCount} draws`);
    console.log(`✓ Letters drawn: ${game.drawnLetters.join(', ')}`);
    console.log(`✓ Winner: ${game.winner.winner.name}`);
    console.log(`✓ Winner's score: ${game.winner.winner.calculateScore()}`);
    if (game.winner.tiebreaker) {
      console.log(`✓ Tiebreaker used: ${game.winner.tiebreaker}`);
    }
  } else {
    console.log(`⚠ Game didn't end naturally (drew ${drawCount} cards)`);
  }
  console.log();
} catch (error) {
  console.error(`✗ Error testing game end: ${error.message}\n`);
}

// Final summary
console.log('--- Test Summary ---');
console.log(`✓ Game ID: ${game.id}`);
console.log(`✓ Status: ${game.status}`);
console.log(`✓ Players: ${game.players.map(p => p.name).join(', ')}`);
console.log(`✓ Winner: ${game.winner ? game.winner.winner.name : 'None'}`);
console.log('\n🎉 All tests completed!\n');
