import { useEffect, useState } from 'react'
import { ref, onValue, set, remove } from 'firebase/database'
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
  const [results, setResults]         = useState({})
  const [adminLocks, setAdminLocks]   = useState({})
  const [manualScores, setManualScores] = useState({})   // fallback manual input
  const [fetched, setFetched]         = useState({})     // from /api/scores
  const [fetching, setFetching]       = useState(false)
  const [lastFetch, setLastFetch]     = useState(null)
  const [fetchError, setFetchError]   = useState(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [currentMsg, setCurrentMsg]   = useState(null)
  const [tournamentPicksLocked, setTournamentPicksLocked] = useState(false)
  const [activeSection, setActiveSection] = useState('matches')

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'),        s => setPredictions(s.exists() ? Object.values(s.val()) : []))
    const u2 = onValue(ref(db, 'results'),            s => setResults(s.exists() ? s.val() : {}))
    const u3 = onValue(ref(db, 'adminLocks'),         s => setAdminLocks(s.exists() ? s.val() : {}))
    const u4 = onValue(ref(db, 'adminMessage'),       s => setCurrentMsg(s.exists() ? s.val() : null))
    const u5 = onValue(ref(db, 'tournamentPicksLocked'), s => setTournamentPicksLocked(s.exists() ? s.val() : false))
    return () => { u1(); u2(); u3(); u4(); u5() }
  }, [])

  // ── Fetch scores via Vercel proxy (no CORS issues) ──────────────
  async function fetchScores() {
    setFetching(true)
    setFetchError(null)
    try {
      const res  = await fetch('/api/scores')
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'API error')

      const allGames = getAllGames()
      const newFetched = {}

      allGames.forEach(g => {
        const key = mkKey(g)
        // Build lookup keys from our team names
        const k1 = `${g.t1}_${g.t2}`.replace(/[^a-zA-Z0-9_]/g, '_')
        const k2 = `${g.t2}_${g.t1}`.replace(/[^a-zA-Z0-9_]/g, '_')

        const hit = data.scores[k1] || data.scores[k2]
        if (!hit) return

        // Determine s1/s2 relative to our t1/t2
        const t1IsHome = hit.home === g.t1
        newFetched[key] = {
          s1: t1IsHome ? hit.homeGoals : hit.awayGoals,
          s2: t1IsHome ? hit.awayGoals : hit.homeGoals,
          label: hit.label,
          isFinished: hit.isFinished,
        }
      })

      setFetched(newFetched)
      setLastFetch(new Date())

      const count = Object.keys(newFetched).length
      if (count === 0) {
        onToast("No live or finished matches found yet today.", 'error')
      } else {
        onToast(`⚡ ${count} score${count !== 1 ? 's' : ''} fetched — just hit Confirm!`, 'success')
      }
    } catch (e) {
      setFetchError(e.message)
      onToast('Could not fetch scores. Use manual input below.', 'error')
    }
    setFetching(false)
  }

  // ── Effective score: fetched takes priority over manual ──────────
  function getScore(key) {
    const f = fetched[key]
    if (f) return { s1: f.s1, s2: f.s2, label: f.label, isFinished: f.isFinished, source: 'api' }
    const m = manualScores[key]
    return { s1: m?.s1 ?? '', s2: m?.s2 ?? '', label: null, isFinished: false, source: 'manual' }
  }

  // ── Firebase actions ─────────────────────────────────────────────
  async function toggleLock(key) {
    if (adminLocks[key]) { await remove(ref(db, `adminLocks/${key}`)); onToast('Match unlocked.', 'success') }
    else                 { await set(ref(db, `adminLocks/${key}`), true); onToast('Match locked.', 'success') }
  }

  async function confirmResult(key, game) {
    const { s1, s2 } = getScore(key)
    if (s1 === '' || s2 === '') { onToast('No score yet — fetch or enter manually.', 'error'); return }
    const score1 = Number(s1), score2 = Number(s2)
    const winner = score1 > score2 ? game.t1 : score2 > score1 ? game.t2 : 'Draw'
    await set(ref(db, `results/${key}`), { t1: game.t1, t2: game.t2, group: game.group, score1, score2, winner })
    onToast(`✅ ${game.t1} ${score1}–${score2} ${game.t2} confirmed!`, 'success')
  }

  async function confirmAllForDay(dateStr, games) {
    let n = 0
    for (const g of games) {
      const key = mkKey(g)
      if (results[key]) continue
      const { s1, s2 } = getScore(key)
      if (s1 === '' || s2 === '') continue
      const score1 = Number(s1), score2 = Number(s2)
      const winner = score1 > score2 ? g.t1 : score2 > score1 ? g.t2 : 'Draw'
      await set(ref(db, `results/${key}`), { t1: g.t1, t2: g.t2, group: g.group, score1, score2, winner })
      n++
    }
    onToast(n ? `${n} result${n !== 1 ? 's' : ''} confirmed for ${dateStr}!` : 'No scores ready yet.', n ? 'success' : 'error')
  }

  async function deleteResult(key) { await remove(ref(db, `results/${key}`)); onToast('Result removed.', 'success') }

  // ── Layout helpers ───────────────────────────────────────────────
  const allGames = getAllGames().filter(g => !g.done)
  const byDate   = {}
  allGames.forEach(g => { if (!byDate[g.dateStr]) byDate[g.dateStr] = []; byDate[g.dateStr].push(g) })

  const sections = [
    { id: 'matches',    label: '⚽ Matches'    },
    { id: 'broadcast',  label: '📢 Broadcast'  },
    { id: 'tournament', label: '🏆 Trophy pick' },
    { id: 'danger',     label: '⚠️ Reset'       },
  ]

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>⚙️ Admin panel</div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 20, cursor: 'pointer',
            border:      `1.5px solid ${activeSection === s.id ? '#c9a84c' : 'rgba(255,255,255,.25)'}`,
            background:  activeSection === s.id ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.08)',
            color:       activeSection === s.id ? '#c9a84c' : 'rgba(255,255,255,.6)',
          }}>{s.label}</button>
        ))}
      </div>

      {/* ── MATCHES ── */}
      {activeSection === 'matches' && (
        <div>
          {/* Fetch card */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>⚡ Auto-fetch live scores</div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>
                  {lastFetch
                    ? `Last fetched: ${lastFetch.toLocaleTimeString()}`
                    : "Pulls today's live & finished scores automatically"}
                </div>
              </div>
              <button onClick={fetchScores} disabled={fetching} style={{
                padding: '9px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none',
                background: fetching ? '#e9ecef' : 'linear-gradient(135deg,#1a6b3c,#0f4526)',
                color: fetching ? '#adb5bd' : '#fff', cursor: fetching ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}>
                {fetching ? '⏳ Fetching…' : '⚡ Fetch scores now'}
              </button>
            </div>

            {fetchError && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#fcebeb', borderRadius: 8, fontSize: 12, color: '#a32d2d', fontWeight: 600 }}>
                ⚠️ {fetchError} — use manual score input below as fallback.
              </div>
            )}

            {Object.keys(fetched).length > 0 && !fetchError && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#e6f5e9', borderRadius: 8, fontSize: 12, color: '#1a6b3c', fontWeight: 600 }}>
                ✅ {Object.keys(fetched).length} score{Object.keys(fetched).length !== 1 ? 's' : ''} fetched — scores pre-filled below. Just hit Confirm.
              </div>
            )}
          </div>

          {/* Match list */}
          <div className="card">
            <div className="card-title">Confirm results</div>
            {Object.entries(byDate).map(([dateStr, games]) => (
              <div key={dateStr}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 6px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ADB5BD', textTransform: 'uppercase', letterSpacing: '.06em' }}>{dateStr}</div>
                  <button onClick={() => confirmAllForDay(dateStr, games)} style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                    border: '1px solid #b2ddb8', background: '#e6f5e9', color: '#1a6b3c', cursor: 'pointer',
                  }}>Confirm all · {dateStr}</button>
                </div>

                {games.map(g => {
                  const key    = mkKey(g)
                  const count  = predictions.filter(p => p.matchKey === key).length
                  const result = results[key]
                  const locked = adminLocks[key]
                  const sc     = getScore(key)

                  return (
                    <div key={key} className="admin-row">
                      <div className="admin-label">
                        <div style={{ fontWeight: 600 }}>{g.t1} vs {g.t2}</div>
                        <div style={{ fontSize: 11, color: '#ADB5BD', marginTop: 1 }}>{g.time} · {count} pick{count !== 1 ? 's' : ''}</div>
                      </div>

                      {/* Lock toggle */}
                      <button onClick={() => toggleLock(key)} style={{
                        padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
                        border:      `1px solid ${locked ? '#f09595' : '#b2ddb8'}`,
                        background:  locked ? '#FCEBEB' : '#e6f5e9',
                        color:       locked ? '#A32D2D' : '#1a6b3c',
                      }}>{locked ? '🔒' : '🔓'}</button>

                      {result ? (
                        /* Already confirmed */
                        <>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#185FA5' }}>{result.score1}–{result.score2}</div>
                          <span className="confirmed-tag">✅</span>
                          <button onClick={() => deleteResult(key)} style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer' }}>Undo</button>
                        </>
                      ) : sc.source === 'api' ? (
                        /* Auto-fetched score — just show it and confirm */
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: sc.isFinished ? '#1a6b3c' : '#856404' }}>{sc.s1}–{sc.s2}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6,
                              background: sc.isFinished ? '#e6f5e9' : '#fff3cd',
                              color:      sc.isFinished ? '#1a6b3c' : '#856404',
                            }}>{sc.label}</span>
                          </div>
                          <button className="btn btn-confirm" onClick={() => confirmResult(key, g)}>Confirm</button>
                        </>
                      ) : (
                        /* Manual fallback input */
                        <>
                          <input className="admin-score-input" type="number" min="0" max="20" placeholder="0"
                            value={manualScores[key]?.s1 ?? ''}
                            onChange={e => setManualScores(p => ({ ...p, [key]: { ...p[key], s1: e.target.value } }))} />
                          <span style={{ fontSize: 13, color: '#ADB5BD' }}>–</span>
                          <input className="admin-score-input" type="number" min="0" max="20" placeholder="0"
                            value={manualScores[key]?.s2 ?? ''}
                            onChange={e => setManualScores(p => ({ ...p, [key]: { ...p[key], s2: e.target.value } }))} />
                          <button className="btn btn-confirm" onClick={() => confirmResult(key, g)}>Confirm</button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BROADCAST ── */}
      {activeSection === 'broadcast' && (
        <div className="card">
          <div className="card-title">Broadcast message</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Appears as a banner on every player's Pick tab until cleared.</p>
          {currentMsg && (
            <div style={{ background: 'rgba(201,168,76,.15)', border: '1px solid #c9a84c', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#856404', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📢 {currentMsg}
              <button onClick={async () => { await remove(ref(db, 'adminMessage')); onToast('Message cleared.', 'success') }}
                style={{ fontSize: 11, color: '#a32d2d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
            </div>
          )}
          <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
            placeholder="e.g. Messi is out injured for tonight's match!"
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #dee2e6', borderRadius: 10, resize: 'vertical', minHeight: 80, marginBottom: 10, fontFamily: 'inherit' }} />
          <button className="btn btn-primary" onClick={async () => {
            if (!broadcastMsg.trim()) { onToast('Enter a message first.', 'error'); return }
            await set(ref(db, 'adminMessage'), broadcastMsg.trim())
            setBroadcastMsg('')
            onToast('Message sent to all players!', 'success')
          }}>📢 Send to all players</button>
        </div>
      )}

      {/* ── TOURNAMENT ── */}
      {activeSection === 'tournament' && (
        <div className="card">
          <div className="card-title">Tournament winner pick</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f9fa', borderRadius: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Tournament picks</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: tournamentPicksLocked ? '#a32d2d' : '#1a6b3c' }}>
              {tournamentPicksLocked ? '🔒 Locked' : '🔓 Open'}
            </span>
          </div>
          <button className="btn btn-primary" onClick={async () => {
            await set(ref(db, 'tournamentPicksLocked'), !tournamentPicksLocked)
            onToast(tournamentPicksLocked ? 'Tournament picks unlocked.' : 'Tournament picks locked!', 'success')
          }}>{tournamentPicksLocked ? '🔓 Unlock' : '🔒 Lock tournament picks'}</button>
        </div>
      )}

      {/* ── DANGER ── */}
      {activeSection === 'danger' && (
        <div className="card">
          <div className="card-title" style={{ color: '#A32D2D' }}>Danger zone</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Permanently deletes all predictions, results, locks and messages.</p>
          <button className="btn btn-danger" onClick={async () => {
            if (!window.confirm('Delete ALL data? This cannot be undone.')) return
            await Promise.all([
              remove(ref(db, 'predictions')),
              remove(ref(db, 'results')),
              remove(ref(db, 'adminLocks')),
              remove(ref(db, 'tournamentPicks')),
              remove(ref(db, 'adminMessage')),
            ])
            onToast('All data reset.', 'success')
          }}>Reset all data</button>
        </div>
      )}
    </div>
  )
}
