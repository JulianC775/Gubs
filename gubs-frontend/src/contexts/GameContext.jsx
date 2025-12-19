import { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};

// Game state reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'GAME_STATE_UPDATE':
      return {
        ...state,
        ...action.payload
      };

    case 'PLAYER_JOINED':
      return {
        ...state,
        players: action.payload.players
      };

    case 'PLAYER_LEFT':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload.playerId)
      };

    case 'PLAYER_READY':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId
            ? { ...p, isReady: action.payload.isReady }
            : p
        )
      };

    case 'GAME_STARTED':
      return {
        ...state,
        status: 'active',
        ...action.payload
      };

    case 'TURN_CHANGED':
      return {
        ...state,
        currentPlayerIndex: action.payload.currentPlayerIndex,
        turnNumber: action.payload.turnNumber
      };

    case 'GAME_ENDED':
      return {
        ...state,
        status: 'ended',
        winner: action.payload.winner,
        scores: action.payload.scores
      };

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
};

const initialGameState = {
  gameId: null,
  roomCode: null,
  status: 'lobby',
  players: [],
  currentPlayerIndex: 0,
  turnNumber: 1,
  drawnLetters: [],
  deck: { cardsRemaining: 0 },
  winner: null,
  scores: []
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const { on, off } = useSocket();

  useEffect(() => {
    // Listen for game state updates
    const handleGameStateUpdate = (game) => {
      dispatch({ type: 'GAME_STATE_UPDATE', payload: game });
    };

    const handlePlayerJoined = (data) => {
      dispatch({ type: 'PLAYER_JOINED', payload: data });
    };

    const handlePlayerLeft = (data) => {
      dispatch({ type: 'PLAYER_LEFT', payload: data });
    };

    const handlePlayerReady = (data) => {
      dispatch({ type: 'PLAYER_READY', payload: data });
    };

    const handleGameStarted = (data) => {
      dispatch({ type: 'GAME_STARTED', payload: data.game });
    };

    const handleTurnChanged = (data) => {
      dispatch({ type: 'TURN_CHANGED', payload: data });
    };

    const handleGameEnded = (data) => {
      dispatch({ type: 'GAME_ENDED', payload: data });
    };

    on('gameState:update', handleGameStateUpdate);
    on('player:joined', handlePlayerJoined);
    on('player:left', handlePlayerLeft);
    on('player:ready', handlePlayerReady);
    on('game:started', handleGameStarted);
    on('turn:changed', handleTurnChanged);
    on('game:ended', handleGameEnded);

    return () => {
      off('gameState:update', handleGameStateUpdate);
      off('player:joined', handlePlayerJoined);
      off('player:left', handlePlayerLeft);
      off('player:ready', handlePlayerReady);
      off('game:started', handleGameStarted);
      off('turn:changed', handleTurnChanged);
      off('game:ended', handleGameEnded);
    };
  }, [on, off]);

  const value = {
    gameId: state.gameId,
    roomCode: state.roomCode,
    status: state.status,
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    turnNumber: state.turnNumber,
    drawnLetters: state.drawnLetters,
    deck: state.deck,
    winner: state.winner,
    scores: state.scores,
    dispatch
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
