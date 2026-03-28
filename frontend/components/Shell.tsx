import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { cn } from '../lib/utils'
import { STORE_URL } from '../lib/constants'

interface ShellProps {
  title: string
  children: React.ReactNode
}

const navItems = [
  {
    href: '/',
    label: 'Overview',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="1.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    href: '/products',
    label: 'Products',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M1.5 6h12" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5.5 6v6.5" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M3.5 1.5h8l2 4v7a1 1 0 01-1 1h-10a1 1 0 01-1-1v-7l2-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M1.5 5.5h12" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5.5 8.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/predictions',
    label: 'Inventory',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 11l3-4 3 2 3-5 2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.5 13.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/ceo',
    label: 'AI CEO',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M5 8l2 2 3.5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accent: true,
  },
]

export default function Shell({ title, children }: ShellProps) {
  const router = useRouter()

  return (
    <div className="flex h-screen" style={{ background: '#080A0F' }}>
      {/* Sidebar */}
      <aside style={{ width: '220px', background: '#0C0E14', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }} className="flex flex-col">

        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #00FF94 0%, #00CC77 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#080A0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', fontFamily: 'Sora, sans-serif' }}>Smart Shopify</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '1px' }}>Experience</p>
            </div>
          </div>
        </div>

        {/* Nav label */}
        <div style={{ padding: '16px 16px 6px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Navigation</p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 8px 16px' }}>
          {navItems.map((item) => {
            const active = router.pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  borderLeft: active ? '2px solid #00FF94' : '2px solid transparent',
                  transition: 'all 150ms ease-out',
                  textDecoration: 'none',
                  fontFamily: 'Sora, sans-serif',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}
              >
                <span style={{ color: active ? '#00FF94' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
                {item.accent && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '9px', fontWeight: 600,
                    color: '#00FF94', background: 'rgba(0,255,148,0.1)',
                    padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>AI</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Store status */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00FF94', display: 'block', boxShadow: '0 0 6px rgba(0,255,148,0.5)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {STORE_URL || 'No store connected'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header style={{
          height: '52px', background: '#0C0E14',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0
        }}>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em', fontFamily: 'Sora, sans-serif' }}>
              {title}
            </h1>
          </div>
          {STORE_URL && (
            <a
              href={`https://${STORE_URL}/admin`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none', transition: 'color 150ms ease-out'
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00FF94', display: 'block' }} />
              {STORE_URL}
            </a>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto dot-grid" style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
