export interface AuditEvent {
  id: string
  type: string
  actor: string
  entityType: string
  entityId: string
  createdAt: string
  details: Record<string, unknown>
}

export default function AuditTimeline({ events }: { events: AuditEvent[] }) {
  return (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id}>
          <div className="dot" />
          <div className="content">
            <div className="row"><strong>{e.type}</strong><span className="muted">{new Date(e.createdAt).toLocaleString()}</span></div>
            <div className="muted">{e.actor} • {e.entityType}:{e.entityId}</div>
            {Object.keys(e.details).length > 0 && (
              <pre>{JSON.stringify(e.details, null, 2)}</pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
