import { useState } from 'react';
import './Lobby.css';

function RoomCodeDisplay({ roomCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="room-code-display">
      <h2>Room Code</h2>
      <div className="room-code-container">
        <div className="room-code">{roomCode}</div>
        <button
          className="copy-button"
          onClick={handleCopy}
          aria-label="Copy room code"
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
      <p className="room-code-subtitle">Share this code with friends to join</p>
    </div>
  );
}

export default RoomCodeDisplay;
