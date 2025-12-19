import { useState } from 'react';
import './App.css';
import GameCard from './components/GameCard';
import { createGame } from './services/gameService';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [createdGame, setCreatedGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateGame = async () => {
    // Validate player name
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call API to create game
      const response = await createGame(playerName.trim());

      // Store the created game
      setCreatedGame(response.data.game);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && playerName.trim() && !loading) {
      handleCreateGame();
    }
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Gubs Card Game</h1>
        <p className="tagline">Build your colony, protect your Gubs</p>
      </header>

      {!createdGame ? (
        <section className="input-section">
          <input
            type="text"
            className="player-input"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoFocus
          />
          <button
            className="start-button"
            onClick={handleCreateGame}
            disabled={loading || !playerName.trim()}
          >
            {loading ? 'Creating Game...' : 'Start Game'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </section>
      ) : (
        <GameCard game={createdGame} />
      )}
    </div>
  );
}

export default App;
