import React, { useState, useRef, useEffect } from 'react'
import { api } from '../lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const GREETING: Message = {
  role: 'assistant',
  content: "Hi! I'm your personal style advisor. Answer a few quick questions and I'll recommend outfits tailored to you.\n\nWhat's your name?",
}

const QUICK_REPLIES: Record<string, string[]> = {
  'skin tone': ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Deep'],
  'size': ['XS', 'S', 'M', 'L', 'XL'],
  'style': ['Casual', 'Smart-casual', 'Sporty', 'Formal'],
  'budget': ['Under $50', '$50–$100', 'Over $100'],
}

function getQuickReplies(messages: Message[]): string[] | null {
  if (!messages.length) return null
  const last = messages[messages.length - 1]
  if (last.role !== 'assistant') return null
  const text = last.content.toLowerCase()
  for (const [key, replies] of Object.entries(QUICK_REPLIES)) {
    if (text.includes(key)) return replies
  }
  return null
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**')) {
      const parts = line.split('**').filter(Boolean)
      return (
        <p key={i} className="mt-2 first:mt-0">
          {parts.map((p, j) =>
            j % 2 === 0
              ? <strong key={j} className="text-accent font-semibold">{p}</strong>
              : <span key={j} className="text-text-secondary">{p}</span>
          )}
        </p>
      )
    }
    if (line.startsWith('*') && line.endsWith('*')) {
      return <p key={i} className="text-text-tertiary italic text-xs mt-0.5">{line.replace(/\*/g, '')}</p>
    }
    if (!line.trim()) return <br key={i} />
    return <p key={i} className="mt-1 first:mt-0">{line}</p>
  })
}

export default function StyleChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, messages, loading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const userMsg: Message = { role: 'user', content }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const { reply } = await api.chat(next.map(m => ({ role: m.role, content: m.content })))
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...next, { role: 'assistant', content: "Couldn't connect. Try again." }])
    } finally {
      setLoading(false)
    }
  }

  const quickReplies = getQuickReplies(messages)
  const unread = !open && messages.length > 1

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 flex flex-col bg-surface-1 border border-border rounded-xl shadow-2xl overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs font-semibold text-text-primary">Style Advisor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setMessages([GREETING]); setInput('') }}
                className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5">
                    <span className="text-accent" style={{ fontSize: '9px' }}>✦</span>
                  </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent text-surface-0 rounded-br-sm'
                    : 'bg-surface-2 border border-border text-text-primary rounded-bl-sm'
                }`}>
                  {msg.role === 'user' ? msg.content : renderContent(msg.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start mb-2">
                <div className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5">
                  <span className="text-accent" style={{ fontSize: '9px' }}>✦</span>
                </div>
                <div className="bg-surface-2 border border-border px-3 py-2.5 rounded-xl rounded-bl-sm">
                  <span className="flex gap-1 items-center">
                    <span className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {quickReplies && !loading && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2 flex-shrink-0">
              {quickReplies.map(r => (
                <button
                  key={r}
                  onClick={() => send(r)}
                  className="px-2.5 py-1 text-xs rounded-full bg-surface-2 border border-border text-text-secondary hover:border-accent/40 hover:text-text-primary transition-all duration-150"
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 px-3 pb-3 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40 transition-colors disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center disabled:opacity-40 hover:bg-accent/90 transition-colors flex-shrink-0"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="#0A0A0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-accent shadow-lg flex items-center justify-center hover:bg-accent/90 transition-all duration-150 hover:scale-105"
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="#0A0A0B" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 3.5A1.5 1.5 0 013.5 2h11A1.5 1.5 0 0116 3.5v8A1.5 1.5 0 0114.5 13H6l-4 3V3.5z" stroke="#0A0A0B" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
          </svg>
        )}
        {unread && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-error border-2 border-surface-0" />
        )}
      </button>
    </>
  )
}
