import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { useAppSelector } from '../../hooks/useAppSelector'
import { setActiveRoom } from './slice'
import { useCreateRoomMutation, useGetRoomsQuery } from './api'

export function RoomList() {
  const dispatch = useAppDispatch()
  const activeRoomName = useAppSelector((s) => s.chat.activeRoomName)
  const { data: rooms, isLoading, error } = useGetRoomsQuery()
  const [createRoom, { isLoading: isCreating, error: createError }] = useCreateRoomMutation()
  const [newName, setNewName] = useState('')

  const createErrorDetail =
    createError && 'data' in createError && createError.data && typeof createError.data === 'object'
      ? Object.values(createError.data as Record<string, string[] | string>)
          .flat()
          .join(' ')
      : createError
        ? 'Could not create room'
        : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    try {
      const room = await createRoom({ name: trimmed }).unwrap()
      setNewName('')
      dispatch(setActiveRoom(room.name))
    } catch {
      /* error rendered below */
    }
  }

  return (
    <Box
      sx={{
        width: 280,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" gutterBottom>
          Rooms
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">Could not load rooms.</Alert>
          </Box>
        )}
        <List dense disablePadding>
          {rooms?.map((room) => (
            <ListItemButton
              key={room.id}
              selected={room.name === activeRoomName}
              onClick={() => dispatch(setActiveRoom(room.name))}
            >
              <ListItemText primary={room.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}
      >
        <Stack spacing={1}>
          <TextField
            size="small"
            label="New room"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
          />
          {createErrorDetail && (
            <Alert severity="error" sx={{ py: 0 }}>
              {createErrorDetail}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={isCreating || !newName.trim()}
          >
            {isCreating ? 'Creating…' : 'Create'}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
