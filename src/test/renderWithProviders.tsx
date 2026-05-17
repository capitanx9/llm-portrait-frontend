import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore, type Reducer } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { baseApi } from '../api/baseApi'
import { authReducer, type AuthState } from '../features/auth/slice'
import { chatReducer, type ChatState } from '../features/chat/slice'

export type TestRootState = {
  auth: AuthState
  chat: ChatState
  [k: string]: unknown
}

export function makeTestStore(preloaded?: {
  auth?: Partial<AuthState>
  chat?: Partial<ChatState>
}) {
  const auth: AuthState = {
    accessToken: null,
    refreshToken: null,
    user: null,
    ...preloaded?.auth,
  }
  const chat: ChatState = {
    activeRoomName: null,
    ...preloaded?.chat,
  }
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer as Reducer,
      auth: authReducer,
      chat: chatReducer,
    },
    middleware: (gDM) => gDM().concat(baseApi.middleware),
    preloadedState: { auth, chat },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: {
    preloadedAuth?: Partial<AuthState>
    preloadedChat?: Partial<ChatState>
    route?: string
    renderOptions?: Omit<RenderOptions, 'wrapper'>
  },
) {
  const store = makeTestStore({
    auth: options?.preloadedAuth,
    chat: options?.preloadedChat,
  })
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
