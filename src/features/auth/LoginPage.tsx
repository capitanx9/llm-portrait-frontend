import { useState, type FormEvent } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material'
import { useLoginMutation } from './api'

export function LoginPage() {
  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const errorDetail =
    error && 'data' in error && error.data && typeof error.data === 'object'
      ? ((error.data as { detail?: string }).detail ?? 'Login failed')
      : error
        ? 'Login failed'
        : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login({ username, password }).unwrap()
      navigate('/chat')
    } catch {
      /* error rendered below */
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" gutterBottom>
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            {errorDetail && <Alert severity="error">{errorDetail}</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
            <Typography variant="body2">
              No account?{' '}
              <Link component={RouterLink} to="/register">
                Register
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
