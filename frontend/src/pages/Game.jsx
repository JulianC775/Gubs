import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { usePlayer, clearSession } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import Hand from '../components/game/Hand';
import PlayArea from '../components/game/PlayArea';
import PlayerBoard from '../components/game/PlayerBoard';
import Deck from '../components/game/Deck';
import GameEndScreen from '../components/game/GameEndScreen';
import ForestBackground from '../components/ForestBackground';
import './Game.css';

// Cards that require clicking an opponent's Gub
const OPPONENT_GUB_CARDS = ['Spear', 'Lure', 'Super Lure', 'Smahl Thief'];

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
  const { playerId, hand, playArea } = usePlayer();

  const [selectedCard, setSelectedCard] = useState(null);
  // 'Barricade' | 'opponent-gub' | 'Lightning' | null
  const [targetingMode, setTargetingMode] = useState(null);
  // After clicking an opponent in Lightning mode, hold their id for action selection
  const [pendingLightningTarget, setPendingLightningTarget] = useState(null);
  const [error, setError] = useState(null);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);

  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const opponents = players.filter(p => p.id !== playerId);
  const myPlayerData = players.find(p => p.id === playerId);

  // Must discard down to 8 before ending turn
  const discardMode = isMyTurn && hand.length > 8;
  const discardCount = Math.max(0, hand.length - 8);

  // When discardMode is active, selection state is effectively cleared in the UI
  // without needing to call setState (avoids sync setState in effect)
  const activeSelectedCard = discardMode ? null : selectedCard;
  const activeTargetingMode = discardMode ? null : targetingMode;
  const activePendingLightningTarget = discardMode ? null : pendingLightningTarget;

  // Socket event listeners
  useEffect(() => {
    const handleError = (data) => {
      if (data.message?.includes('not found') || data.message?.includes('Game not found')) {
        clearSession();
        navigate('/');
        return;
      }
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    };

    const handleTurnChanged = () => {
      setHasDrawnThisTurn(false);
      setSelectedCard(null);
      setTargetingMode(null);
      setPendingLightningTarget(null);
    };

    const handleEventTriggered = (data) => {
      setActiveEvent(data);
      setTimeout(() => setActiveEvent(null), 4000);
    };

    on('error', handleError);
    on('turn:changed', handleTurnChanged);
    on('event:triggered', handleEventTriggered);

    return () => {
      off('error', handleError);
      off('turn:changed', handleTurnChanged);
      off('event:triggered', handleEventTriggered);
    };
  }, [on, off, navigate]);

  // Rejoin game on mount
  useEffect(() => {
    if (gameId && playerId) {
      emit('game:rejoin', { gameId, playerId });
    } else if (!gameId || !playerId) {
      const timer = setTimeout(() => {
        if (!gameId || !playerId) navigate('/');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameId, playerId, emit, navigate]);

  const handleDrawCard = useCallback(() => {
    if (!isMyTurn || hasDrawnThisTurn) return;
    emit('game:drawCard', { gameId, playerId });
    setHasDrawnThisTurn(true);
  }, [isMyTurn, hasDrawnThisTurn, gameId, playerId, emit]);

  const handleDiscardCard = useCallback((card) => {
    if (!discardMode) return;
    emit('game:discardCard', { gameId, playerId, cardId: card.instanceId });
  }, [discardMode, gameId, playerId, emit]);

  const handleCardSelect = useCallback((card) => {
    if (!isMyTurn || discardMode) return;

    if (selectedCard?.instanceId === card.instanceId) {
      setSelectedCard(null);
      setTargetingMode(null);
      setPendingLightningTarget(null);
      return;
    }

    setSelectedCard(card);
    setPendingLightningTarget(null);

    if (card.type === 'Barricade') {
      setTargetingMode('Barricade');
    } else if (card.type === 'Trap' || OPPONENT_GUB_CARDS.includes(card.name)) {
      setTargetingMode('opponent-gub');
    } else if (card.name === 'Lightning') {
      setTargetingMode('Lightning');
    } else {
      setTargetingMode(null);
    }
  }, [isMyTurn, discardMode, selectedCard]);

  const handlePlayCard = useCallback((target = null) => {
    if (!selectedCard || !isMyTurn) return;

    emit('game:playCard', {
      gameId,
      playerId,
      cardId: selectedCard.instanceId,
      target
    });

    setSelectedCard(null);
    setTargetingMode(null);
    setPendingLightningTarget(null);
  }, [selectedCard, isMyTurn, gameId, playerId, emit]);

  const cancelSelection = useCallback(() => {
    setSelectedCard(null);
    setTargetingMode(null);
    setPendingLightningTarget(null);
  }, []);

  // Called when clicking an opponent's board (for Lightning targeting)
  const handleOpponentClick = useCallback((opponentId) => {
    if (targetingMode !== 'Lightning') return;
    setPendingLightningTarget({ playerId: opponentId });
  }, [targetingMode]);

  // Called when clicking an opponent's Gub
  const handleOpponentGubSelect = useCallback((opponent, gubData) => {
    if (targetingMode !== 'opponent-gub') return;
    handlePlayCard({ playerId: opponent.id, gubId: gubData.card.instanceId || gubData.card.id });
  }, [targetingMode, handlePlayCard]);

  // Called when clicking own Gub (for Barricade)
  const handleOwnGubSelect = useCallback((gubData) => {
    if (targetingMode !== 'Barricade') return;
    handlePlayCard({ playerId, gubId: gubData.card.instanceId || gubData.card.id });
  }, [targetingMode, playerId, handlePlayCard]);

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn || discardMode) return;
    emit('game:endTurn', { gameId, playerId });
  }, [isMyTurn, discardMode, gameId, playerId, emit]);

  const handleLeaveGame = useCallback(() => {
    clearSession();
    navigate('/');
  }, [navigate]);

  const getTargetingHint = () => {
    if (!activeSelectedCard) return null;
    switch (activeTargetingMode) {
      case 'Barricade':
        return `Select one of YOUR Gubs to protect with ${activeSelectedCard.name}`;
      case 'opponent-gub':
        return `Select a target Gub for ${activeSelectedCard.name}`;
      case 'Lightning':
        return activePendingLightningTarget
          ? 'Choose Lightning action:'
          : 'Select an opponent to strike with Lightning';
      default:
        return null;
    }
  };

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

      {error && <div className="error-toast">{error}</div>}

      {activeEvent && (
        <div className="event-notification">
          <div className="event-card-name">{activeEvent.eventCard?.name}</div>
          <div className="event-message">{activeEvent.result?.message}</div>
          <div className="event-player">Drawn by {activeEvent.drawingPlayerName}</div>
        </div>
      )}

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

      <main className="game-main">

        {/* YOUR SECTION */}
        <section className={`your-section ${discardMode ? 'discard-mode' : ''}`}>

          {discardMode && (
            <div className="discard-banner">
              Discard {discardCount} card{discardCount !== 1 ? 's' : ''} — click cards in your hand to discard them
            </div>
          )}

          {!discardMode && <div className="section-label">Your Cards</div>}

          <div className="your-hand-container">
            <Hand
              cards={hand}
              onCardClick={discardMode ? handleDiscardCard : handleCardSelect}
              selectedCardId={activeSelectedCard?.instanceId}
              isMyTurn={isMyTurn}
              discardMode={discardMode}
            />
          </div>

          {isMyTurn && !discardMode && (
            <div className="action-buttons">
              {/* No target needed — play immediately */}
              {activeSelectedCard && !activeTargetingMode && (
                <button className="btn btn-primary" onClick={() => handlePlayCard()}>
                  Play {activeSelectedCard.name}
                </button>
              )}

              {/* Targeting hint + cancel */}
              {activeTargetingMode && !activePendingLightningTarget && (
                <div className="targeting-hint">
                  {getTargetingHint()}
                  <button className="btn btn-secondary btn-sm" onClick={cancelSelection}>Cancel</button>
                </div>
              )}

              {/* Lightning action selection after picking a target player */}
              {activeTargetingMode === 'Lightning' && activePendingLightningTarget && (
                <div className="lightning-actions">
                  <span className="targeting-label">{getTargetingHint()}</span>
                  <button
                    className="btn btn-danger"
                    onClick={() => handlePlayCard({ playerId: activePendingLightningTarget.playerId, action: 'destroy-elder' })}
                  >
                    Destroy Esteemed Elder
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handlePlayCard({ playerId: activePendingLightningTarget.playerId, action: 'destroy-hand' })}
                  >
                    Destroy Entire Hand
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={cancelSelection}>Cancel</button>
                </div>
              )}

              <button className="btn btn-secondary" onClick={handleEndTurn}>
                End Turn
              </button>
            </div>
          )}

          <div className="your-play-area">
            <PlayArea
              playArea={myPlayerData?.playArea || playArea}
              playerName="You"
              score={myPlayerData?.score || 0}
              isCurrentPlayer={true}
              onGubClick={activeTargetingMode === 'Barricade' ? handleOwnGubSelect : undefined}
              isTargetable={activeTargetingMode === 'Barricade'}
            />
          </div>
        </section>

        <div className="section-divider">
          <Deck
            cardsRemaining={deck?.cardsRemaining || 0}
            drawnLetters={drawnLetters || []}
            discardPile={[]}
            onDrawCard={handleDrawCard}
            canDraw={isMyTurn && !hasDrawnThisTurn && !discardMode}
          />
        </div>

        {/* OPPONENTS SECTION */}
        <section className="opponents-section">
          <div className="section-label">Opponents</div>
          <div className="opponents-grid">
            {opponents.map(opponent => (
              <PlayerBoard
                key={opponent.id}
                player={opponent}
                isCurrentTurn={currentPlayer?.id === opponent.id}
                onGubSelect={activeTargetingMode === 'opponent-gub'
                  ? (gubData) => handleOpponentGubSelect(opponent, gubData)
                  : undefined}
                onPlayerClick={activeTargetingMode === 'Lightning' && !activePendingLightningTarget
                  ? () => handleOpponentClick(opponent.id)
                  : undefined}
                isTargetable={activeTargetingMode === 'opponent-gub'}
                isPlayerTargetable={activeTargetingMode === 'Lightning' && !activePendingLightningTarget}
                isSelected={activePendingLightningTarget?.playerId === opponent.id}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

export default Game;
