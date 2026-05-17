import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, type Reducer } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { baseApi } from '../api/baseApi'
import { authReducer, type AuthState } from '../features/auth/slice'

export type TestRootState = {
  auth: AuthState
  [k: string]: unknown
}

export function makeTestStore(preloadedAuth?: Partial<AuthState>) {
  const auth: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    ...preloadedAuth,
  }
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer as Reducer,
      auth: authReducer,
    },
    middleware: (gDM) => gDM().concat(baseApi.middleware),
    preloadedState: { auth },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: {
    preloadedAuth?: Partial<AuthState>
    route?: string
    renderOptions?: Omit<RenderOptions, 'wrapper'>
  },
) {
  const store = makeTestStore(options?.preloadedAuth)
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[options?.route ?? '/']}>{children}</MemoryRouter>
      </Provider>
    )
  }
  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...options?.renderOptions }),
  }
}
