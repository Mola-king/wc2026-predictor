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
  { name: 'Leanner',   pin: '6789' },
  { name: 'Annie',     pin: '7890' },
  { name: 'Shadwin',   pin: '1357' },
  { name: 'Danusha',   pin: '2468' },
  { name: 'Tshepo',    pin: '1122' },
  { name: 'Thabo',     pin: '3344' },
]

// Admin PIN — change this!
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
