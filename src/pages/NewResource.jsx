import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Youtube, FileText, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { extractFromFile } from '../utils/extractText'

const TABS = [
  { id: 'file', label: 'Upload file', Icon: Upload },
  { id: 'notes', label: 'Paste notes', Icon: FileText },
  { id: 'youtube', label: 'YouTube link', Icon: Youtube },
]

export default function NewResource() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('file')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | extracting | generating | error
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Give your resource a title first.')
      return
    }

    try {
      let text = ''
      let sourceType = tab
      let sourceUrl = null

      if (tab === 'file') {
        if (!file) return setError('Choose a file to upload.')
        setStatus('extracting')
        text = await extractFromFile(file)
      } else if (tab === 'notes') {
        if (!notes.trim()) return setError('Paste in some notes first.')
        text = notes
      } else if (tab === 'youtube') {
        if (!youtubeUrl.trim()) return setError('Paste a YouTube URL.')
        sourceUrl = youtubeUrl
      }

      if (text && text.length < 40) {
        setError("That doesn't look like enough text to work with — try a longer source.")
        setStatus('idle')
        return
      }

      setStatus('generating')

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          sourceType,
          text: text || undefined,
          youtubeUrl: sourceUrl || undefined,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Generation failed')

      navigate(`/resource/${result.resourceId}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
      setStatus('error')
    }
  }

  const busy = status === 'extracting' || status === 'generating'

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <span className="eyebrow">New study set</span>
      <h1 className="font-display text-3xl font-semibold mt-3 mb-8">What are we studying?</h1>

      <div className="flex gap-2 mb-8">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
              tab === id ? 'border-cyan/60 text-cyan shadow-neon-cyan bg-cyan/5' : 'border-line text-muted hover:text-ink'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs text-muted mb-1.5 block">Title</label>
          <input
            className="input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cell Biology — Chapter 4"
          />
        </div>

        {tab === 'file' && (
          <div>
            <label className="text-xs text-muted mb-1.5 block">PDF, DOCX, or TXT</label>
            <label className="panel flex flex-col items-center justify-center gap-2 py-10 cursor-pointer border-dashed hover:border-cyan/50 transition-colors">
              <Upload className="text-cyan" size={24} />
              <span className="text-sm text-ink/80">{file ? file.name : 'Click to choose a file'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}

        {tab === 'notes' && (
          <div>
            <label className="text-xs text-muted mb-1.5 block">Your notes</label>
            <textarea
              className="input-field min-h-[220px] resize-y font-mono text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your raw notes here…"
            />
          </div>
        )}

        {tab === 'youtube' && (
          <div>
            <label className="text-xs text-muted mb-1.5 block">YouTube URL</label>
            <input
              className="input-field"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted mt-2">
              The video needs captions (auto-generated is fine) for this to work.
            </p>
          </div>
        )}

        {error && <p className="text-magenta text-sm">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              {status === 'extracting' ? 'Reading source…' : 'Generating with Claude…'}
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate study set
            </>
          )}
        </button>
        {busy && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted text-center font-mono"
          >
            This can take 20–40s for longer material.
          </motion.p>
        )}
      </form>
    </div>
  )
}
