import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ChatPage } from './ChatPage'

const wsHookMock = vi.fn<(...args: [string | null, unknown?]) => unknown>(() => ({
  sendJsonMessage: vi.fn(),
  lastJsonMessage: null,
  readyState: 1,
}))

vi.mock('react-use-websocket', () => ({
  default: (...args: [string | null, unknown?]) => wsHookMock(...args),
  ReadyState: { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 },
}))

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('<ChatPage />', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    wsHookMock.mockClear()
    globalThis.fetch = vi.fn(async () =>
      jsonResponse({ count: 0, next: null, previous: null, results: [] }),
    ) as unknown as typeof fetch
  })

  it('renders the placeholder when no room is selected', () => {
    renderWithProviders(<ChatPage />, {
      preloadedAuth: { accessToken: 't', refreshToken: 'r' },
    })
    expect(screen.getByText(/pick a room on the left/i)).toBeInTheDocument()
  })

  it('shows the active room name when one is selected', async () => {
    renderWithProviders(<ChatPage />, {
      preloadedAuth: { accessToken: 't', refreshToken: 'r' },
      preloadedChat: { activeRoomName: 'general' },
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'general' })).toBeInTheDocument()
    })
  })

  it('opens the WebSocket with the room name and access token in the URL', async () => {
    renderWithProviders(<ChatPage />, {
      preloadedAuth: { accessToken: 'secret-token', refreshToken: 'r' },
      preloadedChat: { activeRoomName: 'general' },
    })
    await waitFor(() => {
      expect(wsHookMock).toHaveBeenCalled()
    })
    const [url] = wsHookMock.mock.calls.at(-1) ?? []
    expect(url).toContain('/ws/chat/general/')
    expect(url).toContain('token=secret-token')
  })

  it('does not open a WebSocket when no room is active', async () => {
    renderWithProviders(<ChatPage />, {
      preloadedAuth: { accessToken: 't', refreshToken: 'r' },
    })
    await waitFor(() => {
      expect(wsHookMock).toHaveBeenCalled()
    })
    const [url] = wsHookMock.mock.calls.at(-1) ?? []
    expect(url).toBeNull()
  })
})
