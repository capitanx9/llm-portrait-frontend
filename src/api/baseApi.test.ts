import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { baseApi } from './baseApi'
import { makeTestStore } from '../test/renderWithProviders'

const probeApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    probe: build.query<{ ok: boolean }, void>({
      query: () => ({ url: '/api/protected/' }),
    }),
  }),
  overrideExisting: false,
})

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
}

describe('baseQueryWithReauth', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    sessionStorage.clear()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function urlOf(call: Parameters<typeof fetch>): string {
    const [input] = call
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.href
    return (input as Request).url
  }

  it('refreshes the token on 401 and retries the original request', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ access: 'new-access' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    const store = makeTestStore({ accessToken: 'old', refreshToken: 'r' })

    const result = await store.dispatch(probeApi.endpoints.probe.initiate()).unwrap()

    expect(result).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(urlOf(fetchMock.mock.calls[0])).toContain('/api/protected/')
    expect(urlOf(fetchMock.mock.calls[1])).toContain('/api/auth/refresh/')
    expect(urlOf(fetchMock.mock.calls[2])).toContain('/api/protected/')
    expect((store.getState() as { auth: { accessToken: string | null } }).auth.accessToken).toBe(
      'new-access',
    )
  })

  it('clears credentials when refresh also fails', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: 'expired' }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ detail: 'bad refresh' }, { status: 401 }))

    const store = makeTestStore({ accessToken: 'old', refreshToken: 'r' })

    await store
      .dispatch(probeApi.endpoints.probe.initiate())
      .unwrap()
      .catch(() => null)

    const auth = (
      store.getState() as {
        auth: { accessToken: string | null; refreshToken: string | null }
      }
    ).auth
    expect(auth.accessToken).toBeNull()
    expect(auth.refreshToken).toBeNull()
  })
})
