import { useState, useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { SCHEDULE, FLAGS, FIFA_RANKS, calcProbs, winVerdict, TODAY_KEY } from '../lib/schedule'
import { matchKey as mkKey } from '../lib/data'

function getAllGamesFlat() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => all.push({ ...g, dateStr }))
  })
  return all
}

function MatchCard({ game, liveResult }) {
  // A match is "done" if it was hardcoded done OR admin confirmed a result in Firebase
  const isDone = game.done || !!liveResult
  const score = liveResult ? `${liveResult.score1}–${liveResult.score2}` : game.score

  if (isDone) return (
    <div className="fixture-card">
      <div className="fixture-card-header">
        <div>
          <div className="fixture-group">Group {game.group}</div>
          <div className="fixture-venue">{game.venue}</div>
        </div>
        <span style={{ fontSize: 10, background: 'rgba(201,168,76,.3)', color: '#c9a84c', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
          Full Time
        </span>
      </div>
      <div className="fixture-body">
        <div className="fixture-teams">
          <div className="fixture-team">
            <div className="fixture-flag">{FLAGS[game.t1]}</div>
            <div className="fixture-name">{game.t1}</div>
          </div>
          <div className="fixture-score-display">{score}</div>
          <div className="fixture-team">
            <div className="fixture-flag">{FLAGS[game.t2]}</div>
            <div className="fixture-name">{game.t2}</div>
          </div>
        </div>
        {liveResult && (
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1a6b3c', background: '#e6f5e9', padding: '2px 10px', borderRadius: 10 }}>
              {liveResult.winner === 'Draw' ? 'Draw' : `${liveResult.winner} win`}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const { p1, p2, draw } = calcProbs(game.t1, game.t2)
  const verdict = winVerdict(p1, game.t1, p2, game.t2)
  const r1 = FIFA_RANKS[game.t1] || '—'
  const r2 = FIFA_RANKS[game.t2] || '—'
  const vStyle = { strong: 'verdict-strong', lean: 'verdict-lean', toss: 'verdict-toss' }[verdict.strength]
  const vIcon = verdict.strength === 'strong' ? '🔥' : verdict.strength === 'lean' ? '📈' : '⚖️'

  return (
    <div className="fixture-card">
      <div className="fixture-card-header">
        <div>
          <div className="fixture-group">Group {game.group}</div>
          <div className="fixture-venue">{game.venue}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="fixture-time">🕐 {game.time}</div>
        </div>
      </div>
      <div className="fixture-body">
        <div className="fixture-teams">
          <div className="fixture-team">
            <div className="fixture-flag">{FLAGS[game.t1]}</div>
            <div className="fixture-name">{game.t1}</div>
            <div className="fixture-rank">FIFA #{r1}</div>
          </div>
          <div className="fixture-vs">VS</div>
          <div className="fixture-team">
            <div className="fixture-flag">{FLAGS[game.t2]}</div>
            <div className="fixture-name">{game.t2}</div>
            <div className="fixture-rank">FIFA #{r2}</div>
          </div>
        </div>
        <div className="prob-labels">
          <span className={`prob-pct ${p1 >= p2 ? 'fav' : 'dog'}`}>{p1}%</span>
          <span className="prob-draw-label">Draw {draw}%</span>
          <span className={`prob-pct ${p2 > p1 ? 'fav' : 'dog'}`}>{p2}%</span>
        </div>
        <div className="prob-bar">
          <div className="prob-bar-t1" style={{ width: `${p1}%` }} />
          <div className="prob-bar-draw" style={{ width: `${draw}%` }} />
          <div className="prob-bar-t2" style={{ width: `${p2}%` }} />
        </div>
        <div><span className={`verdict-badge ${vStyle}`}>{vIcon} {verdict.text}</span></div>
      </div>
    </div>
  )
}

export default function FixturesTab() {
  const days = Object.keys(SCHEDULE)
  const [selectedDay, setSelectedDay] = useState(TODAY_KEY)
  const [results, setResults] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)

  // Live Firebase listener — updates instantly when admin confirms a result
  useEffect(() => {
    const unsub = onValue(ref(db, 'results'), snap => {
      setResults(snap.exists() ? snap.val() : {})
      setLastUpdated(new Date())
    })
    return () => unsub()
  }, [])

  const games = SCHEDULE[selectedDay] || []

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
            📅 Fixtures & Odds
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ecc71', animation: 'pulse 1.5s infinite' }} />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting…'}
          </div>
        </div>
      </div>

      <div className="day-tabs">
        {days.map(d => {
          const isToday = d === TODAY_KEY
          const isSel = d === selectedDay
          return (
            <button
              key={d}
              className={`day-tab ${isSel ? 'active' : ''} ${isToday && !isSel ? 'today' : ''}`}
              onClick={() => setSelectedDay(d)}
            >
              {d}{isToday ? ' · Today' : ''}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 500 }}>
          {games.length} match{games.length !== 1 ? 'es' : ''}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)' }}>Odds based on FIFA rankings</span>
      </div>

      {games.length === 0
        ? <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.4)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 13 }}>No matches scheduled.</div>
          </div>
        : games.map((g, i) => {
            const key = mkKey({ ...g, group: g.group })
            const liveResult = results[key] || null
            return <MatchCard key={i} game={g} liveResult={liveResult} />
          })
      }
    </div>
  )
}
