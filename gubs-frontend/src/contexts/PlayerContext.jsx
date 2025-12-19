import { createContext, useContext, useReducer, useEffect } from 'react';
import { useSocket } from './SocketContext';

const PlayerContext = createContext(null);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};

// Player state reducer
const playerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLAYER':
      return {
        ...state,
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        isHost: action.payload.isHost || false
      };

    case 'SET_HAND':
      return {
        ...state,
        hand: action.payload
      };

    case 'HAND_UPDATE':
      return {
        ...state,
        hand: action.payload
      };

    case 'CARD_DRAWN':
      return {
        ...state,
        hand: [...state.hand, action.payload.card]
      };

    case 'CARD_PLAYED':
      return {
        ...state,
        hand: state.hand.filter(card => card.instanceId !== action.payload.cardId)
      };

    case 'SET_PLAY_AREA':
      return {
        ...state,
        playArea: action.payload
      };

    case 'UPDATE_PLAY_AREA':
      return {
        ...state,
        playArea: {
          ...state.playArea,
          ...action.payload
        }
      };

    case 'SET_READY':
      return {
        ...state,
        isReady: action.payload
      };

    case 'SET_SCORE':
      return {
        ...state,
        score: action.payload
      };

    case 'RESET_PLAYER':
      return initialPlayerState;

    default:
      return state;
  }
};

const initialPlayerState = {
  playerId: null,
  playerName: '',
  hand: [],
  playArea: {
    gubs: [],
    protectedGubs: [],
    trappedGubs: [],
    activeEffects: []
  },
  score: 0,
  isReady: false,
  isHost: false
};

export const PlayerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const { on, off } = useSocket();

  useEffect(() => {
    // Listen for hand updates
    const handleHandUpdate = (data) => {
      if (data.playerId === state.playerId) {
        dispatch({ type: 'HAND_UPDATE', payload: data.hand });
      }
    };

    const handleCardDrawn = (data) => {
      if (data.playerId === state.playerId && !data.isEvent) {
        dispatch({ type: 'CARD_DRAWN', payload: data });
      }
    };

    on('hand:update', handleHandUpdate);
    on('card:drawn', handleCardDrawn);

    return () => {
      off('hand:update', handleHandUpdate);
      off('card:drawn', handleCardDrawn);
    };
  }, [on, off, state.playerId]);

  const setPlayer = (playerData) => {
    dispatch({ type: 'SET_PLAYER', payload: playerData });
  };

  const setReady = (isReady) => {
    dispatch({ type: 'SET_READY', payload: isReady });
  };

  const value = {
    playerId: state.playerId,
    playerName: state.playerName,
    hand: state.hand,
    playArea: state.playArea,
    score: state.score,
    isReady: state.isReady,
    isHost: state.isHost,
    dispatch,
    setPlayer,
    setReady
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerContext;
