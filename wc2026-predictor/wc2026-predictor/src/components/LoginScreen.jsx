import { useState } from 'react'
import { PLAYERS, ADMIN_PIN } from '../lib/data'

export default function LoginScreen({ onLogin }) {
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('select') // 'select' | 'pin'

  function handleSelectPlayer(name) {
    setSelectedPlayer(name)
    setPin('')
    setError('')
    setStep('pin')
  }

  function handleAdminSelect() {
    setSelectedPlayer('__admin__')
    setPin('')
    setError('')
    setStep('pin')
  }

  function handleKey(k) {
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => checkPin(next), 120)
    }
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  function checkPin(enteredPin) {
    if (selectedPlayer === '__admin__') {
      if (enteredPin === ADMIN_PIN) {
        onLogin({ name: 'Admin', isAdmin: true })
      } else {
        setPin('')
        setError('Wrong PIN. Try again.')
      }
      return
    }
    const player = PLAYERS.find(p => p.name === selectedPlayer)
    if (player && enteredPin === player.pin) {
      onLogin({ name: player.name, isAdmin: false })
    } else {
      setPin('')
      setError('Wrong PIN. Try again.')
    }
  }

  if (step === 'select') {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">⚽</div>
          <h1 className="login-title">World Cup 2026</h1>
          <p className="login-sub">Predictor League — pick your name to continue</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
            {PLAYERS.map(p => (
              <button
                key={p.name}
                onClick={() => handleSelectPlayer(p.name)}
                style={{
                  padding: '11px 16px', background: '#F8F9FA', border: '1px solid #DEE2E6',
                  borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                  textAlign: 'left', color: '#212529', transition: 'all .12s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#E6F1FB'; e.currentTarget.style.borderColor = '#185FA5' }}
                onMouseOut={e => { e.currentTarget.style.background = '#F8F9FA'; e.currentTarget.style.borderColor = '#DEE2E6' }}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={handleAdminSelect}
              style={{
                padding: '10px 16px', background: 'transparent', border: '1px dashed #CED4DA',
                borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                color: '#6C757D', marginTop: 4
              }}
            >
              Admin access
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🔐</div>
        <h1 className="login-title">{selectedPlayer === '__admin__' ? 'Admin' : selectedPlayer}</h1>
        <p className="login-sub">Enter your 4-digit PIN</p>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}
        </div>

        <div className="pin-grid">
          {['1','2','3','4','5','6','7','8','9'].map(k => (
            <button key={k} className="pin-key" onClick={() => handleKey(k)}>{k}</button>
          ))}
          <button className="pin-key" onClick={() => { setStep('select'); setPin(''); setError('') }} style={{ fontSize: 13, color: '#6C757D' }}>Back</button>
          <button className="pin-key" onClick={() => handleKey('0')}>0</button>
          <button className="pin-key" onClick={handleDelete} style={{ fontSize: 18 }}>⌫</button>
        </div>

        <p className="pin-error">{error}</p>
      </div>
    </div>
  )
}
