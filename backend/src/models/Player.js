const { v4: uuidv4 } = require('uuid');

class Player {
  constructor(name, socketId = null) {
    this.id = uuidv4();
    this.name = name;
    this.socketId = socketId;
    this.hand = [];
    this.playArea = {
      gubs: [],           // Free Gubs (count towards score)
      protectedGubs: [],  // Gubs with Barricades (count towards score)
      trappedGubs: [],    // Gubs under Sud Spouts (do NOT count)
      activeEffects: []   // Special cards like Rings
    };
    this.isCurrentTurn = false;
    this.consecutiveSkips = 0;
    this.isReady = false;
  }

  /**
   * Add a card to the player's hand
   * @param {Card} card - Card to add
   */
  addCardToHand(card) {
    this.hand.push(card);
  }

  /**
   * Remove a card from the player's hand
   * @param {string} cardId - ID of the card to remove
   * @returns {Card|null} - The removed card or null if not found
   */
  removeCardFromHand(cardId) {
    const cardIndex = this.hand.findIndex(card => card.id === cardId);

    if (cardIndex === -1) {
      return null;
    }

    const [removedCard] = this.hand.splice(cardIndex, 1);
    return removedCard;
  }

  /**
   * Check if player has a specific card in hand
   * @param {string} cardId - ID of the card to check
   * @returns {boolean}
   */
  hasCard(cardId) {
    return this.hand.some(card => card.id === cardId);
  }

  /**
   * Play a Gub card to the play area
   * @param {Card} card - Gub card to play
   * @returns {boolean} - Success status
   */
  playGub(card) {
    if (card.type !== 'Gub') {
      return false;
    }

    // Add to free gubs (unprotected)
    this.playArea.gubs.push(card);
    return true;
  }

  /**
   * Play a Barricade card on a Gub
   * @param {Card} barricade - Barricade card to play
   * @param {string} targetGubId - ID of the Gub to protect
   * @returns {boolean} - Success status
   */
  playBarricade(barricade, targetGubId) {
    if (barricade.type !== 'Barricade') {
      return false;
    }

    // Find the target Gub in free gubs
    const gubIndex = this.playArea.gubs.findIndex(gub => gub.id === targetGubId);

    if (gubIndex === -1) {
      return false; // Gub not found or already protected
    }

    // Move Gub from free to protected
    const [gub] = this.playArea.gubs.splice(gubIndex, 1);

    // Mark the Gub as protected and store the barricade
    gub.isProtected = true;
    gub.protectionCards = gub.protectionCards || [];
    gub.protectionCards.push(barricade);

    this.playArea.protectedGubs.push(gub);
    return true;
  }

  /**
   * Find a Gub by ID across all play area sections
   * @param {string} gubId - ID of the Gub to find
   * @returns {Object|null} - { gub, location } or null
   */
  findGub(gubId) {
    // Check free gubs
    let gub = this.playArea.gubs.find(g => g.id === gubId);
    if (gub) return { gub, location: 'gubs' };

    // Check protected gubs
    gub = this.playArea.protectedGubs.find(g => g.id === gubId);
    if (gub) return { gub, location: 'protectedGubs' };

    // Check trapped gubs
    gub = this.playArea.trappedGubs.find(g => g.id === gubId);
    if (gub) return { gub, location: 'trappedGubs' };

    return null;
  }

  /**
   * Trap a Gub under a Sud Spout
   * @param {string} gubId - ID of the Gub to trap
   * @param {Card} trapCard - Sud Spout card
   * @returns {boolean} - Success status
   */
  trapGub(gubId, trapCard) {
    // Find Gub in free gubs only (can't trap protected Gubs)
    const gubIndex = this.playArea.gubs.findIndex(gub => gub.id === gubId);

    if (gubIndex === -1) {
      return false;
    }

    // Move Gub from free to trapped
    const [gub] = this.playArea.gubs.splice(gubIndex, 1);

    gub.isTrapped = true;
    gub.trapCard = trapCard;

    this.playArea.trappedGubs.push(gub);
    return true;
  }

  /**
   * Free a Gub from a trap
   * @param {string} gubId - ID of the Gub to free
   * @returns {Card|null} - The freed Gub or null
   */
  freeGub(gubId) {
    const gubIndex = this.playArea.trappedGubs.findIndex(gub => gub.id === gubId);

    if (gubIndex === -1) {
      return null;
    }

    const [gub] = this.playArea.trappedGubs.splice(gubIndex, 1);

    gub.isTrapped = false;
    gub.trapCard = null;

    // Move back to free gubs
    this.playArea.gubs.push(gub);
    return gub;
  }

  /**
   * Destroy a barricade on a protected Gub
   * @param {string} gubId - ID of the protected Gub
   * @returns {Card|null} - The destroyed barricade or null
   */
  destroyBarricade(gubId) {
    const gubIndex = this.playArea.protectedGubs.findIndex(gub => gub.id === gubId);

    if (gubIndex === -1) {
      return null;
    }

    const [gub] = this.playArea.protectedGubs.splice(gubIndex, 1);

    // Remove protection
    const barricade = gub.protectionCards ? gub.protectionCards.pop() : null;
    gub.isProtected = false;
    gub.protectionCards = [];

    // Move back to free gubs
    this.playArea.gubs.push(gub);

    return barricade;
  }

  /**
   * Remove a Gub from play area (stolen or destroyed)
   * @param {string} gubId - ID of the Gub to remove
   * @returns {Card|null} - The removed Gub or null
   */
  removeGub(gubId) {
    // Check free gubs
    let gubIndex = this.playArea.gubs.findIndex(gub => gub.id === gubId);
    if (gubIndex !== -1) {
      const [gub] = this.playArea.gubs.splice(gubIndex, 1);
      return gub;
    }

    // Check trapped gubs
    gubIndex = this.playArea.trappedGubs.findIndex(gub => gub.id === gubId);
    if (gubIndex !== -1) {
      const [gub] = this.playArea.trappedGubs.splice(gubIndex, 1);
      gub.isTrapped = false;
      gub.trapCard = null;
      return gub;
    }

    return null;
  }

  /**
   * Calculate player's score (free + protected Gubs)
   * @returns {number} - Current score
   */
  calculateScore() {
    return this.playArea.gubs.length + this.playArea.protectedGubs.length;
  }

  /**
   * Check if player has an Esteemed Elder (for tiebreaker)
   * @returns {boolean}
   */
  hasEsteemedElder() {
    const hasInFree = this.playArea.gubs.some(gub => gub.subtype === 'Elder');
    const hasInProtected = this.playArea.protectedGubs.some(gub => gub.subtype === 'Elder');
    return hasInFree || hasInProtected;
  }

  /**
   * Get all cards from play area (for Retreat card)
   * @returns {Array} - All cards in play area
   */
  retrieveAllCards() {
    const allCards = [];

    // Collect all Gubs
    allCards.push(...this.playArea.gubs);
    allCards.push(...this.playArea.protectedGubs);
    allCards.push(...this.playArea.trappedGubs);

    // Collect barricades from protected Gubs
    this.playArea.protectedGubs.forEach(gub => {
      if (gub.protectionCards) {
        allCards.push(...gub.protectionCards);
      }
    });

    // Collect trap cards
    this.playArea.trappedGubs.forEach(gub => {
      if (gub.trapCard) {
        allCards.push(gub.trapCard);
      }
    });

    // Clear play area
    this.playArea = {
      gubs: [],
      protectedGubs: [],
      trappedGubs: [],
      activeEffects: []
    };

    return allCards;
  }

  /**
   * Serialize player to JSON with privacy options
   * @param {boolean} isOwner - If true, include full hand details
   * @param {Object} options - Additional options (e.g., revealHandTo)
   * @returns {Object} - Player data
   */
  toJSON(isOwner = false, options = {}) {
    const { revealHandTo } = options;
    const shouldShowHand = isOwner || revealHandTo;

    return {
      id: this.id,
      name: this.name,
      hand: shouldShowHand ? this.hand.map(card => card.toJSON()) : null,
      handCount: this.hand.length,
      playArea: {
        gubs: this.playArea.gubs.map(card => card.toJSON()),
        protectedGubs: this.playArea.protectedGubs.map(gub => ({
          ...gub.toJSON(),
          protectionCards: gub.protectionCards ? gub.protectionCards.map(c => c.toJSON()) : []
        })),
        trappedGubs: this.playArea.trappedGubs.map(gub => ({
          ...gub.toJSON(),
          trapCard: gub.trapCard ? gub.trapCard.toJSON() : null
        })),
        activeEffects: this.playArea.activeEffects
      },
      score: this.calculateScore(),
      isCurrentTurn: this.isCurrentTurn,
      isReady: this.isReady,
      hasEsteemedElder: this.hasEsteemedElder()
    };
  }
}

module.exports = Player;
