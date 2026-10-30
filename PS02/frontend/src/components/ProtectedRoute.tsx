import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/" replace />
}
