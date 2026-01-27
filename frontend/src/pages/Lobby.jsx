import { useEffect, useState, useRef } from 'react';
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
  const hasJoined = useRef(false);

  // Listen for game:joined and error events (separate from emit to survive strict mode cleanup)
  useEffect(() => {
    if (!connected) return;

    const handleGameJoined = (data) => {
      console.log('Game joined successfully:', data);
      setPlayer({
        playerId: data.playerId,
        playerName: playerName,
        isHost: data.game.players[0]?.id === data.playerId
      });

      dispatch({ type: 'GAME_STATE_UPDATE', payload: data.game });
      setLoading(false);
    };

    const handleError = (data) => {
      console.error('Error from server:', data);
      setError(data.message || 'Failed to join game');
      setLoading(false);
    };

    const handlePlayerJoined = (data) => {
      console.log('Player joined:', data);
      dispatch({ type: 'GAME_STATE_UPDATE', payload: data.game });
    };

    const handlePlayerReady = (data) => {
      console.log('Player ready status changed:', data);
      dispatch({ type: 'GAME_STATE_UPDATE', payload: data.game });
    };

    on('game:joined', handleGameJoined);
    on('error', handleError);
    on('player:joined', handlePlayerJoined);
    on('player:ready', handlePlayerReady);

    return () => {
      off('game:joined', handleGameJoined);
      off('error', handleError);
      off('player:joined', handlePlayerJoined);
      off('player:ready', handlePlayerReady);
    };
  }, [connected, playerName, dispatch, setPlayer, on, off]);

  // Join or register with room when component mounts
  useEffect(() => {
    if (!connected || !playerName) {
      return;
    }

    // Prevent double-joining (React Strict Mode runs effects twice)
    if (hasJoined.current) {
      return;
    }
    hasJoined.current = true;

    // If we already have playerId (host created game via REST), we just need to register socket
    if (playerId && gameId) {
      console.log('Host registering socket with room:', roomCode);
      emit('game:join', { roomCode, playerName });
      // Don't wait for response - we already have the game state
      setLoading(false);
    } else {
      // Joining player - need to wait for game:joined response
      console.log('Attempting to join room:', roomCode, 'as', playerName);
      emit('game:join', { roomCode, playerName });
    }
  }, [connected, playerName, roomCode, playerId, gameId, emit]);

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

  // Redirect to home if no player name
  useEffect(() => {
    if (!playerName) {
      navigate('/');
    }
  }, [playerName, navigate]);

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

  // If no player name, useEffect will redirect - just return null during redirect
  if (!playerName) {
    return null;
  }

  if (loading) {
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