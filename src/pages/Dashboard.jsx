import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FileText, Youtube, Upload, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const SOURCE_ICON = { file: Upload, notes: FileText, youtube: Youtube }

export default function Dashboard() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, source_type, status, created_at')
        .order('created_at', { ascending: false })
      if (active) {
        if (!error) setResources(data ?? [])
        setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <span className="eyebrow">Your library</span>
          <h1 className="font-display text-3xl font-semibold mt-2">Study sets</h1>
        </div>
        <Link to="/new" className="btn-primary">
          <Plus size={16} /> New
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cyan/30 border-t-cyan animate-spin" />
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="panel py-20 text-center">
          <p className="text-ink/70 mb-4">No study sets yet. Your first one is one upload away.</p>
          <Link to="/new" className="btn-ghost inline-flex">
            Create your first set
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((r, i) => {
          const Icon = SOURCE_ICON[r.source_type] ?? FileText
          return (
            <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                to={`/resource/${r.id}`}
                className="panel p-5 flex flex-col gap-3 h-full hover:border-cyan/50 hover:shadow-neon-cyan transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <Icon size={18} className="text-cyan" />
                  <ChevronRight size={16} className="text-muted group-hover:text-cyan group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-display font-medium leading-snug">{r.title}</h3>
                <div className="mt-auto flex items-center justify-between text-xs text-muted font-mono">
                  <span className="capitalize">{r.status}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
