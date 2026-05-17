import { useMemo, useState, type MouseEvent } from 'react'
import * as reactUseWebsocket from 'react-use-websocket'
import { ReadyState } from 'react-use-websocket'

// Vite's CJS interop for react-use-websocket@4 hands us a module namespace
// where `default` is the export-bag object, not the hook itself. Unwrap.
type UseWebSocketFn = typeof reactUseWebsocket.default
const rawDefault: unknown = reactUseWebsocket.default
const useWebSocket: UseWebSocketFn =
  typeof rawDefault === 'function'
    ? (rawDefault as UseWebSocketFn)
    : (rawDefault as { default: UseWebSocketFn }).default
import { Alert, Box, Button, Snackbar, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useGetMessagesQuery, type ChatMessage } from './api'
import { RoomList } from './RoomList'
import { MessageList, type MessageTranslation } from './MessageList'
import { MessageInput } from './MessageInput'
import { ConnectionBanner } from './ConnectionBanner'
import { useProcessAiMutation, type TargetLanguage, type ConversationTurn } from '../ai/api'
import { TranslateMenu } from '../ai/TranslateMenu'
import { SummaryDialog } from '../ai/SummaryDialog'

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

interface ContextMenu {
  message: ChatMessage
  position: { top: number; left: number }
}

type SummaryStatus = 'idle' | 'loading' | 'ready' | 'error'

interface ApiErrorShape {
  status?: number | string
  data?: { detail?: string }
}

function readApiError(err: unknown): ApiErrorShape {
  if (!err || typeof err !== 'object') return {}
  return err as ApiErrorShape
}

export function ChatPage() {
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

  const messagesQueryArg = useMemo(
    () =>
      activeRoomName
        ? olderCursor !== undefined
          ? { name: activeRoomName, before: olderCursor, limit: 50 }
          : { name: activeRoomName, limit: 50 }
        : { name: '__skip__' },
    [activeRoomName, olderCursor],
  )

  const {
    data: messagesPage,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
    error: messagesError,
  } = useGetMessagesQuery(messagesQueryArg, { skip: !activeRoomName })

  const hasMore = messagesPage?.hasMore ?? false

  // Live messages buffer — appended via WebSocket, reset when room changes.
  const [liveState, setLiveState] = useState<{
    room: string | null
    lastFrameId: number | null
    messages: ChatMessage[]
  }>({ room: activeRoomName, lastFrameId: null, messages: [] })
  if (liveState.room !== activeRoomName) {
    setLiveState({ room: activeRoomName, lastFrameId: null, messages: [] })
  }

  const messages = useMemo(() => {
    const restMessages = messagesPage?.results ?? []
    const liveMessages =
      liveState.room === activeRoomName ? liveState.messages : []
    const seen = new Set<number>(restMessages.map((m) => m.id))
    const extra = liveMessages.filter((m) => !seen.has(m.id))
    return [...restMessages, ...extra]
  }, [messagesPage, liveState, activeRoomName])

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

  // Append the latest WS frame to the live buffer on render (no effect needed;
  // we gate by frame id so the same frame is not added twice).
  if (
    lastJsonMessage &&
    activeRoomName &&
    !lastJsonMessage.error &&
    lastJsonMessage.id !== undefined &&
    lastJsonMessage.sender !== undefined &&
    lastJsonMessage.text !== undefined &&
    lastJsonMessage.created_at !== undefined &&
    liveState.room === activeRoomName &&
    liveState.lastFrameId !== lastJsonMessage.id
  ) {
    const incoming: ChatMessage = {
      id: lastJsonMessage.id,
      sender: lastJsonMessage.sender,
      text: lastJsonMessage.text,
      created_at: lastJsonMessage.created_at,
    }
    setLiveState({
      room: activeRoomName,
      lastFrameId: incoming.id,
      messages: liveState.messages.some((m) => m.id === incoming.id)
        ? liveState.messages
        : [...liveState.messages, incoming],
    })
  }

  // AI state — local to the page
  const [processAi] = useProcessAiMutation()
  const [translations, setTranslations] = useState<Record<number, MessageTranslation>>({})
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryStatus, setSummaryStatus] = useState<SummaryStatus>('idle')
  const [summaryText, setSummaryText] = useState<string | undefined>()
  const [summaryError, setSummaryError] = useState<string | undefined>()
  const [snackbar, setSnackbar] = useState<string | null>(null)

  // Reset translations when room changes
  const [translationsForRoom, setTranslationsForRoom] = useState<string | null>(activeRoomName)
  if (translationsForRoom !== activeRoomName) {
    setTranslationsForRoom(activeRoomName)
    setTranslations({})
  }

  function handleContextMenu(message: ChatMessage, e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      message,
      position: { top: e.clientY, left: e.clientX },
    })
  }

  function handleTranslateClick(message: ChatMessage, e: MouseEvent) {
    e.stopPropagation()
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setContextMenu({
      message,
      position: { top: rect.bottom, left: rect.left },
    })
  }

  function handleErrorFromMutation(err: unknown): {
    status?: number | string
    detail?: string
  } {
    const e = readApiError(err)
    const status = e.status
    const detail = e.data?.detail
    if (status === 429) {
      setSnackbar('Rate limit, try again in a minute')
    } else if (status === 503) {
      setSnackbar(detail ?? 'AI service is unavailable, try again later')
    }
    return { status, detail }
  }

  async function handleTranslatePick(lang: TargetLanguage) {
    const msg = contextMenu?.message
    if (!msg) return
    setTranslations((prev) => ({
      ...prev,
      [msg.id]: { status: 'loading', targetLanguage: lang },
    }))
    try {
      const res = await processAi({
        action: 'translate',
        message: msg.text,
        target_language: lang,
      }).unwrap()
      setTranslations((prev) => ({
        ...prev,
        [msg.id]: {
          status: 'ready',
          targetLanguage: lang,
          sourceLanguage: res.source_language,
          text: res.translation,
        },
      }))
    } catch (err) {
      const { detail } = handleErrorFromMutation(err)
      setTranslations((prev) => ({
        ...prev,
        [msg.id]: {
          status: 'error',
          targetLanguage: lang,
          detail,
        },
      }))
    }
  }

  async function handleSummarize() {
    setSummaryOpen(true)
    setSummaryStatus('loading')
    setSummaryText(undefined)
    setSummaryError(undefined)
    const conversation: ConversationTurn[] = messages.slice(-200).map((m) => ({
      role: 'user',
      content: `${m.sender}: ${m.text}`,
    }))
    try {
      const res = await processAi({
        action: 'summarize',
        conversation,
      }).unwrap()
      setSummaryStatus('ready')
      setSummaryText(res.summary ?? '(empty summary)')
    } catch (err) {
      const { detail } = handleErrorFromMutation(err)
      setSummaryStatus('error')
      setSummaryError(detail)
    }
  }

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
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6">{activeRoomName}</Typography>
              <Button
                size="small"
                startIcon={<AutoAwesomeIcon fontSize="small" />}
                onClick={handleSummarize}
                disabled={messages.length === 0}
              >
                Summarize
              </Button>
            </Box>
            {socketUrl && <ConnectionBanner state={connectionState} />}
            <MessageList
              messages={messages}
              isLoading={isMessagesLoading}
              isError={!!messagesError}
              hasMore={hasMore}
              onLoadOlder={handleLoadOlder}
              isFetchingOlder={isMessagesFetching && !isMessagesLoading}
              translations={translations}
              onMessageContextMenu={handleContextMenu}
              onTranslateClick={handleTranslateClick}
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

      <TranslateMenu
        anchorPosition={contextMenu?.position ?? null}
        onClose={() => setContextMenu(null)}
        onPick={handleTranslatePick}
      />
      <SummaryDialog
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        status={summaryStatus}
        summary={summaryText}
        errorDetail={summaryError}
      />
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  )
}
