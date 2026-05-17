import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface ChatState {
  activeRoomName: string | null
}

const initialState: ChatState = { activeRoomName: null }

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveRoom(state, action: PayloadAction<string | null>) {
      state.activeRoomName = action.payload
    },
  },
})

export const { setActiveRoom } = chatSlice.actions
export const chatReducer = chatSlice.reducer
