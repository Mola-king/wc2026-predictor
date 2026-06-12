import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { PLAYERS, getAvatarColor, initials, scorePick, computeStreaks } from '../lib/data'
import HeadToHead from './HeadToHead'

export default function LeaderboardTab({ currentPlayer }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})
  const [adminLocks, setAdminLocks] = useState({})
  const [h2hTarget, setH2hTarget] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'), s => { setPredictions(s.exists() ? Object.values(s.val()) : []); setLastUpdated(new Date()) })
    const u2 = onValue(ref(db, 'results'), s => { setResults(s.exists() ? s.val() : {}); setLastUpdated(new Date()) })
    const u3 = onValue(ref(db, 'adminLocks'), s => setAdminLocks(s.exists() ? s.val() : {}))
    return () => { u1(); u2(); u3() }
  }, [])

  const streaks = computeStreaks(predictions, results)

  const standings = PLAYERS.map(p => {
    const picks = predictions.filter(x => x.player === p.name)
    const scored = picks.filter(pk => results[pk.matchKey])
    let points = 0, correct = 0
    scored.forEach(pick => {
      const base = scorePick(pick, results[pick.matchKey])
      const multiplier = pick.isBanker ? 2 : 1
      points += base * multiplier
      if (base >= 3) correct++
    })
    const acc = scored.length > 0 ? Math.round((correct / scored.length) * 100) : 0
    const streak = streaks[p.name] || { current: 0, max: 0 }
    return { name: p.name, picks: picks.length, correct, points, acc, streak }
  }).sort((a, b) => b.points - a.points || b.picks - a.picks)

  const topScore = standings[0]?.points || 0

  if (h2hTarget) {
    return <HeadToHead
      me={currentPlayer.name}
      opponent={h2hTarget}
      predictions={predictions}
      results={results}
      adminLocks={adminLocks}
      onBack={() => setH2hTarget(null)}
    />
  }

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>🏆 Standings</div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card"><div className="metric-val">20</div><div className="metric-label">Players</div></div>
        <div className="metric-card"><div className="metric-val">{predictions.length}</div><div className="metric-label">Total picks</div></div>
        <div className="metric-card"><div className="metric-val">{Object.keys(results).length}</div><div className="metric-label">Results in</div></div>
        <div className="metric-card"><div className="metric-val" style={{ color: '#c9a84c' }}>{topScore}</div><div className="metric-label">Top score</div></div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Rankings</div>
          {lastUpdated && <span className="text-muted" style={{ fontSize: 10 }}>Live · {lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 36px 36px 52px', gap: 6, padding: '0 8px 8px', fontSize: 11, fontWeight: 700, color: '#ADB5BD', borderBottom: '1px solid #F1F3F5', marginBottom: 4 }}>
          <div>#</div><div>Player</div><div style={{ textAlign: 'center' }}>Picks</div><div style={{ textAlign: 'center' }}>✓</div><div style={{ textAlign: 'center' }}>Points</div>
        </div>
        {standings.map((s, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1
          const rankColor = i === 0 ? '#BA7517' : i === 1 ? '#5F5E5A' : i === 2 ? '#993C1D' : '#ADB5BD'
          const av = getAvatarColor(s.name)
          const isMe = s.name === currentPlayer.name
          const isLast = i === standings.length - 1
          const streakBadge = s.streak.current >= 3 ? `🔥 ${s.streak.current}` : null
          return (
            <div
              key={s.name}
              className={`lb-row ${isMe ? 'me' : ''}`}
              style={{ cursor: !isMe ? 'pointer' : 'default' }}
              onClick={() => { if (!isMe) setH2hTarget(s.name) }}
            >
              <div className="lb-rank" style={{ color: isLast && s.points === 0 ? '#6c757d' : rankColor }}>
                {isLast && s.points === 0 ? '🥄' : medal}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div className="avatar avatar-sm" style={{ background: av.bg, color: av.text }}>{initials(s.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="lb-name" style={isMe ? { color: '#1a6b3c', fontWeight: 800 } : {}}>
                    {s.name}{isMe ? ' 👈' : ''}
                  </div>
                  {streakBadge && <div style={{ fontSize: 10, color: '#e67e22', fontWeight: 700 }}>{streakBadge} streak</div>}
                </div>
              </div>
              <div className="lb-num">{s.picks}</div>
              <div className="lb-num">{s.correct}</div>
              <div className="lb-pts">{s.points}</div>
            </div>
          )
        })}
        <div style={{ fontSize: 11, color: '#ADB5BD', textAlign: 'center', marginTop: 10 }}>Tap a player to see head-to-head</div>
      </div>

      <div className="card">
        <div className="card-title">Scoring</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="flex-between"><span style={{ fontSize: 13 }}>✅ Correct winner or draw</span><span className="badge badge-correct">+3 pts</span></div>
          <div className="flex-between"><span style={{ fontSize: 13 }}>🎯 Exact scoreline bonus</span><span className="badge badge-pts">+2 pts</span></div>
          <div className="flex-between"><span style={{ fontSize: 13 }}>🏦 Banker pick (double)</span><span className="badge" style={{ background: '#fff3cd', color: '#856404' }}>×2</span></div>
          <div className="flex-between"><span style={{ fontSize: 13 }}>🏆 Tournament winner pick</span><span className="badge badge-pts">+10 pts</span></div>
          <div className="flex-between"><span style={{ fontSize: 13 }}>❌ Wrong result</span><span className="badge badge-wrong">0 pts</span></div>
        </div>
      </div>
    </div>
  )
}
