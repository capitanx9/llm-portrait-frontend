import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { clearCredentials, setCredentials } from '../features/auth/slice'
import type { RootState } from '../app/store'

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv) return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/`
  }
  return 'http://localhost/'
}

const API_BASE_URL = resolveApiBaseUrl()

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status !== 401) return result

  const refreshToken = (api.getState() as RootState).auth.refreshToken
  if (!refreshToken) {
    api.dispatch(clearCredentials())
    return result
  }

  const refreshResult = await rawBaseQuery(
    {
      url: '/api/auth/refresh/',
      method: 'POST',
      body: { refresh: refreshToken },
    },
    api,
    extraOptions,
  )

  const data = refreshResult.data as { access?: string } | undefined
  if (data?.access) {
    api.dispatch(setCredentials({ access: data.access }))
    result = await rawBaseQuery(args, api, extraOptions)
  } else {
    api.dispatch(clearCredentials())
  }

  return result
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: ['Me', 'Room', 'Messages'],
})
