import React, { useEffect, useState } from 'react'
import { api } from '../lib/api'

const SOURCES = [
  { label: 'Google Ads', icon: '🔍', color: '#4285F4' },
  { label: 'Instagram', icon: '📸', color: '#E1306C' },
  { label: 'TikTok', icon: '🎵', color: '#69C9D0' },
  { label: 'Facebook', icon: '👤', color: '#1877F2' },
  { label: 'Twitter / X', icon: '🐦', color: '#1DA1F2' },
  { label: 'Friend / Word of mouth', icon: '💬', color: '#00FF94' },
  { label: 'Direct / Typed URL', icon: '🌐', color: '#A78BFA' },
  { label: 'Other', icon: '✨', color: '#6B7280' },
]

export default function SourceModal() {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Show once per session
    if (!sessionStorage.getItem('source_asked')) {
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  async function submit() {
    if (!selected) return
    sessionStorage.setItem('source_asked', '1')
    setSubmitted(true)
    await api.trackSource(selected)
    setTimeout(() => setVisible(false), 1000)
  }

  function skip() {
    sessionStorage.setItem('source_asked', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="bg-surface-1 border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
        {submitted ? (
          <div className="flex flex-col items-center py-4">
            <span className="text-2xl mb-2">✓</span>
            <p className="text-sm font-medium text-text-primary">Thanks!</p>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-text-primary mb-1">Welcome! Quick question</h2>
            <p className="text-xs text-text-tertiary mb-4">How did you find us today?</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {SOURCES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSelected(s.label)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs text-left transition-all duration-150 ${
                    selected === s.label
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-border bg-surface-2 text-text-secondary hover:border-border/60 hover:text-text-primary'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={!selected}
                className="flex-1 py-2 rounded-lg bg-accent text-surface-0 text-xs font-medium disabled:opacity-40 hover:bg-accent/90 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={skip}
                className="px-4 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                Skip
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
