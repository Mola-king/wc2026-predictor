import { useState, useEffect } from 'react'
import { ref, set, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { WC_TEAMS } from '../lib/data'
import { FLAGS } from '../lib/schedule'

export default function TournamentPick({ player, onToast }) {
  const [pick, setPick] = useState('')
  const [saved, setSaved] = useState(null)
  const [allPicks, setAllPicks] = useState({})
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const u1 = onValue(ref(db, 'tournamentPicks'), s => {
      const data = s.exists() ? s.val() : {}
      setAllPicks(data)
      if (data[player]) setSaved(data[player])
    })
    const u2 = onValue(ref(db, 'tournamentPicksLocked'), s => setLocked(s.exists() ? s.val() : false))
    return () => { u1(); u2() }
  }, [])

  async function savePick() {
    if (!pick) { onToast('Select a team first!', 'error'); return }
    await set(ref(db, `tournamentPicks/${player}`), pick)
    setSaved(pick)
    onToast(`🏆 ${pick} locked in to win the World Cup!`, 'success')
  }

  const groupedByTeam = {}
  Object.entries(allPicks).forEach(([name, team]) => {
    if (!groupedByTeam[team]) groupedByTeam[team] = []
    groupedByTeam[team].push(name)
  })
  const sortedTeams = Object.entries(groupedByTeam).sort((a, b) => b[1].length - a[1].length)

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>🏆 Tournament winner</div>
      </div>

      <div className="card">
        <div className="card-title">Who will lift the trophy?</div>
        <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Pick the team you think will win the entire World Cup. Correct = 10 bonus points. One pick per player, no changes once locked.</p>

        {saved ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{FLAGS[saved] || '⚽'}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a6b3c', marginBottom: 4 }}>{saved}</div>
            <span className="badge badge-correct">🔒 Locked in — 10 pts if they win!</span>
          </div>
        ) : locked ? (
          <div className="match-locked-msg">🔒 Tournament picks are now locked.</div>
        ) : (
          <>
            <div className="form-group">
              <div className="form-label">Select your team</div>
              <select className="form-control" value={pick} onChange={e => setPick(e.target.value)}>
                <option value="">— Choose a team —</option>
                {WC_TEAMS.map(t => <option key={t} value={t}>{FLAGS[t] || '⚽'} {t}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={savePick} style={{ background: 'linear-gradient(135deg,#c9a84c,#a07820)' }}>
              🏆 Lock in {pick || 'pick'}
            </button>
          </>
        )}
      </div>

      {sortedTeams.length > 0 && (
        <div className="card">
          <div className="card-title">Group predictions ({Object.keys(allPicks).length} picks made)</div>
          {sortedTeams.map(([team, names]) => (
            <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: 22 }}>{FLAGS[team] || '⚽'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{team}</div>
                <div style={{ fontSize: 11, color: '#6c757d' }}>{names.join(', ')}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ height: 8, background: '#1a6b3c', borderRadius: 4, width: `${names.length * 16}px`, maxWidth: 80 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a6b3c' }}>{names.length}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
