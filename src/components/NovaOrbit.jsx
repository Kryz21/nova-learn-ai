import { motion } from 'framer-motion'
import { FileText, ListChecks, Layers } from 'lucide-react'

const NODES = [
  { Icon: FileText, label: 'Notes', color: '#00F0FF', angle: -90 },
  { Icon: ListChecks, label: 'Quiz', color: '#FF2EC4', angle: 30 },
  { Icon: Layers, label: 'Flashcards', color: '#7C3AED', angle: 150 },
]

const RADIUS = 150
const DURATION = 24

export default function NovaOrbit() {
  return (
    <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] mx-auto select-none" aria-hidden="true">
      <div className="absolute inset-0 rounded-full border border-cyan/15 animate-spin-slow" />
      <div className="absolute inset-8 rounded-full border border-magenta/10 animate-spin-slower" />

      {/* core star */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full
        bg-gradient-to-br from-cyan to-violet flex items-center justify-center"
        style={{ boxShadow: '0 0 60px rgba(0,240,255,0.55)' }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="font-mono text-[9px] tracking-widest text-void font-bold">SOURCE</span>
      </motion.div>

      {/* orbiting group: rotates as one unit */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: DURATION, repeat: Infinity, ease: 'linear' }}
      >
        {NODES.map(({ Icon, label, color, angle }) => (
          <div
            key={label}
            className="absolute top-1/2 left-1/2 w-0 h-0"
            style={{ transform: `rotate(${angle}deg) translate(${RADIUS}px)` }}
          >
            {/* counter-rotate so icon + label stay upright */}
            <motion.div
              className="-translate-x-1/2 -translate-y-1/2"
              animate={{ rotate: -360 }}
              transition={{ duration: DURATION, repeat: Infinity, ease: 'linear' }}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center panel"
                  style={{ boxShadow: `0 0 24px ${color}55` }}
                >
                  <Icon size={20} color={color} strokeWidth={1.75} />
                </div>
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted whitespace-nowrap">
                  {label}
                </span>
              </div>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
