import { useEffect, useRef } from 'react'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import type { ChatMessage } from './api'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
  isError: boolean
  hasMore: boolean
  onLoadOlder: () => void
  isFetchingOlder: boolean
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
        {messages.map((msg) => (
          <Paper key={msg.id} elevation={0} sx={{ p: 1.2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {msg.sender}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(msg.created_at)}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </Typography>
          </Paper>
        ))}
      </Stack>
      <div ref={bottomRef} />
    </Box>
  )
}
