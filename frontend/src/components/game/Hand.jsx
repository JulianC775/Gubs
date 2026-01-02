import PropTypes from 'prop-types';
import Card from './Card';
import './Hand.css';

/**
 * Hand Component
 * Displays all cards in a player's hand
 * @param {Object} props
 * @param {Array} props.cards - Array of card objects
 * @param {Function} props.onCardClick - Handler when a card is clicked
 * @param {string} props.selectedCardId - ID of currently selected card
 * @param {boolean} props.isMyTurn - Whether it's the player's turn
 */
function Hand({ cards = [], onCardClick, selectedCardId = null, isMyTurn = false }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="hand empty">
        <p className="empty-message">No cards in hand</p>
      </div>
    );
  }

  return (
    <div className="hand">
      <div className="hand-label">
        Your Hand ({cards.length} {cards.length === 1 ? 'card' : 'cards'})
        {cards.length > 8 && (
          <span className="hand-warning"> - Must discard to 8 cards!</span>
        )}
      </div>
      <div className="hand-cards">
        {cards.map((card, index) => (
          <div key={card.id || index} className="hand-card-wrapper">
            <Card
              card={card}
              onClick={onCardClick}
              isPlayable={isMyTurn}
              isSelected={card.id === selectedCardId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

Hand.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired
    })
  ),
  onCardClick: PropTypes.func,
  selectedCardId: PropTypes.string,
  isMyTurn: PropTypes.bool
};

export default Hand;
