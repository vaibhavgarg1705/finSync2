import type { Candidate } from '../api/types'
import ScoreBadge from './ScoreBadge'
import MoneyText from './MoneyText'

interface Props {
  candidates: Candidate[]
  currency: string
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function CandidateCompare({ candidates, currency, selectedId, onSelect }: Props) {
  return (
    <div className="compare-grid">
      {candidates.map((c) => {
        const isAmbiguous = c.class === 'AMBIGUOUS'
        return (
          <div
            key={c.id}
            className={`compare-card ${isAmbiguous ? 'ambiguous' : ''} ${selectedId === c.id ? 'selected' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <ScoreBadge cls={c.class} score={c.score} />
            <div className="compare-amount">
              <MoneyText amountMinor={c.components.amount * 100} currency={currency} />
            </div>
            <ul className="compare-evidence">
              {c.evidence.supporting.slice(0, 2).map((s, i) => <li key={i} className="ok">{s}</li>)}
              {c.evidence.conflicting.slice(0, 2).map((s, i) => <li key={i} className="bad">{s}</li>)}
            </ul>
            {isAmbiguous && <div className="compare-note">AMBIGUOUS — choose one</div>}
          </div>
        )
      })}
    </div>
  )
}
