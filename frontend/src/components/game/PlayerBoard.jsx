import PropTypes from 'prop-types';
import PlayArea from './PlayArea';
import Card from './Card';
import './PlayerBoard.css';

function PlayerBoard({
  player,
  isCurrentTurn = false,
  onGubSelect,
  onPlayerClick,
  selectedGubId = null,
  isTargetable = false,
  isPlayerTargetable = false,
  isSelected = false
}) {
  if (!player) return null;

  const {
    name,
    handCount = 0,
    playArea = { gubs: [], protectedGubs: [], trappedGubs: [] },
    score = 0,
    isConnected = true
  } = player;

  const boardClasses = [
    'player-board',
    isCurrentTurn ? 'current-turn' : '',
    !isConnected ? 'disconnected' : '',
    isTargetable ? 'targetable' : '',
    isPlayerTargetable ? 'player-targetable' : '',
    isSelected ? 'selected' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={boardClasses}
      onClick={isPlayerTargetable && onPlayerClick ? onPlayerClick : undefined}
      style={isPlayerTargetable ? { cursor: 'pointer' } : undefined}
    >
      <div className="player-board-header">
        <div className="player-info">
          <span className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? '●' : '○'}
          </span>
          <h3 className="player-name">{name}</h3>
          {isCurrentTurn && <span className="turn-indicator">◆ Their Turn</span>}
          {isPlayerTargetable && <span className="target-indicator">⚡ Click to target</span>}
          {isSelected && <span className="selected-indicator">✓ Selected</span>}
        </div>
        <div className="player-stats">
          <span className="hand-count" title="Cards in hand">🃏 {handCount}</span>
          <span className="score" title="Score">⭐ {score}</span>
        </div>
      </div>

      <div className="opponent-hand">
        {Array.from({ length: Math.min(handCount, 8) }).map((_, index) => (
          <div key={index} className="opponent-card-slot">
            <Card card={{ id: `hidden-${index}`, name: '', type: '' }} faceDown />
          </div>
        ))}
        {handCount > 8 && <div className="hand-overflow">+{handCount - 8}</div>}
      </div>

      <PlayArea
        playArea={playArea}
        playerName={name}
        score={score}
        isCurrentPlayer={false}
        onGubClick={onGubSelect}
        selectedGubId={selectedGubId}
        isTargetable={isTargetable}
      />
    </div>
  );
}

PlayerBoard.propTypes = {
  player: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    handCount: PropTypes.number,
    playArea: PropTypes.object,
    score: PropTypes.number,
    isConnected: PropTypes.bool
  }),
  isCurrentTurn: PropTypes.bool,
  onGubSelect: PropTypes.func,
  onPlayerClick: PropTypes.func,
  selectedGubId: PropTypes.string,
  isTargetable: PropTypes.bool,
  isPlayerTargetable: PropTypes.bool,
  isSelected: PropTypes.bool
};

export default PlayerBoard;
