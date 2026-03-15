import PropTypes from 'prop-types';
import './PlayArea.css';

function GubToken({ gub, onClick, isTargetable, isSelected }) {
  const status = gub.isTrapped ? 'trapped' : gub.isProtected ? 'protected' : 'free';

  return (
    <div
      className={`gub-token ${status} ${isTargetable ? 'targetable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={() => isTargetable && onClick && onClick(gub)}
      title={`${gub.name}${gub.isProtected ? ' (Protected)' : ''}${gub.isTrapped ? ' (Trapped)' : ''}`}
    >
      <span className="gub-token-name">{gub.name}</span>
      <div className="gub-token-badges">
        {gub.isProtected && <span className="gub-badge protected-badge">🛡</span>}
        {gub.isTrapped && <span className="gub-badge trapped-badge">🪤</span>}
        {gub.subtype === 'Elder' && <span className="gub-badge elder-badge">★</span>}
      </div>
    </div>
  );
}

function PlayArea({ playArea, onGubClick, targetingMode, selectedGubInstanceId }) {
  const { gubs = [], protectedGubs = [], trappedGubs = [] } = playArea || {};
  const isEmpty = gubs.length === 0 && protectedGubs.length === 0 && trappedGubs.length === 0;

  if (isEmpty) {
    return (
      <div className="play-area empty">
        <p className="play-area-empty-msg">No Gubs in play</p>
      </div>
    );
  }

  return (
    <div className="play-area">
      {gubs.length > 0 && (
        <div className="gub-group">
          <div className="gub-group-label">Free ({gubs.length})</div>
          <div className="gub-row">
            {gubs.map(gub => (
              <GubToken
                key={gub.instanceId}
                gub={gub}
                onClick={onGubClick}
                isTargetable={targetingMode}
                isSelected={selectedGubInstanceId === gub.instanceId}
              />
            ))}
          </div>
        </div>
      )}

      {protectedGubs.length > 0 && (
        <div className="gub-group">
          <div className="gub-group-label">Protected ({protectedGubs.length})</div>
          <div className="gub-row">
            {protectedGubs.map(gub => (
              <GubToken
                key={gub.instanceId}
                gub={gub}
                onClick={null}
                isTargetable={false}
                isSelected={false}
              />
            ))}
          </div>
        </div>
      )}

      {trappedGubs.length > 0 && (
        <div className="gub-group">
          <div className="gub-group-label">Trapped ({trappedGubs.length})</div>
          <div className="gub-row">
            {trappedGubs.map(gub => (
              <GubToken
                key={gub.instanceId}
                gub={gub}
                onClick={null}
                isTargetable={false}
                isSelected={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

PlayArea.propTypes = {
  playArea: PropTypes.shape({
    gubs: PropTypes.array,
    protectedGubs: PropTypes.array,
    trappedGubs: PropTypes.array,
  }),
  onGubClick: PropTypes.func,
  targetingMode: PropTypes.bool,
  selectedGubInstanceId: PropTypes.string,
};

export default PlayArea;
