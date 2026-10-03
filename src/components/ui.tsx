import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const variants: Record<Variant, string> = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800',
  secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50',
  ghost: 'text-zinc-600 hover:bg-zinc-100',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
}

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-zinc-200 bg-white', className)} {...props} />
}

const field = 'w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100'

export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn(field, className)} {...p} />
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn(field, className)} {...p} />
const EMPTY = '__empty__' // Radix Select does not allow an empty-string item value

/** shadcn Select with a simple options API. An option with value '' is supported. */
export function Select({ value, onValueChange, options, placeholder, className }: {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: ReactNode }[]
  placeholder?: string
  className?: string
}) {
  return (
    <UiSelect value={value === '' ? EMPTY : value} onValueChange={(v) => onValueChange(v === EMPTY ? '' : v)}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value || EMPTY} value={o.value || EMPTY}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </UiSelect>
  )
}

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-1 block text-xs font-medium text-zinc-600">
      {children} {hint && <span className="font-normal text-zinc-400">— {hint}</span>}
    </label>
  )
}

const badgeTones = {
  zinc: 'bg-zinc-100 text-zinc-700',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
}
export type Tone = keyof typeof badgeTones

export function Badge({ tone = 'zinc', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ring-1 ring-transparent ring-inset', badgeTones[tone], className)}>{children}</span>
}

export const statusTone: Record<string, Tone> = {
  production: 'green',
  staging: 'amber',
  draft: 'zinc',
  archived: 'zinc',
  rejected: 'red',
  pending: 'amber',
  processing: 'blue',
  processed: 'green',
  dismissed: 'zinc',
  queued: 'zinc',
  optimizing: 'violet',
  testing: 'blue',
  running: 'blue',
  completed: 'green',
  failed: 'red',
}

export const statusLabel: Record<string, string> = {
  production: 'production',
  staging: 'staging',
  draft: 'draft',
  archived: 'archived',
  rejected: 'rejected',
  pending: 'pending',
  processing: 'processing',
  processed: 'processed',
  dismissed: 'dismissed',
  queued: 'queued',
  optimizing: 'optimizing',
  testing: 'testing',
  running: 'running',
  completed: 'completed',
  failed: 'failed',
}

export const StatusBadge = ({ status }: { status: string }) => <Badge tone={statusTone[status] ?? 'zinc'}>{statusLabel[status] ?? status}</Badge>

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-zinc-900/40 p-4 pt-[8vh]" onClick={onClose}>
      <div className={cn('w-full rounded-lg bg-white shadow-xl', wide ? 'max-w-4xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">{children}</div>
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}
