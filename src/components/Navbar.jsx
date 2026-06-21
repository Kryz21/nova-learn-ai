import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  function handleFeatures(e) {
    e.preventDefault()
    if (isHome) {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/#features')
    }
  }

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="flex items-center justify-between bg-[#0e0e14]/80 border border-white/10 rounded-2xl px-5 h-14 backdrop-blur-xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-[15px] text-white">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6.5 10.5c-.2.25-.6.11-.6-.21V7.04a.67.67 0 0 0-.67-.67H2.14c-.27 0-.43-.31-.27-.53l2.22-3.11c.32-.44 0-1.06-.55-1.06H.62c-.27 0-.43-.31-.27-.53L3.23.14C3.3.05 3.4 0 3.51 0h8.57c.27 0 .43.31.27.53L10.13 3.64c-.32.44 0 1.06.55 1.06h3.37c.28 0 .44.32.26.54L6.5 10.5z" fill="white"/>
            </svg>
          </div>
          novalearn
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {user ? (
            <>
              <Link to="/dashboard" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Dashboard
              </Link>
              <Link to="/new" className="ml-1 px-4 py-1.5 text-sm font-medium bg-white text-black rounded-xl hover:bg-white/90 transition-colors">
                New set
              </Link>
              <button
                onClick={async () => { await signOut(); navigate('/') }}
                className="ml-1 px-3 py-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFeatures}
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Features
              </button>
              <Link to="/login" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                Log in
              </Link>
              <Link to="/signup" className="ml-1 px-4 py-1.5 text-sm font-medium bg-white text-black rounded-xl hover:bg-white/90 transition-colors">
                Start now
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
