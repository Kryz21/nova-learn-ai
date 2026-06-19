import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function ConfigBanner() {
  if (isSupabaseConfigured) return null

  return (
    <div className="relative z-50 bg-magenta/15 border-b border-magenta/40 text-center text-sm py-2.5 px-4">
      <span className="text-ink/90">
        Supabase isn't configured yet. Copy <code className="text-magenta">.env.example</code> to{' '}
        <code className="text-magenta">.env</code>, fill in your project URL + anon key, then restart{' '}
        <code className="text-magenta">npm run dev</code>. See README.md.
      </span>
    </div>
  )
}