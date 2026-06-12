import { useState, useEffect } from 'react'
import { ref, push, update, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { SCHEDULE } from '../lib/schedule'
import { matchKey as mkKey, isMatchLocked, scorePick, getTimeUntilLock } from '../lib/data'

function getAllGames() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => all.push({ ...g, dateStr }))
  })
  return all
}

export default function PickTab({ player, onToast }) {
  const [selectedKey, setSelectedKey] = useState(null)
  const [score1, setScore1] = useState(1)
  const [score2, setScore2] = useState(0)
  const [winner, setWinner] = useState('')
  const [myPicks, setMyPicks] = useState({})
  const [results, setResults] = useState({})
  const [adminLocks, setAdminLocks] = useState({})
  const [adminMessage, setAdminMessage] = useState(null)
  const [bankerUsedToday, setBankerUsedToday] = useState(false)
  const [isBanker, setIsBanker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingKey, setEditingKey] = useState(null)

  const allGames = getAllGames()
  const upcomingGames = allGames.filter(g => !g.done)

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'), snap => {
      const picks = {}
      if (snap.exists()) {
        Object.entries(snap.val()).forEach(([fbKey, pred]) => {
          if (pred.player === player.name) picks[pred.matchKey] = { fbKey, pred }
        })
      }
      setMyPicks(picks)
    })
    const u2 = onValue(ref(db, 'results'), s => setResults(s.exists() ? s.val() : {}))
    const u3 = onValue(ref(db, 'adminLocks'), s => setAdminLocks(s.exists() ? s.val() : {}))
    const u4 = onValue(ref(db, 'adminMessage'), s => setAdminMessage(s.exists() ? s.val() : null))
    return () => { u1(); u2(); u3(); u4() }
  }, [])

  // Check if banker already used today
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const used = Object.values(myPicks).some(({ pred }) => pred.isBanker && pred.bankerDate === today)
    setBankerUsedToday(used)
  }, [myPicks])

  useEffect(() => {
    const game = upcomingGames.find(g => mkKey(g) === currentKey)
    if (game) setWinner(score1 > score2 ? game.t1 : score2 > score1 ? game.t2 : 'Draw')
  }, [score1, score2, selectedKey])

  const currentKey = selectedKey || (upcomingGames[0] ? mkKey(upcomingGames[0]) : null)
  const currentGame = upcomingGames.find(g => mkKey(g) === currentKey)
  const locked = currentGame ? isMatchLocked(currentGame, adminLocks) : false
  const hasPick = currentKey && myPicks[currentKey]
  const isEditing = editingKey === currentKey
  const lockCountdown = currentGame && !locked ? getTimeUntilLock(currentGame) : null
  const unpickedCount = upcomingGames.filter(g => !isMatchLocked(g, adminLocks) && !myPicks[mkKey(g)]).length

  const gamesByDate = {}
  upcomingGames.forEach(g => {
    if (!gamesByDate[g.dateStr]) gamesByDate[g.dateStr] = []
    gamesByDate[g.dateStr].push(g)
  })

  function startEdit(game) {
    const key = mkKey(game)
    const existing = myPicks[key]
    if (existing) { setScore1(existing.pred.score1); setScore2(existing.pred.score2); setWinner(existing.pred.winner) }
    setSelectedKey(key); setEditingKey(key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitPick() {
    const game = currentGame
    const key = mkKey(game)
    if (isMatchLocked(game, adminLocks)) { onToast('This match is locked!', 'error'); return }
    const today = new Date().toISOString().slice(0, 10)
    setLoading(true)
    const data = {
      player: player.name, matchKey: key,
      t1: game.t1, t2: game.t2, group: game.group,
      score1: Number(score1), score2: Number(score2),
      winner, ts: Date.now(),
      isBanker: isBanker,
      bankerDate: isBanker ? today : null
    }
    const existing = myPicks[key]
    if (existing) {
      await update(ref(db, `predictions/${existing.fbKey}`), data)
      onToast('Prediction updated! ✏️', 'success')
    } else {
      await push(ref(db, 'predictions'), data)
      onToast(isBanker ? '🏦 Banker locked in! Double points on the line!' : 'Prediction locked in! 🎯', 'success')
    }
    setEditingKey(null); setIsBanker(false); setLoading(false)
  }

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>✏️ Submit prediction</div>
          {unpickedCount > 0 && (
            <span style={{ background: '#e74c3c', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
              {unpickedCount} open
            </span>
          )}
        </div>
      </div>

      {adminMessage && (
        <div style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c84a)', color: '#0f4526', padding: '10px 14px', borderRadius: 12, marginBottom: 12, fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          📢 {adminMessage}
        </div>
      )}

      <div className="card">
        <div className="card-title">Select a match</div>
        <select className="form-control" value={currentKey || ''} onChange={e => { setSelectedKey(e.target.value); setEditingKey(null) }}>
          {Object.entries(gamesByDate).map(([dateStr, games]) => (
            <optgroup key={dateStr} label={dateStr}>
              {games.map(g => {
                const key = mkKey(g)
                const lk = isMatchLocked(g, adminLocks)
                const picked = !!myPicks[key]
                return <option key={key} value={key}>{lk ? '🔒 ' : picked ? '✅ ' : ''}{g.t1} vs {g.t2} — Grp {g.group}</option>
              })}
            </optgroup>
          ))}
        </select>
      </div>

      {currentGame && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>{currentGame.t1} vs {currentGame.t2}</div>
            {locked
              ? <span className="badge badge-locked">🔒 Locked</span>
              : hasPick && !isEditing
              ? <button className="btn btn-edit" onClick={() => startEdit(currentGame)}>✏️ Edit</button>
              : null}
          </div>

          {lockCountdown && (
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#856404', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⏰ {lockCountdown}
            </div>
          )}

          {locked ? (
            <div className="match-locked-msg">⏰ Predictions for this match are now closed.</div>
          ) : (
            <>
              {hasPick && !isEditing && (
                <div className="match-locked-msg" style={{ background: '#e6f5e9', borderColor: '#b2ddb8', color: '#1a6b3c' }}>
                  ✅ You've picked this. Tap Edit to change before it locks.
                </div>
              )}
              {(!hasPick || isEditing) && (
                <>
                  <div className="card-title">Your scoreline</div>
                  <div className="score-row">
                    <div>
                      <div className="form-label">{currentGame.t1}</div>
                      <input className="score-box" type="number" min="0" max="20" value={score1} onChange={e => setScore1(Math.max(0, parseInt(e.target.value) || 0))} />
                    </div>
                    <div className="score-vs">—</div>
                    <div>
                      <div className="form-label" style={{ textAlign: 'right' }}>{currentGame.t2}</div>
                      <input className="score-box" type="number" min="0" max="20" value={score2} onChange={e => setScore2(Math.max(0, parseInt(e.target.value) || 0))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <div className="form-label">Predicted winner</div>
                    <select className="form-control" value={winner} onChange={e => setWinner(e.target.value)}>
                      <option value={currentGame.t1}>{currentGame.t1} wins</option>
                      <option value="Draw">Draw</option>
                      <option value={currentGame.t2}>{currentGame.t2} wins</option>
                    </select>
                  </div>

                  {!bankerUsedToday && !isEditing && (
                    <div
                      onClick={() => setIsBanker(b => !b)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        background: isBanker ? 'linear-gradient(135deg,#c9a84c22,#e8c84a22)' : '#f8f9fa',
                        border: `1.5px solid ${isBanker ? '#c9a84c' : '#dee2e6'}`,
                        borderRadius: 10, cursor: 'pointer', marginBottom: 12, transition: 'all .15s'
                      }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isBanker ? '#c9a84c' : '#ced4da'}`, background: isBanker ? '#c9a84c' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                        {isBanker && '✓'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isBanker ? '#856404' : '#495057' }}>🏦 Banker pick (double points)</div>
                        <div style={{ fontSize: 11, color: '#6c757d' }}>1 banker allowed per day — scores double if correct</div>
                      </div>
                    </div>
                  )}
                  {bankerUsedToday && !isEditing && (
                    <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 12, padding: '8px 12px', background: '#f8f9fa', borderRadius: 8 }}>🏦 Banker already used today</div>
                  )}

                  <button className="btn btn-primary" onClick={submitPick} disabled={loading} style={isBanker ? { background: 'linear-gradient(135deg,#c9a84c,#a07820)' } : {}}>
                    {loading ? 'Saving…' : isEditing ? '💾 Update prediction' : isBanker ? '🏦 Lock in banker' : '🔒 Lock in prediction'}
                  </button>
                  {isEditing && (
                    <button onClick={() => setEditingKey(null)} style={{ width: '100%', marginTop: 8, padding: '9px', fontSize: 13, background: 'transparent', border: '1px solid #dee2e6', borderRadius: 10, cursor: 'pointer', color: '#6c757d', fontWeight: 600 }}>Cancel</button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-title">Your predictions ({Object.keys(myPicks).length})</div>
        {Object.keys(myPicks).length === 0
          ? <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No picks yet.</div></div>
          : Object.values(myPicks).slice().reverse().map(({ fbKey, pred }) => {
              const result = results[pred.matchKey]
              const pts = result ? scorePick(pred, result) * (pred.isBanker ? 2 : 1) : null
              const game = upcomingGames.find(g => mkKey(g) === pred.matchKey)
              const lk = game ? isMatchLocked(game, adminLocks) : true
              return (
                <div key={fbKey} className="pred-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pred-match">
                      {pred.isBanker && <span style={{ fontSize: 11, marginRight: 4 }}>🏦</span>}
                      {pred.t1} vs {pred.t2} <span className="text-muted">Grp {pred.group}</span>
                    </div>
                    <div className="pred-detail">{pred.winner} · {pred.score1}–{pred.score2}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {!lk && !result && <button className="btn btn-edit" onClick={() => startEdit(game)} style={{ padding: '3px 8px', fontSize: 11 }}>✏️</button>}
                    {result
                      ? pts > 0 ? <span className="badge badge-correct">+{pts} pts{pred.isBanker ? ' ×2' : ''}</span> : <span className="badge badge-wrong">0 pts</span>
                      : lk ? <span className="badge badge-locked">🔒</span> : <span className="badge badge-pending">Pending</span>}
                  </div>
                </div>
              )
            })}
      </div>
    </div>
  )
}
