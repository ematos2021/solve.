import { useState, useEffect, createContext, useContext } from 'react';
import { supabase, supabaseConfigurado, demoMode, resetDemo } from './lib/supabase';
import Dashboard from './views/Dashboard';
import Mural from './views/Mural';
import Tarefas from './views/Tarefas';
import Ideias from './views/Ideias';
import Prospeccao from './views/Prospeccao';
import Orcamentos from './views/Orcamentos';
import Clientes from './views/Clientes';
import Assinaturas from './views/Assinaturas';
import Caixa from './views/Caixa';
import Promocoes from './views/Promocoes';
import TicketsAdmin from './views/TicketsAdmin';
import {
  FaChartPie, FaUsers, FaFileSignature, FaWallet, FaTags, FaBullseye,
  FaHeadset, FaSignOutAlt, FaLock, FaComments, FaCheckSquare, FaLightbulb,
  FaFileInvoiceDollar,
} from 'react-icons/fa';

// Contexto da equipe: sessão do sócio logado + lista de sócios (admins)
export const AppCtx = createContext({ session: null, equipe: [] });
export const useApp = () => useContext(AppCtx);

const NAV = [
  { sec: 'Central', items: [
    { id: 'dashboard', label: 'Visão geral', icon: <FaChartPie />, comp: Dashboard },
    { id: 'mural', label: 'Mural da equipe', icon: <FaComments />, comp: Mural },
    { id: 'tarefas', label: 'Tarefas', icon: <FaCheckSquare />, comp: Tarefas },
    { id: 'ideias', label: 'Ideias', icon: <FaLightbulb />, comp: Ideias },
  ]},
  { sec: 'Comercial', items: [
    { id: 'prospeccao', label: 'Prospecção', icon: <FaBullseye />, comp: Prospeccao },
    { id: 'orcamentos', label: 'Orçamentos', icon: <FaFileInvoiceDollar />, comp: Orcamentos },
    { id: 'clientes', label: 'Clientes', icon: <FaUsers />, comp: Clientes },
    { id: 'promocoes', label: 'Promoções', icon: <FaTags />, comp: Promocoes },
  ]},
  { sec: 'Operação', items: [
    { id: 'assinaturas', label: 'Assinaturas', icon: <FaFileSignature />, comp: Assinaturas },
    { id: 'caixa', label: 'Fluxo de caixa', icon: <FaWallet />, comp: Caixa },
    { id: 'tickets', label: 'Suporte', icon: <FaHeadset />, comp: TicketsAdmin },
  ]},
];
const TODAS = NAV.flatMap(g => g.items);

export default function App() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);   // null = carregando, false = não-admin
  const [equipe, setEquipe] = useState([]);
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setPerfil(null); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setPerfil(null); return; }
    supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setPerfil(data?.role === 'admin' ? data : false));
  }, [session]);

  // Todos os sócios (role admin) — usados como responsáveis em tarefas/prospecção
  useEffect(() => {
    if (!perfil || perfil === false) return;
    supabase.from('profiles').select('user_id, nome, empresa').eq('role', 'admin').order('nome')
      .then(({ data }) => setEquipe(data || []));
  }, [perfil]);

  if (!supabaseConfigurado) {
    return <Central><div className="card" style={{ padding: '2rem', maxWidth: 480, textAlign: 'center', color: 'var(--text-2)' }}>
      Preencha <code>admin/.env</code> com as chaves do Supabase (veja o README na raiz) e reinicie o servidor.
    </div></Central>;
  }

  if (!session) return <Login />;

  if (perfil === null) return <Central><span style={{ color: 'var(--text-3)' }}>Verificando acesso…</span></Central>;

  if (perfil === false) {
    return <Central>
      <div className="card" style={{ padding: '2rem', maxWidth: 460, textAlign: 'center' }}>
        <FaLock size={22} style={{ color: 'var(--danger)', marginBottom: '0.8rem' }} />
        <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Acesso restrito</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
          Esta conta não tem papel de administrador. Promova-a no SQL Editor do Supabase (instruções no README) e entre novamente.
        </p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    </Central>;
  }

  const Atual = TODAS.find(v => v.id === view)?.comp || Dashboard;

  return (
    <AppCtx.Provider value={{ session, perfil, equipe }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{ width: 214, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '1.1rem 1.2rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: -0.4 }}>solve<span style={{ color: 'var(--text-3)' }}>.</span></div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1.4 }}>Central de trabalho</div>
            {demoMode && (
              <div style={{ marginTop: 8, padding: '0.45rem 0.6rem', borderRadius: 8, background: 'rgba(246,224,94,0.08)', border: '1px solid rgba(246,224,94,0.3)' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--warn)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Modo demo</div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-3)', margin: '2px 0 5px' }}>Dados de exemplo no navegador. Configure o <code>.env</code> para usar o banco real.</div>
                <button className="btn sm" style={{ width: '100%', fontSize: '0.66rem', padding: '0.22rem' }} onClick={resetDemo}>Recriar exemplos</button>
              </div>
            )}
          </div>
          <nav style={{ flex: 1, padding: '0.4rem 0.7rem 0.7rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(g => (
              <div key={g.sec} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="nav-sec">{g.sec}</div>
                {g.items.map(v => (
                  <button key={v.id} onClick={() => setView(v.id)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.75rem',
                    borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    background: view === v.id ? 'var(--card-hover)' : 'transparent',
                    color: view === v.id ? 'var(--text)' : 'var(--text-3)', textAlign: 'left', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { if (view !== v.id) e.currentTarget.style.color = 'var(--text-2)'; }}
                    onMouseLeave={e => { if (view !== v.id) e.currentTarget.style.color = 'var(--text-3)'; }}>
                    <span style={{ display: 'flex', fontSize: '0.85rem' }}>{v.icon}</span> {v.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div style={{ padding: '0.9rem 1.2rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 2 }}>{perfil.nome || 'Sócio'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</div>
            <button className="btn sm" style={{ width: '100%' }} onClick={() => supabase.auth.signOut()}><FaSignOutAlt size={10} /> Sair</button>
          </div>
        </aside>

        {/* Conteúdo */}
        <main style={{ flex: 1, minWidth: 0, padding: '1.5rem 1.8rem' }}>
          <Atual onNavigate={setView} />
        </main>
      </div>
    </AppCtx.Provider>
  );
}

const Central = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>{children}</div>
);

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  const entrar = async (e) => {
    e.preventDefault(); setErro(''); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) setErro('Credenciais inválidas.');
    setBusy(false);
  };

  return (
    <Central>
      <form onSubmit={entrar} className="card fade-in" style={{ width: '100%', maxWidth: 360, padding: '1.8rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.4rem' }}>
          <div style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: -0.5 }}>solve<span style={{ color: 'var(--text-3)' }}>.</span></div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1.6 }}>Central de trabalho</div>
        </div>
        <div><label className="label">E-mail</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus required /></div>
        <div><label className="label">Senha</label><input className="input" type="password" value={senha} onChange={e => setSenha(e.target.value)} required /></div>
        {erro && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', textAlign: 'center' }}>{erro}</div>}
        <button className="btn solid" type="submit" disabled={busy} style={{ padding: '0.7rem' }}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', textAlign: 'center' }}>Acesso exclusivo dos sócios (role admin).</div>
      </form>
    </Central>
  );
}
