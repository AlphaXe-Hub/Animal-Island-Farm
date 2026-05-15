import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, getToken, setToken } from '../api/client'
import type { UserJson } from '../types'

interface AuthState {
  user: UserJson | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  applyUser: (u: UserJson) => void
  logout: () => void
  setAuthToken: (token: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserJson | null>(null)
  const [loading, setLoading] = useState(!!getToken())
  const [error, setError] = useState<string | null>(null)

  const refreshUser = useCallback(async () => {
    const t = getToken()
    if (!t) {
      setUser(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const u = await apiFetch<UserJson>('/api/me')
      setUser(u)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const setAuthToken = useCallback(async (token: string) => {
    setToken(token)
    await refreshUser()
  }, [refreshUser])

  const applyUser = useCallback((u: UserJson) => {
    setUser(u)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      applyUser,
      logout,
      setAuthToken,
    }),
    [user, loading, error, refreshUser, applyUser, logout, setAuthToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
