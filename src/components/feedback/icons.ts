import { CircleDashed, Folder, Inbox } from 'lucide-react'
import type { Group } from './data'

export const groupIcons = { inbox: Inbox, 'circle-dashed': CircleDashed, folder: Folder }

export const groupColor: Record<NonNullable<Group['color']>, string> = {
  accent: 'text-accent',
  info: 'text-info',
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
}
