import PropTypes from 'prop-types';
import PlayArea from './PlayArea';
import Card from './Card';
import './PlayerBoard.css';

/**
 * PlayerBoard Component
 * Displays an opponent's game state (name, hand count, play area)
 */
function PlayerBoard({
  player,
  isCurrentTurn = false,
  onGubSelect,
  selectedGubId = null,
  isTargetable = false
}) {
  if (!player) return null;

  const {
    name,
    handCount = 0,
    playArea = { gubs: [], protectedGubs: [], trappedGubs: [] },
    score = 0,
    isConnected = true
  } = player;

  return (
    <div className={`player-board ${isCurrentTurn ? 'current-turn' : ''} ${!isConnected ? 'disconnected' : ''} ${isTargetable ? 'targetable' : ''}`}>
      <div className="player-board-header">
        <div className="player-info">
          <span className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? '●' : '○'}
          </span>
          <h3 className="player-name">{name}</h3>
          {isCurrentTurn && <span className="turn-indicator">◆ Their Turn</span>}
        </div>
        <div className="player-stats">
          <span className="hand-count" title="Cards in hand">
            🃏 {handCount}
          </span>
          <span className="score" title="Score">
            ⭐ {score}
          </span>
        </div>
      </div>

      {/* Opponent's hand (face down) */}
      <div className="opponent-hand">
        {Array.from({ length: Math.min(handCount, 8) }).map((_, index) => (
          <div key={index} className="opponent-card-slot">
            <Card card={{ id: `hidden-${index}`, name: '', type: '' }} faceDown />
          </div>
        ))}
        {handCount > 8 && (
          <div className="hand-overflow">+{handCount - 8}</div>
        )}
      </div>

      {/* Opponent's play area */}
      <PlayArea
        playArea={playArea}
        playerName={name}
        score={score}
        isCurrentPlayer={false}
        onGubClick={onGubSelect}
        selectedGubId={selectedGubId}
      />
    </div>
  );
}

PlayerBoard.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    hand: PropTypes.array,
    handCount: PropTypes.number,
    playArea: PropTypes.object,
    score: PropTypes.number,
    isConnected: PropTypes.bool
  }),
  isCurrentTurn: PropTypes.bool,
  onGubSelect: PropTypes.func,
  selectedGubId: PropTypes.string,
  isTargetable: PropTypes.bool
};

export default PlayerBoard;
