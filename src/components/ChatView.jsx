import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User } from 'lucide-react'

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
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build system prompt from the resource's generated content
  function buildSystemPrompt() {
    const notes = resource.notes_json
    const quiz = resource.quiz_json
    const cards = resource.flashcards_json

    const notesSummary = notes?.sections
      ?.map(s => `## ${s.heading}\n${s.points?.join('\n')}`)
      .join('\n\n') ?? ''

    const termsSummary = notes?.keyTerms
      ?.map(t => `- ${t.term}: ${t.definition}`)
      .join('\n') ?? ''

    const quizSummary = quiz?.questions
      ?.map((q, i) => `Q${i + 1}: ${q.question}\nAnswer: ${q.options[q.correctIndex]}\n${q.explanation}`)
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

    // Add empty assistant message for streaming into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.delta?.text ?? ''
            full += delta
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: full }
              return updated
            })
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Something went wrong. Try again.',
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
    <div className="flex flex-col h-[520px]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5 ${
                  msg.role === 'assistant'
                    ? 'bg-cyan/15 border border-cyan/30'
                    : 'bg-magenta/15 border border-magenta/30'
                }`}
              >
                {msg.role === 'assistant'
                  ? <Bot size={14} className="text-cyan" />
                  : <User size={14} className="text-magenta" />
                }
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[82%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-panel border border-line text-ink/90'
                    : 'bg-magenta/10 border border-magenta/25 text-ink/90'
                }`}
              >
                {msg.content
                  ? <SimpleMarkdown text={msg.content} />
                  : <span className="inline-flex gap-1">
                      {[0,1,2].map(d => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-cyan/60 animate-pulse"
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
      <div className="mt-4 flex gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about this material…"
          className="input-field flex-1 resize-none min-h-[44px] max-h-[120px] py-2.5 text-sm"
          style={{ fieldSizing: 'content' }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="btn-primary !px-4 !py-2.5 disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}

// Minimal markdown renderer (bold, bullets, line breaks)
function SimpleMarkdown({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />
        const isBullet = /^[-*]\s/.test(line)
        const content = renderInline(isBullet ? line.slice(2) : line)
        if (isBullet) {
          return (
            <div key={i} className="flex gap-1.5">
              <span className="text-cyan mt-0.5 flex-shrink-0">▸</span>
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
