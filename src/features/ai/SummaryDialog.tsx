import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

interface Props {
  open: boolean
  onClose: () => void
  status: 'idle' | 'loading' | 'ready' | 'error'
  summary?: string
  errorDetail?: string
}

export function SummaryDialog({ open, onClose, status, summary, errorDetail }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Conversation summary</DialogTitle>
      <DialogContent>
        {status === 'loading' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 2,
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2">Summarizing…</Typography>
          </Box>
        )}
        {status === 'ready' && (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {summary}
          </Typography>
        )}
        {status === 'error' && (
          <Typography variant="body2" color="error">
            {errorDetail ?? 'Could not summarize the conversation.'}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
