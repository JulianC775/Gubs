import PropTypes from 'prop-types';
import Card from './Card';
import './PlayArea.css';

/**
 * PlayArea Component
 * Displays a player's Gubs with their protections and traps
 * @param {Object} props
 * @param {Object} props.playArea - Player's play area with gubs, protectedGubs, trappedGubs
 * @param {string} props.playerName - Name of the player
 * @param {number} props.score - Player's current score
 * @param {boolean} props.isCurrentPlayer - Whether this is the current player viewing
 * @param {Function} props.onGubClick - Handler when a Gub is clicked (for targeting)
 * @param {string} props.selectedGubId - ID of currently selected Gub
 * @param {boolean} props.isTargetable - Whether Gubs can be targeted
 */
function PlayArea({
  playArea = { gubs: [], protectedGubs: [], trappedGubs: [] },
  playerName = '',
  score = 0,
  isCurrentPlayer = false,
  onGubClick,
  selectedGubId = null,
  isTargetable = false
}) {
  const { gubs = [], protectedGubs = [], trappedGubs = [] } = playArea;

  // Combine all Gubs and determine their status
  const allGubsMap = new Map();

  // Add free Gubs
  gubs.forEach(gub => {
    allGubsMap.set(gub.id, {
      card: gub,
      status: 'free',
      protection: null,
      trap: null
    });
  });

  // Add protected Gubs - backend sends gubs with protectionCards array
  protectedGubs.forEach(gub => {
    const protection = gub.protectionCards && gub.protectionCards.length > 0
      ? gub.protectionCards[0]
      : null;
    allGubsMap.set(gub.id, {
      card: gub,
      status: 'protected',
      protection: protection,
      trap: null
    });
  });

  // Add trapped Gubs - backend sends gubs with trapCard
  trappedGubs.forEach(gub => {
    const existing = allGubsMap.get(gub.id);
    if (existing) {
      existing.trap = gub.trapCard;
      existing.status = existing.protection ? 'protected-trapped' : 'trapped';
    } else {
      allGubsMap.set(gub.id, {
        card: gub,
        status: 'trapped',
        protection: null,
        trap: gub.trapCard
      });
    }
  });

  const allGubs = Array.from(allGubsMap.values());

  const handleGubClick = (gubData) => {
    if (onGubClick) {
      onGubClick(gubData);
    }
  };

  const targetableClass = isTargetable ? 'targetable' : '';
  const clickableClass = onGubClick ? 'clickable' : '';

  if (allGubs.length === 0) {
    return (
      <div className={`play-area ${isCurrentPlayer ? 'current-player' : ''} ${targetableClass}`}>
        <div className="play-area-header">
          <h3>{playerName}&apos;s Gubs</h3>
          <div className="score-display">Score: {score}</div>
        </div>
        <div className="no-gubs">
          <p>No Gubs in play yet</p>
          {isTargetable && <p className="target-hint">Play a Gub first, then protect it</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`play-area ${isCurrentPlayer ? 'current-player' : ''} ${targetableClass}`}>
      <div className="play-area-header">
        <h3>{playerName}&apos;s Gubs</h3>
        <div className="score-display">
          Score: {score}
          <span className="score-breakdown">
            (Free: {gubs.length} + Protected: {protectedGubs.length})
          </span>
        </div>
      </div>

      {isTargetable && (
        <div className="target-instruction">Click a Gub to select it as target</div>
      )}

      <div className="gubs-container">
        {allGubs.map((gubData, index) => (
          <div
            key={gubData.card.id || index}
            className={`gub-stack ${gubData.status} ${selectedGubId === gubData.card.id ? 'selected' : ''} ${clickableClass}`}
            onClick={() => handleGubClick(gubData)}
          >
            {/* The Gub card */}
            <div className="gub-card">
              <Card card={gubData.card} />
            </div>

            {/* Protection (Barricade) if any */}
            {gubData.protection && (
              <div className="protection-card">
                <Card card={gubData.protection} />
                <div className="card-label">Protected</div>
              </div>
            )}

            {/* Trap if any */}
            {gubData.trap && (
              <div className="trap-card">
                <Card card={gubData.trap} />
                <div className="card-label">Trapped</div>
              </div>
            )}

            {/* Status indicator */}
            <div className={`status-indicator ${gubData.status}`}>
              {gubData.status === 'free' && '✓ Free'}
              {gubData.status === 'protected' && '🛡️ Protected'}
              {gubData.status === 'trapped' && '⚠️ Trapped'}
              {gubData.status === 'protected-trapped' && '🛡️⚠️ Protected & Trapped'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

PlayArea.propTypes = {
  playArea: PropTypes.shape({
    gubs: PropTypes.array,
    protectedGubs: PropTypes.array,
    trappedGubs: PropTypes.array
  }),
  playerName: PropTypes.string,
  score: PropTypes.number,
  isCurrentPlayer: PropTypes.bool,
  onGubClick: PropTypes.func,
  selectedGubId: PropTypes.string,
  isTargetable: PropTypes.bool
};

export default PlayArea;
