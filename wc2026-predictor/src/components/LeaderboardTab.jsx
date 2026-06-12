import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { PLAYERS, getAvatarColor, initials, scorePick } from '../lib/data'

export default function LeaderboardTab({ currentPlayer }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    const unsubPreds = onValue(ref(db, 'predictions'), snap => {
      setPredictions(snap.exists() ? Object.values(snap.val()) : [])
      setLastUpdated(new Date())
    })
    const unsubResults = onValue(ref(db, 'results'), snap => {
      setResults(snap.exists() ? snap.val() : {})
      setLastUpdated(new Date())
    })
    return () => { unsubPreds(); unsubResults() }
  }, [])

  const standings = PLAYERS.map(p => {
    const picks = predictions.filter(x => x.player === p.name)
    let points = 0, correct = 0
    picks.forEach(pick => {
      const result = results[pick.matchKey]
      if (result) {
        const pts = scorePick(pick, result)
        points += pts
        if (pts >= 3) correct++
      }
    })
    const accuracy = picks.length > 0 ? Math.round((correct / picks.filter(pk => results[pk.matchKey]).length || 0) * 100) || 0 : 0
    return { name: p.name, picks: picks.length, correct, points, accuracy }
  }).sort((a, b) => b.points - a.points || b.picks - a.picks)

  const totalPicks = predictions.length
  const totalResults = Object.keys(results).length
  const topScore = standings[0]?.points || 0

  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-val">20</div><div className="metric-label">Players</div></div>
        <div className="metric-card"><div className="metric-val">{totalPicks}</div><div className="metric-label">Total picks</div></div>
        <div className="metric-card"><div className="metric-val">{totalResults}</div><div className="metric-label">Results in</div></div>
        <div className="metric-card"><div className="metric-val" style={{ color: '#185FA5' }}>{topScore}</div><div className="metric-label">Top score</div></div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Standings</div>
          {lastUpdated && <span className="text-muted" style={{ fontSize: 11 }}>Live · {lastUpdated.toLocaleTimeString()}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 36px 36px 48px', gap: 8, padding: '0 10px 8px', fontSize: 11, fontWeight: 600, color: '#ADB5BD', borderBottom: '1px solid #F1F3F5', marginBottom: 6 }}>
          <div>#</div><div>Player</div><div style={{ textAlign: 'center' }}>Picks</div><div style={{ textAlign: 'center' }}>✓</div><div style={{ textAlign: 'center' }}>Points</div>
        </div>

        {standings.map((s, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1
          const rankColor = i === 0 ? '#BA7517' : i === 1 ? '#5F5E5A' : i === 2 ? '#993C1D' : '#ADB5BD'
          const av = getAvatarColor(s.name)
          const isMe = s.name === currentPlayer.name
          return (
            <div key={s.name} className="lb-row" style={isMe ? { background: '#E6F1FB', borderRadius: 10 } : {}}>
              <div className="lb-rank" style={{ color: rankColor }}>{medal}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div className="avatar avatar-sm" style={{ background: av.bg, color: av.text }}>{initials(s.name)}</div>
                <span className="lb-name" style={isMe ? { color: '#185FA5', fontWeight: 700 } : {}}>{s.name}{isMe ? ' (you)' : ''}</span>
              </div>
              <div className="lb-num">{s.picks}</div>
              <div className="lb-num">{s.correct}</div>
              <div className="lb-pts">{s.points}</div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-title">Scoring system</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="flex-between"><span style={{ fontSize: 13, color: '#495057' }}>Correct winner or draw</span><span className="badge badge-correct">+3 pts</span></div>
          <div className="flex-between"><span style={{ fontSize: 13, color: '#495057' }}>Exact scoreline</span><span className="badge badge-pts">+2 pts</span></div>
          <div className="flex-between"><span style={{ fontSize: 13, color: '#495057' }}>Wrong result</span><span className="badge badge-wrong">0 pts</span></div>
        </div>
      </div>
    </div>
  )
}
