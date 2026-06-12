import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { scorePick, getAvatarColor, initials } from '../lib/data'
import { FLAGS } from '../lib/schedule'
import PlayerProfile from './PlayerProfile'

export default function ResultsTab({ currentPlayer }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})
  const [tournamentPicks, setTournamentPicks] = useState({})
  const [viewingProfile, setViewingProfile] = useState(null)

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'), s => setPredictions(s.exists() ? Object.values(s.val()) : []))
    const u2 = onValue(ref(db, 'results'), s => setResults(s.exists() ? s.val() : {}))
    const u3 = onValue(ref(db, 'tournamentPicks'), s => setTournamentPicks(s.exists() ? s.val() : {}))
    return () => { u1(); u2(); u3() }
  }, [])

  if (viewingProfile) {
    return <PlayerProfile
      player={viewingProfile}
      predictions={predictions}
      results={results}
      tournamentPick={tournamentPicks[viewingProfile]}
      onBack={() => setViewingProfile(null)}
    />
  }

  const confirmedKeys = Object.keys(results)
  const myPicks = predictions.filter(p => p.player === currentPlayer.name)

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>📋 Results</div>
      </div>

      <div className="card" style={{ cursor: 'pointer' }} onClick={() => setViewingProfile(currentPlayer.name)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="avatar avatar-md" style={{ ...getAvatarColor(currentPlayer.name), background: getAvatarColor(currentPlayer.name).bg, color: getAvatarColor(currentPlayer.name).text }}>{initials(currentPlayer.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{currentPlayer.name}</div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>{myPicks.length} picks · Tap to view full profile</div>
          </div>
          <div style={{ fontSize: 18, color: '#adb5bd' }}>›</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Confirmed results ({confirmedKeys.length})</div>
        {confirmedKeys.length === 0
          ? <div className="empty"><div className="empty-icon">⏳</div><div className="empty-text">No results confirmed yet.</div></div>
          : confirmedKeys.map(k => {
              const r = results[k]
              // Show match breakdown — how did the group predict this?
              const matchPreds = predictions.filter(p => p.matchKey === k)
              const t1votes = matchPreds.filter(p => p.winner === r.t1).length
              const t2votes = matchPreds.filter(p => p.winner === r.t2).length
              const drawvotes = matchPreds.filter(p => p.winner === 'Draw').length
              return (
                <div key={k} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f1f3f5' }}>
                  <div className="result-item" style={{ border: 'none', padding: '0 0 8px' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {FLAGS[r.t1] || ''} {r.t1} <span className="result-score">{r.score1}–{r.score2}</span> {r.t2} {FLAGS[r.t2] || ''}
                      </div>
                      <div className="result-meta">Group {r.group} · {r.winner}</div>
                    </div>
                  </div>
                  {matchPreds.length > 0 && (
                    <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Group predicted</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {t1votes > 0 && <span style={{ fontSize: 11, background: '#e6f5e9', color: '#1a6b3c', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{r.t1}: {t1votes}</span>}
                        {drawvotes > 0 && <span style={{ fontSize: 11, background: '#f1f3f5', color: '#495057', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Draw: {drawvotes}</span>}
                        {t2votes > 0 && <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{r.t2}: {t2votes}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
      </div>

      <div className="card">
        <div className="card-title">Your picks ({myPicks.length})</div>
        {myPicks.length === 0
          ? <div className="empty"><div className="empty-icon">📭</div><div className="empty-text">No predictions yet.</div></div>
          : myPicks.slice().reverse().map((p, i) => {
              const result = results[p.matchKey]
              const base = result ? scorePick(p, result) : null
              const pts = base !== null ? base * (p.isBanker ? 2 : 1) : null
              return (
                <div key={i} className="pred-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pred-match">{p.isBanker ? '🏦 ' : ''}{p.t1} vs {p.t2} <span className="text-muted">Grp {p.group}</span></div>
                    <div className="pred-detail">{p.winner} · {p.score1}–{p.score2}</div>
                  </div>
                  {result
                    ? pts > 0 ? <span className="badge badge-correct">+{pts} pts{p.isBanker ? ' ×2' : ''}</span> : <span className="badge badge-wrong">0 pts</span>
                    : <span className="badge badge-pending">Pending</span>}
                </div>
              )
            })}
      </div>
    </div>
  )
}
