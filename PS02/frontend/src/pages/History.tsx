import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import AuditTimeline, { type AuditEvent } from '../components/AuditTimeline'

export default function History() {
  const { data } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.get<{ events: AuditEvent[] }>('/audit-events'),
  })
  return <div><h2>History</h2><AuditTimeline events={data?.events ?? []} /></div>
}
