import PropTypes from 'prop-types';
import './GameEndScreen.css';

/**
 * GameEndScreen Component
 * Displays the winner and final scores when the game ends
 */
function GameEndScreen({
  winner,
  scores = [],
  currentPlayerId,
  onPlayAgain,
  onLeaveGame
}) {
  const isCurrentPlayerWinner = winner && winner.id === currentPlayerId;

  // Sort scores descending
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="game-end-overlay">
      <div className="game-end-screen">
        <div className="game-end-header">
          <h1 className="game-over-title">Game Over!</h1>
          {winner && (
            <div className={`winner-announcement ${isCurrentPlayerWinner ? 'you-won' : ''}`}>
              {isCurrentPlayerWinner ? (
                <>
                  <span className="trophy">🏆</span>
                  <h2>You Won!</h2>
                  <span className="trophy">🏆</span>
                </>
              ) : (
                <>
                  <span className="crown">👑</span>
                  <h2>{winner.name} Wins!</h2>
                </>
              )}
            </div>
          )}
        </div>

        <div className="final-scores">
          <h3>Final Scores</h3>
          <div className="scores-list">
            {sortedScores.map((playerScore, index) => (
              <div
                key={playerScore.playerId}
                className={`score-row ${playerScore.playerId === currentPlayerId ? 'current-player' : ''} ${index === 0 ? 'winner' : ''}`}
              >
                <span className="rank">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && `${index + 1}.`}
                </span>
                <span className="player-name">
                  {playerScore.name}
                  {playerScore.playerId === currentPlayerId && ' (You)'}
                </span>
                <span className="player-score">{playerScore.score} pts</span>
                <div className="score-details">
                  <span className="detail">Gubs: {playerScore.gubCount || 0}</span>
                  {playerScore.hasEsteemedElder && (
                    <span className="detail elder">👴 Esteemed Elder</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {winner && winner.tiebreaker && (
          <div className="tiebreaker-info">
            <p>Won by tiebreaker: {winner.tiebreaker}</p>
          </div>
        )}

        <div className="game-end-actions">
          {onPlayAgain && (
            <button className="btn btn-primary" onClick={onPlayAgain}>
              Play Again
            </button>
          )}
          {onLeaveGame && (
            <button className="btn btn-secondary" onClick={onLeaveGame}>
              Leave Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

GameEndScreen.propTypes = {
  winner: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    score: PropTypes.number,
    tiebreaker: PropTypes.string
  }),
  scores: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.string,
      name: PropTypes.string,
      score: PropTypes.number,
      gubCount: PropTypes.number,
      hasEsteemedElder: PropTypes.bool
    })
  ),
  currentPlayerId: PropTypes.string,
  onPlayAgain: PropTypes.func,
  onLeaveGame: PropTypes.func
};

export default GameEndScreen;
