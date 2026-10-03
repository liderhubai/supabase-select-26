'use client'

import { useState } from 'react'
import { Inbox } from './Inbox'
import { Thread } from './Thread'
import { DetailsPanel } from './DetailsPanel'

export function ChatsScreen() {
  const [selected, setSelected] = useState(42)
  const [panelOpen, setPanelOpen] = useState(true)
  return (
    <div className="flex h-full w-full overflow-hidden">
      <Inbox selected={selected} onSelect={setSelected} />
      <Thread sessionId={selected} onTogglePanel={() => setPanelOpen((o) => !o)} />
      {panelOpen && <DetailsPanel onClose={() => setPanelOpen(false)} />}
    </div>
  )
}
