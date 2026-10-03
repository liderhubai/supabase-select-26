import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const ago = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })

/** Lança o erro do Supabase ou devolve os dados. */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message)
  return res.data as NonNullable<T>
}
