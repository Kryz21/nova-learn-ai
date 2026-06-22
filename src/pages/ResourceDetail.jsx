import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, ListChecks, Layers, ChevronLeft, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import NotesView from '../components/NotesView'
import QuizPlayer from '../components/QuizPlayer'
import FlashcardViewer from '../components/FlashcardViewer'
import ChatView from '../components/ChatView'

const TABS = [
  { id: 'notes',      label: 'Notes',      Icon: FileText },
  { id: 'quiz',       label: 'Quiz',        Icon: ListChecks },
  { id: 'flashcards', label: 'Flashcards',  Icon: Layers },
]

export default function ResourceDetail() {
  const { id } = useParams()
  const [resource, setResource] = useState(null)
  const [tab, setTab] = useState('notes')
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, status, notes_json, quiz_json, flashcards_json')
        .eq('id', id)
        .single()
      if (active) {
        if (!error) setResource(data)
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan/30 border-t-cyan animate-spin" />
      </div>
    )
  }

  if (!resource) {
    return <p className="text-center py-20 text-muted">Resource not found.</p>
  }

  return (
    <div className="relative flex min-h-screen overflow-x-hidden">

      {/* ── Main content ─────────────────────────────────────────── */}
      <motion.div
        className="flex-1 min-w-0 px-6 py-16"
        animate={{ marginRight: panelOpen ? '380px' : '0px' }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      >
        <div className="max-w-4xl mx-auto">
          <span className="eyebrow">Study set</span>
          <h1 className="font-display text-3xl font-semibold mt-2 mb-8">{resource.title}</h1>

          <div className="flex gap-2 mb-8 flex-wrap">
            {TABS.map(({ id: tid, label, Icon }) => (
              <button
                key={tid}
                onClick={() => setTab(tid)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  tab === tid
                    ? 'border-cyan/60 text-cyan shadow-neon-cyan bg-cyan/5'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          {tab === 'notes'      && <NotesView notes={resource.notes_json} />}
          {tab === 'quiz'       && <QuizPlayer questions={resource.quiz_json?.questions} />}
          {tab === 'flashcards' && <FlashcardViewer cards={resource.flashcards_json?.cards} />}
        </div>
      </motion.div>

      {/* ── Toggle tab (sticks to right edge, moves with panel) ──── */}
      <motion.button
        onClick={() => setPanelOpen(o => !o)}
        animate={{ right: panelOpen ? '380px' : '0px' }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="fixed top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 px-3 py-4
          rounded-l-xl bg-[#11111D] border border-r-0 border-violet/40 text-violet
          hover:bg-violet/10 hover:border-violet/70 transition-colors duration-200
          shadow-[-4px_0_20px_rgba(124,58,237,0.2)]"
      >
        <Sparkles size={13} />
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Ask AI
        </span>
        <motion.div animate={{ rotate: panelOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronLeft size={13} />
        </motion.div>
      </motion.button>

      {/* ── Side panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[380px] z-30 flex flex-col
              bg-[#0e0e18] border-l border-violet/25
              shadow-[-8px_0_40px_rgba(124,58,237,0.12)]"
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-5 pt-20 pb-4 border-b border-line flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-violet/15 border border-violet/30 flex items-center justify-center">
                <Sparkles size={14} className="text-violet" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Ask AI</p>
                <p className="text-xs text-muted font-mono">Powered by Claude</p>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">
              <ChatView resource={resource} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
