import { SCHEDULE } from '../lib/schedule'
import { matchKey as mkKey, isMatchLocked, scorePick, getAvatarColor, initials } from '../lib/data'

function getAllGames() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => all.push({ ...g, dateStr }))
  })
  return all
}

export default function HeadToHead({ me, opponent, predictions, results, adminLocks, onBack }) {
  const allGames = getAllGames()
  const avMe = getAvatarColor(me)
  const avOpp = getAvatarColor(opponent)

  const myPicks = {}
  const oppPicks = {}
  predictions.forEach(p => {
    if (p.player === me) myPicks[p.matchKey] = p
    if (p.player === opponent) oppPicks[p.matchKey] = p
  })

  // Only show matches that are locked (predictions closed) and both have picked
  const sharedKeys = Object.keys(myPicks).filter(k => {
    const game = allGames.find(g => mkKey(g) === k)
    if (!game) return false
    return oppPicks[k] && isMatchLocked(game, adminLocks)
  })

  let myPts = 0, oppPts = 0, myScoredCorrect = 0, oppScoredCorrect = 0

  const rows = sharedKeys.map(k => {
    const myP = myPicks[k]
    const oppP = oppPicks[k]
    const result = results[k]
    const myBase = result ? scorePick(myP, result) : null
    const oppBase = result ? scorePick(oppP, result) : null
    const myTotal = myBase !== null ? myBase * (myP.isBanker ? 2 : 1) : null
    const oppTotal = oppBase !== null ? oppBase * (oppP.isBanker ? 2 : 1) : null
    if (myTotal !== null) { myPts += myTotal; if (myBase >= 3) myScoredCorrect++ }
    if (oppTotal !== null) { oppPts += oppTotal; if (oppBase >= 3) oppScoredCorrect++ }
    return { k, myP, oppP, result, myTotal, oppTotal }
  })

  const meWinning = myPts > oppPts
  const tied = myPts === oppPts

  return (
    <div>
      <div style={{ padding: '14px 0 4px' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          ← Back
        </button>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 14, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>⚔️ Head to head</div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className="avatar avatar-lg" style={{ background: avMe.bg, color: avMe.text }}>{initials(me)}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{me} <span style={{ fontSize: 11, color: '#1a6b3c', fontWeight: 600 }}>(you)</span></div>
            <div style={{ fontSize: 28, fontWeight: 800, color: meWinning ? '#1a6b3c' : tied ? '#495057' : '#adb5bd' }}>{myPts}</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#adb5bd' }}>pts</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div className="avatar avatar-lg" style={{ background: avOpp.bg, color: avOpp.text }}>{initials(opponent)}</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{opponent}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: !meWinning && !tied ? '#1a6b3c' : tied ? '#495057' : '#adb5bd' }}>{oppPts}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: tied ? '#495057' : meWinning ? '#1a6b3c' : '#a32d2d', padding: '8px 16px', background: tied ? '#f8f9fa' : meWinning ? '#e6f5e9' : '#fcebeb', borderRadius: 10 }}>
          {tied ? "It's level! ⚖️" : meWinning ? `You're ahead by ${myPts - oppPts} pts 🔥` : `${opponent} leads by ${oppPts - myPts} pts`}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="empty"><div className="empty-icon">🔒</div><div className="empty-text">Head-to-head comparison only shows after matches lock. Check back once predictions close!</div></div>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Match by match</div>
          {rows.map(({ k, myP, oppP, result, myTotal, oppTotal }) => (
            <div key={k} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f1f3f5' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#495057', marginBottom: 8 }}>
                {myP.t1} vs {myP.t2}
                {result && <span style={{ marginLeft: 6, fontSize: 11, color: '#1a6b3c', fontWeight: 600 }}>· {result.score1}–{result.score2}</span>}
                {!result && <span style={{ marginLeft: 6, fontSize: 11, color: '#adb5bd' }}>· Pending</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ name: me, pick: myP, pts: myTotal, av: avMe }, { name: opponent, pick: oppP, pts: oppTotal, av: avOpp }].map(({ name, pick, pts, av }) => (
                  <div key={name} style={{ background: '#f8f9fa', borderRadius: 8, padding: '8px 10px', border: pts >= 3 ? '1px solid #b2ddb8' : pts === 0 && pts !== null ? '1px solid #f09595' : '1px solid #e9ecef' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div className="avatar" style={{ width: 20, height: 20, fontSize: 8, background: av.bg, color: av.text }}>{initials(name)}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#495057' }}>{name}</span>
                      {pick.isBanker && <span style={{ fontSize: 10 }}>🏦</span>}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#212529' }}>{pick.winner}</div>
                    <div style={{ fontSize: 11, color: '#6c757d' }}>{pick.score1}–{pick.score2}</div>
                    {pts !== null && (
                      <div style={{ marginTop: 4 }}>
                        <span className={`badge ${pts > 0 ? 'badge-correct' : 'badge-wrong'}`} style={{ fontSize: 10 }}>
                          {pts > 0 ? `+${pts} pts` : '0 pts'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
