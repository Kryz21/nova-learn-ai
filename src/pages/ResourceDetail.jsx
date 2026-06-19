import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, ListChecks, Layers } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import NotesView from '../components/NotesView'
import QuizPlayer from '../components/QuizPlayer'
import FlashcardViewer from '../components/FlashcardViewer'

const TABS = [
  { id: 'notes', label: 'Notes', Icon: FileText },
  { id: 'quiz', label: 'Quiz', Icon: ListChecks },
  { id: 'flashcards', label: 'Flashcards', Icon: Layers },
]

export default function ResourceDetail() {
  const { id } = useParams()
  const [resource, setResource] = useState(null)
  const [tab, setTab] = useState('notes')
  const [loading, setLoading] = useState(true)

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
    return () => {
      active = false
    }
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
    <div className="max-w-4xl mx-auto px-6 py-16">
      <span className="eyebrow">Study set</span>
      <h1 className="font-display text-3xl font-semibold mt-2 mb-8">{resource.title}</h1>

      <div className="flex gap-2 mb-8">
        {TABS.map(({ id: tid, label, Icon }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
              tab === tid ? 'border-cyan/60 text-cyan shadow-neon-cyan bg-cyan/5' : 'border-line text-muted hover:text-ink'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'notes' && <NotesView notes={resource.notes_json} />}
      {tab === 'quiz' && <QuizPlayer questions={resource.quiz_json?.questions} />}
      {tab === 'flashcards' && <FlashcardViewer cards={resource.flashcards_json?.cards} />}
    </div>
  )
}
