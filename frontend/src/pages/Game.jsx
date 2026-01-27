import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import Hand from '../components/game/Hand';
import PlayArea from '../components/game/PlayArea';
import PlayerBoard from '../components/game/PlayerBoard';
import Deck from '../components/game/Deck';
import GameEndScreen from '../components/game/GameEndScreen';
import ForestBackground from '../components/ForestBackground';
import './Game.css';

function Game() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { emit, on, off } = useSocket();
  const {
    gameId,
    players,
    currentPlayerIndex,
    turnNumber,
    drawnLetters,
    deck,
    status,
    winner,
    scores
  } = useGame();
  const { playerId, playerName, hand, playArea } = usePlayer();

  const [selectedCard, setSelectedCard] = useState(null);
  const [targetingMode, setTargetingMode] = useState(null);
  const [error, setError] = useState(null);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);

  // Get current player
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  // Get opponents (all players except current user)
  const opponents = players.filter(p => p.id !== playerId);

  // Get my player data from the game state
  const myPlayerData = players.find(p => p.id === playerId);

  // Handle socket events
  useEffect(() => {
    const handleError = (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    };

    const handleTurnChanged = () => {
      setHasDrawnThisTurn(false);
      setSelectedCard(null);
      setTargetingMode(null);
    };

    on('error', handleError);
    on('turn:changed', handleTurnChanged);

    return () => {
      off('error', handleError);
      off('turn:changed', handleTurnChanged);
    };
  }, [on, off]);

  // Rejoin game on mount if we have player info
  useEffect(() => {
    if (gameId && playerId) {
      emit('game:rejoin', { gameId, playerId });
    }
  }, [gameId, playerId, emit]);

  // Draw card handler
  const handleDrawCard = useCallback(() => {
    if (!isMyTurn || hasDrawnThisTurn) return;

    emit('game:drawCard', { gameId, playerId });
    setHasDrawnThisTurn(true);
  }, [isMyTurn, hasDrawnThisTurn, gameId, playerId, emit]);

  // Card selection handler
  const handleCardSelect = useCallback((card) => {
    if (!isMyTurn) return;

    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setTargetingMode(null);
    } else {
      setSelectedCard(card);

      // Check if card needs a target
      const needsTarget = ['Barricade', 'Trap', 'Tool'].includes(card.type) ||
                         ['Spear', 'Lure', 'Super Lure', 'Smahl Thief'].includes(card.name);

      if (needsTarget) {
        setTargetingMode(card.type);
      } else {
        setTargetingMode(null);
      }
    }
  }, [isMyTurn, selectedCard]);

  // Play card handler
  const handlePlayCard = useCallback((target = null) => {
    if (!selectedCard || !isMyTurn) return;

    emit('game:playCard', {
      gameId,
      playerId,
      cardId: selectedCard.id,
      target
    });

    setSelectedCard(null);
    setTargetingMode(null);
  }, [selectedCard, isMyTurn, gameId, playerId, emit]);

  // Target selection handler (for opponent gubs, etc.)
  const handleTargetSelect = useCallback((targetData) => {
    if (!targetingMode || !selectedCard) return;

    handlePlayCard({
      targetPlayerId: targetData.playerId,
      targetGubId: targetData.gubId
    });
  }, [targetingMode, selectedCard, handlePlayCard]);

  // End turn handler
  const handleEndTurn = useCallback(() => {
    if (!isMyTurn) return;

    if (hand.length > 8) {
      setError('You must discard down to 8 cards before ending your turn');
      return;
    }

    emit('game:endTurn', { gameId, playerId });
  }, [isMyTurn, hand.length, gameId, playerId, emit]);

  // Leave game handler
  const handleLeaveGame = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Render game ended screen
  if (status === 'ended') {
    return (
      <>
        <ForestBackground />
        <GameEndScreen
          winner={winner}
          scores={scores}
          currentPlayerId={playerId}
          onLeaveGame={handleLeaveGame}
        />
      </>
    );
  }

  return (
    <div className="game-page">
      <ForestBackground />

      {/* Error toast */}
      {error && (
        <div className="error-toast">
          {error}
        </div>
      )}

      {/* Game header */}
      <header className="game-header">
        <div className="game-info">
          <span className="room-code">Room: {roomCode}</span>
          <span className="turn-info">Turn {turnNumber}</span>
        </div>
        <div className="current-turn-indicator">
          {isMyTurn ? (
            <span className="your-turn">Your Turn</span>
          ) : (
            <span className="waiting">{currentPlayer?.name}&apos;s Turn</span>
          )}
        </div>
      </header>

      {/* Main game area */}
      <main className="game-main">
        {/* Opponents section */}
        <section className="opponents-section">
          {opponents.map(opponent => (
            <PlayerBoard
              key={opponent.id}
              player={opponent}
              isCurrentTurn={currentPlayer?.id === opponent.id}
              onGubSelect={targetingMode ? (gubData) => handleTargetSelect({
                playerId: opponent.id,
                gubId: gubData.card.id
              }) : undefined}
              isTargetable={targetingMode && ['Spear', 'Lure', 'Super Lure', 'Smahl Thief'].includes(selectedCard?.name)}
            />
          ))}
        </section>

        {/* Center section - deck and game state */}
        <section className="center-section">
          <Deck
            cardsRemaining={deck?.cardsRemaining || 0}
            drawnLetters={drawnLetters || []}
            discardPile={[]}
            onDrawCard={handleDrawCard}
            canDraw={isMyTurn && !hasDrawnThisTurn}
          />

          {/* Action buttons */}
          {isMyTurn && (
            <div className="action-buttons">
              {selectedCard && !targetingMode && (
                <button
                  className="btn btn-primary"
                  onClick={() => handlePlayCard()}
                >
                  Play {selectedCard.name}
                </button>
              )}
              {targetingMode && (
                <div className="targeting-hint">
                  Select a target for {selectedCard?.name}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSelectedCard(null);
                      setTargetingMode(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleEndTurn}
                disabled={hand.length > 8}
              >
                End Turn
              </button>
            </div>
          )}
        </section>

        {/* Your play area */}
        <section className="your-play-area">
          <PlayArea
            playArea={myPlayerData?.playArea || playArea}
            playerName={playerName}
            score={myPlayerData?.score || 0}
            isCurrentPlayer={true}
            onGubClick={targetingMode === 'Barricade' ? (gubData) => handleTargetSelect({
              playerId: playerId,
              gubId: gubData.card.id
            }) : undefined}
          />
        </section>
      </main>

      {/* Your hand */}
      <footer className="your-hand-section">
        <Hand
          cards={hand}
          onCardClick={handleCardSelect}
          selectedCardId={selectedCard?.id}
          isMyTurn={isMyTurn}
        />
      </footer>
    </div>
  );
}

export default Game;
