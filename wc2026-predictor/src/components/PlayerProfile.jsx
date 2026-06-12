import { SCHEDULE } from '../lib/schedule'
import { matchKey as mkKey, scorePick, getAvatarColor, initials, computeStreaks } from '../lib/data'

function getAllGames() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => all.push({ ...g, dateStr }))
  })
  return all
}

export default function PlayerProfile({ player, predictions, results, tournamentPick, onBack }) {
  const allGames = getAllGames()
  const av = getAvatarColor(player)
  const myPicks = predictions.filter(p => p.player === player)
  const scored = myPicks.filter(p => results[p.matchKey])
  let totalPts = 0, correct = 0, exactScores = 0, bankerUsed = 0, bankerPts = 0
  const streaks = computeStreaks(predictions, results)
  const streak = streaks[player] || { current: 0, max: 0 }

  scored.forEach(p => {
    const base = scorePick(p, results[p.matchKey])
    const mult = p.isBanker ? 2 : 1
    totalPts += base * mult
    if (base >= 3) correct++
    if (base === 5) exactScores++
    if (p.isBanker) { bankerUsed++; bankerPts += base * 2 }
  })
  const acc = scored.length > 0 ? Math.round((correct / scored.length) * 100) : 0
  const ptsPerMatch = scored.length > 0 ? (totalPts / scored.length).toFixed(1) : '—'

  // Fav team backed most
  const teamCount = {}
  myPicks.forEach(p => { teamCount[p.winner] = (teamCount[p.winner] || 0) + 1 })
  delete teamCount['Draw']
  const favTeam = Object.entries(teamCount).sort((a,b) => b[1]-a[1])[0]?.[0] || '—'

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', marginBottom: 14 }}>← Back</button>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>👤 Player profile</div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="avatar avatar-lg" style={{ background: av.bg, color: av.text, margin: '0 auto 10px' }}>{initials(player)}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{player}</div>
        {tournamentPick && <div style={{ fontSize: 13, color: '#1a6b3c', fontWeight: 600 }}>🏆 Backing {tournamentPick} to win it all</div>}
        {streak.current >= 3 && <div style={{ marginTop: 6, fontSize: 13, color: '#e67e22', fontWeight: 700 }}>🔥 On a {streak.current}-game streak!</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total points', val: totalPts, color: '#1a6b3c' },
          { label: 'Accuracy', val: `${acc}%`, color: '#185FA5' },
          { label: 'Correct picks', val: correct, color: '#27500A' },
          { label: 'Exact scores', val: exactScores, color: '#c9a84c' },
          { label: 'Pts per match', val: ptsPerMatch, color: '#495057' },
          { label: 'Best streak', val: streak.max, color: '#e67e22' },
          { label: 'Favourite team', val: favTeam, color: '#185FA5' },
          { label: 'Banker pts', val: bankerPts, color: '#856404' },
        ].map(({ label, val, color }) => (
          <div key={label} className="metric-card" style={{ background: '#fff', border: '1px solid #e9ecef' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: 11, color: '#6c757d', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Recent picks ({myPicks.length})</div>
        {myPicks.length === 0
          ? <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No picks yet.</div></div>
          : myPicks.slice().reverse().slice(0, 10).map((p, i) => {
              const result = results[p.matchKey]
              const base = result ? scorePick(p, result) : null
              const pts = base !== null ? base * (p.isBanker ? 2 : 1) : null
              return (
                <div key={i} className="pred-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pred-match">{p.isBanker ? '🏦 ' : ''}{p.t1} vs {p.t2}</div>
                    <div className="pred-detail">{p.winner} · {p.score1}–{p.score2}</div>
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
