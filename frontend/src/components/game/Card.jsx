import PropTypes from 'prop-types';
import './Card.css';

/**
 * Card Component
 * Displays a single playing card with its details
 * @param {Object} props
 * @param {Object} props.card - Card object with { id, name, type, subtype, description, imageUrl }
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.isPlayable - Whether the card can be played
 * @param {boolean} props.isSelected - Whether the card is currently selected
 * @param {boolean} props.faceDown - Show card face down
 */
function Card({ card, onClick, isPlayable = false, isSelected = false, faceDown = false }) {
  // Get card type color
  const getCardTypeColor = (type) => {
    const colors = {
      'Gub': '#4ade80',          // green
      'Barricade': '#60a5fa',    // blue
      'Trap': '#f87171',         // red
      'Tool': '#facc15',         // yellow
      'Hazard': '#fb923c',       // orange
      'Interrupt': '#a78bfa',    // purple
      'Event': '#f472b6'         // pink
    };
    return colors[type] || '#9ca3af'; // default gray
  };

  const handleClick = () => {
    if (onClick && (isPlayable || isSelected)) {
      onClick(card);
    }
  };

  if (faceDown) {
    return (
      <div className="card face-down">
        <div className="card-back">
          <div className="card-back-pattern">GUBS</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card ${isPlayable ? 'playable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{ borderColor: getCardTypeColor(card.type) }}
    >
      <div className="card-header">
        <span className="card-name">{card.name}</span>
        <span
          className="card-type"
          style={{ backgroundColor: getCardTypeColor(card.type) }}
        >
          {card.type}
        </span>
      </div>

      {card.imageUrl ? (
        <div className="card-image">
          <img src={card.imageUrl} alt={card.name} />
        </div>
      ) : (
        <div
          className="card-image-placeholder"
          style={{ backgroundColor: `${getCardTypeColor(card.type)}33` }}
        >
          <span className="card-type-icon">{card.type[0]}</span>
        </div>
      )}

      {card.subtype && (
        <div className="card-subtype">{card.subtype}</div>
      )}

      <div className="card-description">
        {card.description}
      </div>
    </div>
  );
}

Card.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    subtype: PropTypes.string,
    description: PropTypes.string,
    imageUrl: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func,
  isPlayable: PropTypes.bool,
  isSelected: PropTypes.bool,
  faceDown: PropTypes.bool
};

export default Card;
