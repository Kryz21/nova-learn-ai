import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, RotateCcw } from 'lucide-react'

export default function QuizPlayer({ questions }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  if (!questions?.length) return <p className="text-muted">No quiz generated.</p>

  const score = questions.reduce((acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc), 0)

  function reset() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="space-y-6">
      {submitted && (
        <div className="panel p-5 flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-muted uppercase tracking-widest">Score</span>
            <p className="font-display text-2xl font-semibold">
              {score} <span className="text-muted text-base font-normal">/ {questions.length}</span>
            </p>
          </div>
          <button onClick={reset} className="btn-ghost !px-4 !py-2 text-sm">
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {questions.map((q, i) => {
        const picked = answers[i]
        const isCorrect = picked === q.correctIndex
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="panel p-6">
            <p className="font-medium mb-4">
              <span className="text-magenta font-mono text-sm mr-2">{String(i + 1).padStart(2, '0')}</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isPicked = picked === oi
                let style = 'border-line hover:border-cyan/40'
                if (submitted) {
                  if (oi === q.correctIndex) style = 'border-cyan/60 bg-cyan/10'
                  else if (isPicked) style = 'border-magenta/60 bg-magenta/10'
                } else if (isPicked) {
                  style = 'border-cyan/60 bg-cyan/5'
                }
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {submitted && oi === q.correctIndex && <Check size={16} className="text-cyan" />}
                    {submitted && isPicked && oi !== q.correctIndex && <X size={16} className="text-magenta" />}
                  </button>
                )
              })}
            </div>
            {submitted && q.explanation && (
              <p className="text-xs text-muted mt-3 leading-relaxed">{q.explanation}</p>
            )}
          </motion.div>
        )
      })}

      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="btn-primary w-full disabled:opacity-50"
        >
          Submit quiz
        </button>
      )}
    </div>
  )
}
