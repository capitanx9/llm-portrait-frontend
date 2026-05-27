import { useEffect, useRef, useState, type MouseEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import TranslateIcon from '@mui/icons-material/Translate'
import type { ChatMessage } from './api'
import { REACTION_PICKER_EMOJI, type ReactionAggregate } from './reactions'

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
  onReactionToggle?: (message: ChatMessage, emoji: string, currentlyMine: boolean) => void
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
  onReactionToggle,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number | null>(null)
  const [pickerForMessageId, setPickerForMessageId] = useState<number | null>(null)

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
          const reactions: readonly ReactionAggregate[] = msg.reactions ?? []
          const pickerOpen = pickerForMessageId === msg.id
          return (
            <Paper
              key={msg.id}
              elevation={0}
              sx={{ p: 1.2, bgcolor: 'grey.100', borderRadius: 2, position: 'relative' }}
              onContextMenu={onMessageContextMenu ? (e) => onMessageContextMenu(msg, e) : undefined}
              onMouseEnter={onReactionToggle ? () => setPickerForMessageId(msg.id) : undefined}
              onMouseLeave={onReactionToggle ? () => setPickerForMessageId(null) : undefined}
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
              {onReactionToggle && reactions.length > 0 && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                  {reactions.map((r) => (
                    <Chip
                      key={r.emoji}
                      label={`${r.emoji} ${r.count}`}
                      size="small"
                      color={r.me ? 'primary' : 'default'}
                      variant={r.me ? 'filled' : 'outlined'}
                      onClick={() => onReactionToggle(msg, r.emoji, r.me)}
                      aria-label={`Reaction ${r.emoji}, count ${r.count}${r.me ? ', mine' : ''}`}
                    />
                  ))}
                </Stack>
              )}
              {onReactionToggle && pickerOpen && (
                <Paper
                  elevation={3}
                  role="menu"
                  aria-label={`Add reaction to message ${msg.id}`}
                  sx={{
                    position: 'absolute',
                    top: -16,
                    right: 8,
                    display: 'flex',
                    gap: 0.25,
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 4,
                  }}
                >
                  {REACTION_PICKER_EMOJI.map((emoji) => (
                    <IconButton
                      key={emoji}
                      size="small"
                      onClick={() => {
                        onReactionToggle(msg, emoji, false)
                        setPickerForMessageId(null)
                      }}
                      aria-label={`React with ${emoji}`}
                      sx={{ fontSize: 18, p: 0.5 }}
                    >
                      <span aria-hidden>{emoji}</span>
                    </IconButton>
                  ))}
                </Paper>
              )}
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
