import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(`✓ Connected - ${data.status}`))
      .catch(() => setBackendStatus('✗ Cannot connect to backend (make sure backend is running!)'))
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>🎮 Gubs Card Game</h1>
      <p style={{ fontSize: '20px', color: '#4CAF50' }}>Frontend is running!</p>
      <p style={{ fontSize: '18px' }}>
        Backend API URL: <code>{import.meta.env.VITE_API_URL}</code>
      </p>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
        Backend Status: <span style={{ color: backendStatus.includes('✓') ? 'green' : 'red' }}>{backendStatus}</span>
      </p>

      <hr style={{ margin: '40px auto', width: '50%' }} />

      <h2>✅ Setup Complete!</h2>
      <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
        <li>Frontend running on port 5174</li>
        <li>Folder structure created (components, pages, hooks, etc.)</li>
        <li>Environment variables configured</li>
        <li>Ready to start building!</li>
      </ul>
    </div>
  )
}

export default App
