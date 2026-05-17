import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { aiApi } from './api'
import { makeTestStore } from '../../test/renderWithProviders'

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('aiApi.processAi', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  async function readRequestBody(call: Parameters<typeof fetch>): Promise<unknown> {
    const [input, init] = call
    if (input instanceof Request) {
      const text = await input.clone().text()
      return text ? JSON.parse(text) : {}
    }
    if (init?.body) {
      const text =
        typeof init.body === 'string' ? init.body : await new Response(init.body as BodyInit).text()
      return text ? JSON.parse(text) : {}
    }
    return {}
  }

  it('posts a translate request and returns translation + source language', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        action: 'translate',
        source_language: 'en',
        translation: 'привет',
      }),
    )
    const store = makeTestStore({ auth: { accessToken: 'tok' } })
    const result = await store
      .dispatch(
        aiApi.endpoints.processAi.initiate({
          action: 'translate',
          message: 'hello',
          target_language: 'ru',
        }),
      )
      .unwrap()
    expect(result.translation).toBe('привет')
    expect(result.source_language).toBe('en')
    expect(fetchMock).toHaveBeenCalledOnce()
    const body = await readRequestBody(fetchMock.mock.calls[0])
    expect(body).toEqual({
      action: 'translate',
      message: 'hello',
      target_language: 'ru',
    })
  })

  it('posts a summarize request with the conversation array', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        action: 'summarize',
        source_language: 'en',
        summary: 'two people said hi',
      }),
    )
    const store = makeTestStore({ auth: { accessToken: 'tok' } })
    const conversation = [
      { role: 'user', content: 'alice: hi' },
      { role: 'user', content: 'bob: hello' },
    ]
    const result = await store
      .dispatch(
        aiApi.endpoints.processAi.initiate({
          action: 'summarize',
          conversation,
        }),
      )
      .unwrap()
    expect(result.summary).toBe('two people said hi')
    const body = (await readRequestBody(fetchMock.mock.calls[0])) as {
      action: string
      conversation: unknown[]
    }
    expect(body.action).toBe('summarize')
    expect(body.conversation).toEqual(conversation)
  })

  it('surfaces 429 errors with the rate-limit detail', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: 'too many requests' }, { status: 429 }))
    const store = makeTestStore({ auth: { accessToken: 'tok' } })
    const err = await store
      .dispatch(
        aiApi.endpoints.processAi.initiate({
          action: 'translate',
          message: 'hello',
          target_language: 'ru',
        }),
      )
      .unwrap()
      .catch((e: unknown) => e)
    const e = err as { status: number; data: { detail: string } }
    expect(e.status).toBe(429)
    expect(e.data.detail).toBe('too many requests')
  })
})
