import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'helm_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const authFetch = useCallback(async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api${path}`, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined })
    return res
  }, [token])

  useEffect(() => {
    if (!token) { setReady(true); return }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setUser(d.user))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken('') })
      .finally(() => setReady(true))
  }, [token])

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token); setUser(data.user)
  }
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(''); setUser(null) }

  return <AuthContext.Provider value={{ token, user, ready, login, logout, authFetch }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
