import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/useAppSelector'
import { useLogoutMutation, useMeQuery } from './api'

export function ProfilePage() {
  const navigate = useNavigate()
  const refreshToken = useAppSelector((s) => s.auth.refreshToken)
  const { data, isLoading, error } = useMeQuery()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  async function handleLogout() {
    if (refreshToken) {
      try {
        await logout({ refresh: refreshToken }).unwrap()
      } catch {
        /* clearCredentials runs in finally inside the mutation */
      }
    }
    navigate('/login')
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">Could not load profile.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Card sx={{ width: 360 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Profile</Typography>
            <Typography>
              <strong>ID:</strong> {data.id}
            </Typography>
            <Typography>
              <strong>Username:</strong> {data.username}
            </Typography>
            <Typography>
              <strong>Email:</strong> {data.email}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
