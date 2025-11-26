/**
 * Card Model
 * Represents a single card in the Gubs card game
 */
class Card {
  /**
   * Create a new Card
   * @param {Object} cardData - The card data from cards.json
   * @param {string} cardData.id - Unique identifier for the card
   * @param {string} cardData.name - Name of the card (e.g., "Spear", "Mushroom")
   * @param {string} cardData.type - Card type (Gub, Barricade, Trap, Tool, Hazard, Interrupt, Event, Letter)
   * @param {string} cardData.subtype - Optional subtype for additional categorization
   * @param {string} cardData.description - What the card does
   * @param {string} cardData.imageUrl - Path to card image
   */
  constructor(cardData) {
    // Basic card properties
    this.id = cardData.id;
    this.name = cardData.name;
    this.type = cardData.type;
    this.subtype = cardData.subtype || null;
    this.description = cardData.description;
    this.imageUrl = cardData.imageUrl || `/assets/cards/${cardData.id}.png`;

    // Special state properties (for cards in play)
    // These track the current state of a card when it's on the board
    this.isProtected = false;        // Is this Gub protected by a Barricade?
    this.isTrapped = false;          // Is this Gub trapped by a Sud Spout?
    this.protectionCards = [];       // Array of Barricade cards protecting this Gub
    this.trapCard = null;            // Sud Spout card trapping this Gub (if any)

    // Ownership tracking (set when card is in a player's hand or play area)
    this.ownerId = null;             // ID of the player who owns this card

    // Instance ID (for tracking specific card instances in play)
    // Multiple copies of the same card can exist, so we need unique instance IDs
    this.instanceId = this._generateInstanceId();
  }

  /**
   * Generate a unique instance ID for this card
   * This allows multiple copies of the same card to exist in the game
   * @private
   * @returns {string} Unique instance identifier
   */
  _generateInstanceId() {
    return `${this.id}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Set the owner of this card
   * @param {string} playerId - The ID of the player who owns this card
   */
  setOwner(playerId) {
    this.ownerId = playerId;
  }

  /**
   * Add protection to this card (for Gubs)
   * @param {Card} barricadeCard - The Barricade card protecting this Gub
   */
  addProtection(barricadeCard) {
    if (this.type !== 'Gub') {
      throw new Error('Only Gubs can be protected');
    }

    if (barricadeCard.type !== 'Barricade') {
      throw new Error('Only Barricade cards can protect Gubs');
    }

    this.protectionCards.push(barricadeCard);
    this.isProtected = true;
  }

  /**
   * Remove protection from this card
   * @param {string} barricadeInstanceId - The instance ID of the Barricade to remove
   * @returns {Card|null} The removed Barricade card, or null if not found
   */
  removeProtection(barricadeInstanceId) {
    const index = this.protectionCards.findIndex(
      card => card.instanceId === barricadeInstanceId
    );

    if (index === -1) {
      return null;
    }

    const removedCard = this.protectionCards.splice(index, 1)[0];

    // If no more protection cards, mark as unprotected
    if (this.protectionCards.length === 0) {
      this.isProtected = false;
    }

    return removedCard;
  }

  /**
   * Add a trap to this card (for Gubs)
   * @param {Card} trapCard - The Sud Spout card trapping this Gub
   */
  setTrap(trapCard) {
    if (this.type !== 'Gub') {
      throw new Error('Only Gubs can be trapped');
    }

    if (trapCard.type !== 'Trap') {
      throw new Error('Only Trap cards can trap Gubs');
    }

    this.trapCard = trapCard;
    this.isTrapped = true;
  }

  /**
   * Remove the trap from this card
   * @returns {Card|null} The removed trap card, or null if not trapped
   */
  removeTrap() {
    if (!this.isTrapped) {
      return null;
    }

    const removedTrap = this.trapCard;
    this.trapCard = null;
    this.isTrapped = false;

    return removedTrap;
  }

  /**
   * Check if this Gub is free (not protected and not trapped)
   * @returns {boolean} True if the Gub is free
   */
  isFree() {
    if (this.type !== 'Gub') {
      return false;
    }

    return !this.isProtected && !this.isTrapped;
  }

  /**
   * Check if this is a special immune Gub (Esteemed Elder)
   * @returns {boolean} True if this is an Esteemed Elder
   */
  isImmuneGub() {
    return this.name === 'Esteemed Elder';
  }

  /**
   * Check if this is a Letter card (G, U, or B)
   * @returns {boolean} True if this is a Letter card
   */
  isLetterCard() {
    return this.type === 'Letter';
  }

  /**
   * Check if this is an Event card
   * @returns {boolean} True if this is an Event card
   */
  isEventCard() {
    return this.type === 'Event';
  }

  /**
   * Check if this is an Interrupt card
   * @returns {boolean} True if this is an Interrupt card
   */
  isInterruptCard() {
    return this.type === 'Interrupt';
  }

  /**
   * Reset the card state (remove all protections, traps, ownership)
   * Useful when moving cards back to deck or discard pile
   */
  reset() {
    this.isProtected = false;
    this.isTrapped = false;
    this.protectionCards = [];
    this.trapCard = null;
    this.ownerId = null;
  }

  /**
   * Convert card to JSON for sending to clients
   * @param {boolean} hideDetails - If true, hide sensitive information (for opponent's hand)
   * @returns {Object} JSON representation of the card
   */
  toJSON(hideDetails = false) {
    // If hiding details (for opponent's cards in hand), only return minimal info
    if (hideDetails) {
      return {
        instanceId: this.instanceId,
        cardBack: true // Indicates this is a hidden card
      };
    }

    // Full card data
    return {
      id: this.id,
      instanceId: this.instanceId,
      name: this.name,
      type: this.type,
      subtype: this.subtype,
      description: this.description,
      imageUrl: this.imageUrl,
      isProtected: this.isProtected,
      isTrapped: this.isTrapped,
      protectionCards: this.protectionCards.map(card => card.toJSON(false)),
      trapCard: this.trapCard ? this.trapCard.toJSON(false) : null,
      ownerId: this.ownerId
    };
  }

  /**
   * Create a clone of this card
   * Useful for creating multiple instances of the same card type
   * @returns {Card} A new Card instance with the same base properties
   */
  clone() {
    const clonedCard = new Card({
      id: this.id,
      name: this.name,
      type: this.type,
      subtype: this.subtype,
      description: this.description,
      imageUrl: this.imageUrl
    });

    return clonedCard;
  }

  /**
   * String representation of the card (useful for debugging)
   * @returns {string} String representation
   */
  toString() {
    let status = '';
    if (this.isProtected) status += ' [PROTECTED]';
    if (this.isTrapped) status += ' [TRAPPED]';

    return `${this.name} (${this.type})${status}`;
  }
}

module.exports = Card;
