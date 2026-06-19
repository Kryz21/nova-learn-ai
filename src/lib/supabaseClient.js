import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase's client throws synchronously if the URL is missing/invalid, which
// crashes the whole app before React can even mount (a blank black screen,
// since the error happens at import time, before any error boundary exists).
// We fall back to a harmless placeholder so the app always renders — auth
// calls will just fail with a clear error in the console until real env
// vars are set.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[Novalearn] Missing Supabase env vars. Copy .env.example to .env, fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (from your Supabase project settings), then restart `npm run dev`.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
