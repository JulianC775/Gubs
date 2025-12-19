import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SocketProvider } from './contexts/SocketContext'
import { GameProvider } from './contexts/GameContext'
import { PlayerProvider } from './contexts/PlayerContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SocketProvider>
      <GameProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </GameProvider>
    </SocketProvider>
  </StrictMode>,
)
