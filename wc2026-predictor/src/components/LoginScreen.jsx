import { useState } from 'react'
import { PLAYERS, ADMIN_PIN } from '../lib/data'
import { getAvatarColor, initials } from '../lib/data'

export default function LoginScreen({ onLogin }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('select')

  function handleSelectPlayer(p) {
    setSelectedPlayer(p)
    setPin(''); setError(''); setStep('pin')
  }

  function handleKey(k) {
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) setTimeout(() => checkPin(next), 120)
  }

  function handleDelete() { setPin(p => p.slice(0, -1)); setError('') }

  function checkPin(entered) {
    if (selectedPlayer === '__admin__') {
      if (entered === ADMIN_PIN) { onLogin({ name: 'Admin', isAdmin: true }) }
      else { setPin(''); setError('Wrong PIN. Try again.') }
      return
    }
    if (entered === selectedPlayer.pin) { onLogin({ name: selectedPlayer.name, isAdmin: false }) }
    else { setPin(''); setError('Wrong PIN. Try again.') }
  }

  if (step === 'select') return (
    <div className="login-screen">
      <div className="login-emblem">🏆</div>
      <div className="login-card">
        <div className="login-subtitle">USA · Canada · Mexico</div>
        <div className="login-title">World Cup 2026</div>
        <div className="login-sub" style={{ marginTop: 4, marginBottom: 20 }}>Prediction League — pick your name</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 380, overflowY: 'auto' }}>
          {PLAYERS.map(p => {
            const av = getAvatarColor(p.name)
            return (
              <button key={p.name} className="player-btn" onClick={() => handleSelectPlayer(p)}>
                <div className="avatar avatar-sm" style={{ background: av.bg, color: av.text }}>{initials(p.name)}</div>
                {p.name}
              </button>
            )
          })}
          <button onClick={() => handleSelectPlayer('__admin__')} style={{
            padding: '10px 16px', background: 'transparent', border: '1.5px dashed #CED4DA',
            borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6C757D', marginTop: 4
          }}>
            ⚙️ Admin access
          </button>
        </div>
      </div>
    </div>
  )

  const name = selectedPlayer === '__admin__' ? 'Admin' : selectedPlayer.name
  const av = selectedPlayer !== '__admin__' ? getAvatarColor(selectedPlayer.name) : { bg: '#f1f3f5', text: '#495057' }

  return (
    <div className="login-screen">
      <div className="login-emblem">🔐</div>
      <div className="login-card">
        <div className="login-subtitle">Enter your PIN</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 4 }}>
          <div className="avatar avatar-lg" style={{ background: av.bg, color: av.text, marginBottom: 8 }}>{initials(name)}</div>
          <div className="login-title" style={{ fontSize: 18 }}>{name}</div>
        </div>
        <div className="pin-dots">
          {[0,1,2,3].map(i => <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />)}
        </div>
        <div className="pin-grid">
          {['1','2','3','4','5','6','7','8','9'].map(k => (
            <button key={k} className="pin-key" onClick={() => handleKey(k)}>{k}</button>
          ))}
          <button className="pin-key" onClick={() => { setStep('select'); setPin(''); setError('') }} style={{ fontSize: 12, color: '#6C757D', fontWeight: 600 }}>Back</button>
          <button className="pin-key" onClick={() => handleKey('0')}>0</button>
          <button className="pin-key" onClick={handleDelete} style={{ fontSize: 20 }}>⌫</button>
        </div>
        <p className="pin-error">{error}</p>
      </div>
    </div>
  )
}
