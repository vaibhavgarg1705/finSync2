import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', roles: ['Viewer', 'Reviewer', 'Admin'] },
  { to: '/import', label: 'Import', roles: ['Reviewer', 'Admin'] },
  { to: '/queue', label: 'Queue', roles: ['Viewer', 'Reviewer', 'Admin'] },
  { to: '/history', label: 'History', roles: ['Viewer', 'Reviewer', 'Admin'] },
  { to: '/reports', label: 'Reports', roles: ['Viewer', 'Reviewer', 'Admin'] },
]

export default function Layout() {
  const role = useAuth((s) => s.role)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">Recon</div>
        <nav>
          {NAV.filter((n) => role && n.roles.includes(role)).map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="role-pill">{role}</span>
          <button onClick={() => { logout(); nav('/') }}>Sign out</button>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
