import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Hero3D from '../components/Hero3D'
import { useAuth } from '../state/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuth((s) => s.login)
  const nav = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      nav('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    }
  }

  return (
    <div className="login-page">
      <Hero3D />
      <div className="login-card">
        <h1>Reconciliation</h1>
        <p className="muted">Match invoices and payments with evidence.</p>
        <form onSubmit={submit}>
          <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  )
}
