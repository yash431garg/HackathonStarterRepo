import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  action?: React.ReactNode
}

export default function Card({ children, title, subtitle, className, action }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: '#0C0E14',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: '13px', fontWeight: 700,
                color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em',
                fontFamily: 'Sora, sans-serif',
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px', fontFamily: 'Sora, sans-serif' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
