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
    reactions: [],
  },
  {
    id: 2,
    sender: 'bob',
    text: 'hi',
    created_at: '2026-05-17T10:01:00Z',
    reactions: [],
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

  it('renders inline translation when one is provided for a message', () => {
    render(
      <MessageList
        messages={sample}
        isLoading={false}
        isError={false}
        hasMore={false}
        onLoadOlder={() => {}}
        isFetchingOlder={false}
        translations={{
          1: {
            status: 'ready',
            targetLanguage: 'fr',
            sourceLanguage: 'en',
            text: 'bonjour',
          },
        }}
      />,
    )
    expect(screen.getByText('bonjour')).toBeInTheDocument()
    expect(screen.getByText(/EN.+FR/)).toBeInTheDocument()
  })

  it('fires onMessageContextMenu when a message is right-clicked', () => {
    const onContext = vi.fn()
    render(
      <MessageList
        messages={sample}
        isLoading={false}
        isError={false}
        hasMore={false}
        onLoadOlder={() => {}}
        isFetchingOlder={false}
        onMessageContextMenu={onContext}
      />,
    )
    fireEvent.contextMenu(screen.getByText('hello'))
    expect(onContext).toHaveBeenCalledOnce()
    expect(onContext.mock.calls[0][0].id).toBe(1)
  })

  describe('reactions', () => {
    const withReactions: ChatMessage[] = [
      {
        id: 7,
        sender: 'alice',
        text: 'hello',
        created_at: '2026-05-17T10:00:00Z',
        reactions: [
          { emoji: '👍', count: 2, me: false },
          { emoji: '❤️', count: 1, me: true },
        ],
      },
    ]

    it('renders a chip per reaction with count', () => {
      render(
        <MessageList
          messages={withReactions}
          isLoading={false}
          isError={false}
          hasMore={false}
          onLoadOlder={() => {}}
          isFetchingOlder={false}
          onReactionToggle={() => {}}
        />,
      )
      expect(screen.getByText('👍 2')).toBeInTheDocument()
      expect(screen.getByText('❤️ 1')).toBeInTheDocument()
    })

    it('fires onReactionToggle with currentlyMine=false when clicking a chip the user has not reacted with', () => {
      const onToggle = vi.fn()
      render(
        <MessageList
          messages={withReactions}
          isLoading={false}
          isError={false}
          hasMore={false}
          onLoadOlder={() => {}}
          isFetchingOlder={false}
          onReactionToggle={onToggle}
        />,
      )
      fireEvent.click(screen.getByText('👍 2'))
      expect(onToggle).toHaveBeenCalledOnce()
      const [msg, emoji, mine] = onToggle.mock.calls[0]
      expect(msg.id).toBe(7)
      expect(emoji).toBe('👍')
      expect(mine).toBe(false)
    })

    it('fires onReactionToggle with currentlyMine=true when clicking the user’s own chip', () => {
      const onToggle = vi.fn()
      render(
        <MessageList
          messages={withReactions}
          isLoading={false}
          isError={false}
          hasMore={false}
          onLoadOlder={() => {}}
          isFetchingOlder={false}
          onReactionToggle={onToggle}
        />,
      )
      fireEvent.click(screen.getByText('❤️ 1'))
      const [, emoji, mine] = onToggle.mock.calls[0]
      expect(emoji).toBe('❤️')
      expect(mine).toBe(true)
    })

    it('shows the 5-emoji picker on hover and hides it after a pick (which fires onReactionToggle)', () => {
      const onToggle = vi.fn()
      render(
        <MessageList
          messages={withReactions}
          isLoading={false}
          isError={false}
          hasMore={false}
          onLoadOlder={() => {}}
          isFetchingOlder={false}
          onReactionToggle={onToggle}
        />,
      )
      const bubble = screen.getByText('hello').closest('.MuiPaper-root')!
      fireEvent.mouseEnter(bubble)
      const picker = screen.getByRole('menu', { name: /add reaction to message 7/i })
      expect(picker).toBeInTheDocument()
      const laughBtn = screen.getByRole('button', { name: /react with 😂/i })
      fireEvent.click(laughBtn)
      const [, emoji, mine] = onToggle.mock.calls[0]
      expect(emoji).toBe('😂')
      expect(mine).toBe(false)
      expect(
        screen.queryByRole('menu', { name: /add reaction to message 7/i }),
      ).not.toBeInTheDocument()
    })

    it('does not render the picker or chips when onReactionToggle is not provided', () => {
      render(
        <MessageList
          messages={withReactions}
          isLoading={false}
          isError={false}
          hasMore={false}
          onLoadOlder={() => {}}
          isFetchingOlder={false}
        />,
      )
      expect(screen.queryByText('👍 2')).not.toBeInTheDocument()
      const bubble = screen.getByText('hello').closest('.MuiPaper-root')!
      fireEvent.mouseEnter(bubble)
      expect(screen.queryByRole('menu', { name: /add reaction/i })).not.toBeInTheDocument()
    })
  })
})
