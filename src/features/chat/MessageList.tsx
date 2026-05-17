import { useEffect, useRef, type MouseEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import type { ChatMessage } from './api'

export interface MessageTranslation {
  status: 'loading' | 'ready' | 'error'
  targetLanguage?: string
  sourceLanguage?: string
  text?: string
  detail?: string
}

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
  isError: boolean
  hasMore: boolean
  onLoadOlder: () => void
  isFetchingOlder: boolean
  translations?: Record<number, MessageTranslation>
  onMessageContextMenu?: (message: ChatMessage, e: MouseEvent) => void
  onTranslateClick?: (message: ChatMessage, e: MouseEvent) => void
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function MessageList({
  messages,
  isLoading,
  isError,
  hasMore,
  onLoadOlder,
  isFetchingOlder,
  translations,
  onMessageContextMenu,
  onTranslateClick,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number | null>(null)

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    const lastId = lastMessage ? lastMessage.id : null
    if (lastId !== lastIdRef.current) {
      lastIdRef.current = lastId
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Could not load messages.</Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <Button size="small" onClick={onLoadOlder} disabled={isFetchingOlder}>
            {isFetchingOlder ? 'Loading…' : 'Load older'}
          </Button>
        </Box>
      )}
      <Stack spacing={1}>
        {messages.map((msg) => {
          const t = translations?.[msg.id]
          return (
            <Paper
              key={msg.id}
              elevation={0}
              sx={{ p: 1.2, bgcolor: 'grey.100', borderRadius: 2 }}
              onContextMenu={onMessageContextMenu ? (e) => onMessageContextMenu(msg, e) : undefined}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {msg.sender}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(msg.created_at)}
                </Typography>
                {onTranslateClick && (
                  <Tooltip title="Translate to…">
                    <IconButton
                      size="small"
                      onClick={(e) => onTranslateClick(msg, e)}
                      sx={{ ml: 'auto', p: 0.25 }}
                      aria-label={`Translate message ${msg.id}`}
                    >
                      <TranslateIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </Typography>
              {t && (
                <Box
                  sx={{
                    mt: 0.5,
                    pt: 0.5,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  {t.status === 'loading' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={12} />
                      <Typography variant="caption" color="text.secondary">
                        Translating to {t.targetLanguage?.toUpperCase()}…
                      </Typography>
                    </Box>
                  )}
                  {t.status === 'ready' && (
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block' }}
                      >
                        {t.sourceLanguage
                          ? `Translated from ${t.sourceLanguage.toUpperCase()} → ${t.targetLanguage?.toUpperCase()}`
                          : `Translated to ${t.targetLanguage?.toUpperCase()}`}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap', fontStyle: 'italic' }}
                      >
                        {t.text}
                      </Typography>
                    </>
                  )}
                  {t.status === 'error' && (
                    <Typography variant="caption" color="error">
                      Translation failed: {t.detail ?? 'unknown error'}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          )
        })}
      </Stack>
      <div ref={bottomRef} />
    </Box>
  )
}
