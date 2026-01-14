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
 */
function PlayArea({
  playArea = { gubs: [], protectedGubs: [], trappedGubs: [] },
  playerName = '',
  score = 0,
  isCurrentPlayer = false,
  onGubClick,
  selectedGubId = null
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

  // Add protected Gubs
  protectedGubs.forEach(item => {
    if (item.gub) {
      allGubsMap.set(item.gub.id, {
        card: item.gub,
        status: 'protected',
        protection: item.barricade,
        trap: null
      });
    }
  });

  // Add trapped Gubs
  trappedGubs.forEach(item => {
    if (item.gub) {
      const existing = allGubsMap.get(item.gub.id);
      if (existing) {
        existing.trap = item.trap;
        existing.status = existing.protection ? 'protected-trapped' : 'trapped';
      } else {
        allGubsMap.set(item.gub.id, {
          card: item.gub,
          status: 'trapped',
          protection: null,
          trap: item.trap
        });
      }
    }
  });

  const allGubs = Array.from(allGubsMap.values());

  const handleGubClick = (gubData) => {
    if (onGubClick) {
      onGubClick(gubData);
    }
  };

  if (allGubs.length === 0) {
    return (
      <div className={`play-area ${isCurrentPlayer ? 'current-player' : ''}`}>
        <div className="play-area-header">
          <h3>{playerName}&apos;s Play Area</h3>
          <div className="score-display">Score: {score}</div>
        </div>
        <div className="no-gubs">
          <p>No Gubs in play</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`play-area ${isCurrentPlayer ? 'current-player' : ''}`}>
      <div className="play-area-header">
        <h3>{playerName}&apos;s Play Area</h3>
        <div className="score-display">
          Score: {score}
          <span className="score-breakdown">
            (Free: {gubs.length} + Protected: {protectedGubs.length})
          </span>
        </div>
      </div>

      <div className="gubs-container">
        {allGubs.map((gubData, index) => (
          <div
            key={gubData.card.id || index}
            className={`gub-stack ${gubData.status} ${selectedGubId === gubData.card.id ? 'selected' : ''}`}
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
  selectedGubId: PropTypes.string
};

export default PlayArea;
