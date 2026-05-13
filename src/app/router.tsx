import { createBrowserRouter } from 'react-router-dom'
import { App } from '../App'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div>Home (stub)</div> },
      { path: 'login', element: <div>Login (stub)</div> },
      { path: 'register', element: <div>Register (stub)</div> },
      { path: 'chat', element: <div>Chat (stub)</div> },
      { path: 'profile', element: <div>Profile (stub)</div> },
    ],
  },
])
