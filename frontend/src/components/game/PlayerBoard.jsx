import PropTypes from 'prop-types';
import PlayArea from './PlayArea';
import './PlayerBoard.css';

function PlayerBoard({
  player,
  isCurrentTurn,
  isTargetable,
  onPlayerClick,
  onGubClick,
  targetingGubs,
  selectedGubInstanceId,
}) {
  return (
    <div
      className={`player-board ${isCurrentTurn ? 'active-turn' : ''} ${isTargetable && !targetingGubs ? 'targetable' : ''}`}
      onClick={isTargetable && !targetingGubs ? onPlayerClick : undefined}
    >
      <div className="player-board-header">
        <div className="player-board-name">
          {player.name}
          {isCurrentTurn && <span className="active-turn-badge">Active</span>}
          {!player.isConnected && <span className="dc-badge">DC</span>}
        </div>
        <div className="player-board-stats">
          <span className="player-stat">{player.score} <small>Gubs</small></span>
          <span className="player-stat">{player.handCount} <small>cards</small></span>
        </div>
      </div>

      {player.handCount > 0 && (
        <div className="player-hand-display">
          {Array.from({ length: Math.min(player.handCount, 8) }).map((_, i) => (
            <div key={i} className="mini-card-back" />
          ))}
          {player.handCount > 8 && <span className="extra-cards">+{player.handCount - 8}</span>}
        </div>
      )}

      <PlayArea
        playArea={player.playArea}
        onGubClick={onGubClick}
        targetingMode={targetingGubs}
        selectedGubInstanceId={selectedGubInstanceId}
      />
    </div>
  );
}

PlayerBoard.propTypes = {
  player: PropTypes.object.isRequired,
  isCurrentTurn: PropTypes.bool,
  isTargetable: PropTypes.bool,
  onPlayerClick: PropTypes.func,
  onGubClick: PropTypes.func,
  targetingGubs: PropTypes.bool,
  selectedGubInstanceId: PropTypes.string,
};

export default PlayerBoard;
