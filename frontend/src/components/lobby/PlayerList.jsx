import './Lobby.css';

function PlayerList({ players, hostId, currentPlayerId }) {
  return (
    <div className="player-list">
      <h3>Players ({players.length})</h3>
      <div className="players">
        {players.map((player, index) => (
          <div
            key={player.id}
            className={`player-item ${player.id === currentPlayerId ? 'current-player' : ''}`}
          >
            <div className="player-info">
              <span className="player-name">
                {player.name}
                {player.id === hostId && <span className="host-badge">👑 Host</span>}
                {player.id === currentPlayerId && <span className="you-badge">(You)</span>}
              </span>
            </div>
            <div className="player-status">
              {player.isReady ? (
                <span className="ready-indicator">✓ Ready</span>
              ) : (
                <span className="not-ready-indicator">Not Ready</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PlayerList;