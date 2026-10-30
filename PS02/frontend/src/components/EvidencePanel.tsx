import type { Candidate } from '../api/types'

export default function EvidencePanel({ candidate }: { candidate: Candidate }) {
  const { evidence, explanation } = candidate
  return (
    <div className="evidence-panel">
      <div className="evidence-cols">
        <div>
          <h4 className="ev-supporting">Supporting</h4>
          <ul>{evidence.supporting.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div>
          <h4 className="ev-conflicting">Conflicting</h4>
          <ul>{evidence.conflicting.length ? evidence.conflicting.map((s, i) => <li key={i}>{s}</li>) : <li className="muted">None</li>}</ul>
        </div>
        <div>
          <h4 className="ev-missing">Missing</h4>
          <ul>{evidence.missing.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      </div>
      <div className="explanation">
        <span className={`source-tag ${explanation.source === 'AI' ? 'tag-ai' : 'tag-template'}`}>
          {explanation.source === 'AI' ? 'AI' : 'Standard'}
        </span>
        <p>{explanation.text}</p>
      </div>
      {evidence.nextAction && <p className="next-action">Next: {evidence.nextAction}</p>}
    </div>
  )
}
