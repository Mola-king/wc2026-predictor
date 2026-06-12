import { useState, useEffect } from 'react'
import { ref, push, get } from 'firebase/database'
import { db } from '../lib/firebase'
import { GROUPS, getMatchups, matchKey } from '../lib/data'

export default function PickTab({ player, onToast }) {
  const [group, setGroup] = useState('A')
  const [matchIdx, setMatchIdx] = useState(0)
  const [score1, setScore1] = useState(1)
  const [score2, setScore2] = useState(0)
  const [winner, setWinner] = useState('')
  const [myPicks, setMyPicks] = useState([])
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState(false)

  const matchList = getMatchups(group)
  const match = matchList[matchIdx] || matchList[0]

  useEffect(() => {
    fetchMyPicks()
    fetchResults()
  }, [])

  useEffect(() => {
    if (match) setWinner(score1 > score2 ? match.t1 : score2 > score1 ? match.t2 : 'Draw')
  }, [score1, score2, matchIdx, group])

  async function fetchMyPicks() {
    const snap = await get(ref(db, 'predictions'))
    if (!snap.exists()) { setMyPicks([]); return }
    const all = Object.values(snap.val())
    setMyPicks(all.filter(p => p.player === player.name))
  }

  async function fetchResults() {
    const snap = await get(ref(db, 'results'))
    if (snap.exists()) setResults(snap.val())
  }

  async function submitPick() {
    const key = matchKey(match)
    const already = myPicks.find(p => p.matchKey === key)
    if (already) { onToast('You already picked this match!', 'error'); return }

    setLoading(true)
    await push(ref(db, 'predictions'), {
      player: player.name,
      matchKey: key,
      t1: match.t1, t2: match.t2, group: match.group,
      score1: Number(score1), score2: Number(score2),
      winner,
      ts: Date.now()
    })
    onToast('Prediction locked in! 🎯', 'success')
    setLoading(false)
    fetchMyPicks()
  }

  function scorePick(pred, result) {
    let pts = 0
    if (pred.winner === result.winner) pts += 3
    if (pred.score1 === result.score1 && pred.score2 === result.score2) pts += 2
    return pts
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Choose a match</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div className="form-label">Group</div>
            <select className="form-control" value={group} onChange={e => { setGroup(e.target.value); setMatchIdx(0) }}>
              {Object.keys(GROUPS).map(g => <option key={g} value={g}>Group {g}</option>)}
            </select>
          </div>
          <div>
            <div className="form-label">Match</div>
            <select className="form-control" value={matchIdx} onChange={e => setMatchIdx(Number(e.target.value))}>
              {matchList.map((m, i) => <option key={i} value={i}>{m.t1} vs {m.t2}</option>)}
            </select>
          </div>
        </div>

        <div className="card-title">Your scoreline</div>
        <div className="score-row">
          <div>
            <div className="form-label">{match?.t1}</div>
            <input className="score-box" type="number" min="0" max="20" value={score1}
              onChange={e => setScore1(Math.max(0, parseInt(e.target.value) || 0))} />
          </div>
          <div className="score-vs">—</div>
          <div>
            <div className="form-label" style={{ textAlign: 'right' }}>{match?.t2}</div>
            <input className="score-box" type="number" min="0" max="20" value={score2}
              onChange={e => setScore2(Math.max(0, parseInt(e.target.value) || 0))} />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">Predicted winner</div>
          <select className="form-control" value={winner} onChange={e => setWinner(e.target.value)}>
            <option value={match?.t1}>{match?.t1} wins</option>
            <option value="Draw">Draw</option>
            <option value={match?.t2}>{match?.t2} wins</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={submitPick} disabled={loading}>
          {loading ? 'Locking in…' : '🔒 Lock in prediction'}
        </button>
      </div>

      <div className="card">
        <div className="card-title">Your predictions ({myPicks.length})</div>
        {myPicks.length === 0
          ? <div className="empty"><div className="empty-icon">📋</div><div className="empty-text">No picks yet — lock one in above.</div></div>
          : myPicks.slice().reverse().map((p, i) => {
              const result = results[p.matchKey]
              const pts = result ? scorePick(p, result) : null
              return (
                <div key={i} className="pred-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="pred-match">{p.t1} vs {p.t2} <span className="text-muted" style={{ fontWeight: 400 }}>Grp {p.group}</span></div>
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
