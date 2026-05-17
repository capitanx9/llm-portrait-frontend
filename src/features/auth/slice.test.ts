import { describe, it, expect, beforeEach } from 'vitest'
import {
  authReducer,
  setCredentials,
  setUser,
  clearCredentials,
  type AuthState,
} from './slice'

const empty: AuthState = { accessToken: null, refreshToken: null, user: null }

describe('authSlice', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('stores tokens on setCredentials', () => {
    const next = authReducer(empty, setCredentials({ access: 'a', refresh: 'r' }))
    expect(next.accessToken).toBe('a')
    expect(next.refreshToken).toBe('r')
  })

  it('updates access only when refresh is omitted (refresh flow)', () => {
    const seeded: AuthState = { accessToken: 'old', refreshToken: 'r', user: null }
    const next = authReducer(seeded, setCredentials({ access: 'new' }))
    expect(next.accessToken).toBe('new')
    expect(next.refreshToken).toBe('r')
  })

  it('stores user via setUser without touching tokens', () => {
    const seeded: AuthState = { accessToken: 'a', refreshToken: 'r', user: null }
    const next = authReducer(
      seeded,
      setUser({ id: 1, username: 'oleksa', email: 'o@e.com' }),
    )
    expect(next.user).toEqual({ id: 1, username: 'oleksa', email: 'o@e.com' })
    expect(next.accessToken).toBe('a')
  })

  it('clears everything on clearCredentials', () => {
    const seeded: AuthState = {
      accessToken: 'a',
      refreshToken: 'r',
      user: { id: 1, username: 'u', email: 'e@e.com' },
    }
    const next = authReducer(seeded, clearCredentials())
    expect(next).toEqual(empty)
  })

  it('persists to sessionStorage on every change', () => {
    authReducer(empty, setCredentials({ access: 'a', refresh: 'r' }))
    const raw = sessionStorage.getItem('llm-portrait.auth')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toMatchObject({ accessToken: 'a', refreshToken: 'r' })
  })
})
