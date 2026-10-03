import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  return (client ??= createClient(url, key, { auth: { persistSession: false } }))
}

// Service role: só no servidor (route handlers), grava traces/execuções ignorando RLS.
// Criado sob demanda para o build não exigir as variáveis de ambiente.
export const db = new Proxy({} as SupabaseClient, {
  get: (_, prop) => {
    const c = getClient()
    const value = Reflect.get(c, prop)
    return typeof value === 'function' ? value.bind(c) : value
  },
})

export function must<T>(res: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  if (res.data === null) throw new Error(`${what}: não encontrado`)
  return res.data as NonNullable<T>
}
