import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material'
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAppSelector } from './hooks/useAppSelector'
import { useLogoutMutation } from './features/auth/api'

export function App() {
  const navigate = useNavigate()
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const refreshToken = useAppSelector((s) => s.auth.refreshToken)
  const [logout] = useLogoutMutation()

  async function handleLogout() {
    if (refreshToken) {
      try {
        await logout({ refresh: refreshToken }).unwrap()
      } catch {
        /* clearCredentials already dispatched by mutation */
      }
    }
    navigate('/login')
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            llm-portrait
          </Typography>
          {accessToken ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/chat">
                Chat
              </Button>
              <Button color="inherit" component={RouterLink} to="/profile">
                Profile
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Log out
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/login">
                Sign in
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 2 }}>
        <Outlet />
      </Container>
    </>
  )
}
