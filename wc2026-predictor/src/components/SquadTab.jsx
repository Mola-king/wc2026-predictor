import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { PLAYERS, getAvatarColor, initials } from '../lib/data'

export default function SquadTab() {
  const [predictions, setPredictions] = useState([])
  useEffect(() => {
    const u = onValue(ref(db, 'predictions'), s => setPredictions(s.exists() ? Object.values(s.val()) : []))
    return () => u()
  }, [])

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
          👥 The squad
        </div>
      </div>
      <div className="card">
        <div className="card-title">20 players · World Cup 2026</div>
        <div className="squad-grid">
          {PLAYERS.map(p => {
            const count = predictions.filter(x => x.player === p.name).length
            const av = getAvatarColor(p.name)
            return (
              <div key={p.name} className="squad-card">
                <div className="avatar avatar-md" style={{ background: av.bg, color: av.text }}>{initials(p.name)}</div>
                <div className="squad-info">
                  <div className="squad-name">{p.name}</div>
                  <div className="squad-picks">{count} pick{count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
