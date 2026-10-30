import type { CandidateClass } from '../api/types'

const COLORS: Record<CandidateClass, string> = {
  STRONG: 'badge-strong',
  LIKELY: 'badge-likely',
  AMBIGUOUS: 'badge-ambiguous',
  WEAK: 'badge-weak',
  UNMATCHED: 'badge-unmatched',
}

export default function ScoreBadge({ cls, score }: { cls: CandidateClass; score: number }) {
  return (
    <span className={`badge ${COLORS[cls]}`}>
      <strong>{cls}</strong>
      <span className="score">{(score).toFixed(2)}</span>
    </span>
  )
}
