import React, { useState, useRef, useEffect } from 'react'
import Shell from '../components/Shell'
import Button from '../components/ui/Button'
import { api } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ── Markdown-lite renderer ─────────────────────────────────────────────────

function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold product title line: **Title** — $price
    if (line.startsWith('**') && line.includes('**')) {
      const parts = line.split('**').filter(Boolean)
      return (
        <p key={i} className="mt-3 first:mt-0">
          {parts.map((part, j) =>
            j % 2 === 0 ? (
              <strong key={j} className="text-accent font-semibold">{part}</strong>
            ) : (
              <span key={j} className="text-text-secondary">{part}</span>
            )
          )}
        </p>
      )
    }
    // Italic line
    if (line.startsWith('*') && line.endsWith('*')) {
      return <p key={i} className="text-text-tertiary italic text-xs mt-0.5">{line.replace(/\*/g, '')}</p>
    }
    // Empty line
    if (line.trim() === '') return <br key={i} />
    return <p key={i} className="mt-1 first:mt-0">{line}</p>
  })
}

// ── Bubble ─────────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <span className="text-accent text-xs">✦</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
          isUser
            ? 'bg-accent text-surface-0 rounded-br-sm'
            : 'bg-surface-2 border border-border text-text-primary rounded-bl-sm'
        }`}
      >
        {isUser ? msg.content : renderContent(msg.content)}
      </div>
    </div>
  )
}

// ── Quick replies ──────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'],
  ['S', 'M', 'L', 'XL'],
  ['Casual', 'Smart-casual', 'Sporty', 'Formal'],
  ['Under $50', '$50–$100', 'Over $100'],
]

function getQuickReplies(messages: Message[]): string[] | null {
  if (messages.length === 0) return null
  const last = messages[messages.length - 1]
  if (last.role !== 'assistant') return null
  const text = last.content.toLowerCase()
  if (text.includes('skin tone')) return QUICK_REPLIES[0]
  if (text.includes('size')) return QUICK_REPLIES[1]
  if (text.includes('style') || text.includes('prefer')) return QUICK_REPLIES[2]
  if (text.includes('budget')) return QUICK_REPLIES[3]
  return null
}

// ── Page ───────────────────────────────────────────────────────────────────

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm your personal style advisor. I'll help you find the perfect outfit from our collection.\n\nTo get started — what's your name?",
}

export default function StylistPage() {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      // Only send assistant + user messages (skip the greeting system message quirk)
      const history = next.map(m => ({ role: m.role, content: m.content }))
      const { reply } = await api.chat(history)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...next, { role: 'assistant', content: "Sorry, I couldn't connect right now. Please try again." }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function reset() {
    setMessages([GREETING])
    setInput('')
  }

  const quickReplies = getQuickReplies(messages)

  return (
    <Shell title="Style Advisor">
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Personal Style Advisor</h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              Answer a few questions and get outfit recommendations tailored to you
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>Start over</Button>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-surface-1 border border-border rounded-lg overflow-y-auto p-4">
          {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <span className="text-accent text-xs">✦</span>
              </div>
              <div className="bg-surface-2 border border-border px-3.5 py-2.5 rounded-xl rounded-bl-sm">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {quickReplies && !loading && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {quickReplies.map(r => (
              <button
                key={r}
                onClick={() => send(r)}
                className="px-3 py-1.5 text-xs rounded-full bg-surface-2 border border-border text-text-secondary hover:border-accent/40 hover:text-text-primary transition-all duration-150"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 mt-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type your answer..."
            disabled={loading}
            className="flex-1 bg-surface-1 border border-border rounded-lg px-4 py-2.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 transition-colors duration-150 disabled:opacity-50"
          />
          <Button variant="primary" size="md" onClick={() => send()} disabled={!input.trim() || loading}>
            Send
          </Button>
        </div>
      </div>
    </Shell>
  )
}
