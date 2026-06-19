import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Novalearn] Render crash:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-void px-6">
          <div className="panel max-w-lg p-8 text-center">
            <p className="eyebrow mb-3">Something broke</p>
            <h1 className="font-display text-xl font-semibold mb-3">The app hit an error</h1>
            <p className="text-sm text-ink/70 mb-4">
              {this.state.error?.message || 'Unknown error.'}
            </p>
            <p className="text-xs text-muted">
              Check the browser console for details. If this is your first run, make sure{' '}
              <code className="text-cyan">.env</code> has{' '}
              <code className="text-cyan">VITE_SUPABASE_URL</code> and{' '}
              <code className="text-cyan">VITE_SUPABASE_ANON_KEY</code> set, then restart{' '}
              <code className="text-cyan">npm run dev</code>.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}