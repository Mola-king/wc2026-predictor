import { useEffect, useState } from 'react'
import { ref, onValue, set, remove } from 'firebase/database'
import { db } from '../lib/firebase'

export default function AdminTab({ onToast }) {
  const [predictions, setPredictions] = useState([])
  const [results, setResults] = useState({})
  const [scores, setScores] = useState({})

  useEffect(() => {
    const u1 = onValue(ref(db, 'predictions'), s => setPredictions(s.exists() ? Object.values(s.val()) : []))
    const u2 = onValue(ref(db, 'results'), s => setResults(s.exists() ? s.val() : {}))
  }, [])

  const matchKeys = [...new Set(predictions.map(p => p.matchKey))]

  function getScoreState(key) {
    return scores[key] || { s1: '', s2: '' }
  }

  function setScore(key, field, val) {
    setScores(prev => ({ ...prev, [key]: { ...getScoreState(key), [field]: val } }))
  }

  async function confirmResult(key) {
    const sample = predictions.find(p => p.matchKey === key)
    const sc = getScoreState(key)
    const s1 = parseInt(sc.s1) || 0
    const s2 = parseInt(sc.s2) || 0
    const winner = s1 > s2 ? sample.t1 : s2 > s1 ? sample.t2 : 'Draw'
    await set(ref(db, `results/${key}`), {
      t1: sample.t1, t2: sample.t2, group: sample.group,
      score1: s1, score2: s2, winner
    })
    onToast(`Result confirmed: ${sample.t1} ${s1}–${s2} ${sample.t2}`, 'success')
  }

  async function deleteResult(key) {
    await remove(ref(db, `results/${key}`))
    onToast('Result removed.', 'success')
  }

  async function resetAll() {
    if (!window.confirm('This will delete ALL predictions and results. Are you sure?')) return
    await remove(ref(db, 'predictions'))
    await remove(ref(db, 'results'))
    onToast('All data reset.', 'success')
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Confirm match results</div>
        <p style={{ fontSize: 13, color: '#6C757D', marginBottom: 14 }}>
          Once you confirm a result, predictions for that match get scored automatically and the leaderboard updates for everyone in real time.
        </p>

        {matchKeys.length === 0
          ? <div className="empty"><div className="empty-icon">📭</div><div className="empty-text">No picks submitted yet.</div></div>
          : matchKeys.map(key => {
              const sample = predictions.find(p => p.matchKey === key)
              const count = predictions.filter(p => p.matchKey === key).length
              const result = results[key]
              const sc = getScoreState(key)
              return (
                <div key={key} className="admin-row">
                  <div className="admin-label">
                    <div style={{ fontWeight: 500 }}>{sample.t1} vs {sample.t2}</div>
                    <div style={{ fontSize: 11, color: '#ADB5BD', marginTop: 2 }}>Group {sample.group} · {count} pick{count !== 1 ? 's' : ''}</div>
                  </div>
                  {result ? (
                    <>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#185FA5' }}>{result.score1}–{result.score2}</div>
                      <div className="confirmed-tag">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Done
                      </div>
                      <button onClick={() => deleteResult(key)} style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer' }}>Undo</button>
                    </>
                  ) : (
                    <>
                      <input className="admin-score-input" type="number" min="0" max="20" value={sc.s1}
                        onChange={e => setScore(key, 's1', e.target.value)} placeholder="0" />
                      <span style={{ fontSize: 13, color: '#ADB5BD' }}>–</span>
                      <input className="admin-score-input" type="number" min="0" max="20" value={sc.s2}
                        onChange={e => setScore(key, 's2', e.target.value)} placeholder="0" />
                      <button className="btn btn-confirm" onClick={() => confirmResult(key)}>Confirm</button>
                    </>
                  )}
                </div>
              )
            })}
      </div>

      <div className="card">
        <div className="card-title" style={{ color: '#A32D2D' }}>Danger zone</div>
        <p style={{ fontSize: 13, color: '#6C757D', marginBottom: 14 }}>This permanently deletes all predictions and results for everyone.</p>
        <button className="btn btn-danger" onClick={resetAll}>Reset all data</button>
      </div>
    </div>
  )
}
