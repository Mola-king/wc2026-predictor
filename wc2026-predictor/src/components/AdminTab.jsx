import { useEffect, useState } from 'react'
import { ref, onValue, set, remove } from 'firebase/database'
import { db } from '../lib/firebase'
import { matchKey as mkKey } from '../lib/data'
import { SCHEDULE } from '../lib/schedule'

const API_KEY = '34af3dd85455f161456e3af1e94bc1e7'
const API_BASE = 'https://v3.football.api-sports.io'
const WC_LEAGUE = 1
const WC_SEASON = 2026

function getAllGames() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => all.push({ ...g, dateStr }))
  })
  return all
}

// Normalize team names between our app and API-Football
const TEAM_MAP = {
  'United States': ['USA', 'United States'],
  'Bosnia & Herz.': ['Bosnia', 'Bosnia and Herzegovina', 'Bosnia & Herzegovina'],
  'Curaçao': ['Curacao', 'Curaçao'],
  'Türkiye': ['Turkey', 'Türkiye'],
  'DR Congo': ['DR Congo', 'Congo DR', 'Democratic Republic of Congo'],
  'South Korea': ['South Korea', 'Korea Republic'],
  'Ivory Coast': ["Ivory Coast", "Côte d'Ivoire"],
}

function normalizeName(name) {
  for (const [ours, variants] of Object.entries(TEAM_MAP)) {
    if (variants.some(v => v.toLowerCase() === name.toLowerCase())) return ours
  }
  return name
}

export default function AdminTab({ onToast }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})
  const [adminLocks, setAdminLocks] = useState({})
  const [scores, setScores] = useState({})       // manually typed scores
  const [fetched, setFetched] = useState({})     // auto-fetched from API
  const [fetching, setFetching] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)
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

  // Fetch today's live & finished scores from API-Football
  async function fetchLiveScores() {
    setFetching(true)
    try {
      // Fetch today's fixtures
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch(
        `${API_BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&date=${today}`,
        { headers: { 'x-apisports-key': API_KEY } }
      )
      const data = await res.json()

      if (!data.response || data.response.length === 0) {
        // Also try fetching live matches
        const liveRes = await fetch(
          `${API_BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&live=all`,
          { headers: { 'x-apisports-key': API_KEY } }
        )
        const liveData = await liveRes.json()
        processFixtures(liveData.response || [])
      } else {
        processFixtures(data.response)
      }

      setLastFetch(new Date())
      onToast('Scores fetched from API ⚡', 'success')
    } catch (e) {
      onToast('Could not fetch scores — check your API key.', 'error')
    }
    setFetching(false)
  }

  function processFixtures(fixtures) {
    const newFetched = { ...fetched }
    const allGames = getAllGames()

    fixtures.forEach(fix => {
      const status = fix.fixture.status.short
      // Only process finished or in-progress matches
      if (!['FT', 'AET', 'PEN', '1H', 'HT', '2H', 'ET', 'BT', 'P'].includes(status)) return

      const apiHome = normalizeName(fix.teams.home.name)
      const apiAway = normalizeName(fix.teams.away.name)
      const homeGoals = fix.goals.home ?? 0
      const awayGoals = fix.goals.away ?? 0
      const isFinished = ['FT', 'AET', 'PEN'].includes(status)

      // Find matching game in our schedule
      const match = allGames.find(g =>
        (g.t1 === apiHome && g.t2 === apiAway) ||
        (g.t1 === apiAway && g.t2 === apiHome)
      )
      if (!match) return

      const key = mkKey(match)
      const s1 = match.t1 === apiHome ? homeGoals : awayGoals
      const s2 = match.t2 === apiHome ? homeGoals : awayGoals

      newFetched[key] = { s1, s2, status, isFinished, label: isFinished ? 'Full time' : 'Live' }
    })
    setFetched(newFetched)
  }

  function getEffectiveScore(key) {
    // Priority: manually typed > API fetched
    const manual = scores[key]
    const api = fetched[key]
    if (manual?.s1 !== '' && manual?.s1 !== undefined) return { s1: manual.s1, s2: manual.s2, source: 'manual' }
    if (api) return { s1: api.s1, s2: api.s2, source: api.label, isFinished: api.isFinished }
    return { s1: '', s2: '', source: null }
  }

  async function toggleLock(key) {
    if (adminLocks[key]) { await remove(ref(db, `adminLocks/${key}`)); onToast('Match unlocked.', 'success') }
    else { await set(ref(db, `adminLocks/${key}`), true); onToast('Match locked.', 'success') }
  }

  async function confirmResult(key, game) {
    const { s1, s2 } = getEffectiveScore(key)
    if (s1 === '' || s2 === '') { onToast('No score available yet — fetch or enter manually.', 'error'); return }
    const score1 = Number(s1), score2 = Number(s2)
    const winner = score1 > score2 ? game.t1 : score2 > score1 ? game.t2 : 'Draw'
    await set(ref(db, `results/${key}`), { t1: game.t1, t2: game.t2, group: game.group, score1, score2, winner })
    onToast(`✅ ${game.t1} ${score1}–${score2} ${game.t2} confirmed!`, 'success')
  }

  async function confirmAllForDay(dateStr, games) {
    let confirmed = 0
    for (const g of games) {
      const key = mkKey(g)
      if (results[key]) continue
      const { s1, s2 } = getEffectiveScore(key)
      if (s1 === '' || s2 === '') continue
      const score1 = Number(s1), score2 = Number(s2)
      const winner = score1 > score2 ? g.t1 : score2 > score1 ? g.t2 : 'Draw'
      await set(ref(db, `results/${key}`), { t1: g.t1, t2: g.t2, group: g.group, score1, score2, winner })
      confirmed++
    }
    onToast(`${confirmed} result${confirmed !== 1 ? 's' : ''} confirmed for ${dateStr}.`, 'success')
  }

  async function deleteResult(key) { await remove(ref(db, `results/${key}`)); onToast('Result removed.', 'success') }

  async function sendBroadcast() {
    if (!broadcastMsg.trim()) { onToast('Enter a message first.', 'error'); return }
    await set(ref(db, 'adminMessage'), broadcastMsg.trim())
    setBroadcastMsg('')
    onToast('Message sent!', 'success')
  }

  async function clearBroadcast() { await remove(ref(db, 'adminMessage')); onToast('Message cleared.', 'success') }

  const allGames = getAllGames().filter(g => !g.done)
  const byDate = {}
  allGames.forEach(g => {
    if (!byDate[g.dateStr]) byDate[g.dateStr] = []
    byDate[g.dateStr].push(g)
  })

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
        <div>
          {/* Fetch scores button */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>⚡ Auto-fetch live scores</div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>
                  {lastFetch ? `Last fetched: ${lastFetch.toLocaleTimeString()}` : "Fetches today's scores from API-Football"}
                </div>
              </div>
              <button
                onClick={fetchLiveScores}
                disabled={fetching}
                style={{
                  padding: '9px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                  background: fetching ? '#e9ecef' : 'linear-gradient(135deg,#1a6b3c,#0f4526)',
                  color: fetching ? '#adb5bd' : '#fff', border: 'none', cursor: fetching ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
                }}
              >
                {fetching ? '⏳ Fetching…' : '⚡ Fetch scores now'}
              </button>
            </div>
            {Object.keys(fetched).length > 0 && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#e6f5e9', borderRadius: 8, fontSize: 12, color: '#1a6b3c', fontWeight: 600 }}>
                ✅ {Object.keys(fetched).length} score{Object.keys(fetched).length !== 1 ? 's' : ''} fetched — scores auto-filled below. Just hit Confirm.
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Confirm results</div>
            {Object.entries(byDate).map(([dateStr, games]) => (
              <div key={dateStr}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0 6px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ADB5BD', textTransform: 'uppercase', letterSpacing: '.06em' }}>{dateStr}</div>
                  <button onClick={() => confirmAllForDay(dateStr, games)} style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, border: '1px solid #b2ddb8', background: '#e6f5e9', color: '#1a6b3c', cursor: 'pointer' }}>
                    Confirm all · {dateStr}
                  </button>
                </div>
                {games.map(g => {
                  const key = mkKey(g)
                  const count = predictions.filter(p => p.matchKey === key).length
                  const result = results[key]
                  const locked = adminLocks[key]
                  const eff = getEffectiveScore(key)
                  const hasFetched = !!fetched[key]

                  return (
                    <div key={key} className="admin-row">
                      <div className="admin-label">
                        <div style={{ fontWeight: 600 }}>{g.t1} vs {g.t2}</div>
                        <div style={{ fontSize: 11, color: '#ADB5BD', marginTop: 1 }}>{g.time} · {count} pick{count !== 1 ? 's' : ''}</div>
                      </div>

                      <button onClick={() => toggleLock(key)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 700, borderRadius: 8, border: `1px solid ${locked ? '#f09595' : '#b2ddb8'}`, background: locked ? '#FCEBEB' : '#e6f5e9', color: locked ? '#A32D2D' : '#1a6b3c', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {locked ? '🔒' : '🔓'}
                      </button>

                      {result ? (
                        <>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#185FA5' }}>{result.score1}–{result.score2}</div>
                          <span className="confirmed-tag">✅</span>
                          <button onClick={() => deleteResult(key)} style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer' }}>Undo</button>
                        </>
                      ) : (
                        <>
                          {/* Score display — auto-filled or manual */}
                          {hasFetched ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: '#1a6b3c' }}>{eff.s1}–{eff.s2}</span>
                              <span style={{ fontSize: 9, background: eff.isFinished ? '#e6f5e9' : '#fff3cd', color: eff.isFinished ? '#1a6b3c' : '#856404', padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>
                                {eff.source}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <input className="admin-score-input" type="number" min="0" max="20"
                                value={scores[key]?.s1 ?? ''}
                                onChange={e => setScores(prev => ({ ...prev, [key]: { ...prev[key], s1: e.target.value } }))}
                                placeholder="0" />
                              <span style={{ fontSize: 13, color: '#ADB5BD' }}>–</span>
                              <input className="admin-score-input" type="number" min="0" max="20"
                                value={scores[key]?.s2 ?? ''}
                                onChange={e => setScores(prev => ({ ...prev, [key]: { ...prev[key], s2: e.target.value } }))}
                                placeholder="0" />
                            </div>
                          )}
                          <button className="btn btn-confirm" onClick={() => confirmResult(key, g)}>
                            Confirm
                          </button>
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

      {activeSection === 'broadcast' && (
        <div className="card">
          <div className="card-title">Broadcast message</div>
          <p style={{ fontSize: 13, color: '#6c757d', marginBottom: 14 }}>Appears as a banner on every player's Pick tab until cleared.</p>
          {currentMsg && (
            <div style={{ background: 'linear-gradient(135deg,#c9a84c22,#e8c84a22)', border: '1px solid #c9a84c', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#856404', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              📢 {currentMsg}
              <button onClick={clearBroadcast} style={{ fontSize: 11, color: '#a32d2d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
            </div>
          )}
          <textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)}
            placeholder="e.g. Messi is out injured for tonight's match!"
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid #dee2e6', borderRadius: 10, resize: 'vertical', minHeight: 80, marginBottom: 10, fontFamily: 'inherit' }} />
          <button className="btn btn-primary" onClick={sendBroadcast}>📢 Send to all players</button>
        </div>
      )}

      {activeSection === 'tournament' && (
        <div className="card">
          <div className="card-title">Tournament winner pick</div>
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
          <button className="btn btn-danger" onClick={async () => {
            if (!window.confirm('Delete ALL data?')) return
            await remove(ref(db, 'predictions'))
            await remove(ref(db, 'results'))
            await remove(ref(db, 'adminLocks'))
            await remove(ref(db, 'tournamentPicks'))
            await remove(ref(db, 'adminMessage'))
            onToast('All data reset.', 'success')
          }}>Reset all data</button>
        </div>
      )}
    </div>
  )
}
