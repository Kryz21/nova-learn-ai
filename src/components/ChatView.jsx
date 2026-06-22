import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function ChatView({ resource }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `I've read through **${resource.title}**. Ask me anything — I can explain concepts, quiz you, or help you understand something from the material.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function buildSystemPrompt() {
    const notes = resource.notes_json
    const quiz  = resource.quiz_json
    const cards = resource.flashcards_json

    const notesSummary = notes?.sections
      ?.map(s => `## ${s.heading}\n${s.points?.join('\n')}`)
      .join('\n\n') ?? ''

    const termsSummary = notes?.keyTerms
      ?.map(t => `- ${t.term}: ${t.definition}`)
      .join('\n') ?? ''

    const quizSummary = quiz?.questions
      ?.map((q, i) => `Q${i+1}: ${q.question}\nAnswer: ${q.options[q.correctIndex]}\n${q.explanation}`)
      .join('\n\n') ?? ''

    const flashSummary = cards?.cards
      ?.map(c => `Front: ${c.front}\nBack: ${c.back}`)
      .join('\n') ?? ''

    return `You are a study assistant helping a student understand material from a study set titled "${resource.title}".

Here is the full content of their study set:

=== NOTES ===
${notesSummary}

=== KEY TERMS ===
${termsSummary}

=== QUIZ QUESTIONS & ANSWERS ===
${quizSummary}

=== FLASHCARDS ===
${flashSummary}

Rules:
- Only answer questions related to this material. If asked something unrelated, redirect them back.
- Be concise but thorough. Use examples from the material when helpful.
- If they ask you to quiz them, ask one question at a time and give feedback on their answer.
- Use markdown for structure when it helps clarity (bold key terms, bullet points for lists).
- Keep a friendly, encouraging teaching tone.`
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Add empty placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            system: buildSystemPrompt(),
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Request failed')
      }

      const data = await response.json()

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: data.text }
        return updated
      })
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${err.message}`,
        }
        return updated
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === 'assistant'
                    ? 'bg-violet/15 border border-violet/35'
                    : 'bg-magenta/15 border border-magenta/30'
                }`}
              >
                {msg.role === 'assistant'
                  ? <Bot  size={12} className="text-violet" />
                  : <User size={12} className="text-magenta" />
                }
              </div>

              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-[#13131f] border border-line text-ink/90'
                    : 'bg-magenta/10 border border-magenta/20 text-ink/90'
                }`}
              >
                {msg.content
                  ? <SimpleMarkdown text={msg.content} />
                  : <span className="inline-flex gap-1 py-0.5">
                      {[0,1,2].map(d => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-violet/60 animate-pulse"
                          style={{ animationDelay: `${d * 0.15}s` }}
                        />
                      ))}
                    </span>
                }
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about this material…"
          className="input-field flex-1 resize-none text-sm py-2.5"
          style={{ minHeight: '42px', maxHeight: '100px' }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet/20 border border-violet/40
            text-violet flex items-center justify-center
            hover:bg-violet/30 hover:border-violet/60 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <Send size={15} />
          }
        </button>
      </div>
    </div>
  )
}

function SimpleMarkdown({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />
        const isBullet = /^[-*]\s/.test(line)
        const content  = renderInline(isBullet ? line.slice(2) : line)
        if (isBullet) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-violet mt-0.5 flex-shrink-0">▸</span>
              <span>{content}</span>
            </div>
          )
        }
        return <p key={i}>{content}</p>
      })}
    </div>
  )
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}
