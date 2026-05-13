import { AppBar, Toolbar, Typography, Container } from '@mui/material'
import { Outlet } from 'react-router-dom'

export function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">llm-portrait</Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 2 }}>
        <Outlet />
      </Container>
    </>
  )
}
