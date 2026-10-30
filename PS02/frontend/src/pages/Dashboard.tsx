import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import MoneyText from '../components/MoneyText'

interface Summary {
  countsByClass: Record<string, number>
  unresolved: number
  totalOutstandingMinor: number
  currency: string
  overdueCount: number
  integrityAlert: boolean
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: () => api.get<Summary>('/reports/summary'),
  })
  if (isLoading || !data) return <p>Loading…</p>
  return (
    <div>
      {data.integrityAlert && <div className="banner-error">Integrity alert — review ledger.</div>}
      <div className="kpi-grid">
        <div className="kpi"><span>Total Outstanding</span><strong><MoneyText amountMinor={data.totalOutstandingMinor} currency={data.currency} /></strong></div>
        <div className="kpi"><span>Unresolved</span><strong>{data.unresolved}</strong></div>
        <div className="kpi"><span>Overdue</span><strong>{data.overdueCount}</strong></div>
        {Object.entries(data.countsByClass).map(([cls, n]) => (
          <div key={cls} className="kpi"><span>{cls}</span><strong>{n}</strong></div>
        ))}
      </div>
    </div>
  )
}
