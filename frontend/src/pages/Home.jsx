import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ForestBackground from '../components/ForestBackground';
import ForestParticles from '../components/ForestParticles';
import ForestDecorations from '../components/ForestDecorations';
import { createGame } from '../services/gameService';
import { usePlayer } from '../contexts/PlayerContext';
import { useGame } from '../contexts/GameContext';
import '../App.css';

function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'create', 'join'

  const navigate = useNavigate();
  const { setPlayer } = usePlayer();
  const { dispatch: gameDispatch } = useGame();

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createGame(playerName.trim());
      const game = response.data.game;

      // Set player info
      setPlayer({
        playerId: game.players[0].id,
        playerName: playerName.trim(),
        isHost: true
      });

      // Set game state so Lobby knows we already joined
      gameDispatch({ type: 'GAME_STATE_UPDATE', payload: game });

      // Navigate to lobby
      navigate(`/lobby/${game.roomCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    // Store player name for lobby page
    setPlayer({
      playerName: playerName.trim(),
      isHost: false
    });

    // Navigate to lobby with room code
    navigate(`/lobby/${roomCode.toUpperCase()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && playerName.trim() && !loading) {
      if (mode === 'create') {
        handleCreateGame();
      } else if (mode === 'join' && roomCode.trim()) {
        handleJoinGame();
      }
    }
  };

  return (
    <>
      {/* Magical forest background layers */}
      <ForestBackground />
      <ForestParticles />
      <ForestDecorations />

      {/* Main content */}
      <div className="home-container">
        <header className="home-header">
          <h1>Gubs Card Game</h1>
          <p className="tagline">Build your colony, protect your Gubs</p>
        </header>

        <section className="input-section">
          {mode === 'select' ? (
            <>
              <h2>Welcome to Gubs!</h2>
              <button
                className="start-button"
                onClick={() => setMode('create')}
              >
                Create New Game
              </button>
              <button
                className="start-button"
                onClick={() => setMode('join')}
              >
                Join Existing Game
              </button>
            </>
          ) : (
            <>
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

              {mode === 'join' && (
                <input
                  type="text"
                  className="player-input"
                  placeholder="Enter room code (e.g., A1B2)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  maxLength={4}
                />
              )}

              <button
                className="start-button"
                onClick={mode === 'create' ? handleCreateGame : handleJoinGame}
                disabled={loading || !playerName.trim() || (mode === 'join' && !roomCode.trim())}
              >
                {loading
                  ? mode === 'create' ? 'Creating Game...' : 'Joining...'
                  : mode === 'create' ? 'Create Game' : 'Join Game'
                }
              </button>

              <button
                className="back-button"
                onClick={() => {
                  setMode('select');
                  setError(null);
                }}
                disabled={loading}
              >
                Back
              </button>

              {error && <p className="error-message">{error}</p>}
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default Home;
