import { create } from 'zustand'
import { api } from '../api/client'

type Role = 'Viewer' | 'Reviewer' | 'Admin'

interface AuthState {
  token: string | null
  role: Role | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  role: null,
  async login(username, password) {
    const res = await api.post<{ token: string; role: Role }>('/auth/login', { username, password })
    api.setToken(res.token)
    set({ token: res.token, role: res.role })
  },
  logout() {
    api.setToken(null)
    set({ token: null, role: null })
  },
}))
