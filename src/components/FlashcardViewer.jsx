import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'

export default function FlashcardViewer({ cards }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (!cards?.length) return <p className="text-muted">No flashcards generated.</p>

  const card = cards[index]

  function go(dir) {
    setFlipped(false)
    setIndex((i) => (i + dir + cards.length) % cards.length)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="font-mono text-xs text-muted tracking-widest">
        {index + 1} / {cards.length}
      </div>

      <div className="w-full max-w-lg h-72 [perspective:1200px]">
        <motion.div
          className="relative w-full h-full cursor-pointer [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="absolute inset-0 panel p-8 flex items-center justify-center text-center [backface-visibility:hidden] hover:border-cyan/50">
            <p className="font-display text-xl">{card.front}</p>
          </div>
          <div
            className="absolute inset-0 panel p-8 flex items-center justify-center text-center border-magenta/40 [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <p className="text-ink/85">{card.back}</p>
          </div>
        </motion.div>
      </div>

      <button onClick={() => setFlipped((f) => !f)} className="flex items-center gap-1.5 text-xs text-muted hover:text-cyan transition-colors font-mono">
        <RotateCw size={12} /> click card to flip
      </button>

      <div className="flex items-center gap-4">
        <button onClick={() => go(-1)} className="btn-ghost !px-3 !py-2">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => go(1)} className="btn-ghost !px-3 !py-2">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
