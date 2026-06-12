import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { getAvatarColor, initials, scorePick } from '../lib/data'

export default function ResultsTab({ currentPlayer }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'), s => setPredictions(s.exists() ? Object.values(s.val()) : []))
    const u2 = onValue(ref(db, 'results'), s => setResults(s.exists() ? s.val() : {}))
    return () => { u1(); u2() }
  }, [])

  const confirmedKeys = Object.keys(results)

  return (
    <div>
      <div className="card">
        <div className="card-title">Confirmed results ({confirmedKeys.length})</div>
        {confirmedKeys.length === 0
          ? <div className="empty"><div className="empty-icon">⏳</div><div className="empty-text">No results confirmed yet.</div></div>
          : confirmedKeys.map(k => {
              const r = results[k]
              return (
                <div key={k} className="result-item">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{r.t1} <span className="result-score">{r.score1}–{r.score2}</span> {r.t2}</div>
                    <div className="result-meta">Group {r.group} · {r.winner}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#ADB5BD' }}>
                    {predictions.filter(p => p.matchKey === k).length} picks
                  </div>
                </div>
              )
            })}
      </div>

      <div className="card">
        <div className="card-title">All predictions ({predictions.length})</div>
        {predictions.length === 0
          ? <div className="empty"><div className="empty-icon">📭</div><div className="empty-text">No predictions submitted yet.</div></div>
          : predictions.slice().reverse().map((p, i) => {
              const result = results[p.matchKey]
              const pts = result ? scorePick(p, result) : null
              const av = getAvatarColor(p.player)
              const isMe = p.player === currentPlayer.name
              return (
                <div key={i} className="pred-item">
                  <div className="avatar avatar-sm" style={{ background: av.bg, color: av.text }}>{initials(p.player)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? '#185FA5' : '#343A40' }}>{p.player}</div>
                    <div className="pred-detail">{p.t1} vs {p.t2} · {p.winner} · {p.score1}–{p.score2}</div>
                  </div>
                  {result
                    ? pts > 0 ? <span className="badge badge-correct">+{pts} pts</span> : <span className="badge badge-wrong">0 pts</span>
                    : <span className="badge badge-pending">Pending</span>}
                </div>
              )
            })}
      </div>
    </div>
  )
}
