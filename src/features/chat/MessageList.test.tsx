import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessageList } from './MessageList'
import type { ChatMessage } from './api'

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const sample: ChatMessage[] = [
  {
    id: 1,
    sender: 'alice',
    text: 'hello',
    created_at: '2026-05-17T10:00:00Z',
  },
  {
    id: 2,
    sender: 'bob',
    text: 'hi',
    created_at: '2026-05-17T10:01:00Z',
  },
]

describe('<MessageList />', () => {
  it('renders each message with sender and text', () => {
    render(
      <MessageList
        messages={sample}
        isLoading={false}
        isError={false}
        hasMore={false}
        onLoadOlder={() => {}}
        isFetchingOlder={false}
      />,
    )
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('bob')).toBeInTheDocument()
    expect(screen.getByText('hi')).toBeInTheDocument()
  })

  it('shows "Load older" button when hasMore and fires onLoadOlder on click', () => {
    const onLoadOlder = vi.fn()
    render(
      <MessageList
        messages={sample}
        isLoading={false}
        isError={false}
        hasMore={true}
        onLoadOlder={onLoadOlder}
        isFetchingOlder={false}
      />,
    )
    const btn = screen.getByRole('button', { name: /load older/i })
    fireEvent.click(btn)
    expect(onLoadOlder).toHaveBeenCalledOnce()
  })

  it('hides "Load older" button when hasMore is false', () => {
    render(
      <MessageList
        messages={sample}
        isLoading={false}
        isError={false}
        hasMore={false}
        onLoadOlder={() => {}}
        isFetchingOlder={false}
      />,
    )
    expect(screen.queryByRole('button', { name: /load older/i })).not.toBeInTheDocument()
  })

  it('shows error state', () => {
    render(
      <MessageList
        messages={[]}
        isLoading={false}
        isError={true}
        hasMore={false}
        onLoadOlder={() => {}}
        isFetchingOlder={false}
      />,
    )
    expect(screen.getByText(/could not load messages/i)).toBeInTheDocument()
  })
})
