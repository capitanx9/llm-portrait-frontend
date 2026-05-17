import { describe, it, expect } from 'vitest'
import { chatReducer, setActiveRoom, type ChatState } from './slice'

const empty: ChatState = { activeRoomName: null }

describe('chatSlice', () => {
  it('sets active room', () => {
    const next = chatReducer(empty, setActiveRoom('general'))
    expect(next.activeRoomName).toBe('general')
  })

  it('clears active room when set to null', () => {
    const seeded: ChatState = { activeRoomName: 'general' }
    const next = chatReducer(seeded, setActiveRoom(null))
    expect(next.activeRoomName).toBeNull()
  })
})
