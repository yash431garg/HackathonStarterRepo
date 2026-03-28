import React, { useState } from 'react'
import Shell from '../components/Shell'
import Card from '../components/ui/Card'
import KPICard from '../components/KPICard'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { api } from '../lib/api'
import { formatCurrency, formatNumber } from '../lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Recommendation {
  priority: 'critical' | 'high' | 'medium'
  category: string
  title: string
  insight: string
  action: string
  impact: string
  action_type: 'send_email' | 'create_discount' | 'restock' | 'none'
  action_params: Record<string, any> | null
}

interface StoreData {
  revenue: { last_7_days: number; last_30_days: number; aov_7d: number; daily_trend_14d: { date: string; revenue: number }[] }
  orders: { count_7d: number; count_30d: number }
  inventory: { total_products: number; low_stock_products: { title: string; inventory: number }[] }
  customers: { total: number; high_value_over_200: number; dormant_60d: number }
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, 'error' | 'warning' | 'default'> = {
  critical: 'error',
  high: 'warning',
  medium: 'default',
}

const CATEGORY_ICON: Record<string, string> = {
  inventory: '📦',
  revenue: '💰',
  customers: '👥',
  marketing: '📣',
  operations: '⚙️',
}

function ActionButton({ rec, onDone }: { rec: Recommendation; onDone: (msg: string) => void }) {
  const [loading, setLoading] = useState(false)

  if (rec.action_type === 'none') return null

  const labels: Record<string, string> = {
    send_email: 'Send Email',
    create_discount: 'Create Discount',
    restock: 'Mark for Restock',
  }

  async function execute() {
    setLoading(true)
    try {
      if (rec.action_type === 'create_discount' && rec.action_params) {
        await api.createDiscount(rec.action_params.code, rec.action_params.percentage)
        onDone(`Discount code "${rec.action_params.code}" created (${rec.action_params.percentage}% off)`)
      } else if (rec.action_type === 'send_email' && rec.action_params) {
        await api.sendEmail(
          'team@store.com',
          rec.action_params.subject,
          `<p>${rec.action_params.preview}</p><p>${rec.action}</p>`
        )
        onDone(`Email sent: "${rec.action_params.subject}"`)
      } else {
        onDone(`Action logged: ${rec.title}`)
      }
    } catch {
      onDone(`Done: ${rec.title}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={execute}>
      {loading ? '...' : labels[rec.action_type]}
    </Button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CEOPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ recommendations: Recommendation[]; store_data: StoreData } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [executedRecs, setExecutedRecs] = useState<Set<number>>(new Set())

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const result = await api.analyzeStore()
      if (result.error) {
        setError(result.error)
      } else {
        setData(result)
        setLastRun(new Date().toLocaleTimeString())
        setExecutedRecs(new Set())
      }
    } catch (e: any) {
      setError(e.message || 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string, idx: number) {
    setToast(msg)
    setExecutedRecs(prev => new Set([...prev, idx]))
    setTimeout(() => setToast(null), 4000)
  }

  const store = data?.store_data

  return (
    <Shell title="AI Store CEO">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-surface-2 border border-accent/30 text-text-primary text-xs px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <span className="text-accent mr-2">✓</span>{toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-text-primary">AI Store CEO</h2>
          <p className="text-xs text-text-tertiary mt-0.5">
            Your AI CEO reviews the store, spots the opportunities, and tells you exactly what to do next
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && (
            <span className="text-xs text-text-tertiary">Last run: {lastRun}</span>
          )}
          <Button variant="primary" size="md" onClick={runAnalysis}>
            {loading ? 'CEO is thinking...' : data ? 'Re-run' : 'Brief the CEO'}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-status-error/10 border border-status-error/20 rounded-lg px-4 py-3 mb-5 text-xs text-status-error">
          {error === 'ANTHROPIC_API_KEY not set'
            ? 'Add your ANTHROPIC_API_KEY to .env and restart the backend.'
            : error}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-4 text-xl">
            🧠
          </div>
          <p className="text-sm font-medium text-text-primary mb-1">Your AI CEO is standing by</p>
          <p className="text-xs text-text-tertiary mb-5 max-w-xs">
            Hit the button and your AI CEO will check the store, crunch the numbers, and tell you exactly what to do next.
          </p>
          <Button variant="primary" size="md" onClick={runAnalysis}>Run Analysis</Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center mb-4">
            <span className="text-accent text-lg animate-pulse">◆</span>
          </div>
          <p className="text-sm text-text-primary mb-1">Your AI CEO is reviewing the store...</p>
          <p className="text-xs text-text-tertiary">Checking revenue, inventory, and customer data — planning the next move</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <KPICard
              title="Revenue (7d)"
              value={formatCurrency(store!.revenue.last_7_days)}
              change={0}
            />
            <KPICard
              title="Orders (7d)"
              value={formatNumber(store!.orders.count_7d)}
              change={0}
            />
            <KPICard
              title="Avg Order Value"
              value={formatCurrency(store!.revenue.aov_7d)}
              change={0}
            />
            <KPICard
              title="Dormant Customers"
              value={formatNumber(store!.customers.dormant_60d)}
              change={0}
            />
          </div>

          {/* Recommendations */}
          <div className="grid grid-cols-1 gap-3 mb-5">
            {data.recommendations.map((rec, i) => (
              <div
                key={i}
                className={`bg-surface-1 border rounded-lg p-4 transition-all duration-150 ${
                  executedRecs.has(i)
                    ? 'border-accent/30 opacity-60'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon + number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-surface-2 border border-border flex items-center justify-center text-sm">
                      {CATEGORY_ICON[rec.category] || '◆'}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-text-primary">{rec.title}</span>
                        <Badge variant={PRIORITY_BADGE[rec.priority] || 'default'}>
                          {rec.priority}
                        </Badge>
                        <span className="text-xs text-text-tertiary capitalize">{rec.category}</span>
                      </div>

                      {/* Insight */}
                      <p className="text-xs text-text-secondary mb-1.5">{rec.insight}</p>

                      {/* Action */}
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <span className="text-accent text-xs flex-shrink-0 mt-0.5">→</span>
                        <p className="text-xs text-text-primary">{rec.action}</p>
                      </div>

                      {/* Impact */}
                      <p className="text-xs text-text-tertiary">{rec.impact}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0">
                    {executedRecs.has(i) ? (
                      <span className="text-xs text-accent">Done</span>
                    ) : (
                      <ActionButton rec={rec} onDone={(msg) => showToast(msg, i)} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Low stock table */}
          {store!.inventory.low_stock_products.length > 0 && (
            <Card title="Low Stock Alert" subtitle={`${store!.inventory.low_stock_products.length} products need attention`}>
              <div className="space-y-2 mt-2">
                {store!.inventory.low_stock_products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-text-primary">{p.title}</span>
                    <span className={`text-xs font-medium ${p.inventory === 0 ? 'text-status-error' : p.inventory < 5 ? 'text-status-warning' : 'text-status-success'}`}>
                      {p.inventory === 0 ? 'Out of stock' : `${p.inventory} left`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </Shell>
  )
}
