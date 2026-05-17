import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Box, Button, TextField } from '@mui/material'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')

  function submit() {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <TextField
          size="small"
          fullWidth
          multiline
          maxRows={4}
          placeholder={disabled ? 'Reconnecting…' : 'Type a message'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
        />
        <Button type="submit" variant="contained" disabled={disabled || !text.trim()}>
          Send
        </Button>
      </Box>
    </Box>
  )
}
