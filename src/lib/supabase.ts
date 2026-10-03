import { createClient } from '@supabase/supabase-js'

// Browser client (publishable/anon key). Trace writes and AI calls live in the API routes.
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
