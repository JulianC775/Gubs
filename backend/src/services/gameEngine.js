/**
 * Game Engine Service
 * Handles card effect execution and validation
 */

/**
 * Validate if a card play is legal
 * @param {Game} game - The game instance
 * @param {string} playerId - ID of the player attempting to play
 * @param {string} cardId - ID of the card being played
 * @param {Object} target - Target object { playerId, gubId, cardId }
 * @returns {Object} - { valid: boolean, error: string }
 */
function validateCardPlay(game, playerId, cardId, target = {}) {
  const player = game.getPlayer(playerId);

  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has the card
  const card = player.hand.find(c => c.id === cardId);
  if (!card) {
    return { valid: false, error: 'Card not in hand' };
  }

  // Interrupt cards can be played anytime, others require it to be player's turn
  if (card.type !== 'Interrupt' && !player.isCurrentTurn) {
    return { valid: false, error: 'Not your turn' };
  }

  // Validate based on card type
  switch (card.type) {
    case 'Gub':
      return { valid: true };

    case 'Barricade':
      return validateBarricadePlay(game, player, target);

    case 'Tool':
      return validateToolPlay(game, player, card, target);

    case 'Trap':
      return validateTrapPlay(game, player, target);

    case 'Hazard':
      return validateHazardPlay(game, player, card, target);

    case 'Interrupt':
      return validateInterruptPlay(game, player, card, target);

    case 'Event':
      return { valid: false, error: 'Event cards are drawn, not played' };

    default:
      return { valid: false, error: 'Unknown card type' };
  }
}

/**
 * Validate Barricade card play
 */
function validateBarricadePlay(game, player, target) {
  if (!target.gubId) {
    return { valid: false, error: 'Must target a Gub to protect' };
  }

  // Check if the Gub exists in player's free gubs
  const gub = player.playArea.gubs.find(g => g.id === target.gubId);
  if (!gub) {
    return { valid: false, error: 'Can only protect your own unprotected Gubs' };
  }

  return { valid: true };
}

/**
 * Validate Tool card play
 */
function validateToolPlay(game, player, card, target) {
  switch (card.subtype) {
    case 'Weapon':
      return validateWeaponPlay(game, player, card, target);
    case 'Thief':
      return validateThiefPlay(game, player, target);
    case 'Healing':
      return validateHealingPlay(game, player, target);
    case 'Tactical':
      return validateTacticalPlay(game, player, card, target);
    case 'Magic':
      return validateMagicPlay(game, player, card, target);
    default:
      return { valid: true };
  }
}

/**
 * Validate Weapon (Spear, Lure, Super Lure) play
 */
function validateWeaponPlay(game, player, card, target) {
  if (!target.playerId) {
    return { valid: false, error: 'Must target an opponent' };
  }

  const targetPlayer = game.getPlayer(target.playerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  if (targetPlayer.id === player.id) {
    return { valid: false, error: 'Cannot target yourself' };
  }

  // Spear can destroy barricade or trap/kill Gub
  if (card.name === 'Spear') {
    if (target.gubId) {
      const gubLocation = targetPlayer.findGub(target.gubId);
      if (!gubLocation) {
        return { valid: false, error: 'Target Gub not found' };
      }
      return { valid: true };
    }
    return { valid: false, error: 'Spear requires a target Gub' };
  }

  // Lure and Super Lure destroy barricades
  if (card.name === 'Lure' || card.name === 'Super Lure') {
    if (!target.gubId) {
      return { valid: false, error: 'Must target a protected Gub' };
    }

    const protectedGub = targetPlayer.playArea.protectedGubs.find(g => g.id === target.gubId);
    if (!protectedGub) {
      return { valid: false, error: 'Target must be a protected Gub' };
    }

    return { valid: true };
  }

  return { valid: true };
}

/**
 * Validate Thief (Smahl Thief) play
 */
function validateThiefPlay(game, player, target) {
  if (!target.playerId || !target.gubId) {
    return { valid: false, error: 'Must target an opponent and their Gub' };
  }

  const targetPlayer = game.getPlayer(target.playerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  if (targetPlayer.id === player.id) {
    return { valid: false, error: 'Cannot steal from yourself' };
  }

  // Can steal from free gubs or trapped gubs, not protected gubs
  const gubLocation = targetPlayer.findGub(target.gubId);
  if (!gubLocation) {
    return { valid: false, error: 'Target Gub not found' };
  }

  if (gubLocation.location === 'protectedGubs') {
    return { valid: false, error: 'Cannot steal protected Gubs' };
  }

  // Cannot steal Esteemed Elder
  if (gubLocation.gub.subtype === 'Elder') {
    return { valid: false, error: 'Cannot steal Esteemed Elder' };
  }

  return { valid: true };
}

/**
 * Validate Healing (Age Old Cure) play
 */
function validateHealingPlay(game, player, target) {
  if (!target.cardId && game.deck.discardPile.length === 0) {
    return { valid: false, error: 'No cards in discard pile' };
  }

  return { valid: true };
}

/**
 * Validate Tactical (Retreat, Scout, Blindfold, Feather) play
 */
function validateTacticalPlay(game, player, card, target) {
  if (card.name === 'Retreat') {
    // Can always play retreat
    return { valid: true };
  }

  if (card.name === 'Scout') {
    if (!target.playerId) {
      return { valid: false, error: 'Must target an opponent to scout' };
    }

    const targetPlayer = game.getPlayer(target.playerId);
    if (!targetPlayer || targetPlayer.id === player.id) {
      return { valid: false, error: 'Must target an opponent' };
    }

    return { valid: true };
  }

  // Other tactical cards (Blindfold, Feather) - implement as needed
  return { valid: true };
}

/**
 * Validate Magic (Rings, Haki Flute, Omen Beetle, Dangerous Alchemy) play
 */
function validateMagicPlay(game, player, card, target) {
  // Rings are played as persistent effects
  if (card.name.includes('Ring')) {
    return { valid: true };
  }

  // Other magic cards - implement as needed
  return { valid: true };
}

/**
 * Validate Trap (Sud Spout) play
 */
function validateTrapPlay(game, player, target) {
  if (!target.playerId || !target.gubId) {
    return { valid: false, error: 'Must target an opponent and their Gub' };
  }

  const targetPlayer = game.getPlayer(target.playerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  if (targetPlayer.id === player.id) {
    return { valid: false, error: 'Cannot trap your own Gubs' };
  }

  // Can only trap free (unprotected) Gubs
  const gub = targetPlayer.playArea.gubs.find(g => g.id === target.gubId);
  if (!gub) {
    return { valid: false, error: 'Can only trap unprotected Gubs' };
  }

  return { valid: true };
}

/**
 * Validate Hazard (Lightning, Cyclone) play
 */
function validateHazardPlay(game, player, card, target) {
  if (card.name === 'Lightning') {
    if (!target.playerId) {
      return { valid: false, error: 'Must target a player' };
    }

    const targetPlayer = game.getPlayer(target.playerId);
    if (!targetPlayer) {
      return { valid: false, error: 'Target player not found' };
    }

    return { valid: true };
  }

  // Cyclone - implement as needed
  return { valid: true };
}

/**
 * Validate Interrupt (Cricket Song, Flop Boat) play
 */
function validateInterruptPlay(game, player, card, target) {
  if (card.name === 'Flop Boat') {
    // Flop Boat can only be played when an Event is drawn
    if (!target.eventCard) {
      return { valid: false, error: 'Flop Boat can only redirect Event cards' };
    }
    return { valid: true };
  }

  if (card.name === 'Cricket Song') {
    // Cricket Song is a wild card - requires the player to specify what it represents
    if (!target.asCard) {
      return { valid: false, error: 'Must specify what Cricket Song represents' };
    }
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Execute a card's effect
 * @param {Game} game - The game instance
 * @param {Card} card - The card being played
 * @param {string} playerId - ID of the player playing the card
 * @param {Object} target - Target object
 * @returns {Object} - { success: boolean, message: string, effects: Object }
 */
function executeCardEffect(game, card, playerId, target = {}) {
  const player = game.getPlayer(playerId);

  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  switch (card.type) {
    case 'Gub':
      return playGub(game, player, card);

    case 'Barricade':
      return playBarricade(game, player, card, target);

    case 'Tool':
      return playTool(game, player, card, target);

    case 'Trap':
      return playTrap(game, player, card, target);

    case 'Hazard':
      return playHazard(game, player, card, target);

    case 'Interrupt':
      return playInterrupt(game, player, card, target);

    default:
      return { success: false, message: 'Unknown card type' };
  }
}

/**
 * Play a Gub card
 */
function playGub(game, player, card) {
  player.playGub(card);

  return {
    success: true,
    message: `${player.name} played ${card.name}`,
    effects: {
      type: 'gub-played',
      playerId: player.id,
      card: card.toJSON()
    }
  };
}

/**
 * Play a Barricade card
 */
function playBarricade(game, player, card, target) {
  const success = player.playBarricade(card, target.gubId);

  if (!success) {
    return { success: false, message: 'Failed to play Barricade' };
  }

  return {
    success: true,
    message: `${player.name} protected a Gub with ${card.name}`,
    effects: {
      type: 'barricade-played',
      playerId: player.id,
      card: card.toJSON(),
      targetGubId: target.gubId
    }
  };
}

/**
 * Play a Tool card
 */
function playTool(game, player, card, target) {
  switch (card.subtype) {
    case 'Weapon':
      return playWeapon(game, player, card, target);
    case 'Thief':
      return playSmallThief(game, player, card, target);
    case 'Healing':
      return playAgeOldCure(game, player, card, target);
    case 'Tactical':
      return playTactical(game, player, card, target);
    case 'Magic':
      return playMagic(game, player, card, target);
    default:
      return { success: false, message: 'Unknown tool subtype' };
  }
}

/**
 * Play a Weapon card (Spear, Lure, Super Lure)
 */
function playWeapon(game, player, card, target) {
  const targetPlayer = game.getPlayer(target.playerId);

  if (!targetPlayer) {
    return { success: false, message: 'Target player not found' };
  }

  if (card.name === 'Spear') {
    return playSpear(game, player, card, targetPlayer, target);
  }

  if (card.name === 'Lure' || card.name === 'Super Lure') {
    const destroyedBarricade = targetPlayer.destroyBarricade(target.gubId);

    if (!destroyedBarricade) {
      return { success: false, message: 'Failed to destroy barricade' };
    }

    game.deck.addToDiscard(destroyedBarricade);

    return {
      success: true,
      message: `${player.name} destroyed ${targetPlayer.name}'s ${destroyedBarricade.name}`,
      effects: {
        type: 'barricade-destroyed',
        playerId: player.id,
        targetPlayerId: targetPlayer.id,
        destroyedCard: destroyedBarricade.toJSON(),
        targetGubId: target.gubId
      }
    };
  }

  return { success: false, message: 'Unknown weapon type' };
}

/**
 * Play a Spear card
 * Spear can: destroy barricade OR trap unprotected Gub OR kill unprotected Gub
 */
function playSpear(game, player, card, targetPlayer, target) {
  const gubLocation = targetPlayer.findGub(target.gubId);

  if (!gubLocation) {
    return { success: false, message: 'Target Gub not found' };
  }

  // If Gub is protected, destroy the barricade
  if (gubLocation.location === 'protectedGubs') {
    const destroyedBarricade = targetPlayer.destroyBarricade(target.gubId);

    if (!destroyedBarricade) {
      return { success: false, message: 'Failed to destroy barricade' };
    }

    game.deck.addToDiscard(destroyedBarricade);

    return {
      success: true,
      message: `${player.name} used Spear to destroy ${targetPlayer.name}'s ${destroyedBarricade.name}`,
      effects: {
        type: 'barricade-destroyed',
        playerId: player.id,
        targetPlayerId: targetPlayer.id,
        destroyedCard: destroyedBarricade.toJSON(),
        targetGubId: target.gubId
      }
    };
  }

  // If Gub is free or trapped, kill it or trap it
  if (target.action === 'trap') {
    // Need a Sud Spout to trap - this should come from player's hand
    // For now, just kill the Gub
    const removedGub = targetPlayer.removeGub(target.gubId);

    if (!removedGub) {
      return { success: false, message: 'Failed to remove Gub' };
    }

    game.deck.addToRemoved(removedGub);

    return {
      success: true,
      message: `${player.name} used Spear to kill ${targetPlayer.name}'s ${removedGub.name}`,
      effects: {
        type: 'gub-killed',
        playerId: player.id,
        targetPlayerId: targetPlayer.id,
        killedGub: removedGub.toJSON()
      }
    };
  }

  // Default: kill the Gub
  const removedGub = targetPlayer.removeGub(target.gubId);

  if (!removedGub) {
    return { success: false, message: 'Failed to remove Gub' };
  }

  game.deck.addToRemoved(removedGub);

  return {
    success: true,
    message: `${player.name} used Spear to kill ${targetPlayer.name}'s ${removedGub.name}`,
    effects: {
      type: 'gub-killed',
      playerId: player.id,
      targetPlayerId: targetPlayer.id,
      killedGub: removedGub.toJSON()
    }
  };
}

/**
 * Play Smahl Thief card
 */
function playSmallThief(game, player, card, target) {
  const targetPlayer = game.getPlayer(target.playerId);

  if (!targetPlayer) {
    return { success: false, message: 'Target player not found' };
  }

  const stolenGub = targetPlayer.removeGub(target.gubId);

  if (!stolenGub) {
    return { success: false, message: 'Failed to steal Gub' };
  }

  // If the Gub was trapped, discard the trap
  if (stolenGub.isTrapped && stolenGub.trapCard) {
    game.deck.addToDiscard(stolenGub.trapCard);
    stolenGub.isTrapped = false;
    stolenGub.trapCard = null;
  }

  // Add to player's play area
  player.playGub(stolenGub);

  return {
    success: true,
    message: `${player.name} stole ${stolenGub.name} from ${targetPlayer.name}`,
    effects: {
      type: 'gub-stolen',
      playerId: player.id,
      targetPlayerId: targetPlayer.id,
      stolenGub: stolenGub.toJSON()
    }
  };
}

/**
 * Play Age Old Cure card
 */
function playAgeOldCure(game, player, card, target) {
  if (game.deck.discardPile.length === 0) {
    return { success: false, message: 'Discard pile is empty' };
  }

  let rescuedCard;

  if (target.cardId) {
    // Rescue specific card
    const cardIndex = game.deck.discardPile.findIndex(c => c.id === target.cardId);
    if (cardIndex === -1) {
      return { success: false, message: 'Card not found in discard pile' };
    }
    [rescuedCard] = game.deck.discardPile.splice(cardIndex, 1);
  } else {
    // Rescue top card
    rescuedCard = game.deck.discardPile.pop();
  }

  player.addCardToHand(rescuedCard);

  return {
    success: true,
    message: `${player.name} rescued ${rescuedCard.name} from the discard pile`,
    effects: {
      type: 'card-rescued',
      playerId: player.id,
      rescuedCard: rescuedCard.toJSON()
    }
  };
}

/**
 * Play Tactical cards (Retreat, Scout, etc.)
 */
function playTactical(game, player, card, target) {
  if (card.name === 'Retreat') {
    return playRetreat(game, player, card);
  }

  if (card.name === 'Scout') {
    const targetPlayer = game.getPlayer(target.playerId);

    if (!targetPlayer) {
      return { success: false, message: 'Target player not found' };
    }

    return {
      success: true,
      message: `${player.name} scouted ${targetPlayer.name}'s hand`,
      effects: {
        type: 'scout-played',
        playerId: player.id,
        targetPlayerId: targetPlayer.id,
        revealedHand: targetPlayer.hand.map(c => c.toJSON())
      }
    };
  }

  // Other tactical cards - implement as needed
  return { success: true, message: `${player.name} played ${card.name}` };
}

/**
 * Play Retreat card
 */
function playRetreat(game, player, card) {
  const retrievedCards = player.retrieveAllCards();

  retrievedCards.forEach(c => {
    player.addCardToHand(c);
  });

  return {
    success: true,
    message: `${player.name} retrieved all cards to hand (${retrievedCards.length} cards)`,
    effects: {
      type: 'retreat-played',
      playerId: player.id,
      retrievedCount: retrievedCards.length
    }
  };
}

/**
 * Play Magic cards (Rings, Haki Flute, etc.)
 */
function playMagic(game, player, card, target) {
  if (card.name.includes('Ring')) {
    // Add ring to active effects
    player.playArea.activeEffects.push(card);

    return {
      success: true,
      message: `${player.name} played ${card.name} (active effect)`,
      effects: {
        type: 'magic-played',
        playerId: player.id,
        card: card.toJSON()
      }
    };
  }

  // Other magic cards - implement as needed
  return { success: true, message: `${player.name} played ${card.name}` };
}

/**
 * Play a Trap card (Sud Spout)
 */
function playTrap(game, player, card, target) {
  const targetPlayer = game.getPlayer(target.playerId);

  if (!targetPlayer) {
    return { success: false, message: 'Target player not found' };
  }

  const success = targetPlayer.trapGub(target.gubId, card);

  if (!success) {
    return { success: false, message: 'Failed to trap Gub' };
  }

  return {
    success: true,
    message: `${player.name} trapped ${targetPlayer.name}'s Gub with ${card.name}`,
    effects: {
      type: 'gub-trapped',
      playerId: player.id,
      targetPlayerId: targetPlayer.id,
      targetGubId: target.gubId,
      trapCard: card.toJSON()
    }
  };
}

/**
 * Play a Hazard card (Lightning, Cyclone)
 */
function playHazard(game, player, card, target) {
  if (card.name === 'Lightning') {
    return playLightning(game, player, card, target);
  }

  // Cyclone - implement as needed
  return { success: true, message: `${player.name} played ${card.name}` };
}

/**
 * Play Lightning card
 * Can destroy Esteemed Elder OR destroy a player's entire hand
 */
function playLightning(game, player, card, target) {
  const targetPlayer = game.getPlayer(target.playerId);

  if (!targetPlayer) {
    return { success: false, message: 'Target player not found' };
  }

  if (target.action === 'destroy-elder') {
    // Find and destroy Esteemed Elder
    const elderLocation = targetPlayer.playArea.gubs.find(g => g.subtype === 'Elder') ||
                          targetPlayer.playArea.protectedGubs.find(g => g.subtype === 'Elder');

    if (!elderLocation) {
      return { success: false, message: 'Target player has no Esteemed Elder' };
    }

    const removedElder = targetPlayer.removeGub(elderLocation.id);

    if (!removedElder) {
      // Try removing from protected
      const elderIndex = targetPlayer.playArea.protectedGubs.findIndex(g => g.subtype === 'Elder');
      if (elderIndex !== -1) {
        const [elder] = targetPlayer.playArea.protectedGubs.splice(elderIndex, 1);
        game.deck.addToDiscard(elder);

        return {
          success: true,
          message: `${player.name} destroyed ${targetPlayer.name}'s Esteemed Elder with Lightning`,
          effects: {
            type: 'elder-destroyed',
            playerId: player.id,
            targetPlayerId: targetPlayer.id,
            destroyedElder: elder.toJSON()
          }
        };
      }

      return { success: false, message: 'Failed to destroy Elder' };
    }

    game.deck.addToDiscard(removedElder);

    return {
      success: true,
      message: `${player.name} destroyed ${targetPlayer.name}'s Esteemed Elder with Lightning`,
      effects: {
        type: 'elder-destroyed',
        playerId: player.id,
        targetPlayerId: targetPlayer.id,
        destroyedElder: removedElder.toJSON()
      }
    };
  }

  if (target.action === 'destroy-hand') {
    // Destroy entire hand
    const discardedCards = [...targetPlayer.hand];
    targetPlayer.hand = [];

    discardedCards.forEach(c => game.deck.addToDiscard(c));

    return {
      success: true,
      message: `${player.name} destroyed ${targetPlayer.name}'s hand with Lightning (${discardedCards.length} cards)`,
      effects: {
        type: 'hand-destroyed',
        playerId: player.id,
        targetPlayerId: targetPlayer.id,
        discardedCount: discardedCards.length
      }
    };
  }

  return { success: false, message: 'Must specify Lightning action: destroy-elder or destroy-hand' };
}

/**
 * Play an Interrupt card
 */
function playInterrupt(game, player, card, target) {
  if (card.name === 'Flop Boat') {
    // Redirect Event card back to deck
    const eventCard = target.eventCard;

    if (!eventCard) {
      return { success: false, message: 'No Event card to redirect' };
    }

    // Add back to deck and shuffle
    game.deck.cards.push(eventCard);
    game.deck.cards = game.deck.shuffle(game.deck.cards);

    return {
      success: true,
      message: `${player.name} used Flop Boat to redirect ${eventCard.name} back to deck`,
      effects: {
        type: 'event-redirected',
        playerId: player.id,
        eventCard: eventCard.toJSON()
      }
    };
  }

  if (card.name === 'Cricket Song') {
    // Cricket Song is handled by mimicking another card
    return {
      success: true,
      message: `${player.name} played Cricket Song as ${target.asCard}`,
      effects: {
        type: 'wild-card-played',
        playerId: player.id,
        card: card.toJSON(),
        representingCard: target.asCard
      }
    };
  }

  return { success: true, message: `${player.name} played ${card.name}` };
}

module.exports = {
  validateCardPlay,
  executeCardEffect
};
