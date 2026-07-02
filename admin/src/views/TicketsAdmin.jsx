import { useState, useEffect, useCallback } from 'react';
import { supabase, dtBR } from '../lib/supabase';
import { Modal, Vazio, Kpi } from '../components/ui';
import { FaPaperPlane } from 'react-icons/fa';

// Lado da equipe: responder chamados do portal do cliente.
const STATUS = {
  aberto: { label: 'Aberto', cls: 'warn' },
  em_atendimento: { label: 'Em atendimento', cls: 'info' },
  resolvido: { label: 'Resolvido', cls: 'ok' },
  fechado: { label: 'Fechado', cls: '' },
};
const PRIO_CLS = { urgente: 'danger', alta: 'warn', normal: '', baixa: '' };

export default function TicketsAdmin() {
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('abertos');
  const [sel, setSel] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)); }, []);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    setLista(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = lista.filter(t => filtro === 'todos' ? true : filtro === 'abertos' ? (t.status === 'aberto' || t.status === 'em_atendimento') : t.status === filtro);
  const urgentes = lista.filter(t => t.prioridade === 'urgente' && (t.status === 'aberto' || t.status === 'em_atendimento')).length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Suporte</h1>
        <select className="input" style={{ maxWidth: 180, marginLeft: 'auto' }} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="abertos">Em andamento</option>
          <option value="resolvido">Resolvidos</option>
          <option value="fechado">Fechados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        <Kpi label="Em andamento" value={lista.filter(t => t.status === 'aberto' || t.status === 'em_atendimento').length} />
        <Kpi label="Urgentes" value={urgentes} tone={urgentes ? 'danger' : 'ok'} />
        <Kpi label="Resolvidos" value={lista.filter(t => t.status === 'resolvido').length} tone="ok" />
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>#</th><th>Assunto</th><th>Produto</th><th>Prioridade</th><th>Status</th><th>Aberto em</th></tr></thead>
          <tbody>
            {filtrados.map(t => (
              <tr key={t.id} onClick={() => setSel(t)} style={{ cursor: 'pointer' }}>
                <td style={{ fontWeight: 700, color: 'var(--text-3)' }}>{t.numero}</td>
                <td style={{ fontWeight: 600 }}>{t.assunto}</td>
                <td style={{ color: 'var(--text-3)' }}>{t.produto || '—'}</td>
                <td><span className={`badge ${PRIO_CLS[t.prioridade] || ''}`}>{t.prioridade}</span></td>
                <td><span className={`badge ${STATUS[t.status]?.cls || ''}`}>{STATUS[t.status]?.label}</span></td>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{dtBR(t.created_at)}</td>
              </tr>
            ))}
            {!filtrados.length && <Vazio msg="Nada por aqui." />}
          </tbody>
        </table>
      </div>

      {sel && session && <Atendimento ticket={sel} session={session} onClose={() => { setSel(null); carregar(); }} />}
    </div>
  );
}

function Atendimento({ ticket, session, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [texto, setTexto] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('ticket_mensagens').select('*').eq('ticket_id', ticket.id).order('created_at');
    setMsgs(data || []);
  }, [ticket.id]);
  useEffect(() => { carregar(); }, [carregar]);

  const responder = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setBusy(true);
    await supabase.from('ticket_mensagens').insert({ ticket_id: ticket.id, autor_id: session.user.id, texto: texto.trim(), staff: true });
    // Responder já move para "em atendimento" — o cliente vê progresso imediato.
    if (ticket.status === 'aberto') await mudarStatus('em_atendimento', false);
    setTexto(''); setBusy(false); carregar();
  };

  const mudarStatus = async (s, confirmar = true) => {
    await supabase.from('tickets').update({ status: s, updated_at: new Date().toISOString() }).eq('id', ticket.id);
    setStatus(s);
    if (confirmar && (s === 'resolvido' || s === 'fechado')) onClose();
  };

  return (
    <Modal titulo={`#${ticket.numero} — ${ticket.assunto}`} onClose={onClose} wide>
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <span className="badge">{ticket.produto || 'Geral'}</span>
        <span className={`badge ${PRIO_CLS[ticket.prioridade] || ''}`}>{ticket.prioridade}</span>
        <select className="input" style={{ width: 'auto', marginLeft: 'auto', padding: '0.3rem 1.9rem 0.3rem 0.6rem', fontSize: '0.8rem' }}
          value={status} onChange={e => mudarStatus(e.target.value)}>
          <option value="aberto">Aberto</option>
          <option value="em_atendimento">Em atendimento</option>
          <option value="resolvido">Resolvido</option>
          <option value="fechado">Fechado</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 320, overflowY: 'auto', marginBottom: '0.9rem', paddingRight: 4 }}>
        <Bolha staff={false} texto={ticket.descricao || '(sem descrição)'} quando={ticket.created_at} rotulo="Cliente" />
        {msgs.map(m => <Bolha key={m.id} staff={m.staff} texto={m.texto} quando={m.created_at} rotulo={m.staff ? 'Você (suporte)' : 'Cliente'} />)}
      </div>

      <form onSubmit={responder} style={{ display: 'flex', gap: '0.6rem' }}>
        <input className="input" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Responder ao cliente…" autoFocus />
        <button className="btn solid" type="submit" disabled={busy}><FaPaperPlane size={12} /></button>
      </form>
    </Modal>
  );
}

const Bolha = ({ staff, texto, quando, rotulo }) => (
  <div style={{ alignSelf: staff ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
    <div style={{
      background: staff ? 'var(--bg-3)' : 'var(--card-hover)', border: '1px solid var(--border)',
      borderRadius: staff ? '11px 11px 4px 11px' : '11px 11px 11px 4px', padding: '0.6rem 0.85rem',
      fontSize: '0.86rem', whiteSpace: 'pre-wrap',
    }}>{texto}</div>
    <div style={{ fontSize: '0.64rem', color: 'var(--text-4)', marginTop: 2, textAlign: staff ? 'right' : 'left' }}>{rotulo} · {dtBR(quando)}</div>
  </div>
);
