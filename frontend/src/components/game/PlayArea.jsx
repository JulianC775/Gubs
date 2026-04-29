import PropTypes from 'prop-types';
import { useDroppable } from '@dnd-kit/core';
import Card from './Card';
import './PlayArea.css';

function DroppableGubSlot({ gubData, isOwnArea, opponentPlayerId, onGubClick, isTargetable, isSelected }) {
  const droppableId = isOwnArea
    ? `own-gub__${gubData.card.instanceId || gubData.card.id}`
    : `opp-gub__${opponentPlayerId}__${gubData.card.instanceId || gubData.card.id}`;

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: isOwnArea
      ? { type: 'own-gub', gub: gubData.card }
      : { type: 'opp-gub', playerId: opponentPlayerId, gub: gubData.card },
  });

  const status = gubData.status;
  const clickableClass = onGubClick ? 'clickable' : '';

  return (
    <div
      ref={setNodeRef}
      className={`gub-stack ${status} ${isSelected ? 'selected' : ''} ${clickableClass} ${isTargetable ? 'targetable' : ''} ${isOver ? 'drop-over' : ''}`}
      onClick={() => onGubClick && onGubClick(gubData)}
    >
      <div className="gub-card">
        <Card card={gubData.card} />
      </div>

      {gubData.protection && (
        <div className="protection-card">
          <Card card={gubData.protection} />
          <div className="card-label">Protected</div>
        </div>
      )}

      {gubData.trap && (
        <div className="trap-card">
          <Card card={gubData.trap} />
          <div className="card-label">Trapped</div>
        </div>
      )}

      <div className={`status-indicator ${status}`}>
        {status === 'free' && '✓ Free'}
        {status === 'protected' && '🛡️ Protected'}
        {status === 'trapped' && '⚠️ Trapped'}
        {status === 'protected-trapped' && '🛡️⚠️ Protected & Trapped'}
      </div>
    </div>
  );
}

function PlayArea({
  playArea = { gubs: [], protectedGubs: [], trappedGubs: [] },
  playerName = '',
  score = 0,
  isCurrentPlayer = false,
  onGubClick,
  selectedGubId = null,
  isTargetable = false,
  // Droppable config
  isOwnArea = false,
  ownPlayerId = null,
  opponentPlayerId = null,
}) {
  const { gubs = [], protectedGubs = [], trappedGubs = [] } = playArea;

  // Build unified gub map
  const allGubsMap = new Map();

  gubs.forEach(gub => {
    allGubsMap.set(gub.instanceId || gub.id, { card: gub, status: 'free', protection: null, trap: null });
  });

  protectedGubs.forEach(gub => {
    const protection = gub.protectionCards?.length > 0 ? gub.protectionCards[0] : null;
    allGubsMap.set(gub.instanceId || gub.id, { card: gub, status: 'protected', protection, trap: null });
  });

  trappedGubs.forEach(gub => {
    const key = gub.instanceId || gub.id;
    const existing = allGubsMap.get(key);
    if (existing) {
      existing.trap = gub.trapCard;
      existing.status = existing.protection ? 'protected-trapped' : 'trapped';
    } else {
      allGubsMap.set(key, { card: gub, status: 'trapped', protection: null, trap: gub.trapCard });
    }
  });

  const allGubs = Array.from(allGubsMap.values());

  if (allGubs.length === 0) {
    return (
      <div className={`play-area ${isCurrentPlayer ? 'current-player' : ''} ${isTargetable ? 'targetable' : ''}`}>
        <div className="play-area-header">
          <h3>{playerName}&apos;s Gubs</h3>
          <div className="score-display">Score: {score}</div>
        </div>
        <div className="no-gubs">
          <p>No Gubs in play yet</p>
          {isTargetable && <p className="target-hint">Drag or click a target Gub</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`play-area ${isCurrentPlayer ? 'current-player' : ''} ${isTargetable ? 'targetable' : ''}`}>
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
        <div className="target-instruction">Drag a card here or click a Gub to target it</div>
      )}

      <div className="gubs-container">
        {allGubs.map((gubData) => (
          <DroppableGubSlot
            key={gubData.card.instanceId || gubData.card.id}
            gubData={gubData}
            isOwnArea={isOwnArea}
            ownPlayerId={ownPlayerId}
            opponentPlayerId={opponentPlayerId}
            onGubClick={onGubClick}
            isTargetable={isTargetable}
            isSelected={selectedGubId === (gubData.card.instanceId || gubData.card.id)}
          />
        ))}
      </div>
    </div>
  );
}

PlayArea.propTypes = {
  playArea: PropTypes.shape({
    gubs: PropTypes.array,
    protectedGubs: PropTypes.array,
    trappedGubs: PropTypes.array,
  }),
  playerName: PropTypes.string,
  score: PropTypes.number,
  isCurrentPlayer: PropTypes.bool,
  onGubClick: PropTypes.func,
  selectedGubId: PropTypes.string,
  isTargetable: PropTypes.bool,
  isOwnArea: PropTypes.bool,
  ownPlayerId: PropTypes.string,
  opponentPlayerId: PropTypes.string,
};

export default PlayArea;
