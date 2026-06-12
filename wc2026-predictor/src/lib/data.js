export const PLAYERS = [
  { name: 'Prince',    pin: '1111' },
  { name: 'Phango',    pin: '2222' },
  { name: 'Nikola',    pin: '3333' },
  { name: 'Tinus',     pin: '4444' },
  { name: 'Graeme',    pin: '5555' },
  { name: 'Sharneece', pin: '6666' },
  { name: 'Hamish',    pin: '7777' },
  { name: 'Jaco',      pin: '8888' },
  { name: 'Mojalefa',  pin: '9999' },
  { name: 'Ramotse',   pin: '1234' },
  { name: 'David',     pin: '2345' },
  { name: 'Charles',   pin: '3456' },
  { name: 'Chanchal',  pin: '4567' },
  { name: 'Hannes',    pin: '5678' },
  { name: 'Leanne',    pin: '6789' },
  { name: 'Annie',     pin: '7890' },
  { name: 'Shadwin',   pin: '1357' },
  { name: 'Danusha',   pin: '2468' },
  { name: 'Tshepo',    pin: '1122' },
  { name: 'Thabo',     pin: '3344' },
]

export const ADMIN_PIN = '0000'

export const GROUPS = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  B: ['Canada', 'Bosnia & Herz.', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Türkiye'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
}

export const WC_TEAMS = [
  'Argentina','Brazil','France','England','Spain','Germany','Portugal','Netherlands',
  'Belgium','Uruguay','Colombia','Japan','Croatia','Morocco','Senegal','United States',
  'Mexico','Switzerland','South Korea','Ecuador','Sweden','Norway','Türkiye','Australia',
  'Czech Republic','Canada','Saudi Arabia','Egypt','Iran','Scotland','Ghana','Ivory Coast',
  'Tunisia','Panama','Paraguay','Austria','Algeria','New Zealand','South Africa',
  'Bosnia & Herz.','Cape Verde','DR Congo','Jordan','Haiti','Uzbekistan','Curaçao','Qatar','Iraq'
]

export const AVATAR_COLORS = [
  { bg: '#E6F1FB', text: '#0C447C' },
  { bg: '#EAF3DE', text: '#27500A' },
  { bg: '#FAEEDA', text: '#633806' },
  { bg: '#EEEDFE', text: '#3C3489' },
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#FBEAF0', text: '#72243E' },
  { bg: '#FAECE7', text: '#712B13' },
  { bg: '#F1EFE8', text: '#2C2C2A' },
]

export function getMatchups(group) {
  const teams = GROUPS[group]
  const matchups = []
  for (let i = 0; i < teams.length; i++)
    for (let j = i + 1; j < teams.length; j++)
      matchups.push({ t1: teams[i], t2: teams[j], group })
  return matchups
}

export function matchKey(m) {
  return `${m.group}_${m.t1}_${m.t2}`.replace(/[^a-zA-Z0-9_]/g, '_')
}

export function scorePick(pred, result) {
  let pts = 0
  if (pred.winner === result.winner) pts += 3
  if (pred.score1 === result.score1 && pred.score2 === result.score2) pts += 2
  return pts
}

export function getAvatarColor(playerName) {
  const idx = PLAYERS.findIndex(p => p.name === playerName)
  return AVATAR_COLORS[Math.abs(idx) % AVATAR_COLORS.length]
}

export function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function isMatchLocked(game, adminLocks = {}) {
  if (!game) return false
  if (game.done) return true
  if (adminLocks[matchKey(game)]) return true
  const kickoff = parseKickoff(game.dateStr, game.time)
  if (!kickoff) return false
  return new Date() >= new Date(kickoff.getTime() - 60 * 60 * 1000)
}

export function parseKickoff(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  try {
    const match = timeStr.match(/(\d+)(am|pm)\s*ET/i)
    if (!match) return null
    let hour = parseInt(match[1])
    const ampm = match[2].toLowerCase()
    if (ampm === 'pm' && hour !== 12) hour += 12
    if (ampm === 'am' && hour === 12) hour = 0
    const utcHour = hour + 4
    const d = new Date(`${dateStr} 2026 UTC`)
    d.setUTCHours(utcHour, 0, 0, 0)
    return d
  } catch { return null }
}

export function getTimeUntilLock(game) {
  const kickoff = parseKickoff(game.dateStr, game.time)
  if (!kickoff) return null
  const cutoff = new Date(kickoff.getTime() - 60 * 60 * 1000)
  const diff = cutoff - new Date()
  if (diff <= 0) return null
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `Locks in ${h}h ${m}m`
  return `Locks in ${m}m`
}

export function computeStreaks(predictions, results) {
  // per player: current streak, max streak
  const streaks = {}
  PLAYERS.forEach(p => { streaks[p.name] = { current: 0, max: 0 } })
  const byPlayer = {}
  predictions.forEach(pred => {
    if (!byPlayer[pred.player]) byPlayer[pred.player] = []
    byPlayer[pred.player].push(pred)
  })
  Object.entries(byPlayer).forEach(([name, preds]) => {
    const scored = preds.filter(p => results[p.matchKey]).sort((a,b) => a.ts - b.ts)
    let cur = 0, max = 0
    scored.forEach(p => {
      if (scorePick(p, results[p.matchKey]) >= 3) { cur++; max = Math.max(max, cur) }
      else cur = 0
    })
    streaks[name] = { current: cur, max }
  })
  return streaks
}
