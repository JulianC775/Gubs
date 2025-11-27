const Card = require('./Card');
const cardData = require('../data/cards.json');

class Deck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
    this.drawnLetters = [];
    this.removedCards = [];

    this.initializeDeck();
  }

  /**
   * Load all cards from cards.json and create instances
   */
  initializeDeck() {
    const letterCards = [];
    const regularCards = [];

    // Create card instances based on quantityc
    cardData.cards.forEach(cardTemplate => {
      for (let i = 0; i < cardTemplate.quantity; i++) {
        const card = new Card({
          id: cardTemplate.id,
          name: cardTemplate.name,
          type: cardTemplate.type,
          subtype: cardTemplate.subtype,
          description: cardTemplate.description,
          imageUrl: cardTemplate.imageUrl
        });

        // Separate letter cards from regular cards
        if (cardTemplate.subtype === 'Letter') {
          letterCards.push(card);
        } else {
          regularCards.push(card);
        }
      }
    });

    // Shuffle the regular cards (69 cards)
    this.cards = this.shuffle(regularCards);

    // Insert letter cards into their respective thirds
    this.insertLetterCards(letterCards);
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  shuffle(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Insert letter cards (G, U, B) into top, middle, and bottom thirds
   * @param {Array} letterCards - Array of letter cards [G, U, B]
   */
  insertLetterCards(letterCards) {
    // Find each letter card
    const gCard = letterCards.find(card => card.name === 'G');
    const uCard = letterCards.find(card => card.name === 'U');
    const bCard = letterCards.find(card => card.name === 'B');

    const deckSize = this.cards.length;
    const thirdSize = Math.floor(deckSize / 3);

    // Insert G in top third (0 to thirdSize-1)
    if (gCard) {
      const gPosition = Math.floor(Math.random() * thirdSize);
      this.cards.splice(gPosition, 0, gCard);
    }

    // Insert U in middle third (thirdSize to 2*thirdSize-1)
    // Note: After inserting G, indices shift by 1
    if (uCard) {
      const uPosition = thirdSize + Math.floor(Math.random() * thirdSize);
      this.cards.splice(uPosition, 0, uCard);
    }

    // Insert B in bottom third (2*thirdSize to end)
    // Note: After inserting G and U, indices shift by 2
    if (bCard) {
      const bPosition = (2 * thirdSize) + Math.floor(Math.random() * thirdSize);
      this.cards.splice(bPosition, 0, bCard);
    }
  }

  /**
   * Draw the top card from the deck
   * @returns {Card|null} - The drawn card or null if deck is empty
   */
  drawCard() {
    if (this.cards.length === 0) {
      return null;
    }

    const card = this.cards.shift(); // Remove from top of deck

    // Check if it's a letter card
    if (card.subtype === 'Letter') {
      this.drawnLetters.push(card.name);
    }

    return card;
  }

  /**
   * Add a card to the discard pile
   * @param {Card} card - Card to discard
   */
  addToDiscard(card) {
    this.discardPile.push(card);
  }

  /**
   * Add a card to removed cards (permanently out of game)
   * @param {Card} card - Card to remove
   */
  addToRemoved(card) {
    this.removedCards.push(card);
  }

  /**
   * Get number of cards remaining in deck
   * @returns {number}
   */
  getCardsRemaining() {
    return this.cards.length;
  }

  /**
   * Check if all 3 letters have been drawn (game ending condition)
   * @returns {boolean}
   */
  isGameEnding() {
    return this.drawnLetters.length === 3;
  }

  /**
   * Get the top card without removing it
   * @returns {Card|null}
   */
  peekTopCard() {
    return this.cards.length > 0 ? this.cards[0] : null;
  }

  /**
   * Serialize deck state to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      cardsRemaining: this.cards.length,
      discardPileSize: this.discardPile.length,
      drawnLetters: this.drawnLetters,
      removedCardsCount: this.removedCards.length,
      topDiscardCard: this.discardPile.length > 0
        ? this.discardPile[this.discardPile.length - 1].toJSON()
        : null
    };
  }
}

module.exports = Deck;
