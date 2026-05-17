import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { App } from './App'
import { renderWithProviders } from './test/renderWithProviders'

describe('<App />', () => {
  it('renders the project name in the header', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('llm-portrait')).toBeInTheDocument()
  })

  it('shows Sign in / Register when no access token', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument()
  })

  it('shows Chat / Profile / Log out when authenticated', () => {
    renderWithProviders(<App />, {
      preloadedAuth: { accessToken: 'tok', refreshToken: 'r' },
    })
    expect(screen.getByRole('link', { name: /chat/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
  })
})
