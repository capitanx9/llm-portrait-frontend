import { Menu, MenuItem, ListItemText, Divider, Typography } from '@mui/material'
import { TARGET_LANGUAGES, type TargetLanguage } from './api'

interface Props {
  anchorPosition: { top: number; left: number } | null
  onClose: () => void
  onPick: (lang: TargetLanguage) => void
}

export function TranslateMenu({ anchorPosition, onClose, onPick }: Props) {
  const open = anchorPosition !== null

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition ?? undefined}
    >
      <MenuItem disabled>
        <Typography variant="caption">Translate to…</Typography>
      </MenuItem>
      <Divider />
      {TARGET_LANGUAGES.map((lang) => (
        <MenuItem
          key={lang.code}
          onClick={() => {
            onPick(lang.code)
            onClose()
          }}
        >
          <ListItemText>{lang.label}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  )
}
