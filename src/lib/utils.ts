import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const ago = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: enUS })

/** Throws the Supabase error or returns the data. */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message)
  return res.data as NonNullable<T>
}

// USD per million tokens (input, output).
const PRICING: Record<string, [number, number]> = {
  'claude-opus-5-5': [4, 20],
  'claude-sonnet-5-5': [2, 10],
  'claude-haiku-4-5': [1, 5],
}

export function costUsd(model: string, inputTokens: number | null, outputTokens: number | null) {
  const [i, o] = PRICING[model] ?? [0, 0]
  return ((inputTokens ?? 0) * i + (outputTokens ?? 0) * o) / 1_000_000
}

export const formatMs = (ms: number | null | undefined) => (ms == null ? '—' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`)

export const shortId = (id: string) => id.slice(0, 8)
