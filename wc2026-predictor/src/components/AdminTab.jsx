import { useEffect, useState } from 'react'
import { ref, onValue, set, remove, push } from 'firebase/database'
import { db } from '../lib/firebase'
import { matchKey as mkKey } from '../lib/data'
import { SCHEDULE } from '../lib/schedule'

function getAllGames() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => all.push({ ...g, dateStr }))
  })
  return all
}

export default function AdminTab({ onToast }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})
  const [adminLocks, setAdminLocks] = useState({})
  const [scores, setScores] = useState({})
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [currentMsg, setCurrentMsg] = useState(null)
  const [tournamentPicksLocked, setTournamentPicksLocked] = useState(false)
  const [activeSection, setActiveSection] = useState('matches')

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'), s => setPredictions(s.exists() ? Object.values(s.val()) : []))
    const u2 = onValue(ref(db, 'results'), s => setResults(s.exists() ? s.val() : {}))
    const u3 = onValue(ref(db, 'adminLocks'), s => setAdminLocks(s.exists() ? s.val() : {}))
    const u4 = onValue(ref(db, 'adminMessage'), s => setCurrentMsg(s.exists() ? s.val() : null))
    const u5 = onValue(ref(db, 'tournamentPicksLocked'), s => setTournamentPicksLocked(s.exists() ? s.val() : false))
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [])

  const allGames = getAllGames().filter(g => !g.done)
  const byDate = {}
  allGames.forEach(g => {
    if (!byDate[g.dateStr]) byDate[g.dateStr] = []
    byDate[g.dateStr].push(g)
  })

  function getScoreState(key) { return scores[key] || { s1: '', s2: '' } }
  function setScore(key, field, val) { setScores(prev => ({ ...prev, [key]: { ...getScoreState(key), [field]: val } })) }

  async function toggleLock(key) {
    if (adminLocks[key]) { await remove(ref(db, `adminLocks/${key}`)); onToast('Match unlocked.', 'success') }
    else { await set(ref(db, `adminLocks/${key}`), true); onToast('Match locked — no more predictions.', 'success') }
  }

  async function confirmResult(key) {
    const sample = predictions.find(p => p.matchKey === key)
    if (!sample) { onToast('No picks for this match yet.', 'error'); return }
    const sc = getScoreState(key)
    const s1 = parseInt(sc.s1) || 0, s2 = parseInt(sc.s2) || 0
    const winner = s1 > s2 ? sample.t1 : s2 > s1 ? sample.t2 : 'Draw'
    await set(ref(db, `results/${key}`), { t1: sample.t1, t2: sample.t2, group: sample.group, score1: s1, score2: s2, winner })
    onToast(`Result saved: ${sample.t1} ${s1}–${s2} ${sample.t2}`, 'success')
  }

  async function confirmAllForDay(dateStr) {
    const games = byDate[dateStr] || []
    let confirmed = 0
    for (const g of games) {
      const key = mkKey(g)
      if (results[key]) continue
      const sc = getScoreState(key)
      if (sc.s1 === '' || sc.s2 === '') continue
      const s1 = parseInt(sc.s1) || 0, s2 = parseInt(sc.s2) || 0
      const winner = s1 > s2 ? g.t1 : s2 > s1 ? g.t2 : 'Draw'
      await set(ref(db, `results/${key}`), { t1: g.t1, t2: g.t2, group: g.group, score1: s1, score2: s2, winner })
      confirmed++
    }
    onToast(`${confirmed} result${confirmed !== 1 ? 's' : ''} confirmed for ${dateStr}.`, 'success')
  }

  async function deleteResult(key) { await remove(ref(db, `results/${key}`)); onToast('Result removed.', 'success') }

  async function sendBroadcast() {
    if (!broadcastMsg.trim()) { onToast('Enter a message first.', 'error'); return }
    await set(ref(db, 'adminMessage'), broadcastMsg.trim())
    setBroadcastMsg('')
    onToast('Message sent to all players!', 'success')
  }

  async function clearBroadcast() { await remove(ref(db, 'adminMessage')); onToast('Message cleared.', 'success') }

  async function resetAll() {
    if (!window.confirm('Delete ALL predictions, results and locks?')) return
    await remove(ref(db, 'predictions'))
    await remove(ref(db, 'results'))
    await remove(ref(db, 'adminLocks'))
    await remove(ref(db, 'tournamentPicks'))
    await remove(ref(db, 'adminMessage'))
    onToast('All data reset.', 'success')
  }

  const sections = [
    { id: 'matches', label: '⚽ Matches' },
    { id: 'broadcast', label: '📢 Broadcast' },
    { id: 'tournament', label: '🏆 Trophy pick' },
    { id: 'danger', label: '⚠️ Reset' },
  ]

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>⚙️ Admin panel</div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 20,
            border: `1.5px solid ${activeSection === s.id ? '#c9a84c' : 'rgba(255,255,255,.25)'}`,
            background: activeSection === s.id ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.08)',
            color: activeSection === s.id ? '#c9a84c' : 'rgba(255,255,255,.6)', cursor: 'pointer'
          }}>{s.label}</button>
        ))}
      </div>

      {activeSection === 'matches' && (
        <div className="card">
          <div className="card-title">Lock predictions & confirm results</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Matches auto-lock 1hr before kickoff. You can also manually toggle. Fill scores and confirm after full time.</p>
          {Object.entries(byDate).map(([dateStr, games]) => (
            <div key={dateStr}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 6px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ADB5BD', textTransform: 'uppercase', letterSpacing: '.06em' }}>{dateStr}</div>
                <button onClick={() => confirmAllForDay(dateStr)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, border: '1px solid #b2ddb8', background: '#e6f5e9', color: '#1a6b3c', cursor: 'pointer' }}>
                  Confirm all for {dateStr}
                </button>
              </div>
              {games.map(g => {
                const key = mkKey(g)
                const count = predictions.filter(p => p.matchKey === key).length
                const result = results[key]
                const locked = adminLocks[key]
                const sc = getScoreState(key)
                return (
                  <div key={key} className="admin-row">
                    <div className="admin-label">
                      <div style={{ fontWeight: 600 }}>{g.t1} vs {g.t2}</div>
                      <div style={{ fontSize: 11, color: '#ADB5BD', marginTop: 1 }}>{g.time} · {count} pick{count !== 1 ? 's' : ''}</div>
                    </div>
                    <button onClick={() => toggleLock(key)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${locked ? '#f09595' : '#b2ddb8'}`, background: locked ? '#FCEBEB' : '#e6f5e9', color: locked ? '#A32D2D' : '#1a6b3c', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {locked ? '🔒 Locked' : '🔓 Open'}
                    </button>
                    {result ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#185FA5' }}>{result.score1}–{result.score2}</div>
                        <span className="confirmed-tag">✅</span>
                        <button onClick={() => deleteResult(key)} style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer' }}>Undo</button>
                      </>
                    ) : (
                      <>
                        <input className="admin-score-input" type="number" min="0" max="20" value={sc.s1} onChange={e => setScore(key, 's1', e.target.value)} placeholder="0" />
                        <span style={{ fontSize: 13, color: '#ADB5BD' }}>–</span>
                        <input className="admin-score-input" type="number" min="0" max="20" value={sc.s2} onChange={e => setScore(key, 's2', e.target.value)} placeholder="0" />
                        <button className="btn btn-confirm" onClick={() => confirmResult(key)}>Confirm</button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {activeSection === 'broadcast' && (
        <div className="card">
          <div className="card-title">Broadcast message</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>This message appears as a banner on every player's Pick tab until you clear it.</p>
          {currentMsg && (
            <div style={{ background: 'linear-gradient(135deg,#c9a84c22,#e8c84a22)', border: '1px solid #c9a84c', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#856404', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📢 {currentMsg}
              <button onClick={clearBroadcast} style={{ fontSize: 11, color: '#a32d2d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
            </div>
          )}
          <textarea
            value={broadcastMsg}
            onChange={e => setBroadcastMsg(e.target.value)}
            placeholder="e.g. Messi is out injured for Argentina vs Algeria tonight!"
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #dee2e6', borderRadius: 10, resize: 'vertical', minHeight: 80, marginBottom: 10, fontFamily: 'inherit' }}
          />
          <button className="btn btn-primary" onClick={sendBroadcast}>📢 Send to all players</button>
        </div>
      )}

      {activeSection === 'tournament' && (
        <div className="card">
          <div className="card-title">Tournament winner pick</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Lock this once the tournament is underway to prevent changes.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fa', borderRadius: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Tournament picks status</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: tournamentPicksLocked ? '#a32d2d' : '#1a6b3c' }}>
              {tournamentPicksLocked ? '🔒 Locked' : '🔓 Open'}
            </span>
          </div>
          <button className="btn btn-primary" onClick={async () => {
            await set(ref(db, 'tournamentPicksLocked'), !tournamentPicksLocked)
            onToast(tournamentPicksLocked ? 'Tournament picks unlocked.' : 'Tournament picks locked!', 'success')
          }}>
            {tournamentPicksLocked ? '🔓 Unlock tournament picks' : '🔒 Lock tournament picks'}
          </button>
        </div>
      )}

      {activeSection === 'danger' && (
        <div className="card">
          <div className="card-title" style={{ color: '#A32D2D' }}>Danger zone</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Permanently deletes all predictions, results, locks and messages.</p>
          <button className="btn btn-danger" onClick={resetAll}>Reset all data</button>
        </div>
      )}
    </div>
  )
}
