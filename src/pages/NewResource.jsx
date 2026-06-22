import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Youtube, FileText, Sparkles, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { extractFromFile } from '../utils/extractText'

const TABS = [
  { id: 'file',    label: 'Upload file',  Icon: Upload },
  { id: 'notes',   label: 'Paste notes',  Icon: FileText },
  { id: 'youtube', label: 'YouTube link', Icon: Youtube },
]

// Steps shown during generation
const STEPS = [
  { id: 'reading',    label: 'Reading your source' },
  { id: 'notes',      label: 'Generating structured notes' },
  { id: 'quiz',       label: 'Building quiz questions' },
  { id: 'flashcards', label: 'Creating flashcards' },
  { id: 'saving',     label: 'Saving your study set' },
]

// Simulate step progression while we wait for the real response
function useStepProgress(active) {
  const [stepIdx, setStepIdx] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setStepIdx(0)
      clearTimeout(timerRef.current)
      return
    }
    // Stagger through first 4 steps; last step fires when we actually finish
    const delays = [0, 4000, 10000, 17000]
    delays.forEach((delay, i) => {
      timerRef.current = setTimeout(() => setStepIdx(i), delay)
    })
    return () => clearTimeout(timerRef.current)
  }, [active])

  return [stepIdx, setStepIdx]
}

export default function NewResource() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [tab, setTab]           = useState('file')
  const [title, setTitle]       = useState('')
  const [file, setFile]         = useState(null)
  const [notes, setNotes]       = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError]       = useState('')

  const [stepIdx, setStepIdx] = useStepProgress(generating)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!title.trim()) { setError('Give your resource a title first.'); return }

    try {
      let text       = ''
      let sourceType = tab
      let sourceUrl  = null

      if (tab === 'file') {
        if (!file) { setError('Choose a file to upload.'); return }
        // Brief extraction phase before spinner kicks in
        text = await extractFromFile(file)
      } else if (tab === 'notes') {
        if (!notes.trim()) { setError('Paste in some notes first.'); return }
        text = notes
      } else if (tab === 'youtube') {
        if (!youtubeUrl.trim()) { setError('Paste a YouTube URL.'); return }
        sourceUrl = youtubeUrl
      }

      if (text && text.length < 40) {
        setError("That doesn't look like enough text to work with — try a longer source.")
        return
      }

      setGenerating(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            sourceType,
            text:       text       || undefined,
            youtubeUrl: sourceUrl  || undefined,
          }),
        }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Generation failed')

      // Jump to "saving" step before navigating
      setStepIdx(4)
      await new Promise(r => setTimeout(r, 600))

      navigate(`/resource/${result.resourceId}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong.')
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <span className="eyebrow">New study set</span>
      <h1 className="font-display text-3xl font-semibold mt-3 mb-8">What are we studying?</h1>

      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="panel p-8"
          >
            <p className="eyebrow mb-6">Generating with Gemini</p>

            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done    = i < stepIdx
                const current = i === stepIdx
                const pending = i > stepIdx

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: pending ? 0.35 : 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    {/* Status icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-500 ${
                        done    ? 'bg-cyan/20 border-cyan/60'    :
                        current ? 'border-cyan/40 bg-cyan/5'     :
                                  'border-line bg-transparent'
                      }`}
                    >
                      {done ? (
                        <Check size={12} className="text-cyan" />
                      ) : current ? (
                        <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-line" />
                      )}
                    </div>

                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        done    ? 'text-ink/50 line-through'  :
                        current ? 'text-ink'                   :
                                  'text-muted'
                      }`}
                    >
                      {step.label}
                    </span>

                    {current && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-auto font-mono text-xs text-cyan/60"
                      >
                        working…
                      </motion.span>
                    )}
                  </motion.div>
                )
              })}
            </div>

            <p className="text-xs text-muted font-mono mt-8 text-center">
              Longer sources can take 20–40 seconds
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
          >
            {/* Source type tabs */}
            <div className="flex gap-2 mb-8">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    tab === id
                      ? 'border-cyan/60 text-cyan shadow-neon-cyan bg-cyan/5'
                      : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-muted mb-1.5 block">Title</label>
                <input
                  className="input-field"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Cell Biology — Chapter 4"
                />
              </div>

              {tab === 'file' && (
                <div>
                  <label className="text-xs text-muted mb-1.5 block">PDF, DOCX, or TXT</label>
                  <label className="panel flex flex-col items-center justify-center gap-2 py-10 cursor-pointer border-dashed hover:border-cyan/50 transition-colors">
                    <Upload className="text-cyan" size={24} />
                    <span className="text-sm text-ink/80">
                      {file ? file.name : 'Click to choose a file'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                      onChange={e => setFile(e.target.files?.[0] ?? null)}
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
                    onChange={e => setNotes(e.target.value)}
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
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted mt-2">
                    The video needs captions (auto-generated is fine).
                  </p>
                </div>
              )}

              {error && <p className="text-magenta text-sm">{error}</p>}

              <button type="submit" className="btn-primary w-full">
                <Sparkles size={16} /> Generate study set
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
