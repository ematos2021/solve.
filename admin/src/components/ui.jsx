import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { aoVoltar } from '../lib/native';

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
  // No app, "voltar" fecha o modal em vez de fechar o app; no navegador, Esc.
  useEffect(() => {
    const baixa = aoVoltar(onClose);
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { baixa(); window.removeEventListener('keydown', esc); };
  }, [onClose]);

  // Portal para o <body>: garante que o overlay cubra a viewport inteira,
  // imune a transforms/animações de containers pai (senão o modal "escapa" de posição).
  return createPortal(
    <div className="modal-ov" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`card fade-in modal-box ${wide ? 'wide' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{titulo}</h2>
          <button onClick={onClose} className="btn sm" style={{ marginLeft: 'auto', border: 'none' }}><FaTimes size={13} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

// span vira classe (f2/f4) para a grade poder colapsar em 1 coluna no celular
export const Field = ({ label, children, span }) => (
  <div className={span ? `f${span}` : undefined}>
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

// Bolinha com as iniciais do sócio (responsável/autor)
export function Avatar({ perfil, title }) {
  const nome = (perfil?.nome || '').trim();
  const ini = nome ? nome.split(/\s+/).slice(0, 2).map(p => p[0]).join('') : '?';
  return <span className="avatar" title={title || nome || 'Sem responsável'}>{ini}</span>;
}

export const PRIO_CLS = { baixa: '', normal: 'info', alta: 'warn', urgente: 'danger' };
export const PrioBadge = ({ prio }) => (
  <span className={`badge ${PRIO_CLS[prio] || ''}`}>{prio}</span>
);
