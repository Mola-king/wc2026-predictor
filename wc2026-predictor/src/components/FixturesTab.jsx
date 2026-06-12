import { useState, useEffect, useRef } from 'react'
import { SCHEDULE, FLAGS, FIFA_RANKS, calcProbs, winVerdict, TODAY_KEY } from '../lib/schedule'

function MatchCard({ game, probs }) {
  if (game.done) {
    return (
      <div style={{
        background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', marginBottom: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Group {game.group}</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ fontSize: 10, background: '#EAF3DE', color: '#27500A', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Full time</span>
            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{game.venue}</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{FLAGS[game.t1]}</span>
            <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', color: 'var(--color-text-primary)' }}>{game.t1}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', minWidth: 60 }}>{game.score}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>{FLAGS[game.t2]}</span>
            <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', color: 'var(--color-text-primary)' }}>{game.t2}</span>
          </div>
        </div>
      </div>
    )
  }

  const { p1, p2, draw } = probs
  const verdict = winVerdict(p1, game.t1, p2, game.t2)
  const r1 = FIFA_RANKS[game.t1] || '—'
  const r2 = FIFA_RANKS[game.t2] || '—'

  const verdictStyle = {
    strong: { bg: '#E6F1FB', color: '#0C447C' },
    lean:   { bg: '#EAF3DE', color: '#27500A' },
    toss:   { bg: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' },
  }[verdict.strength]

  return (
    <div style={{
      background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', marginBottom: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Group {game.group}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>🕐 {game.time}</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{game.venue}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{FLAGS[game.t1]}</span>
          <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', color: 'var(--color-text-primary)' }}>{game.t1}</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>FIFA #{r1}</span>
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)' }}>vs</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{FLAGS[game.t2]}</span>
          <span style={{ fontSize: 13, fontWeight: 500, textAlign: 'center', color: 'var(--color-text-primary)' }}>{game.t2}</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>FIFA #{r2}</span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: p1 >= p2 ? '#185FA5' : 'var(--color-text-secondary)' }}>{p1}%</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Draw {draw}%</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: p2 > p1 ? '#185FA5' : 'var(--color-text-secondary)' }}>{p2}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--color-background-secondary)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
          <div style={{ height: '100%', background: '#378ADD', width: `${p1}%`, transition: 'width .5s ease' }} />
          <div style={{ height: '100%', background: '#B4B2A9', width: `${draw}%` }} />
          <div style={{ height: '100%', background: '#97C459', width: `${p2}%`, transition: 'width .5s ease' }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: verdictStyle.bg, color: verdictStyle.color
          }}>
            📈 {verdict.text}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function FixturesTab() {
  const days = Object.keys(SCHEDULE)
  const [selectedDay, setSelectedDay] = useState(TODAY_KEY)
  const [tick, setTick] = useState(0)
  const probsRef = useRef({})

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    probsRef.current = {}
  }, [tick])

  function getProbs(game) {
    const key = `${game.t1}_${game.t2}`
    if (!probsRef.current[key]) {
      probsRef.current[key] = calcProbs(game.t1, game.t2)
    }
    return probsRef.current[key]
  }

  const games = SCHEDULE[selectedDay] || []

  return (
    <div>
      <div style={{ overflowX: 'auto', display: 'flex', gap: 6, paddingBottom: 4, marginBottom: 16 }}>
        {days.map(d => {
          const isToday = d === TODAY_KEY
          const isSel = d === selectedDay
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 20,
                border: `0.5px solid ${isSel ? '#185FA5' : isToday ? '#185FA5' : 'var(--color-border-secondary)'}`,
                background: isSel ? '#185FA5' : 'transparent',
                color: isSel ? '#fff' : isToday ? '#185FA5' : 'var(--color-text-secondary)',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {d}{isToday ? ' · Today' : ''}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--color-text-primary)' }}>{selectedDay}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{games.length} match{games.length !== 1 ? 'es' : ''}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Odds refresh live</span>
      </div>

      {games.length === 0
        ? <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-tertiary)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 13 }}>No matches scheduled.</div>
          </div>
        : games.map((g, i) => <MatchCard key={i} game={g} probs={getProbs(g)} />)
      }
    </div>
  )
}
