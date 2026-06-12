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
    <div className="card">
      <div className="card-title">The squad · 20 players</div>
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
  )
}
