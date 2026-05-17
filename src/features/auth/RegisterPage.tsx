import { useState, type FormEvent } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useRegisterMutation } from './api'

type FieldErrors = Partial<Record<'username' | 'email' | 'password', string[]>>

export function RegisterPage() {
  const navigate = useNavigate()
  const [register, { isLoading, error }] = useRegisterMutation()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const fieldErrors: FieldErrors =
    error && 'data' in error && error.data && typeof error.data === 'object'
      ? (error.data as FieldErrors)
      : {}
  const formError =
    error && !('data' in error) ? 'Registration failed' : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await register({ username, email, password }).unwrap()
      navigate('/login')
    } catch {
      /* error rendered below */
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" gutterBottom>
          Create account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username?.join(' ')}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email?.join(' ')}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!fieldErrors.password}
              helperText={fieldErrors.password?.join(' ')}
              required
              fullWidth
            />
            {formError && <Alert severity="error">{formError}</Alert>}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !username || !email || !password}
            >
              {isLoading ? 'Creating…' : 'Create account'}
            </Button>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
