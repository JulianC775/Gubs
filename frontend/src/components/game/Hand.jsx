import PropTypes from 'prop-types';
import Card from './Card';
import './Hand.css';

function Hand({ cards = [], onCardClick, selectedCardId = null, isMyTurn = false, discardMode = false }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="hand empty">
        <p className="empty-message">No cards in hand</p>
      </div>
    );
  }

  return (
    <div className={`hand ${discardMode ? 'discard-mode' : ''}`}>
      <div className="hand-label">
        {discardMode
          ? `Hand (${cards.length}) — click to discard`
          : `Your Hand (${cards.length} ${cards.length === 1 ? 'card' : 'cards'})`}
      </div>
      <div className="hand-cards">
        {cards.map((card, index) => (
          <div key={card.instanceId || card.id || index} className={`hand-card-wrapper ${discardMode ? 'discardable' : ''}`}>
            <Card
              card={card}
              onClick={onCardClick}
              isPlayable={discardMode ? true : isMyTurn}
              isSelected={!discardMode && card.instanceId === selectedCardId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

Hand.propTypes = {
  cards: PropTypes.array,
  onCardClick: PropTypes.func,
  selectedCardId: PropTypes.string,
  isMyTurn: PropTypes.bool,
  discardMode: PropTypes.bool
};

export default Hand;
