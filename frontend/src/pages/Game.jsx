import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { usePlayer } from '../contexts/PlayerContext';
import ForestBackground from '../components/ForestBackground';
import ForestParticles from '../components/ForestParticles';
import Hand from '../components/game/Hand';
import PlayArea from '../components/game/PlayArea';
import PlayerBoard from '../components/game/PlayerBoard';
import './Game.css';

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { connected, emit, on, off } = useSocket();
  const { players, currentPlayerIndex, turnNumber, drawnLetters, deck, dispatch } = useGame();
  const { playerId, hand, playArea, dispatch: playerDispatch } = usePlayer();

  const [selectedCard, setSelectedCard] = useState(null);
  const [targetingMode, setTargetingMode] = useState(null); // null | 'own-gub' | 'opponent-gub' | 'player'
  const [selectedTarget, setSelectedTarget] = useState(null); // { playerId?, gubInstanceId? }
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [gameLog, setGameLog] = useState([]);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [gameOver, setGameOver] = useState(null);

  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const myPlayerData = players.find(p => p.id === playerId);
  const opponents = players.filter(p => p.id !== playerId);

  // Request game state on mount
  useEffect(() => {
    if (connected && gameId) {
      emit('game:getState', { gameId });
    }
  }, [connected, gameId, emit]);

  const showNotification = useCallback((msg, type = 'info') => {
    setNotification({ msg, type });
    const timer = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const addLog = useCallback((msg) => {
    setGameLog(prev => [...prev.slice(-29), msg]);
  }, []);

  // Socket event listeners
  useEffect(() => {
    const handleCardDrawn = (data) => {
      // PlayerContext already updates hand; just track that we drew
      setHasDrawnCard(true);
      if (data.isLetter) {
        showNotification(`You drew the letter "${data.card?.name}"!`, 'warning');
      } else if (data.isEvent) {
        showNotification(`Event card: ${data.card?.name}`, 'info');
        addLog(`You triggered event: ${data.card?.name}`);
      }
    };

    const handleGameCardDrawn = (data) => {
      if (data.isLetter) {
        addLog(`${data.playerName} drew letter "${data.card?.name}"!`);
      } else if (data.isEvent) {
        addLog(`${data.playerName} drew event: ${data.card?.name}`);
      } else {
        addLog(`${data.playerName} drew a card (${data.cardsRemaining} left in deck)`);
      }
    };

    const handleLetterDrawn = (data) => {
      showNotification(
        `Letter "${data.letter}" drawn! [${data.drawnLetters.join(' ')}]`,
        'warning'
      );
    };

    const handleCardPlayed = (data) => {
      addLog(`${data.playerName} played ${data.card.name}`);
    };

    const handleTurnChanged = (data) => {
      setHasDrawnCard(false);
      setSelectedCard(null);
      setTargetingMode(null);
      setSelectedTarget(null);
      if (data.currentPlayerId === playerId) {
        showNotification("It's your turn!", 'success');
      } else {
        addLog(`Turn ${data.turnNumber}: ${data.currentPlayerName}'s turn`);
      }
    };

    const handleGameEnded = (data) => {
      setGameOver(data);
    };

    const handleError = (data) => {
      setError(data.message);
      const timer = setTimeout(() => setError(null), 3500);
      return () => clearTimeout(timer);
    };

    on('card:drawn', handleCardDrawn);
    on('game:cardDrawn', handleGameCardDrawn);
    on('letter:drawn', handleLetterDrawn);
    on('card:played', handleCardPlayed);
    on('turn:changed', handleTurnChanged);
    on('game:ended', handleGameEnded);
    on('error', handleError);

    return () => {
      off('card:drawn', handleCardDrawn);
      off('game:cardDrawn', handleGameCardDrawn);
      off('letter:drawn', handleLetterDrawn);
      off('card:played', handleCardPlayed);
      off('turn:changed', handleTurnChanged);
      off('game:ended', handleGameEnded);
      off('error', handleError);
    };
  }, [on, off, playerId, addLog, showNotification]);

  const handleDrawCard = () => {
    if (!isMyTurn || hasDrawnCard) return;
    emit('game:drawCard', { gameId, playerId });
  };

  const handleCardClick = (card) => {
    // Deselect if clicking same card
    if (selectedCard?.instanceId === card.instanceId) {
      setSelectedCard(null);
      setTargetingMode(null);
      setSelectedTarget(null);
      return;
    }

    setSelectedCard(card);
    setSelectedTarget(null);

    // Set targeting mode based on card type
    switch (card.type) {
      case 'Barricade':
        setTargetingMode('own-gub');
        break;
      case 'Trap':
        setTargetingMode('opponent-gub');
        break;
      case 'Tool':
      case 'Hazard':
        setTargetingMode('player');
        break;
      default:
        // Gubs, Interrupts — no targeting needed
        setTargetingMode(null);
    }
  };

  const handleGubClick = (gub, ownerId) => {
    if (!selectedCard || !targetingMode) return;
    if (targetingMode === 'own-gub' && ownerId === playerId) {
      setSelectedTarget({ playerId: ownerId, gubInstanceId: gub.instanceId });
    } else if (targetingMode === 'opponent-gub' && ownerId !== playerId) {
      setSelectedTarget({ playerId: ownerId, gubInstanceId: gub.instanceId });
    }
  };

  const handlePlayerTargetClick = (targetPlayerId) => {
    if (!selectedCard || targetingMode !== 'player') return;
    setSelectedTarget({ playerId: targetPlayerId });
  };

  const handlePlayCard = () => {
    if (!selectedCard) return;

    if (targetingMode && !selectedTarget) {
      setError('Select a target first');
      setTimeout(() => setError(null), 2000);
      return;
    }

    emit('game:playCard', {
      gameId,
      playerId,
      cardId: selectedCard.id,
      target: selectedTarget,
    });

    setSelectedCard(null);
    setTargetingMode(null);
    setSelectedTarget(null);
  };

  const handleEndTurn = () => {
    if (!isMyTurn) return;
    if (hand.length > 8) {
      setError('Discard down to 8 cards before ending your turn');
      setTimeout(() => setError(null), 3000);
      return;
    }
    emit('game:endTurn', { gameId, playerId });
  };

  // ── Redirect if not in a game ──
  if (!playerId) {
    navigate('/');
    return null;
  }

  // ── Game Over Screen ──
  if (gameOver) {
    const winnerName = gameOver.winner?.name;
    const isWinner = gameOver.finalScores?.find(s => s.playerName === winnerName)?.playerId === playerId;

    return (
      <>
        <ForestBackground />
        <div className="game-container">
          <div className="game-over-screen">
            <div className="game-over-title">{isWinner ? '🏆 You Win!' : 'Game Over'}</div>
            <div className="game-over-winner">Winner: {winnerName}</div>
            <div className="final-scores">
              {(gameOver.finalScores || [])
                .sort((a, b) => b.score - a.score)
                .map(s => (
                  <div
                    key={s.playerId}
                    className={`score-row ${s.playerName === winnerName ? 'winner' : ''}`}
                  >
                    <span className="score-name">{s.playerName}</span>
                    <span className="score-value">{s.gubs} Gubs</span>
                  </div>
                ))}
            </div>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Return Home
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Loading ──
  if (players.length === 0) {
    return (
      <>
        <ForestBackground />
        <div className="game-container">
          <div className="game-loading">Loading game…</div>
        </div>
      </>
    );
  }

  const needsDiscard = hand.length > 8;

  return (
    <>
      <ForestBackground />
      <ForestParticles />

      {notification && (
        <div className={`game-notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {error && (
        <div className="game-notification error">
          {error}
        </div>
      )}

      <div className="game-container">

        {/* Header */}
        <header className="game-header">
          <div className="header-turn">
            <span className="turn-number">Turn {turnNumber}</span>
            <span className={`turn-status ${isMyTurn ? 'my-turn' : ''}`}>
              {isMyTurn ? 'Your Turn' : `${currentPlayer?.name ?? '…'}'s Turn`}
            </span>
          </div>

          <div className="header-letters">
            {['G', 'U', 'B'].map(letter => (
              <span
                key={letter}
                className={`letter-token ${drawnLetters.includes(letter) ? 'drawn' : ''}`}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="header-deck">
            <span className="deck-count">{deck?.cardsRemaining ?? '?'}</span>
            <span className="deck-label">in deck</span>
          </div>
        </header>

        {/* Opponents */}
        {opponents.length > 0 && (
          <section className="opponents-section">
            {opponents.map(opp => (
              <PlayerBoard
                key={opp.id}
                player={opp}
                isCurrentTurn={opp.isCurrentTurn}
                isTargetable={targetingMode === 'player'}
                onPlayerClick={() => handlePlayerTargetClick(opp.id)}
                onGubClick={(gub) => handleGubClick(gub, opp.id)}
                targetingGubs={targetingMode === 'opponent-gub'}
                selectedGubInstanceId={
                  selectedTarget?.playerId === opp.id ? selectedTarget.gubInstanceId : null
                }
              />
            ))}
          </section>
        )}

        {/* My Play Area */}
        <section className="my-area">
          <div className="my-area-header">
            <span className="my-area-label">Your Play Area</span>
            <span className="my-score">{myPlayerData?.score ?? 0} Gubs</span>
          </div>
          <PlayArea
            playArea={myPlayerData?.playArea || playArea}
            onGubClick={(gub) => handleGubClick(gub, playerId)}
            targetingMode={targetingMode === 'own-gub'}
            selectedGubInstanceId={
              selectedTarget?.playerId === playerId ? selectedTarget.gubInstanceId : null
            }
          />
        </section>

        {/* Action Bar */}
        <div className="action-bar">
          <button
            className={`btn-action draw-btn ${!isMyTurn || hasDrawnCard ? 'disabled' : 'active'}`}
            onClick={handleDrawCard}
            disabled={!isMyTurn || hasDrawnCard}
          >
            {hasDrawnCard ? 'Card Drawn ✓' : 'Draw Card'}
          </button>

          {selectedCard ? (
            <div className="play-card-group">
              <div className="selected-info">
                <span className="selected-name">{selectedCard.name}</span>
                {targetingMode && !selectedTarget && (
                  <span className="target-hint">
                    {targetingMode === 'own-gub' && '← click your free Gub'}
                    {targetingMode === 'opponent-gub' && '← click opponent Gub'}
                    {targetingMode === 'player' && '← click opponent'}
                  </span>
                )}
              </div>
              <button
                className={`btn-action play-btn ${targetingMode && !selectedTarget ? 'disabled' : 'active'}`}
                onClick={handlePlayCard}
                disabled={!!targetingMode && !selectedTarget}
              >
                Play
              </button>
              <button
                className="btn-action cancel-btn"
                onClick={() => {
                  setSelectedCard(null);
                  setTargetingMode(null);
                  setSelectedTarget(null);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            needsDiscard && (
              <span className="discard-warning">
                Select a card to discard (hand {'>'} 8)
              </span>
            )
          )}

          <button
            className={`btn-action end-turn-btn ${!isMyTurn || needsDiscard ? 'disabled' : 'active'}`}
            onClick={handleEndTurn}
            disabled={!isMyTurn || needsDiscard}
          >
            End Turn
          </button>
        </div>

        {/* My Hand */}
        <Hand
          cards={hand}
          onCardClick={handleCardClick}
          selectedCardId={selectedCard?.instanceId}
          isMyTurn={isMyTurn || needsDiscard}
        />

        {/* Game Log */}
        {gameLog.length > 0 && (
          <div className="game-log">
            {gameLog.slice(-5).reverse().map((msg, i) => (
              <div key={i} className={`log-entry ${i === 0 ? 'latest' : ''}`}>
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Game;
