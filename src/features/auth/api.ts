import { baseApi } from '../../api/baseApi'
import type { components } from '../../api/schema'
import { clearCredentials, setCredentials, setUser, type AuthUser } from './slice'

type LoginRequest = { username: string; password: string }
type LoginResponse = { access: string; refresh: string }

type RegisterRequest = { username: string; email: string; password: string }
type RegisterResponse = components['schemas']['Register']

type RefreshResponse = { access: string }
type LogoutRequest = { refresh: string }

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: '/api/auth/register/',
        method: 'POST',
        body,
      }),
    }),

    login: build.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({
        url: '/api/auth/login/',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setCredentials({ access: data.access, refresh: data.refresh }))
        } catch {
          /* surface error via mutation result */
        }
      },
    }),

    refresh: build.mutation<RefreshResponse, { refresh: string }>({
      query: (body) => ({
        url: '/api/auth/refresh/',
        method: 'POST',
        body,
      }),
    }),

    logout: build.mutation<void, LogoutRequest>({
      query: (body) => ({
        url: '/api/auth/logout/',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled
        } finally {
          dispatch(clearCredentials())
        }
      },
    }),

    me: build.query<AuthUser, void>({
      query: () => ({ url: '/api/auth/me/' }),
      providesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch {
          /* ignore — interceptor handles 401 */
        }
      },
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useMeQuery,
} = authApi
