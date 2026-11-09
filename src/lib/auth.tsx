// Connexion Google via Google Identity Services (flux "token", 100 % côté navigateur).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { clientId } from './config'

const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly openid email profile'
const TOKEN_KEY = 'youfree:token'

interface Token {
  access: string
  expiresAt: number
}
export interface GoogleUser {
  name: string
  email: string
  picture: string
}

interface AuthState {
  user: GoogleUser | null
  token: string | null
  available: boolean
  signIn: () => void
  signOut: () => void
  error: string | null
}

// Lu par le client API sans passer par React.
let currentToken: Token | null = null
try {
  const raw = sessionStorage.getItem(TOKEN_KEY)
  if (raw) {
    const t = JSON.parse(raw) as Token
    if (t.expiresAt > Date.now() + 60_000) currentToken = t
  }
} catch {
  /* ignore */
}
export const accessToken = () => (currentToken && currentToken.expiresAt > Date.now() ? currentToken.access : null)

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any
  }
}

let gisPromise: Promise<void> | null = null
function loadGis() {
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Impossible de charger Google Identity Services'))
      document.head.appendChild(s)
    })
  }
  return gisPromise
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(accessToken())
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const available = !!clientId()

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Session expirée'))))
      .then((u) => setUser({ name: u.name, email: u.email, picture: u.picture }))
      .catch(() => {
        currentToken = null
        sessionStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
  }, [token])

  const signIn = useCallback(async () => {
    setError(null)
    try {
      await loadGis()
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId(),
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            setError(resp.error_description || resp.error)
            return
          }
          currentToken = { access: resp.access_token, expiresAt: Date.now() + Number(resp.expires_in) * 1000 }
          sessionStorage.setItem(TOKEN_KEY, JSON.stringify(currentToken))
          setToken(resp.access_token)
        },
        error_callback: (err: any) => setError(err?.message || 'Connexion annulée'),
      })
      client.requestAccessToken()
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const signOut = useCallback(() => {
    const t = accessToken()
    if (t && window.google) window.google.accounts.oauth2.revoke(t, () => {})
    currentToken = null
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem('youfree:feed')
    setToken(null)
  }, [])

  return <Ctx.Provider value={{ user, token, available, signIn, signOut, error }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth hors AuthProvider')
  return v
}
