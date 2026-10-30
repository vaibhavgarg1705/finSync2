import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import ScoreBadge from '../components/ScoreBadge'
import type { Candidate } from '../api/types'

export default function Queue() {
  const { data } = useQuery({
    queryKey: ['queue'],
    queryFn: () => api.get<{ items: Candidate[] }>('/queue'),
  })
  return (
    <div>
      <h2>Investigation Queue</h2>
      <p className="muted">Sorted by risk.</p>
      <ul className="queue-list">
        {data?.items.map((c) => (
          <li key={c.id}>
            <ScoreBadge cls={c.class} score={c.score} />
            <span>{c.evidence.nextAction}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
