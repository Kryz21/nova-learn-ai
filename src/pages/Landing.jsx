import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Upload, FileText, ListChecks, Layers, Youtube, FileType, ArrowRight } from 'lucide-react'
import NovaOrbit from '../components/NovaOrbit'

const STEPS = [
  {
    n: '01',
    title: 'Feed it a source',
    body: 'Drop in a PDF, a Word doc, raw notes, or paste a YouTube link. Novalearn reads it end to end.',
    Icon: Upload,
  },
  {
    n: '02',
    title: 'Gemini reads & structures',
    body: 'The content is parsed and sent to Gemini, which extracts the concepts that actually matter.',
    Icon: FileText,
  },
  {
    n: '03',
    title: 'Study, your way',
    body: 'Get clean notes, a graded quiz, and spaced-repetition-ready flashcards — generated together, kept in sync.',
    Icon: Layers,
  },
]

const OUTPUTS = [
  { Icon: FileText, title: 'Structured notes', body: 'Headings, key terms, and summaries pulled straight from the source — not a wall of text.', color: 'cyan' },
  { Icon: ListChecks, title: 'Auto-graded quizzes', body: 'Multiple choice and short answer questions that test the concepts, not just keywords.', color: 'magenta' },
  { Icon: Layers, title: 'Flashcard decks', body: 'Front/back cards generated from the densest parts of your material, ready to drill.', color: 'violet' },
]

const SOURCES = [
  { Icon: FileType, label: 'PDF' },
  { Icon: FileText, label: 'DOCX' },
  { Icon: Upload, label: 'Raw notes' },
  { Icon: Youtube, label: 'YouTube' },
]

export default function Landing() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })

  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const heroOrbitY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center w-full">
          <motion.div style={{ y: heroTextY, opacity: heroOpacity }}>
            <span className="eyebrow">Notes · Quizzes · Flashcards — one source</span>
            <h1 className="mt-5 font-display text-5xl sm:text-6xl font-semibold leading-[1.05] tracking-tight">
              Turn anything into{' '}
              <span className="text-cyan text-glow-cyan">knowledge</span>.
            </h1>
            <p className="mt-6 text-lg text-ink/70 max-w-md leading-relaxed">
              Upload a PDF, a Word doc, your raw notes, or a YouTube video. Novalearn AI reads it and
              builds you a study set — structured notes, a quiz, and flashcards — in one pass.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup" className="btn-primary">
                Start learning free <ArrowRight size={16} />
              </Link>
              <a href="#how" className="btn-ghost">
                See how it works
              </a>
            </div>
            <div className="mt-10 flex items-center gap-5">
              {SOURCES.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-muted text-xs font-mono">
                  <Icon size={14} /> {label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div style={{ y: heroOrbitY }}>
            <NovaOrbit />
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted/60 text-xs font-mono tracking-widest animate-pulse-glow">
          SCROLL ↓
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative py-32 border-t border-line/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl">
            <span className="eyebrow">The pipeline</span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold">From raw material to recall.</h2>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <ParallaxCard key={step.n} index={i}>
                <div className="font-mono text-xs text-magenta tracking-widest mb-4">{step.n}</div>
                <step.Icon className="text-cyan mb-4" size={26} strokeWidth={1.5} />
                <h3 className="font-display text-xl font-medium mb-2">{step.title}</h3>
                <p className="text-ink/65 text-sm leading-relaxed">{step.body}</p>
              </ParallaxCard>
            ))}
          </div>
        </div>
      </section>

      {/* OUTPUTS */}
      <section className="relative py-32 border-t border-line/50 bg-gradient-to-b from-transparent via-surface/40 to-transparent">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-xl">
            <span className="eyebrow">What you get</span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-semibold">Three study formats, one source of truth.</h2>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {OUTPUTS.map((o, i) => (
              <ParallaxCard key={o.title} index={i} accent={o.color}>
                <o.Icon
                  className={o.color === 'cyan' ? 'text-cyan' : o.color === 'magenta' ? 'text-magenta' : 'text-violet'}
                  size={26}
                  strokeWidth={1.5}
                />
                <h3 className="font-display text-xl font-medium mt-4 mb-2">{o.title}</h3>
                <p className="text-ink/65 text-sm leading-relaxed">{o.body}</p>
              </ParallaxCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 border-t border-line/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">
            Stop re-reading. Start <span className="text-magenta text-glow-magenta">recalling</span>.
          </h2>
          <p className="mt-4 text-ink/65">Free to start. No credit card. Bring your own material.</p>
          <Link to="/signup" className="btn-primary mt-8">
            Create your first study set <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line/50 py-8 text-center text-xs font-mono text-muted">
        Novalearn AI — Built with Gemini
      </footer>
    </div>
  )
}

function ParallaxCard({ children, index, accent }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [40 + index * 12, -40 - index * 12])

  const borderColor =
    accent === 'magenta' ? 'hover:border-magenta/50' : accent === 'violet' ? 'hover:border-violet/50' : 'hover:border-cyan/50'

  return (
    <motion.div ref={ref} style={{ y }} className={`panel p-7 transition-colors duration-300 ${borderColor}`}>
      {children}
    </motion.div>
  )
}
