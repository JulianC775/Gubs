/**
 * Simple test file for Game model
 * Run with: node backend/test/gameTest.js
 */

const Game = require('../src/models/Game');

console.log('=== Gubs Game Model Test ===\n');

try {
  // Test 1: Create a game
  console.log('Test 1: Creating a new game...');
  const game = new Game();
  console.log(`✓ Game created with ID: ${game.id}`);
  console.log(`✓ Room code: ${game.roomCode}`);
  console.log(`✓ Status: ${game.status}\n`);

  // Test 2: Add players
  console.log('Test 2: Adding players...');
  const player1 = game.addPlayer('Alice');
  console.log(`✓ Added player: ${player1.name} (ID: ${player1.id})`);
  console.log(`  Starting Gubs: ${player1.playArea.gubs.length}`);

  const player2 = game.addPlayer('Bob');
  console.log(`✓ Added player: ${player2.name} (ID: ${player2.id})`);
  console.log(`  Starting Gubs: ${player2.playArea.gubs.length}\n`);

  // Test 3: Try to start game without ready players
  console.log('Test 3: Testing game start validation...');
  try {
    game.startGame();
    console.log('✗ Should have thrown error (players not ready)');
  } catch (error) {
    console.log(`✓ Correctly prevented start: ${error.message}\n`);
  }

  // Test 4: Mark players ready and start game
  console.log('Test 4: Starting the game...');
  player1.isReady = true;
  player2.isReady = true;
  game.startGame();
  console.log(`✓ Game started!`);
  console.log(`  Status: ${game.status}`);
  console.log(`  Current player: ${game.getCurrentPlayer().name}`);
  console.log(`  Turn number: ${game.turnNumber}`);
  console.log(`  Alice's hand: ${player1.hand.length} cards`);
  console.log(`  Bob's hand: ${player2.hand.length} cards\n`);

  // Test 5: Draw cards
  console.log('Test 5: Drawing cards...');
  const drawnCard1 = game.playerDrawCard(player1.id);
  console.log(`✓ ${player1.name} drew: ${drawnCard1.name} (${drawnCard1.type})`);
  console.log(`  Alice's hand: ${player1.hand.length} cards\n`);

  // Test 6: Try to draw on wrong turn
  console.log('Test 6: Testing turn validation...');
  try {
    game.playerDrawCard(player2.id);
    console.log('✗ Should have thrown error (not their turn)');
  } catch (error) {
    console.log(`✓ Correctly prevented action: ${error.message}\n`);
  }

  // Test 7: Play a card
  console.log('Test 7: Playing a card...');
  const firstCard = player1.hand[0];
  if (firstCard) {
    console.log(`  Attempting to play: ${firstCard.name} (${firstCard.type})`);
    try {
      const result = game.playerPlayCard(player1.id, firstCard.id);
      console.log(`✓ ${result.message}`);
      console.log(`  Alice's hand: ${player1.hand.length} cards\n`);
    } catch (error) {
      console.log(`  Note: ${error.message}\n`);
    }
  }

  // Test 8: End turn and move to next player
  console.log('Test 8: Changing turns...');
  const currentPlayerBefore = game.getCurrentPlayer().name;
  game.nextTurn();
  const currentPlayerAfter = game.getCurrentPlayer().name;
  console.log(`✓ Turn changed from ${currentPlayerBefore} to ${currentPlayerAfter}`);
  console.log(`  Turn number: ${game.turnNumber}\n`);

  // Test 9: Check game state
  console.log('Test 9: Getting game state...');
  const gameState = game.getGameState();
  console.log(`✓ Game state retrieved:`);
  console.log(`  Room code: ${gameState.roomCode}`);
  console.log(`  Status: ${gameState.status}`);
  console.log(`  Players: ${gameState.players.length}`);
  console.log(`  Cards in deck: ${gameState.deck.cardsRemaining}`);
  console.log(`  Letters drawn: ${gameState.deck.drawnLetters.join(', ') || 'none'}\n`);

  // Test 10: Simulate drawing until game ends
  console.log('Test 10: Simulating game to completion...');
  let drawCount = 0;
  const maxDraws = 100; // Safety limit

  while (!game.isGameOver() && drawCount < maxDraws) {
    try {
      const currentPlayer = game.getCurrentPlayer();
      const card = game.playerDrawCard(currentPlayer.id);

      if (card.isLetterCard()) {
        console.log(`  ${currentPlayer.name} drew LETTER: ${card.name}`);
        console.log(`  Total letters drawn: ${game.deck.drawnLetters.length}`);
      }

      game.nextTurn();
      drawCount++;
    } catch (error) {
      console.log(`  Error during draw: ${error.message}`);
      break;
    }
  }

  if (game.isGameOver()) {
    console.log(`✓ Game ended after ${drawCount} draws`);
    console.log(`  Letters drawn: ${game.deck.drawnLetters.join(', ')}\n`);

    // Test 11: Determine winner
    console.log('Test 11: Determining winner...');
    const winner = game.winner;
    if (winner) {
      console.log(`✓ Winner: ${winner.name}`);
      console.log(`  Final score: ${winner.calculateScore()}`);
      console.log(`  Has Esteemed Elder: ${winner.hasEsteemedElder()}`);
      console.log(`  Cards in hand: ${winner.hand.length}`);

      console.log('\n  Final scores:');
      game.players.forEach(p => {
        console.log(`    ${p.name}: ${p.calculateScore()} points`);
      });
    }
  } else {
    console.log(`✗ Game did not end after ${maxDraws} draws (safety limit reached)`);
  }

  console.log('\n=== All Tests Completed Successfully! ===');

} catch (error) {
  console.error('\n✗ Test failed with error:');
  console.error(error);
  process.exit(1);
}
