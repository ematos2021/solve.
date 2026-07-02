import { useState, useEffect, useCallback } from 'react';
import { supabase, supabaseConfigurado } from '../lib/supabase';
import { SOLUCOES } from '../data/solucoes';
import {
  FaArrowLeft, FaLock, FaPlus, FaPaperPlane, FaCheckCircle, FaHeadset,
  FaChevronRight, FaSignOutAlt, FaTimes, FaRegClock,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────
// Portal do cliente — filosofia: o cliente chega com um problema;
// cada tela tem UMA ação óbvia. Criar chamado leva menos de 1 minuto.
// ─────────────────────────────────────────────────────────────────

const STATUS = {
  aberto: { label: 'Aberto', cls: 'warn' },
  em_atendimento: { label: 'Em atendimento', cls: '' },
  resolvido: { label: 'Resolvido', cls: 'ok' },
  fechado: { label: 'Fechado', cls: '' },
};
const dt = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Portal({ onBack }) {
  const [session, setSession] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!supabase) { setCarregando(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setCarregando(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: '1rem' }}>
          <button className="btn btn-quiet btn-sm" onClick={onBack}><FaArrowLeft size={11} /> Site</button>
          <span style={{ fontWeight: 800, letterSpacing: -0.4 }}>solve<span style={{ color: 'var(--text-3)' }}>.</span> <span style={{ fontWeight: 500, color: 'var(--text-3)', fontSize: '0.85rem' }}>portal do cliente</span></span>
          {session && (
            <button className="btn btn-quiet btn-sm" style={{ marginLeft: 'auto' }} onClick={() => supabase.auth.signOut()}>
              <FaSignOutAlt size={11} /> Sair
            </button>
          )}
        </div>
      </nav>

      {!supabaseConfigurado ? (
        <Aviso texto="O portal ainda não foi conectado ao banco. Preencha site/.env com as chaves do Supabase (veja o README) e reinicie o servidor." />
      ) : carregando ? (
        <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-3)' }}>Carregando…</div>
      ) : !session ? (
        <Auth />
      ) : (
        <Tickets session={session} />
      )}
    </div>
  );
}

const Aviso = ({ texto }) => (
  <div className="container" style={{ paddingTop: '4rem' }}>
    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-2)', maxWidth: 560, margin: '0 auto' }}>{texto}</div>
  </div>
);

/* ══════════ AUTENTICAÇÃO ══════════ */
function Auth() {
  const [modo, setModo] = useState('login'); // login | signup
  const [form, setForm] = useState({ nome: '', empresa: '', email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const entrar = async (e) => {
    e.preventDefault(); setErro(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.senha });
    if (error) setErro('E-mail ou senha inválidos.');
    setBusy(false);
  };

  const cadastrar = async (e) => {
    e.preventDefault(); setErro(''); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(), password: form.senha,
      options: { data: { nome: form.nome, empresa: form.empresa } },
    });
    if (error) setErro(error.message.includes('already') ? 'Este e-mail já possui conta.' : 'Não foi possível criar a conta. Verifique os dados.');
    else setInfo('Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada antes de entrar.');
    setBusy(false);
  };

  return (
    <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
      <div className="card fade-up" style={{ maxWidth: 420, margin: '0 auto', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 46, height: 46, margin: '0 auto 0.8rem', borderRadius: 12, border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaLock size={16} style={{ color: 'var(--text-2)' }} />
          </div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{modo === 'login' ? 'Acessar minha conta' : 'Criar minha conta'}</h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>
            {modo === 'login' ? 'Acompanhe seus chamados de suporte.' : 'Leva menos de um minuto.'}
          </p>
        </div>

        <form onSubmit={modo === 'login' ? entrar : cadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {modo === 'signup' && (
            <>
              <div><label className="label">Seu nome</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
              <div><label className="label">Empresa</label><input className="input" value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })} /></div>
            </>
          )}
          <div><label className="label">E-mail</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoComplete="email" /></div>
          <div><label className="label">Senha</label><input className="input" type="password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} required minLength={6} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} /></div>

          {erro && <div style={{ color: 'var(--danger)', fontSize: '0.84rem', textAlign: 'center' }}>{erro}</div>}
          {info && <div style={{ color: 'var(--ok)', fontSize: '0.84rem', textAlign: 'center' }}>{info}</div>}

          <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: '0.3rem', padding: '0.85rem' }}>
            {busy ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button className="btn btn-quiet btn-sm" style={{ width: '100%', marginTop: '0.9rem' }}
          onClick={() => { setModo(m => m === 'login' ? 'signup' : 'login'); setErro(''); setInfo(''); }}>
          {modo === 'login' ? 'Primeira vez aqui? Criar conta' : 'Já tenho conta — entrar'}
        </button>
      </div>
    </div>
  );
}

/* ══════════ TICKETS ══════════ */
function Tickets({ session }) {
  const [tickets, setTickets] = useState([]);
  const [novo, setNovo] = useState(false);
  const [criado, setCriado] = useState(null);   // ticket recém-criado (confirmação)
  const [sel, setSel] = useState(null);         // ticket aberto (thread)

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const abertos = tickets.filter(t => t.status === 'aberto' || t.status === 'em_atendimento');

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: 880 }}>
      {/* Cabeçalho com UMA ação primária */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.6rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Como podemos ajudar?</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-3)' }}>
            {abertos.length ? `${abertos.length} chamado(s) em andamento` : 'Nenhum chamado em aberto'} · resposta em até 1 dia útil
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setNovo(true); setCriado(null); }}><FaPlus size={12} /> Novo chamado</button>
      </div>

      {/* Confirmação pós-criação — fecha o ciclo de ansiedade do cliente */}
      {criado && (
        <div className="card fade-up" style={{ padding: '1.3rem 1.5rem', marginBottom: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', borderColor: 'rgba(154,230,180,0.3)' }}>
          <FaCheckCircle size={26} style={{ color: 'var(--ok)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>Chamado #{criado.numero} registrado.</div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-3)' }}>Nossa equipe já foi notificada. Você acompanha cada atualização aqui e responde direto na conversa.</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSel(criado); setCriado(null); }}>Acompanhar</button>
        </div>
      )}

      {/* Lista */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>#</th><th>Assunto</th><th className="hide-mobile">Solução</th><th>Status</th><th className="hide-mobile">Atualizado</th><th></th></tr></thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id} onClick={() => setSel(t)}>
                <td style={{ color: 'var(--text-3)', fontWeight: 700 }}>{t.numero}</td>
                <td style={{ fontWeight: 600 }}>{t.assunto}</td>
                <td className="hide-mobile" style={{ color: 'var(--text-3)' }}>{t.produto || '—'}</td>
                <td><span className={`badge ${STATUS[t.status]?.cls || ''}`}>{STATUS[t.status]?.label || t.status}</span></td>
                <td className="hide-mobile" style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{dt(t.updated_at || t.created_at)}</td>
                <td style={{ textAlign: 'right' }}><FaChevronRight size={11} style={{ color: 'var(--text-4)' }} /></td>
              </tr>
            ))}
            {!tickets.length && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)', cursor: 'default' }}>
                <FaHeadset size={26} style={{ color: 'var(--text-4)', marginBottom: '0.7rem' }} /><br />
                Sem chamados por aqui. Quando precisar, estamos a um clique.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {novo && <NovoTicket session={session} onClose={() => setNovo(false)} onCriado={(t) => { setNovo(false); setCriado(t); carregar(); }} />}
      {sel && <Thread ticket={sel} session={session} onClose={() => { setSel(null); carregar(); }} />}
    </div>
  );
}

function NovoTicket({ session, onClose, onCriado }) {
  const [form, setForm] = useState({ produto: '', assunto: '', descricao: '', prioridade: 'normal' });
  const [busy, setBusy] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.assunto.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from('tickets')
      .insert({ ...form, user_id: session.user.id })
      .select().single();
    setBusy(false);
    if (!error && data) onCriado(data);
  };

  return (
    <ModalShell titulo="Novo chamado" sub="Descreva com suas palavras — a gente cuida do resto." onClose={onClose}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
          <div>
            <label className="label">Solução</label>
            <select className="input" value={form.produto} onChange={e => setForm({ ...form, produto: e.target.value })}>
              <option value="">Selecione…</option>
              {SOLUCOES.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)}
              <option value="Outro">Outro assunto</option>
            </select>
          </div>
          <div>
            <label className="label">Urgência</label>
            <select className="input" value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
              <option value="baixa">Posso esperar</option>
              <option value="normal">Normal</option>
              <option value="alta">Está me atrapalhando</option>
              <option value="urgente">Operação parada</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Assunto</label>
          <input className="input" value={form.assunto} onChange={e => setForm({ ...form, assunto: e.target.value })} placeholder="ex.: Erro ao gerar relatório mensal" required autoFocus />
        </div>
        <div>
          <label className="label">Descreva o que aconteceu</label>
          <textarea className="input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="O que você tentou fazer, o que apareceu na tela…" />
        </div>
        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center', marginTop: '0.2rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-4)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <FaRegClock size={11} /> Resposta em até 1 dia útil
          </span>
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginLeft: 'auto' }}>
            {busy ? 'Enviando…' : <>Abrir chamado <FaPaperPlane size={11} /></>}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function Thread({ ticket, session, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [texto, setTexto] = useState('');
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('ticket_mensagens')
      .select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true });
    setMsgs(data || []);
  }, [ticket.id]);
  useEffect(() => { carregar(); }, [carregar]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setBusy(true);
    await supabase.from('ticket_mensagens').insert({ ticket_id: ticket.id, autor_id: session.user.id, texto: texto.trim(), staff: false });
    setTexto(''); setBusy(false); carregar();
  };

  return (
    <ModalShell titulo={`Chamado #${ticket.numero} — ${ticket.assunto}`}
      sub={`${ticket.produto || 'Geral'} · ${STATUS[ticket.status]?.label}`} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: 340, overflowY: 'auto', paddingRight: 4, marginBottom: '1rem' }}>
        {/* descrição original */}
        <Bolha autor="Você" texto={ticket.descricao || '(sem descrição)'} quando={ticket.created_at} minha />
        {msgs.map(m => (
          <Bolha key={m.id} autor={m.staff ? 'Suporte Solve' : 'Você'} texto={m.texto} quando={m.created_at} minha={!m.staff} />
        ))}
        {!msgs.length && <div style={{ fontSize: '0.78rem', color: 'var(--text-4)', textAlign: 'center', padding: '0.6rem' }}>Nossa equipe responde por aqui. Você recebe tudo nesta conversa.</div>}
      </div>
      {(ticket.status === 'aberto' || ticket.status === 'em_atendimento') ? (
        <form onSubmit={enviar} style={{ display: 'flex', gap: '0.6rem' }}>
          <input className="input" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escreva uma mensagem…" />
          <button className="btn btn-primary" type="submit" disabled={busy}><FaPaperPlane size={12} /></button>
        </form>
      ) : (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center', padding: '0.5rem' }}>
          Este chamado foi {STATUS[ticket.status]?.label.toLowerCase()}. Precisa de algo mais? Abra um novo chamado.
        </div>
      )}
    </ModalShell>
  );
}

const Bolha = ({ autor, texto, quando, minha }) => (
  <div style={{ alignSelf: minha ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
    <div style={{
      background: minha ? 'var(--bg-3)' : 'var(--card-hover)', border: '1px solid var(--border)',
      borderRadius: minha ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '0.65rem 0.9rem', fontSize: '0.88rem', whiteSpace: 'pre-wrap',
    }}>{texto}</div>
    <div style={{ fontSize: '0.66rem', color: 'var(--text-4)', marginTop: 3, textAlign: minha ? 'right' : 'left' }}>{autor} · {dt(quando)}</div>
  </div>
);

function ModalShell({ titulo, sub, children, onClose, wide }) {
  return (
    <div className="fade-in" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,6,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: wide ? 640 : 520, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{titulo}</h2>
            {sub && <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>{sub}</p>}
          </div>
          <button onClick={onClose} className="btn btn-quiet btn-sm" style={{ marginLeft: 'auto' }}><FaTimes size={13} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
