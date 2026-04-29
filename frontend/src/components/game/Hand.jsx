import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';
import './Hand.css';

function DraggableCard({ card, onCardClick, isPlayable, isSelected, discardMode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.instanceId || card.id,
    data: { card },
    disabled: !isPlayable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    transition: isDragging ? undefined : 'transform 0.2s ease',
    zIndex: isDragging ? 999 : undefined,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`hand-card-wrapper ${discardMode ? 'discardable' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <Card
        card={card}
        onClick={onCardClick}
        isPlayable={isPlayable}
        isSelected={isSelected}
      />
    </div>
  );
}

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
          ? `Hand (${cards.length}) — click or drag to discard`
          : `Your Hand (${cards.length} ${cards.length === 1 ? 'card' : 'cards'}) — drag or click to play`}
      </div>
      <div className="hand-cards">
        {cards.map((card) => (
          <DraggableCard
            key={card.instanceId || card.id}
            card={card}
            onCardClick={onCardClick}
            isPlayable={discardMode ? true : isMyTurn}
            isSelected={!discardMode && card.instanceId === selectedCardId}
            discardMode={discardMode}
          />
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
  discardMode: PropTypes.bool,
};

export default Hand;
