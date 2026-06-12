import { useState, useCallback } from 'react'
import LoginScreen from './components/LoginScreen'
import PickTab from './components/PickTab'
import LeaderboardTab from './components/LeaderboardTab'
import ResultsTab from './components/ResultsTab'
import AdminTab from './components/AdminTab'
import SquadTab from './components/SquadTab'
import FixturesTab from './components/FixturesTab'
import { getAvatarColor, initials } from './lib/data'

function NavIcon({ tab }) {
  const icons = {
    fixtures: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    pick: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    leaderboard: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    results: <><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
    squad: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    admin: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M16.95 16.95l1.41 1.41M5.05 16.95l-1.41 1.41"/></>,
  }
  return <svg viewBox="0 0 24 24">{icons[tab]}</svg>
}

export default function App() {
  const [player, setPlayer] = useState(null)
  const [tab, setTab] = useState('fixtures')
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  if (!player) return <LoginScreen onLogin={setPlayer} />

  const tabs = player.isAdmin
    ? [
        { id: 'fixtures',    label: 'Fixtures' },
        { id: 'leaderboard', label: 'Standings' },
        { id: 'results',     label: 'Results' },
        { id: 'squad',       label: 'Squad' },
        { id: 'admin',       label: 'Admin' },
      ]
    : [
        { id: 'fixtures',    label: 'Fixtures' },
        { id: 'pick',        label: 'Pick' },
        { id: 'leaderboard', label: 'Standings' },
        { id: 'results',     label: 'Results' },
        { id: 'squad',       label: 'Squad' },
      ]

  const av = getAvatarColor(player.name)

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title"><span>⚽</span> World Cup 2026</div>
          <div className="header-user" onClick={() => setPlayer(null)}>
            <div className="avatar avatar-sm" style={{ background: av.bg, color: av.text }}>{initials(player.name)}</div>
            <span>{player.name}</span>
            <button className="btn btn-logout" style={{ marginLeft: 4 }}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      <main className="app-shell" style={{ paddingTop: 20 }}>
        {tab === 'fixtures'    && <FixturesTab />}
        {tab === 'pick'        && !player.isAdmin && <PickTab player={player} onToast={showToast} />}
        {tab === 'leaderboard' && <LeaderboardTab currentPlayer={player} />}
        {tab === 'results'     && <ResultsTab currentPlayer={player} />}
        {tab === 'squad'       && <SquadTab />}
        {tab === 'admin'       && player.isAdmin && <AdminTab onToast={showToast} />}
      </main>

      <nav className="bottom-nav">
        {tabs.map(t => (
          <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <NavIcon tab={t.id} />
            {t.label}
          </button>
        ))}
      </nav>
    </>
  )
}
