'use client'

import { useMemo, useState } from 'react'
import { diffLines, diffWords } from 'diff'
import { cn } from '@/lib/utils'

type Row = { left?: string; right?: string; type: 'same' | 'changed' | 'removed' | 'added' }

function buildRows(oldText: string, newText: string): Row[] {
  const rows: Row[] = []
  const parts = diffLines(oldText, newText)
  const split = (v: string) => v.replace(/\n$/, '').split('\n')

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (!p.added && !p.removed) {
      for (const l of split(p.value)) rows.push({ left: l, right: l, type: 'same' })
    } else if (p.removed && parts[i + 1]?.added) {
      // Bloco modificado: pareia linha a linha removida/adicionada.
      const a = split(p.value)
      const b = split(parts[i + 1].value)
      for (let k = 0; k < Math.max(a.length, b.length); k++) {
        if (a[k] !== undefined && b[k] !== undefined) rows.push({ left: a[k], right: b[k], type: 'changed' })
        else if (a[k] !== undefined) rows.push({ left: a[k], type: 'removed' })
        else rows.push({ right: b[k], type: 'added' })
      }
      i++
    } else if (p.removed) {
      for (const l of split(p.value)) rows.push({ left: l, type: 'removed' })
    } else {
      for (const l of split(p.value)) rows.push({ right: l, type: 'added' })
    }
  }
  return rows
}

function Words({ from, to, side }: { from: string; to: string; side: 'left' | 'right' }) {
  return (
    <>
      {diffWords(from, to).map((w, i) => {
        if (side === 'left' && w.added) return null
        if (side === 'right' && w.removed) return null
        const hl = side === 'left' ? w.removed : w.added
        return (
          <span key={i} className={cn(hl && (side === 'left' ? 'rounded-sm bg-red-200/80' : 'rounded-sm bg-emerald-200/80'))}>
            {w.value}
          </span>
        )
      })}
    </>
  )
}

export function PromptDiff({ oldText, newText, oldLabel, newLabel }: { oldText: string; newText: string; oldLabel: string; newLabel: string }) {
  const [mode, setMode] = useState<'split' | 'changes'>('split')
  const rows = useMemo(() => buildRows(oldText, newText), [oldText, newText])
  const added = rows.filter((r) => r.type === 'added' || r.type === 'changed').length
  const removed = rows.filter((r) => r.type === 'removed' || r.type === 'changed').length
  const visible = mode === 'split' ? rows : rows.filter((r) => r.type !== 'same')

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
        <div className="flex gap-3">
          <span className="text-emerald-700">+{added} linhas</span>
          <span className="text-red-700">−{removed} linhas</span>
        </div>
        <div className="flex gap-1">
          {(['split', 'changes'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={cn('rounded px-2 py-0.5', mode === m ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-200')}>
              {m === 'split' ? 'Completo' : 'Só mudanças'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 border-b border-zinc-200 text-xs font-medium text-zinc-500">
        <div className="border-r border-zinc-200 px-3 py-1.5">{oldLabel}</div>
        <div className="px-3 py-1.5">{newLabel}</div>
      </div>
      <div className="max-h-[70vh] overflow-auto font-mono text-xs leading-relaxed">
        {visible.map((r, i) => (
          <div key={i} className="grid grid-cols-2">
            <div
              className={cn(
                'whitespace-pre-wrap break-words border-r border-zinc-200 px-3 py-0.5',
                (r.type === 'removed' || r.type === 'changed') && 'bg-red-50',
                r.type === 'added' && 'bg-zinc-50',
              )}
            >
              {r.type === 'changed' ? <Words from={r.left!} to={r.right!} side="left" /> : (r.left ?? '')}
            </div>
            <div
              className={cn(
                'whitespace-pre-wrap break-words px-3 py-0.5',
                (r.type === 'added' || r.type === 'changed') && 'bg-emerald-50',
                r.type === 'removed' && 'bg-zinc-50',
              )}
            >
              {r.type === 'changed' ? <Words from={r.left!} to={r.right!} side="right" /> : (r.right ?? '')}
            </div>
          </div>
        ))}
        {!visible.length && <div className="p-4 text-center text-zinc-400">Sem diferenças.</div>}
      </div>
    </div>
  )
}
