import { createBrowserRouter } from 'react-router-dom'
import { App } from '../App'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ProfilePage } from '../features/auth/ProfilePage'
import { ProtectedRoute } from '../components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div>Home (stub)</div> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'chat', element: <div>Chat (stub)</div> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
])
