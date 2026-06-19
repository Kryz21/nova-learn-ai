import { Link, useNavigate } from 'react-router-dom'
import { Orbit, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-void/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
          <Orbit className="text-cyan" size={22} />
          <span>
            Nova<span className="text-cyan text-glow-cyan">learn</span>
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-ink/80 hover:text-cyan transition-colors px-3 py-2">
                Dashboard
              </Link>
              <Link to="/new" className="btn-primary !px-4 !py-2 text-sm">
                New resource
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
                className="text-sm text-muted hover:text-magenta transition-colors p-2"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-ink/80 hover:text-cyan transition-colors px-3 py-2">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary !px-4 !py-2 text-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
