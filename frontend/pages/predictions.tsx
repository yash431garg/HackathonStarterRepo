import React, { useState } from 'react'
import Shell from '../components/Shell'
import { useApi } from '../hooks/useApi'
import { api } from '../lib/api'

interface Prediction {
  product_id: string
  title: string
  product_type: string
  current_stock: number
  sold_7d: number
  daily_velocity: number
  days_until_stockout: number | null
  status: 'critical' | 'warning' | 'low' | 'ok'
  projection: number[]
}

const STATUS_CONFIG = {
  critical: { label: 'Critical', color: '#FF5050', bg: 'rgba(255,80,80,0.08)', border: 'rgba(255,80,80,0.2)', dot: '#FF5050' },
  warning:  { label: 'Warning',  color: '#FFB800', bg: 'rgba(255,184,0,0.08)',  border: 'rgba(255,184,0,0.2)',  dot: '#FFB800' },
  low:      { label: 'Low',      color: '#FF8C42', bg: 'rgba(255,140,66,0.08)', border: 'rgba(255,140,66,0.2)', dot: '#FF8C42' },
  ok:       { label: 'Healthy',  color: '#00FF94', bg: 'rgba(0,255,148,0.08)',  border: 'rgba(0,255,148,0.2)',  dot: '#00FF94' },
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const w = 80, h = 28
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={color}
        opacity="0.08"
        stroke="none"
      />
    </svg>
  )
}

function StockBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  const color = pct <= 10 ? '#FF5050' : pct <= 30 ? '#FFB800' : '#00FF94'
  return (
    <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.3s ease' }} />
    </div>
  )
}

export default function PredictionsPage() {
  const { data, loading } = useApi(() => api.getPredictions(), [])
  const [filter, setFilter] = useState<string>('all')

  const predictions: Prediction[] = data?.predictions || []
  const maxStock = Math.max(...predictions.map(p => p.current_stock), 1)

  const filtered = filter === 'all' ? predictions : predictions.filter(p => p.status === filter)

  const counts = {
    critical: predictions.filter(p => p.status === 'critical').length,
    warning: predictions.filter(p => p.status === 'warning').length,
    low: predictions.filter(p => p.status === 'low').length,
    ok: predictions.filter(p => p.status === 'ok').length,
  }

  return (
    <Shell title="Inventory Predictor">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>AI Forecast</p>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.03em', fontFamily: 'Sora, sans-serif' }}>
          Inventory Predictor
        </h2>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
          Days-until-stockout based on 7-day sales velocity
        </p>
      </div>

      {/* Status summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {(['critical', 'warning', 'low', 'ok'] as const).map(s => {
          const cfg = STATUS_CONFIG[s]
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
              style={{
                background: filter === s ? cfg.bg : '#0C0E14',
                border: `1px solid ${filter === s ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px', padding: '16px',
                cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, display: 'block', boxShadow: `0 0 6px ${cfg.dot}` }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cfg.label}</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: 700, color: cfg.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {counts[s]}
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>products</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#0C0E14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 90px 80px 80px 100px 90px',
          padding: '10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: '12px',
        }}>
          {['Product', 'Stock', 'Sold 7d', 'Velocity', 'Days Left', 'Trend'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
            Loading predictions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
            No products found
          </div>
        ) : (
          filtered.map((p, i) => {
            const cfg = STATUS_CONFIG[p.status]
            return (
              <div
                key={p.product_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 90px 80px 80px 100px 90px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Product */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'Sora, sans-serif', marginBottom: '2px' }}>{p.title}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{p.product_type}</p>
                </div>

                {/* Stock */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
                    {p.current_stock}
                  </p>
                  <StockBar current={p.current_stock} max={maxStock} />
                </div>

                {/* Sold 7d */}
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {p.sold_7d}
                </p>

                {/* Daily velocity */}
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {p.daily_velocity}/day
                </p>

                {/* Days left */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: '8px', padding: '4px 10px', width: 'fit-content',
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, display: 'block' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}>
                    {p.days_until_stockout === null ? '∞' : p.days_until_stockout < 1 ? '<1d' : `${Math.round(p.days_until_stockout)}d`}
                  </span>
                </div>

                {/* Sparkline */}
                <MiniSparkline data={p.projection} color={cfg.color} />
              </div>
            )
          })
        )}
      </div>

      {data && (
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px', textAlign: 'right' }}>
          Based on 7-day sales velocity · Updated {new Date(data.generated_at).toLocaleTimeString()}
        </p>
      )}
    </Shell>
  )
}
