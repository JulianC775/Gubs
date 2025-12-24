import '../App.css';

/**
 * GameCard Component
 * Displays game information in a styled card format
 * @param {Object} props - Component props
 * @param {Object} props.game - Game object from API
 */
function GameCard({ game }) {
  // Format the created date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Capitalize status
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="game-card">
      <div className="room-code-section">
        <h2>Room Code</h2>
        <div className="room-code">{game.roomCode}</div>
        <p className="room-code-subtitle">Share this code with other players to join</p>
      </div>

      <div className="game-details">
        <div className="detail-row">
          <span className="label">Game ID:</span>
          <span className="value">{game.id}</span>
        </div>

        <div className="detail-row">
          <span className="label">Status:</span>
          <span className="value">{formatStatus(game.status)}</span>
        </div>

        <div className="detail-row">
          <span className="label">Players:</span>
          <span className="value">{game.players.length} / {game.maxPlayers}</span>
        </div>

        <div className="detail-row">
          <span className="label">Created:</span>
          <span className="value">{formatDate(game.createdAt)}</span>
        </div>

        {game.players.length > 0 && (
          <div className="players-section">
            <h3>Current Players</h3>
            <ul className="players-list">
              {game.players.map((player, index) => (
                <li key={player.id} className="player-item">
                  <span className="player-name">{player.name}</span>
                  {index === 0 && <span className="host-badge">Host</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default GameCard;
