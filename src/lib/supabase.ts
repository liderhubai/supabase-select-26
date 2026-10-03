import { createClient } from '@supabase/supabase-js'

// Client do browser (publishable/anon key). A gravação de traces e chamadas de IA ficam nas API routes.
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
