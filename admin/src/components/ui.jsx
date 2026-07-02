import { FaTimes } from 'react-icons/fa';

export function Kpi({ label, value, sub, tone }) {
  const cor = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : tone === 'danger' ? 'var(--danger)' : 'var(--text)';
  return (
    <div className="card" style={{ padding: '0.95rem 1.1rem' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cor, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Modal({ titulo, onClose, children, wide }) {
  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,6,0.85)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: wide ? 660 : 480, padding: '1.3rem', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{titulo}</h2>
          <button onClick={onClose} className="btn sm" style={{ marginLeft: 'auto', border: 'none' }}><FaTimes size={13} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children, span }) => (
  <div style={span ? { gridColumn: `span ${span}` } : undefined}>
    <label className="label">{label}</label>
    {children}
  </div>
);

export const Acoes = ({ onCancel, onOk, okLabel = 'Salvar', busy }) => (
  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.1rem' }}>
    <button className="btn" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
    <button className="btn solid" style={{ flex: 1 }} onClick={onOk} disabled={busy}>{busy ? 'Salvando…' : okLabel}</button>
  </div>
);

export const Vazio = ({ msg }) => (
  <tr><td colSpan={99} style={{ textAlign: 'center', padding: '2.2rem', color: 'var(--text-3)' }}>{msg}</td></tr>
);
