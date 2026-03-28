import React, { useState } from 'react'
import Shell from '../components/Shell'
import KPICard from '../components/KPICard'
import Card from '../components/ui/Card'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import DonutChart from '../components/charts/DonutChart'
import LiveFeed from '../components/LiveFeed'
import { useApi } from '../hooks/useApi'
import { useRevenue, useTopProducts } from '../hooks/useAnalytics'
import { api } from '../lib/api'
import { formatCurrency, formatNumber } from '../lib/utils'
import type { StoreInfo, RevenueDataPoint, TopProduct, LiveEvent } from '../lib/types'

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STORE: StoreInfo = {
  domain: 'snowdevil.myshopify.com',
  name: 'Snow Devil',
  currency: 'USD',
  product_count: 42,
  order_count: 1283,
  customer_count: 891,
  last_sync_at: '2026-03-24T10:30:00Z',
}

function generateMockRevenue(): RevenueDataPoint[] {
  // Deterministic pseudo-random so server and client produce identical output
  const bases = [3241, 2987, 3812, 2654, 3590, 4012, 3187, 2843, 3654, 4201, 3087, 2765, 3921, 3456, 2987, 3812, 4123, 3087, 2654, 3765, 4012, 3543, 2876, 3654, 3987, 4201, 3123, 2843, 3765, 4087]
  const orderCounts = [24, 19, 28, 18, 26, 30, 22, 20, 27, 31, 21, 19, 29, 25, 20, 28, 32, 22, 18, 27, 30, 26, 20, 27, 29, 32, 23, 21, 28, 31]
  const data: RevenueDataPoint[] = []
  const anchor = new Date('2026-03-28')
  for (let i = 29; i >= 0; i--) {
    const d = new Date(anchor)
    d.setDate(d.getDate() - i)
    const base = bases[29 - i]
    const orders = orderCounts[29 - i]
    data.push({
      date: d.toISOString().split('T')[0],
      revenue: Math.round(base * 100) / 100,
      orders,
      aov: Math.round((base / orders) * 100) / 100,
    })
  }
  return data
}

const MOCK_REVENUE = generateMockRevenue()

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { id: '1', title: 'The Complete Snowboard', revenue: 12480, units_sold: 48 },
  { id: '2', title: 'The Collection Snowboard: Hydrogen', revenue: 9360, units_sold: 36 },
  { id: '3', title: 'The Multi-managed Snowboard', revenue: 7540, units_sold: 29 },
  { id: '4', title: 'The Draft Snowboard', revenue: 5200, units_sold: 20 },
  { id: '5', title: 'Selling Plans Ski Wax', revenue: 3120, units_sold: 78 },
]

const MOCK_EVENTS: LiveEvent[] = [
  { id: '1', event_type: 'new_order', payload: { order_number: '1042', total_price: 259.99 }, created_at: '2026-03-28T09:59:00Z' },
  { id: '2', event_type: 'customer_created', payload: { email: 'sarah@example.com' }, created_at: '2026-03-28T09:57:00Z' },
  { id: '3', event_type: 'new_order', payload: { order_number: '1041', total_price: 149.50 }, created_at: '2026-03-28T09:55:00Z' },
  { id: '4', event_type: 'inventory_change', payload: { product_title: 'Complete Snowboard' }, created_at: '2026-03-28T09:53:00Z' },
  { id: '5', event_type: 'new_order', payload: { order_number: '1040', total_price: 89.99 }, created_at: '2026-03-28T09:50:00Z' },
  { id: '6', event_type: 'product_update', payload: { title: 'Hydrogen Snowboard' }, created_at: '2026-03-28T09:45:00Z' },
  { id: '7', event_type: 'refund_issued', payload: { order_number: '1035' }, created_at: '2026-03-28T09:40:00Z' },
  { id: '8', event_type: 'new_order', payload: { order_number: '1039', total_price: 324.00 }, created_at: '2026-03-28T09:35:00Z' },
]

// ── Page Component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [useMock, setUseMock] = useState(false)

  const { data: storeData, error: storeError } = useApi(() => api.getStore(), [])
  const { data: revenueData, error: revenueError } = useRevenue('30d')
  const { data: topData, error: topError } = useTopProducts(5)
  const { data: trafficData } = useApi(() => api.getTrafficSources(), [])

  // Determine if we should use mock data
  const isMock = useMock || !!(storeError && revenueError)
  const store = storeData || MOCK_STORE
  const revenue = revenueData?.series || MOCK_REVENUE
  const topProducts = topData?.products || MOCK_TOP_PRODUCTS

  // Compute KPIs from revenue series
  const totalRevenue = revenue.reduce((sum, d) => sum + d.revenue, 0)
  const totalOrders = revenue.reduce((sum, d) => sum + d.orders, 0)
  const avgAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Simulated period-over-period change
  const half = Math.floor(revenue.length / 2)
  const firstHalf = revenue.slice(0, half).reduce((s, d) => s + d.revenue, 0)
  const secondHalf = revenue.slice(half).reduce((s, d) => s + d.revenue, 0)
  const revenueChange = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <Shell title="Overview">
      {/* Page header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Store Intelligence</p>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.03em', fontFamily: 'Sora, sans-serif' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} ☀️
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{today}</p>
        </div>
        {isMock && (
          <div style={{ background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.2)', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,180,0,0.8)' }}>Demo data</span>
          </div>
        )}
      </div>

      {/* Section label */}
      <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Key Metrics — Last 30 days</p>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4 mb-6 animate-fade-up-1">
        <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} change={revenueChange} />
        <KPICard title="Total Orders" value={formatNumber(totalOrders)} change={8.2} />
        <KPICard title="Avg Order Value" value={formatCurrency(avgAOV)} change={-2.1} />
        <KPICard title="Customers" value={formatNumber(store.customer_count)} change={12.4} />
      </div>

      {/* Section label */}
      <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Revenue & Activity</p>

      {/* Charts + Feed */}
      <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up-2">
        <div className="col-span-2">
          <Card title="Revenue Trend" subtitle="Daily revenue over the last 30 days">
            <LineChart
              data={revenue.map((d) => ({
                label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: d.revenue,
              }))}
              height={220}
              color="#00FF94"
              showGrid
              showLabels
              showTooltip
            />
          </Card>
        </div>
        <Card>
          <LiveFeed maxEvents={20} mockEvents={isMock ? MOCK_EVENTS : undefined} />
        </Card>
      </div>

      {/* Section label */}
      <p style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Products & Acquisition</p>

      {/* Top Products + Traffic Sources */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up-3">
        <div className="col-span-2">
          <Card title="Top Products" subtitle="Ranked by revenue generated">
            <BarChart
              data={topProducts.map((p) => ({ label: p.title, value: p.revenue }))}
              height={180}
              horizontal
            />
          </Card>
        </div>
        <Card title="Traffic Sources" subtitle={trafficData ? `${trafficData.total} total visitors` : 'Waiting for visitors'}>
          {trafficData && trafficData.sources.length > 0 ? (
            <DonutChart
              size={140}
              segments={trafficData.sources.map((s, i) => ({
                label: s.source,
                value: s.count,
                color: ['#E1306C','#4285F4','#69C9D0','#00FF94','#1877F2','#A78BFA','#F59E0B','#6B7280'][i % 8],
              }))}
              centerLabel="visitors"
              centerValue={String(trafficData.total)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', textAlign: 'center' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>📡</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>No data yet</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>Sources appear as visitors answer the welcome prompt</p>
            </div>
          )}
        </Card>
      </div>
    </Shell>
  )
}
