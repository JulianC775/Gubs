import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import ForestBackground from '../components/ForestBackground';
import ForestParticles from '../components/ForestParticles';
import ForestDecorations from '../components/ForestDecorations';
import RoomCodeDisplay from '../components/lobby/RoomCodeDisplay';
import PlayerList from '../components/lobby/PlayerList';
import '../components/lobby/Lobby.css';

function Lobby() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { connected, emit, on, off } = useSocket();
  const { gameId, players, status, dispatch } = useGame();
  const { playerId, playerName, isReady, isHost, setPlayer, setReady } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);

  // Join game when component mounts
  useEffect(() => {
    if (!connected || !playerName) {
      return;
    }

    if (gameId && playerId) {
      // Already in game, just set loading to false
      setLoading(false);
      return;
    }

    // Join the game
    setJoining(true);
    console.log('Attempting to join room:', roomCode, 'as', playerName);

    const handleGameJoined = (data) => {
      console.log('Game joined successfully:', data);
      setPlayer({
        playerId: data.playerId,
        playerName: playerName,
        isHost: data.game.players[0]?.id === data.playerId
      });

      dispatch({ type: 'GAME_STATE_UPDATE', payload: data.game });
      setLoading(false);
      setJoining(false);
    };

    const handleError = (data) => {
      console.error('Error joining game:', data);
      setError(data.message || 'Failed to join game');
      setLoading(false);
      setJoining(false);
    };

    on('game:joined', handleGameJoined);
    on('error', handleError);

    emit('game:join', { roomCode, playerName });

    return () => {
      off('game:joined', handleGameJoined);
      off('error', handleError);
    };
  }, [connected, playerName, roomCode, gameId, playerId]);

  // Listen for game start
  useEffect(() => {
    const handleGameStarted = (data) => {
      console.log('Game started:', data);
      navigate(`/game/${data.game.id}`);
    };

    on('game:started', handleGameStarted);

    return () => {
      off('game:started', handleGameStarted);
    };
  }, [on, off, navigate]);

  const handleToggleReady = () => {
    if (!gameId || !playerId) return;

    const newReadyState = !isReady;
    setReady(newReadyState);
    emit('player:setReady', { gameId, playerId, isReady: newReadyState });
  };

  const handleStartGame = () => {
    if (!gameId || !playerId || !isHost) return;

    const readyCount = players.filter(p => p.isReady).length;
    if (readyCount < 2) {
      setError('Need at least 2 ready players to start');
      return;
    }

    emit('game:start', { gameId, playerId });
  };

  const handleLeave = () => {
    navigate('/');
  };

  if (!connected) {
    return (
      <>
        <ForestBackground />
        <div className="lobby-container">
          <div className="lobby-loading">
            <p>Connecting to server...</p>
          </div>
        </div>
      </>
    );
  }

  if (!playerName) {
    // Redirect to home if no player name
    navigate('/');
    return null;
  }

  if (loading || joining) {
    return (
      <>
        <ForestBackground />
        <ForestParticles />
        <ForestDecorations />
        <div className="lobby-container">
          <div className="lobby-loading">
            <p>Joining game...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ForestBackground />
        <ForestParticles />
        <ForestDecorations />
        <div className="lobby-container">
          <div className="lobby-error">
            <h3>Error</h3>
            <p>{error}</p>
            <button
              className="leave-button"
              onClick={handleLeave}
              style={{ marginTop: '1rem' }}
            >
              Return Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const canStartGame = isHost && players.filter(p => p.isReady).length >= 2;

  return (
    <>
      <ForestBackground />
      <ForestParticles />
      <ForestDecorations />

      <div className="lobby-container">
        <header className="lobby-header">
          <h1>Game Lobby</h1>
          <p className="lobby-subtitle">Waiting for players...</p>
        </header>

        <RoomCodeDisplay roomCode={roomCode} />

        <PlayerList
          players={players}
          hostId={players[0]?.id}
          currentPlayerId={playerId}
        />

        <div className="lobby-actions">
          {isHost && (
            <button
              className="start-game-button"
              onClick={handleStartGame}
              disabled={!canStartGame}
              title={!canStartGame ? 'Need at least 2 ready players' : ''}
            >
              Start Game
            </button>
          )}

          <button
            className={`ready-button ${isReady ? 'ready' : ''}`}
            onClick={handleToggleReady}
          >
            {isReady ? 'Not Ready' : 'Ready'}
          </button>

          <button
            className="leave-button"
            onClick={handleLeave}
          >
            Leave Lobby
          </button>
        </div>
      </div>
    </>
  );
}

export default Lobby;