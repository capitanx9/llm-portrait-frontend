import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  id: number
  username: string
  email: string
}

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
}

const STORAGE_KEY = 'llm-portrait.auth'

function hydrate(): AuthState {
  if (typeof sessionStorage === 'undefined') {
    return { accessToken: null, refreshToken: null, user: null }
  }
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return { accessToken: null, refreshToken: null, user: null }
  try {
    const parsed = JSON.parse(raw) as AuthState
    return {
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      user: parsed.user ?? null,
    }
  } catch {
    return { accessToken: null, refreshToken: null, user: null }
  }
}

function persist(state: AuthState): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const authSlice = createSlice({
  name: 'auth',
  initialState: hydrate(),
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ access: string; refresh?: string; user?: AuthUser }>,
    ) {
      state.accessToken = action.payload.access
      if (action.payload.refresh !== undefined) {
        state.refreshToken = action.payload.refresh
      }
      if (action.payload.user !== undefined) {
        state.user = action.payload.user
      }
      persist(state)
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      persist(state)
    },
    clearCredentials(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      persist(state)
    },
  },
})

export const { setCredentials, setUser, clearCredentials } = authSlice.actions
export const authReducer = authSlice.reducer
