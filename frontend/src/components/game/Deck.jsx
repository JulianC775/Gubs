import PropTypes from 'prop-types';
import Card from './Card';
import './Deck.css';

/**
 * Deck Component
 * Displays the draw pile, discard pile, and drawn letter cards
 */
function Deck({
  cardsRemaining = 0,
  drawnLetters = [],
  discardPile = [],
  onDrawCard,
  canDraw = false
}) {
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  // Letter display helper
  const getLetterStatus = (letter) => {
    return drawnLetters.includes(letter);
  };

  const handleDeckClick = () => {
    if (canDraw && onDrawCard) {
      onDrawCard();
    }
  };

  return (
    <div className="deck-area">
      {/* Letter cards progress */}
      <div className="letter-progress">
        <div className={`letter-card ${getLetterStatus('G') ? 'drawn' : ''}`}>
          <span className="letter">G</span>
          {getLetterStatus('G') && <span className="letter-check">✓</span>}
        </div>
        <div className={`letter-card ${getLetterStatus('U') ? 'drawn' : ''}`}>
          <span className="letter">U</span>
          {getLetterStatus('U') && <span className="letter-check">✓</span>}
        </div>
        <div className={`letter-card ${getLetterStatus('B') ? 'drawn' : ''}`}>
          <span className="letter">B</span>
          {getLetterStatus('B') && <span className="letter-check">✓</span>}
        </div>
        <div className="letter-warning">
          {drawnLetters.length === 2 && '⚠️ One letter left!'}
          {drawnLetters.length === 3 && '🏁 Game Over!'}
        </div>
      </div>

      <div className="deck-and-discard">
        {/* Draw pile */}
        <div className="draw-pile-container">
          <div
            className={`draw-pile ${canDraw ? 'can-draw' : ''}`}
            onClick={handleDeckClick}
            title={canDraw ? 'Click to draw a card' : 'Cannot draw right now'}
          >
            {cardsRemaining > 0 ? (
              <>
                <div className="deck-stack">
                  {/* Visual stack effect */}
                  <div className="deck-card-back layer-3"></div>
                  <div className="deck-card-back layer-2"></div>
                  <div className="deck-card-back layer-1">
                    <div className="card-back-design">GUBS</div>
                  </div>
                </div>
                {canDraw && <div className="draw-hint">Draw</div>}
              </>
            ) : (
              <div className="empty-deck">
                <span>Empty</span>
              </div>
            )}
          </div>
          <div className="pile-label">
            Draw Pile
            <span className="cards-count">{cardsRemaining} cards</span>
          </div>
        </div>

        {/* Discard pile */}
        <div className="discard-pile-container">
          <div className="discard-pile">
            {topDiscard ? (
              <Card card={topDiscard} />
            ) : (
              <div className="empty-discard">
                <span>Discard</span>
              </div>
            )}
          </div>
          <div className="pile-label">
            Discard Pile
            <span className="cards-count">{discardPile.length} cards</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Deck.propTypes = {
  cardsRemaining: PropTypes.number,
  drawnLetters: PropTypes.arrayOf(PropTypes.string),
  discardPile: PropTypes.array,
  onDrawCard: PropTypes.func,
  canDraw: PropTypes.bool
};

export default Deck;
