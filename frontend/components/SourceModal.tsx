import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { api } from '../lib/api'

const SOURCES = [
  { label: 'Google Ads', icon: '🔍' },
  { label: 'Instagram', icon: '📸' },
  { label: 'TikTok', icon: '🎵' },
  { label: 'Facebook', icon: '👤' },
  { label: 'Twitter / X', icon: '🐦' },
  { label: 'Friend / Word of mouth', icon: '💬' },
  { label: 'Direct / Typed URL', icon: '🌐' },
  { label: 'Other', icon: '✨' },
]

export default function SourceModal() {
  const [visible, setVisible] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!sessionStorage.getItem('source_asked')) {
      setTimeout(() => setVisible(true), 800)
    }
  }, [])

  async function submit() {
    if (!selected) return
    sessionStorage.setItem('source_asked', '1')
    setSubmitted(true)
    await api.trackSource(selected)
    setTimeout(() => {
      setVisible(false)
      router.push('/products')
    }, 1000)
  }

  function skip() {
    sessionStorage.setItem('source_asked', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#0C0E14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,255,148,0.1)', border: '1px solid rgba(0,255,148,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#00FF94', fontSize: '20px' }}>✓</span>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', fontFamily: 'Sora, sans-serif' }}>Thanks! Taking you to our products...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Welcome</p>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', fontFamily: 'Sora, sans-serif', marginBottom: '4px' }}>
                How did you find us?
              </h2>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Help us understand where our customers come from</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              {SOURCES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSelected(s.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 14px', borderRadius: '10px', textAlign: 'left',
                    cursor: 'pointer', transition: 'all 150ms ease',
                    background: selected === s.label ? 'rgba(0,255,148,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selected === s.label ? 'rgba(0,255,148,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    fontFamily: 'Sora, sans-serif',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{s.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: selected === s.label ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)' }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={submit}
                disabled={!selected}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: selected ? '#00FF94' : 'rgba(0,255,148,0.2)',
                  color: selected ? '#080A0F' : 'rgba(255,255,255,0.3)',
                  fontSize: '13px', fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed',
                  border: 'none', transition: 'all 150ms ease', fontFamily: 'Sora, sans-serif',
                }}
              >
                Continue →
              </button>
              <button
                onClick={skip}
                style={{
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer',
                  transition: 'all 150ms ease', fontFamily: 'Sora, sans-serif',
                }}
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
