export const FIFA_RANKS = {
  'Argentina':1,'France':2,'England':3,'Brazil':4,'Belgium':5,'Portugal':6,
  'Netherlands':7,'Spain':8,'Germany':9,'Uruguay':10,'United States':11,
  'Mexico':12,'Switzerland':13,'Colombia':14,'Japan':15,'Croatia':16,
  'South Korea':17,'Morocco':18,'Senegal':19,'Ecuador':20,'Sweden':21,
  'Norway':22,'Türkiye':23,'Australia':24,'Czech Republic':25,'Canada':26,
  'Saudi Arabia':27,'Egypt':28,'Iran':29,'Scotland':30,'Ghana':31,
  'Ivory Coast':32,'Tunisia':33,'Panama':34,'Paraguay':35,'Austria':36,
  'Algeria':37,'New Zealand':38,'South Africa':39,'Bosnia & Herz.':40,
  'Cape Verde':41,'DR Congo':42,'Jordan':43,'Haiti':44,'Uzbekistan':45,
  'Curaçao':46,'Qatar':47,'Iraq':48,
}

export const FLAGS = {
  'Mexico':'🇲🇽','South Africa':'🇿🇦','South Korea':'🇰🇷','Czech Republic':'🇨🇿',
  'Canada':'🇨🇦','Bosnia & Herz.':'🇧🇦','Qatar':'🇶🇦','Switzerland':'🇨🇭',
  'Brazil':'🇧🇷','Morocco':'🇲🇦','Haiti':'🇭🇹','Scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'United States':'🇺🇸','Paraguay':'🇵🇾','Australia':'🇦🇺','Türkiye':'🇹🇷',
  'Germany':'🇩🇪','Curaçao':'🇨🇼','Ivory Coast':'🇨🇮','Ecuador':'🇪🇨',
  'Netherlands':'🇳🇱','Japan':'🇯🇵','Sweden':'🇸🇪','Tunisia':'🇹🇳',
  'Spain':'🇪🇸','Cape Verde':'🇨🇻','Saudi Arabia':'🇸🇦','Uruguay':'🇺🇾',
  'Belgium':'🇧🇪','Egypt':'🇪🇬','Iran':'🇮🇷','New Zealand':'🇳🇿',
  'France':'🇫🇷','Senegal':'🇸🇳','Iraq':'🇮🇶','Norway':'🇳🇴',
  'Argentina':'🇦🇷','Algeria':'🇩🇿','Austria':'🇦🇹','Jordan':'🇯🇴',
  'Portugal':'🇵🇹','DR Congo':'🇨🇩','Uzbekistan':'🇺🇿','Colombia':'🇨🇴',
  'England':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croatia':'🇭🇷','Ghana':'🇬🇭','Panama':'🇵🇦',
}

export const SCHEDULE = {
  'Jun 11': [
    { t1:'Mexico', t2:'South Africa', time:'3pm ET', venue:'Mexico City', group:'A', done:true, score:'2–0', winner:'Mexico', dateStr:'Jun 11' },
    { t1:'South Korea', t2:'Czech Republic', time:'10pm ET', venue:'Guadalajara', group:'A', done:true, score:'2–1', winner:'South Korea', dateStr:'Jun 11' },
  ],
  'Jun 12': [
    { t1:'Canada', t2:'Bosnia & Herz.', time:'3pm ET', venue:'Toronto', group:'B', dateStr:'Jun 12' },
    { t1:'United States', t2:'Paraguay', time:'9pm ET', venue:'Los Angeles', group:'D', dateStr:'Jun 12' },
  ],
  'Jun 13': [
    { t1:'Qatar', t2:'Switzerland', time:'3pm ET', venue:'Santa Clara', group:'B', dateStr:'Jun 13' },
    { t1:'Brazil', t2:'Morocco', time:'6pm ET', venue:'Houston', group:'C', dateStr:'Jun 13' },
    { t1:'Haiti', t2:'Scotland', time:'9pm ET', venue:'Dallas', group:'C', dateStr:'Jun 13' },
  ],
  'Jun 14': [
    { t1:'Australia', t2:'Türkiye', time:'12am ET', venue:'Vancouver', group:'D', dateStr:'Jun 14' },
    { t1:'Germany', t2:'Curaçao', time:'1pm ET', venue:'Houston', group:'E', dateStr:'Jun 14' },
    { t1:'Netherlands', t2:'Japan', time:'4pm ET', venue:'New York', group:'F', dateStr:'Jun 14' },
    { t1:'Ivory Coast', t2:'Ecuador', time:'7pm ET', venue:'Miami', group:'E', dateStr:'Jun 14' },
    { t1:'Sweden', t2:'Tunisia', time:'10pm ET', venue:'Seattle', group:'F', dateStr:'Jun 14' },
  ],
  'Jun 15': [
    { t1:'Spain', t2:'Cape Verde', time:'12pm ET', venue:'Atlanta', group:'H', dateStr:'Jun 15' },
    { t1:'Belgium', t2:'Egypt', time:'3pm ET', venue:'Seattle', group:'G', dateStr:'Jun 15' },
    { t1:'Saudi Arabia', t2:'Uruguay', time:'6pm ET', venue:'Miami', group:'H', dateStr:'Jun 15' },
    { t1:'Iran', t2:'New Zealand', time:'9pm ET', venue:'Los Angeles', group:'G', dateStr:'Jun 15' },
  ],
  'Jun 16': [
    { t1:'France', t2:'Senegal', time:'3pm ET', venue:'New York', group:'I', dateStr:'Jun 16' },
    { t1:'Iraq', t2:'Norway', time:'6pm ET', venue:'Boston', group:'I', dateStr:'Jun 16' },
    { t1:'Argentina', t2:'Algeria', time:'9pm ET', venue:'Kansas City', group:'J', dateStr:'Jun 16' },
  ],
  'Jun 17': [
    { t1:'Austria', t2:'Jordan', time:'12am ET', venue:'Santa Clara', group:'J', dateStr:'Jun 17' },
    { t1:'Portugal', t2:'DR Congo', time:'1pm ET', venue:'Houston', group:'K', dateStr:'Jun 17' },
    { t1:'England', t2:'Croatia', time:'4pm ET', venue:'Dallas', group:'L', dateStr:'Jun 17' },
    { t1:'Ghana', t2:'Panama', time:'7pm ET', venue:'Toronto', group:'L', dateStr:'Jun 17' },
    { t1:'Uzbekistan', t2:'Colombia', time:'10pm ET', venue:'Mexico City', group:'K', dateStr:'Jun 17' },
  ],
  'Jun 18': [
    { t1:'Czech Republic', t2:'South Africa', time:'12pm ET', venue:'Atlanta', group:'A', dateStr:'Jun 18' },
    { t1:'Switzerland', t2:'Bosnia & Herz.', time:'3pm ET', venue:'Los Angeles', group:'B', dateStr:'Jun 18' },
    { t1:'Canada', t2:'Qatar', time:'6pm ET', venue:'Dallas', group:'B', dateStr:'Jun 18' },
    { t1:'Mexico', t2:'South Korea', time:'9pm ET', venue:'Guadalajara', group:'A', dateStr:'Jun 18' },
  ],
  'Jun 19': [
    { t1:'United States', t2:'Australia', time:'3pm ET', venue:'Seattle', group:'D', dateStr:'Jun 19' },
    { t1:'Scotland', t2:'Morocco', time:'6pm ET', venue:'Houston', group:'C', dateStr:'Jun 19' },
    { t1:'Brazil', t2:'Haiti', time:'9pm ET', venue:'Miami', group:'C', dateStr:'Jun 19' },
  ],
  'Jun 20': [
    { t1:'Türkiye', t2:'Paraguay', time:'12am ET', venue:'San Francisco', group:'D', dateStr:'Jun 20' },
    { t1:'Netherlands', t2:'Sweden', time:'1pm ET', venue:'Dallas', group:'F', dateStr:'Jun 20' },
    { t1:'Germany', t2:'Ivory Coast', time:'4pm ET', venue:'New York', group:'E', dateStr:'Jun 20' },
    { t1:'Ecuador', t2:'Curaçao', time:'8pm ET', venue:'Boston', group:'E', dateStr:'Jun 20' },
  ],
  'Jun 21': [
    { t1:'Tunisia', t2:'Japan', time:'12am ET', venue:'Seattle', group:'F', dateStr:'Jun 21' },
    { t1:'Spain', t2:'Saudi Arabia', time:'12pm ET', venue:'Atlanta', group:'H', dateStr:'Jun 21' },
    { t1:'Belgium', t2:'Iran', time:'3pm ET', venue:'Los Angeles', group:'G', dateStr:'Jun 21' },
    { t1:'Uruguay', t2:'Cape Verde', time:'6pm ET', venue:'Miami', group:'H', dateStr:'Jun 21' },
    { t1:'New Zealand', t2:'Egypt', time:'9pm ET', venue:'Houston', group:'G', dateStr:'Jun 21' },
  ],
  'Jun 22': [
    { t1:'Argentina', t2:'Austria', time:'1pm ET', venue:'Dallas', group:'J', dateStr:'Jun 22' },
    { t1:'France', t2:'Iraq', time:'5pm ET', venue:'New York', group:'I', dateStr:'Jun 22' },
    { t1:'Norway', t2:'Senegal', time:'8pm ET', venue:'Kansas City', group:'I', dateStr:'Jun 22' },
    { t1:'Jordan', t2:'Algeria', time:'11pm ET', venue:'San Francisco', group:'J', dateStr:'Jun 22' },
  ],
  'Jun 23': [
    { t1:'Portugal', t2:'Uzbekistan', time:'1pm ET', venue:'Houston', group:'K', dateStr:'Jun 23' },
    { t1:'England', t2:'Ghana', time:'4pm ET', venue:'Dallas', group:'L', dateStr:'Jun 23' },
    { t1:'Panama', t2:'Croatia', time:'7pm ET', venue:'Toronto', group:'L', dateStr:'Jun 23' },
    { t1:'Colombia', t2:'DR Congo', time:'10pm ET', venue:'Mexico City', group:'K', dateStr:'Jun 23' },
  ],
}

export function calcProbs(t1, t2) {
  const r1 = FIFA_RANKS[t1] || 35
  const r2 = FIFA_RANKS[t2] || 35
  const diff = (r2 - r1) * 1.1
  const raw1 = 50 + diff * 0.55
  const c1 = Math.min(82, Math.max(18, raw1))
  const draw = 20
  const rem = 100 - draw
  const p1 = Math.round((c1 / 100) * rem)
  const p2 = rem - p1
  return { p1, p2, draw }
}

export function winVerdict(p1, t1, p2, t2) {
  const hi = Math.max(p1, p2)
  const fav = p1 > p2 ? t1 : t2
  if (hi >= 60) return { text: `${fav} to win`, strength: 'strong' }
  if (hi >= 52) return { text: `${fav} slight edge`, strength: 'lean' }
  return { text: 'Too close to call', strength: 'toss' }
}

export const TODAY_KEY = 'Jun 12'

// All games as flat list for pick tab
export function getAllUpcomingGames() {
  const all = []
  Object.entries(SCHEDULE).forEach(([dateStr, games]) => {
    games.forEach(g => {
      if (!g.done) all.push({ ...g, dateStr })
    })
  })
  return all
}
