import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import './Game.css';

function Game() {
  const { roomCode } = useParams();
  const { emit, on, off } = useSocket();
  const { players, currentPlayerIndex, turnNumber, drawnLetters, deck, status, winner } = useGame();
  const { playerId, playerName } = usePlayer();

  // TODO: Implement game logic

  return (
    <div className="game-page">
      {/* TODO: Build game UI */}
    </div>
  );
}

export default Game;
