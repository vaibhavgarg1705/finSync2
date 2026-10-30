export function Loader({ label = 'Loading…' }) {
  return (
    <span className="loader">
      <span className="dot" /><span className="dot" /><span className="dot" />
      <span>{label}</span>
    </span>
  );
}

export function Badge({ value }) {
  if (!value) return null;
  return <span className={`badge badge-${String(value).toLowerCase()}`}>{value}</span>;
}

export function ErrorAlert({ error, onDismiss }) {
  if (!error) return null;
  const details = error.details;
  return (
    <div className="alert alert-error">
      <div>
        <strong>{error.code || 'ERROR'}</strong> — {error.message}
      </div>
      {details?.remainingAmount != null && (
        <div className="muted" style={{ marginTop: 6 }}>
          Remaining amount: <code>{details.remainingAmount}</code>
        </div>
      )}
      {Array.isArray(details?.errors) && details.errors.length > 0 && (
        <ul className="error-list">
          {details.errors.map((e, i) => (
            <li key={i}>
              Row {e.row}, field <code>{e.field}</code>: {e.message}
            </li>
          ))}
        </ul>
      )}
      {onDismiss && (
        <div style={{ marginTop: 8 }}>
          <button className="btn-link" onClick={onDismiss}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

export function SuccessAlert({ children, onDismiss }) {
  if (!children) return null;
  return (
    <div className="alert alert-success">
      {children}
      {onDismiss && (
        <div style={{ marginTop: 8 }}>
          <button className="btn-link" onClick={onDismiss}>Dismiss</button>
        </div>
      )}
    </div>
  );
}

export function InfoAlert({ children }) {
  if (!children) return null;
  return <div className="alert alert-info">{children}</div>;
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function CheckboxList({ items, selected, onChange, getId, getLabel, emptyText }) {
  if (!items.length) return <div className="muted">{emptyText}</div>;
  const set = new Set(selected || []);
  const toggle = (id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(Array.from(next));
  };
  return (
    <div className="checkbox-list">
      {items.map((it) => {
        const id = getId(it);
        return (
          <label key={id} className="checkbox-row">
            <input type="checkbox" checked={set.has(id)} onChange={() => toggle(id)} />
            <span>{getLabel(it)}</span>
          </label>
        );
      })}
    </div>
  );
}

export const money = (v) => (v == null ? '0.00' : String(v));