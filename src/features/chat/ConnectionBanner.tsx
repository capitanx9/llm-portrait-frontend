import { Alert, Box, CircularProgress, Typography } from '@mui/material'

interface Props {
  state: 'connecting' | 'open' | 'closed'
}

export function ConnectionBanner({ state }: Props) {
  if (state === 'open') return null

  const message = state === 'connecting' ? 'Reconnecting…' : 'Disconnected. Retrying…'

  return (
    <Box sx={{ px: 2, pt: 1 }}>
      <Alert severity="warning" icon={false} sx={{ py: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={14} />
          <Typography variant="body2">{message}</Typography>
        </Box>
      </Alert>
    </Box>
  )
}
