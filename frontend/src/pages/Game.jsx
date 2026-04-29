import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useGame } from '../contexts/GameContext';
import { usePlayer, clearSession } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import Hand from '../components/game/Hand';
import PlayArea from '../components/game/PlayArea';
import PlayerBoard from '../components/game/PlayerBoard';
import Card from '../components/game/Card';
import Deck from '../components/game/Deck';
import GameEndScreen from '../components/game/GameEndScreen';
import ForestBackground from '../components/ForestBackground';
import './Game.css';

const OPPONENT_GUB_CARDS = ['Spear', 'Lure', 'Super Lure', 'Smahl Thief'];

// Positions the drag overlay so the cursor sits at ~75% down the card —
// card floats above the finger/cursor like picking up a real card from the table.
function liftedCursorModifier({ activatorEvent, draggingNodeRect, transform }) {
  if (!draggingNodeRect || !activatorEvent) return transform;
  const cx = activatorEvent.clientX ?? activatorEvent.touches?.[0]?.clientX ?? 0;
  const cy = activatorEvent.clientY ?? activatorEvent.touches?.[0]?.clientY ?? 0;
  return {
    ...transform,
    x: transform.x + cx - draggingNodeRect.left - draggingNodeRect.width / 2,
    y: transform.y + cy - draggingNodeRect.top - draggingNodeRect.height * 0.75,
  };
}

function DroppableOwnArea({ children, className }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'own-play-area',
    data: { type: 'own-play-area' },
  });
  return (
    <div ref={setNodeRef} className={`${className}${isOver ? ' drop-over' : ''}`}>
      {children}
    </div>
  );
}

// What Cricket Song can mimic, grouped for the picker UI
const CRICKET_SONG_OPTIONS = [
  { name: 'Spear',      label: 'Spear — destroy barricade or kill Gub',  targeting: 'opponent-gub' },
  { name: 'Lure',       label: 'Lure — remove one barricade',             targeting: 'opponent-gub' },
  { name: 'Super Lure', label: 'Super Lure — remove one barricade',       targeting: 'opponent-gub' },
  { name: 'Smahl Thief',label: 'Smahl Thief — steal a Gub',               targeting: 'opponent-gub' },
  { name: 'Lightning',  label: 'Lightning — destroy Elder or hand',       targeting: 'Lightning'     },
  { name: 'Age Old Cure',label: 'Age Old Cure — rescue from discard',     targeting: null            },
  { name: 'Retreat',    label: 'Retreat — retrieve all your cards',       targeting: null            },
  { name: 'Flop Boat',  label: 'Flop Boat — redirect next Event',         targeting: null            },
];

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
  // When Cricket Song is selected, show picker; stores the chosen card name after pick
  const [cricketSongMode, setCricketSongMode] = useState(false);
  const [cricketSongChoice, setCricketSongChoice] = useState(null);
  const [ageOldCureMode, setAgeOldCureMode] = useState(false);
  const [discardPileCards, setDiscardPileCards] = useState([]);
  const [pendingEventInterrupt, setPendingEventInterrupt] = useState(null);
  const [privateResult, setPrivateResult] = useState(null); // Omen Beetle / Scout reveals
  const [error, setError] = useState(null);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null); // card being dragged (for DragOverlay)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const opponents = players.filter(p => p.id !== playerId);
  const myPlayerData = players.find(p => p.id === playerId);

  // Must discard down to 8 before ending turn
  const discardMode = isMyTurn && hand.length > 8;
  const discardCount = Math.max(0, hand.length - 8);

  const activeSelectedCard = discardMode ? null : selectedCard;
  const activeTargetingMode = discardMode ? null : targetingMode;
  const activePendingLightningTarget = discardMode ? null : pendingLightningTarget;
  const activeCricketSongMode = discardMode ? false : cricketSongMode;

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
      setCricketSongMode(false);
      setCricketSongChoice(null);
      setAgeOldCureMode(false);
      setDiscardPileCards([]);
    };

    const handleDiscardPile = (data) => {
      setDiscardPileCards(data.cards || []);
    };

    const handleEventPending = (data) => {
      setPendingEventInterrupt(data);
      // Auto-dismiss when window closes
      setTimeout(() => setPendingEventInterrupt(null), data.windowMs + 500);
    };

    const handleEventRedirected = () => {
      setPendingEventInterrupt(null);
    };

    const handlePrivateResult = (data) => {
      setPrivateResult(data);
      setTimeout(() => setPrivateResult(null), 8000);
    };

    const handleEventTriggered = (data) => {
      setActiveEvent(data);
      setTimeout(() => setActiveEvent(null), 4000);
    };

    on('error', handleError);
    on('turn:changed', handleTurnChanged);
    on('event:triggered', handleEventTriggered);
    on('game:discardPile', handleDiscardPile);
    on('event:pending', handleEventPending);
    on('event:redirected', handleEventRedirected);
    on('card:privateResult', handlePrivateResult);

    return () => {
      off('error', handleError);
      off('turn:changed', handleTurnChanged);
      off('event:triggered', handleEventTriggered);
      off('game:discardPile', handleDiscardPile);
      off('event:pending', handleEventPending);
      off('event:redirected', handleEventRedirected);
      off('card:privateResult', handlePrivateResult);
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
    setCricketSongChoice(null);

    if (card.name === 'Cricket Song') {
      setCricketSongMode(true);
      setAgeOldCureMode(false);
      setTargetingMode(null);
    } else if (card.name === 'Age Old Cure') {
      setCricketSongMode(false);
      setAgeOldCureMode(true);
      setTargetingMode(null);
      emit('game:getDiscardPile', { gameId });
    } else if (card.type === 'Barricade') {
      setCricketSongMode(false);
      setTargetingMode('Barricade');
    } else if (card.type === 'Trap' || OPPONENT_GUB_CARDS.includes(card.name)) {
      setCricketSongMode(false);
      setTargetingMode('opponent-gub');
    } else if (card.name === 'Lightning') {
      setCricketSongMode(false);
      setTargetingMode('Lightning');
    } else if (card.name === 'Cyclone' || card.name === 'Scout') {
      setCricketSongMode(false);
      setTargetingMode('player-target');
    } else {
      setCricketSongMode(false);
      setTargetingMode(null);
    }
  }, [isMyTurn, discardMode, selectedCard, emit, gameId]);

  const handlePlayCard = useCallback((target = null) => {
    if (!selectedCard || !isMyTurn) return;

    // Merge asCard into target when playing Cricket Song
    const finalTarget = cricketSongChoice
      ? { ...(target || {}), asCard: cricketSongChoice }
      : target;

    emit('game:playCard', {
      gameId,
      playerId,
      cardId: selectedCard.instanceId,
      target: finalTarget
    });

    setSelectedCard(null);
    setTargetingMode(null);
    setPendingLightningTarget(null);
    setCricketSongMode(false);
    setCricketSongChoice(null);
  }, [selectedCard, isMyTurn, gameId, playerId, emit, cricketSongChoice]);

  const cancelSelection = useCallback(() => {
    setSelectedCard(null);
    setTargetingMode(null);
    setPendingLightningTarget(null);
    setCricketSongMode(false);
    setCricketSongChoice(null);
    setAgeOldCureMode(false);
    setDiscardPileCards([]);
  }, []);

  const handleCricketSongPick = useCallback((option) => {
    setCricketSongMode(false);
    setCricketSongChoice(option.name);
    if (option.targeting === 'Lightning') {
      setTargetingMode('Lightning');
    } else if (option.targeting === 'opponent-gub') {
      setTargetingMode('opponent-gub');
    } else {
      // No target needed — play immediately
      setTargetingMode(null);
    }
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
    emit('game:endTurn', { gameId, playerId, didDraw: hasDrawnThisTurn });
  }, [isMyTurn, discardMode, gameId, playerId, emit, hasDrawnThisTurn]);

  const handleLeaveGame = useCallback(() => {
    clearSession();
    navigate('/');
  }, [navigate]);

  const handleDragStart = useCallback(({ active }) => {
    const card = active.data.current?.card;
    if (card) setDraggedCard(card);
  }, []);

  const handleDragEnd = useCallback(({ active, over }) => {
    setDraggedCard(null);
    if (!active.data.current?.card) return;

    const card = active.data.current.card;

    // In discard mode any drop discards the card
    if (discardMode) {
      handleDiscardCard(card);
      return;
    }

    if (!isMyTurn || !over) return;

    const zone = over.data.current;
    if (!zone) return;

    // Helper — plays immediately with selectedCard set to dragged card
    const playDirect = (target) => {
      emit('game:playCard', {
        gameId,
        playerId,
        cardId: card.instanceId,
        target,
      });
      cancelSelection();
    };

    if (zone.type === 'own-play-area') {
      // No-target cards: Gubs, Retreat, Feather, Haki Flute, Omen Beetle, Dangerous Alchemy
      const noTargetCards = ['Retreat', 'Feather', 'Haki Flute', 'Omen Beetle', 'Dangerous Alchemy'];
      if (card.type === 'Gub') { playDirect(null); return; }
      if (noTargetCards.includes(card.name)) { playDirect(null); return; }
      // Cards needing sub-choice: use click flow
      if (card.name === 'Cricket Song') { handleCardSelect(card); return; }
      if (card.name === 'Age Old Cure') { handleCardSelect(card); return; }
      // Barricades dropped on play area (no specific gub): enter targeting mode
      if (card.type === 'Barricade') { handleCardSelect(card); return; }
      return;
    }

    if (zone.type === 'own-gub') {
      if (card.type === 'Barricade') {
        setSelectedCard(card);
        playDirect({ playerId, gubId: zone.gub.instanceId || zone.gub.id });
      }
      return;
    }

    if (zone.type === 'opp-gub') {
      const needsOppGub = [...OPPONENT_GUB_CARDS, ...(card.type === 'Trap' ? [card.name] : [])];
      if (needsOppGub.includes(card.name) || card.type === 'Trap') {
        setSelectedCard(card);
        playDirect({ playerId: zone.playerId, gubId: zone.gub.instanceId || zone.gub.id });
      } else if (card.name === 'Spear') {
        setSelectedCard(card);
        playDirect({ playerId: zone.playerId, gubId: zone.gub.instanceId || zone.gub.id });
      }
      return;
    }

    if (zone.type === 'opponent-board') {
      if (card.name === 'Lightning') {
        // Set up action selection UI
        setSelectedCard(card);
        setTargetingMode('Lightning');
        setPendingLightningTarget({ playerId: zone.playerId });
        return;
      }
      if (card.name === 'Cyclone' || card.name === 'Scout') {
        setSelectedCard(card);
        playDirect({ playerId: zone.playerId });
        return;
      }
    }
  }, [discardMode, isMyTurn, emit, gameId, playerId, handleDiscardCard, handleCardSelect, cancelSelection, setSelectedCard, setTargetingMode, setPendingLightningTarget]);

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
      case 'player-target':
        return `Select a target player for ${activeSelectedCard?.name}`;
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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="game-page">
      <ForestBackground />

      {error && <div className="error-toast">{error}</div>}

      {/* Flop Boat interrupt window */}
      {pendingEventInterrupt && hand.some(c => c.name === 'Flop Boat') && (
        <div className="flop-boat-prompt">
          <div className="flop-boat-event">
            Event drawn: <strong>{pendingEventInterrupt.eventCard?.name}</strong>
          </div>
          <div className="flop-boat-message">You have Flop Boat! Redirect this event?</div>
          <button
            className="btn btn-primary"
            onClick={() => {
              const flopBoat = hand.find(c => c.name === 'Flop Boat');
              if (flopBoat) {
                emit('game:flopBoat', { gameId, playerId, cardId: flopBoat.instanceId });
                setPendingEventInterrupt(null);
              }
            }}
          >
            Play Flop Boat
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setPendingEventInterrupt(null)}>
            Let it happen
          </button>
        </div>
      )}

      {privateResult && (
        <div className="private-result-overlay">
          <button className="close-overlay" onClick={() => setPrivateResult(null)}>✕</button>
          {privateResult.type === 'peek' && (
            <>
              <div className="overlay-title">Omen Beetle — Top 3 cards in deck:</div>
              <div className="overlay-cards">
                {privateResult.cards.map((c, i) => (
                  <div key={i} className="overlay-card-item">
                    <strong>{c.name}</strong> <span className="card-type-badge">{c.type}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {privateResult.type === 'scout' && (
            <>
              <div className="overlay-title">Scout — Opponent&apos;s hand:</div>
              <div className="overlay-cards">
                {privateResult.hand.map((c, i) => (
                  <div key={i} className="overlay-card-item">
                    <strong>{c.name}</strong> <span className="card-type-badge">{c.type}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

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

          {/* Cricket Song picker modal */}
          {activeCricketSongMode && (
            <div className="cricket-song-picker">
              <div className="picker-title">Cricket Song — Choose what it represents:</div>
              <div className="picker-options">
                {CRICKET_SONG_OPTIONS.map(opt => (
                  <button
                    key={opt.name}
                    className="btn btn-cricket-option"
                    onClick={() => handleCricketSongPick(opt)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={cancelSelection}>Cancel</button>
            </div>
          )}

          {/* Age Old Cure — pick from discard pile */}
          {ageOldCureMode && isMyTurn && (
            <div className="age-old-cure-picker">
              <div className="picker-title">Age Old Cure — Choose a card to rescue from the discard pile:</div>
              {discardPileCards.length === 0 ? (
                <p className="picker-empty">Discard pile is empty</p>
              ) : (
                <div className="picker-options">
                  {discardPileCards.map((card) => (
                    <button
                      key={card.instanceId || card.id}
                      className="btn btn-age-old-cure-option"
                      onClick={() => {
                        handlePlayCard({ cardId: card.instanceId || card.id });
                        setAgeOldCureMode(false);
                      }}
                    >
                      {card.name} <span className="card-type-badge">{card.type}</span>
                    </button>
                  ))}
                </div>
              )}
              <button className="btn btn-secondary btn-sm" onClick={cancelSelection}>Cancel</button>
            </div>
          )}

          {isMyTurn && !discardMode && !activeCricketSongMode && !ageOldCureMode && (
            <div className="action-buttons">
              {/* No target needed — play immediately */}
              {activeSelectedCard && !activeTargetingMode && (
                <button className="btn btn-primary" onClick={() => handlePlayCard()}>
                  {cricketSongChoice
                    ? `Play Cricket Song as ${cricketSongChoice}`
                    : `Play ${activeSelectedCard.name}`}
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

          <DroppableOwnArea className="your-play-area">
            <PlayArea
              playArea={myPlayerData?.playArea || playArea}
              playerName="You"
              score={myPlayerData?.score || 0}
              isCurrentPlayer={true}
              onGubClick={activeTargetingMode === 'Barricade' ? handleOwnGubSelect : undefined}
              isTargetable={activeTargetingMode === 'Barricade'}
              isOwnArea={true}
              ownPlayerId={playerId}
            />
          </DroppableOwnArea>
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
                onPlayerClick={
                  (activeTargetingMode === 'Lightning' && !activePendingLightningTarget)
                    ? () => handleOpponentClick(opponent.id)
                    : activeTargetingMode === 'player-target'
                      ? () => handlePlayCard({ playerId: opponent.id })
                      : undefined
                }
                isTargetable={activeTargetingMode === 'opponent-gub'}
                isPlayerTargetable={
                  (activeTargetingMode === 'Lightning' && !activePendingLightningTarget) ||
                  activeTargetingMode === 'player-target'
                }
                isSelected={activePendingLightningTarget?.playerId === opponent.id}
              />
            ))}
          </div>
        </section>

      </main>
    </div>

    {/* Floating card that follows the cursor while dragging */}
    <DragOverlay modifiers={[liftedCursorModifier]} dropAnimation={null}>
      {draggedCard ? (
        <div className="drag-overlay-card">
          <Card card={draggedCard} isPlayable />
        </div>
      ) : null}
    </DragOverlay>
    </DndContext>
  );
}

export default Game;
