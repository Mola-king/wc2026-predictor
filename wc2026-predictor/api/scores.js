// Vercel serverless function — proxies API-Football so CORS is never an issue.
// The browser calls /api/scores, this function calls API-Football server-side.

const API_KEY = '34af3dd85455f161456e3af1e94bc1e7'
const API_BASE = 'https://v3.football.api-sports.io'
const WC_LEAGUE = 1
const WC_SEASON = 2026

const TEAM_NAME_MAP = {
  'United States':   ['USA', 'United States'],
  'Bosnia & Herz.':  ['Bosnia', 'Bosnia and Herzegovina', 'Bosnia & Herzegovina'],
  'Curaçao':         ['Curacao', 'Curaçao'],
  'Türkiye':         ['Turkey', 'Türkiye'],
  'DR Congo':        ['DR Congo', 'Congo DR', 'Democratic Republic of Congo'],
  'South Korea':     ['South Korea', 'Korea Republic'],
  "Ivory Coast":     ["Ivory Coast", "Côte d'Ivoire"],
}

function normalizeName(apiName) {
  for (const [ours, variants] of Object.entries(TEAM_NAME_MAP)) {
    if (variants.some(v => v.toLowerCase() === apiName.toLowerCase())) return ours
  }
  return apiName
}

export default async function handler(req, res) {
  // Allow browser to call this
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    // Fetch today's fixtures + live matches
    const today = new Date().toISOString().slice(0, 10)

    const [todayRes, liveRes] = await Promise.all([
      fetch(`${API_BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&date=${today}`, {
        headers: { 'x-apisports-key': API_KEY }
      }),
      fetch(`${API_BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&live=all`, {
        headers: { 'x-apisports-key': API_KEY }
      })
    ])

    const [todayData, liveData] = await Promise.all([
      todayRes.json(),
      liveRes.json()
    ])

    // Merge and deduplicate by fixture id
    const allFixtures = [...(todayData.response || []), ...(liveData.response || [])]
    const seen = new Set()
    const fixtures = allFixtures.filter(f => {
      if (seen.has(f.fixture.id)) return false
      seen.add(f.fixture.id)
      return true
    })

    const FINISHED = ['FT', 'AET', 'PEN', 'FT_PEN']
    const IN_PLAY  = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']

    const scores = {}

    fixtures.forEach(fix => {
      const status = fix.fixture.status.short
      const isFinished = FINISHED.includes(status)
      const isLive     = IN_PLAY.includes(status)
      if (!isFinished && !isLive) return

      const home = normalizeName(fix.teams.home.name)
      const away = normalizeName(fix.teams.away.name)
      const homeGoals = fix.goals.home ?? 0
      const awayGoals = fix.goals.away ?? 0

      // Build a key that matches our matchKey format
      // We store both orientations so we can match regardless of home/away order
      const key1 = `${home}_${away}`.replace(/[^a-zA-Z0-9_]/g, '_')
      const key2 = `${away}_${home}`.replace(/[^a-zA-Z0-9_]/g, '_')

      const entry = {
        home, away, homeGoals, awayGoals,
        status: isFinished ? 'FT' : status,
        label: isFinished ? 'Full time' : `Live · ${status}`,
        isFinished
      }

      scores[key1] = entry
      scores[key2] = { ...entry, homeGoals: awayGoals, awayGoals: homeGoals }
    })

    res.status(200).json({ ok: true, scores, fetchedAt: new Date().toISOString() })

  } catch (err) {
    console.error('API-Football proxy error:', err)
    res.status(500).json({ ok: false, error: err.message })
  }
}
