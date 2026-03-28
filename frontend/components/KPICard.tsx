import React from 'react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  prefix?: string
  suffix?: string
}

export default function KPICard({ title, value, change, prefix, suffix }: KPICardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div style={{
      background: '#0C0E14',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #00FF94 0%, transparent 60%)',
        opacity: 0.5,
      }} />

      {/* Label */}
      <p style={{
        fontSize: '10px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '12px',
        fontFamily: 'Sora, sans-serif',
      }}>
        {title}
      </p>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '10px' }}>
        {prefix && (
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>
            {prefix}
          </span>
        )}
        <span style={{
          fontSize: '28px',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.95)',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Change */}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            background: isPositive ? 'rgba(0,255,148,0.08)' : 'rgba(255,80,80,0.08)',
            padding: '3px 7px', borderRadius: '5px',
          }}>
            <span style={{ color: isPositive ? '#00FF94' : '#FF5050', fontSize: '10px' }}>
              {isPositive ? '▲' : '▼'}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 600,
              color: isPositive ? '#00FF94' : '#FF5050',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>vs prev period</span>
        </div>
      )}
    </div>
  )
}
