import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TranslateMenu } from './TranslateMenu'

describe('<TranslateMenu />', () => {
  it('does not render when anchorPosition is null', () => {
    render(<TranslateMenu anchorPosition={null} onClose={() => {}} onPick={() => {}} />)
    expect(screen.queryByText(/translate to/i)).not.toBeInTheDocument()
  })

  it('renders six language options when open', () => {
    render(
      <TranslateMenu
        anchorPosition={{ top: 100, left: 100 }}
        onClose={() => {}}
        onPick={() => {}}
      />,
    )
    expect(screen.getByText('Russian')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Ukrainian')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
    expect(screen.getByText('Spanish')).toBeInTheDocument()
    expect(screen.getByText('German')).toBeInTheDocument()
  })

  it('calls onPick with the language code on click', () => {
    const onPick = vi.fn()
    const onClose = vi.fn()
    render(
      <TranslateMenu anchorPosition={{ top: 100, left: 100 }} onClose={onClose} onPick={onPick} />,
    )
    fireEvent.click(screen.getByText('French'))
    expect(onPick).toHaveBeenCalledWith('fr')
    expect(onClose).toHaveBeenCalled()
  })
})
