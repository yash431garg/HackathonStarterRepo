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
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: '/products',
    label: 'Products',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2 6h12" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 6v7" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: '/orders',
    label: 'Orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h8l2 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6l2-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M2 6h12" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/ceo',
    label: 'AI CEO',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 8.5l1.5 1.5L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function Shell({ title, children }: ShellProps) {
  const router = useRouter()

  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar */}
      <aside className="w-60 bg-surface-1 border-r border-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#0A0A0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary tracking-tight">Growzilla</p>
              <p className="text-xs text-text-tertiary" style={{ fontSize: '10px' }}>Commerce Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = router.pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150 ease-out',
                  active
                    ? 'bg-surface-2 text-text-primary border-l-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
                )}
              >
                <span className={active ? 'text-accent' : 'text-text-tertiary'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
            <span className="text-xs text-text-tertiary truncate">
              {STORE_URL || 'No store connected'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-surface-1 border-b border-border flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-base font-bold text-text-primary tracking-tight">{title}</h1>
          {STORE_URL && (
            <a
              href={`https://${STORE_URL}/admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150 ease-out"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              {STORE_URL}
            </a>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  )
}
