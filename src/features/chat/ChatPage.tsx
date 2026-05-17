import { useEffect, useState } from 'react'
import * as reactUseWebsocket from 'react-use-websocket'
import { ReadyState } from 'react-use-websocket'

// Vite's CJS interop for react-use-websocket@4 hands us a module namespace
// where `default` is the export-bag object, not the hook itself. Unwrap.
type UseWebSocketFn = typeof reactUseWebsocket.default
const rawDefault: unknown = reactUseWebsocket.default
const useWebSocket: UseWebSocketFn =
  typeof rawDefault === 'function'
    ? (rawDefault as UseWebSocketFn)
    : ((rawDefault as { default: UseWebSocketFn }).default)
import { Box, Typography } from '@mui/material'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { chatApi, useGetMessagesQuery, type ChatMessage } from './api'
import { RoomList } from './RoomList'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ConnectionBanner } from './ConnectionBanner'

function wsUrlFor(name: string, token: string): string {
  if (typeof window === 'undefined') return ''
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/ws/chat/${encodeURIComponent(
    name,
  )}/?token=${encodeURIComponent(token)}`
}

interface IncomingFrame {
  id?: number
  sender?: string
  text?: string
  created_at?: string
  error?: string
  detail?: string
}

export function ChatPage() {
  const dispatch = useAppDispatch()
  const activeRoomName = useAppSelector((s) => s.chat.activeRoomName)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [cursorState, setCursorState] = useState<{
    room: string | null
    before: number | undefined
  }>({ room: activeRoomName, before: undefined })
  if (cursorState.room !== activeRoomName) {
    setCursorState({ room: activeRoomName, before: undefined })
  }
  const olderCursor = cursorState.room === activeRoomName ? cursorState.before : undefined

  const {
    data: messagesPage,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
    error: messagesError,
  } = useGetMessagesQuery(
    activeRoomName
      ? { name: activeRoomName, before: olderCursor, limit: 50 }
      : { name: '__skip__' },
    { skip: !activeRoomName },
  )

  const messages = messagesPage?.results ?? []
  const hasMore = messagesPage?.hasMore ?? false

  const socketUrl = activeRoomName && accessToken ? wsUrlFor(activeRoomName, accessToken) : null

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket<IncomingFrame | null>(
    socketUrl,
    {
      shouldReconnect: () => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
      share: false,
    },
  )

  useEffect(() => {
    if (!lastJsonMessage || !activeRoomName) return
    if (lastJsonMessage.error) return
    if (
      lastJsonMessage.id === undefined ||
      lastJsonMessage.sender === undefined ||
      lastJsonMessage.text === undefined ||
      lastJsonMessage.created_at === undefined
    ) {
      return
    }
    const incoming: ChatMessage = {
      id: lastJsonMessage.id,
      sender: lastJsonMessage.sender,
      text: lastJsonMessage.text,
      created_at: lastJsonMessage.created_at,
    }
    dispatch(
      chatApi.util.updateQueryData(
        'getMessages',
        { name: activeRoomName, before: olderCursor, limit: 50 },
        (draft) => {
          if (draft.results.some((m) => m.id === incoming.id)) return
          draft.results.push(incoming)
        },
      ),
    )
  }, [lastJsonMessage, activeRoomName, dispatch, olderCursor])

  function handleSend(text: string) {
    sendJsonMessage({ text })
  }

  function handleLoadOlder() {
    const first = messages[0]
    if (first) setCursorState({ room: activeRoomName, before: first.id })
  }

  const connectionState: 'connecting' | 'open' | 'closed' = !socketUrl
    ? 'closed'
    : readyState === ReadyState.OPEN
      ? 'open'
      : readyState === ReadyState.CONNECTING
        ? 'connecting'
        : 'closed'

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px - 32px)',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <RoomList />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeRoomName ? (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{activeRoomName}</Typography>
            </Box>
            {socketUrl && <ConnectionBanner state={connectionState} />}
            <MessageList
              messages={messages}
              isLoading={isMessagesLoading}
              isError={!!messagesError}
              hasMore={hasMore}
              onLoadOlder={handleLoadOlder}
              isFetchingOlder={isMessagesFetching && !isMessagesLoading}
            />
            <MessageInput onSend={handleSend} disabled={connectionState !== 'open'} />
          </>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">
              Pick a room on the left, or create a new one.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
