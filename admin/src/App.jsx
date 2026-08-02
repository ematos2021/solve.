import { useState, useEffect, useRef, createContext, useContext, lazy, Suspense } from 'react';
import { supabase, supabaseConfigurado, demoMode, resetDemo } from './lib/supabase';
import { iniciarNativo, nativo } from './lib/native';
import {
  FaChartPie, FaUsers, FaFileSignature, FaWallet, FaTags, FaBullseye,
  FaHeadset, FaSignOutAlt, FaLock, FaComments, FaCheckSquare, FaLightbulb,
  FaFileInvoiceDollar, FaBars, FaFolderOpen, FaCog,
} from 'react-icons/fa';

// Views carregadas sob demanda: o painel abre mais rápido (importante no celular)
const Dashboard = lazy(() => import('./views/Dashboard'));
const Mural = lazy(() => import('./views/Mural'));
const Tarefas = lazy(() => import('./views/Tarefas'));
const Ideias = lazy(() => import('./views/Ideias'));
const Prospeccao = lazy(() => import('./views/Prospeccao'));
const Orcamentos = lazy(() => import('./views/Orcamentos'));
const Clientes = lazy(() => import('./views/Clientes'));
const Assinaturas = lazy(() => import('./views/Assinaturas'));
const Caixa = lazy(() => import('./views/Caixa'));
const Promocoes = lazy(() => import('./views/Promocoes'));
const TicketsAdmin = lazy(() => import('./views/TicketsAdmin'));
const Projetos = lazy(() => import('./views/Projetos'));

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
const TODAS = [
  ...NAV.flatMap(g => g.items),
  { id: 'projetos', label: 'Projetos', icon: <FaFolderOpen />, comp: Projetos },
];

// O que o papel 'associado' enxerga da Central (o resto some do menu;
// e o que ele NÃO pode ver é bloqueado de verdade no banco, via RLS)
const ASSOCIADO_VE = ['dashboard', 'tarefas', 'ideias', 'assinaturas'];

export default function App() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);   // null = carregando, false = não-admin
  const [equipe, setEquipe] = useState([]);
  const [view, setView] = useState('dashboard');
  const [menu, setMenu] = useState(false);      // gaveta de navegação no celular
  const [projetos, setProjetos] = useState([]);
  const [projFiltro, setProjFiltro] = useState('todos');  // lente global de projeto

  // Espelho do estado da tela para os callbacks nativos, que são registrados
  // uma única vez e não enxergariam as atualizações de state por closure.
  const refUI = useRef({ menu, view });
  refUI.current = { menu, view };

  // App instalado: botão "voltar" do Android, barra de status, splash e
  // renovação do token só enquanto o app está em primeiro plano.
  useEffect(() => iniciarNativo({
    aoVoltarRaiz: () => {
      if (refUI.current.menu) { setMenu(false); return true; }
      if (refUI.current.view !== 'dashboard') { setView('dashboard'); return true; }
      return false;                       // já na raiz: o "voltar" fecha o app
    },
    aoMudarEstado: (ativo) => {
      if (ativo) supabase.auth.startAutoRefresh?.();
      else supabase.auth.stopAutoRefresh?.();
    },
  }), []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setPerfil(null); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setPerfil(null); return; }
    supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setPerfil(data && ['admin', 'associado'].includes(data.role) ? data : false));
  }, [session]);

  // Equipe (sócios + associados) — responsáveis em tarefas/prospecção.
  // O RLS decide quem cada um enxerga (associado só vê sócios e colegas de projeto).
  useEffect(() => {
    if (!perfil || perfil === false) return;
    supabase.from('profiles').select('user_id, nome, empresa, role').in('role', ['admin', 'associado']).order('nome')
      .then(({ data }) => setEquipe(data || []));
  }, [perfil]);

  // Projetos visíveis (admin: todos; associado: só os dele — filtrado pelo RLS)
  const recarregarProjetos = () => {
    supabase.from('projetos').select('*').order('nome').then(({ data }) => setProjetos(data || []));
  };
  useEffect(() => {
    if (!perfil || perfil === false) return;
    recarregarProjetos();
  }, [perfil]);  // eslint-disable-line react-hooks/exhaustive-deps

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
          Esta conta não faz parte da equipe (sócio ou associado). Peça a um sócio para adicioná-la na tela Projetos da Central, ou promova-a no SQL Editor do Supabase (instruções no README), e entre novamente.
        </p>
        <button className="btn" onClick={() => supabase.auth.signOut()}>Sair</button>
      </div>
    </Central>;
  }

  const isAdmin = perfil.role === 'admin';
  // Menu conforme o papel: associado só vê os módulos liberados
  const nav = NAV
    .map(g => ({ ...g, items: g.items.filter(v => isAdmin || ASSOCIADO_VE.includes(v.id)) }))
    .filter(g => g.items.length);
  const atualId = (isAdmin || ASSOCIADO_VE.includes(view) ? view : 'dashboard');
  const atual = TODAS.find(v => v.id === atualId) || TODAS[0];
  const Atual = atual.comp;
  const irPara = (id) => { setView(id); setMenu(false); };

  return (
    <AppCtx.Provider value={{ session, perfil, equipe, isAdmin, projetos, projFiltro, recarregarProjetos }}>
      <div className="layout">
        {/* Barra superior — visível só no celular (CSS) */}
        <header className="topbar">
          <button className="btn sm" aria-label="Abrir menu" onClick={() => setMenu(true)}><FaBars size={14} /></button>
          <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: -0.4 }}>solve<span style={{ color: 'var(--text-3)' }}>.</span></div>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{atual.label}</span>
        </header>
        <div className={`nav-overlay ${menu ? 'on' : ''}`} onClick={() => setMenu(false)} />

        {/* Sidebar (gaveta no celular) */}
        <aside className={`sidebar ${menu ? 'open' : ''}`}>
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
            {nav.map(g => (
              <div key={g.sec} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="nav-sec">{g.sec}</div>
                {g.items.map(v => (
                  <BotaoNav key={v.id} ativo={atualId === v.id} onClick={() => irPara(v.id)} icon={v.icon} label={v.label} />
                ))}
              </div>
            ))}

            {/* Lente de projetos: filtra Ideias, Tarefas e Assinaturas */}
            {(projetos.length > 0 || isAdmin) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div className="nav-sec">Projetos</div>
                {projetos.length > 0 && (
                  <BotaoNav ativo={projFiltro === 'todos'} onClick={() => setProjFiltro('todos')}
                    icon={<FaFolderOpen />} label={isAdmin ? 'Todos os projetos' : 'Todos os meus'} />
                )}
                {projetos.map(p => (
                  <BotaoNav key={p.id} ativo={projFiltro === p.id} onClick={() => setProjFiltro(p.id)}
                    icon={<span style={{ width: 8, height: 8, borderRadius: 3, background: p.ativo ? 'var(--info)' : 'var(--text-4)', display: 'inline-block' }} />}
                    label={p.nome} />
                ))}
                {isAdmin && (
                  <BotaoNav ativo={atualId === 'projetos'} onClick={() => irPara('projetos')}
                    icon={<FaCog />} label="Gerenciar projetos" />
                )}
              </div>
            )}
          </nav>
          <div style={{ padding: '0.9rem 1.2rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 2 }}>
              {perfil.nome || 'Sócio'} <span style={{ fontWeight: 500, color: 'var(--text-4)', fontSize: '0.68rem' }}>· {isAdmin ? 'sócio' : 'associado'}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</div>
            <button className="btn sm" style={{ width: '100%' }} onClick={() => supabase.auth.signOut()}><FaSignOutAlt size={10} /> Sair</button>
          </div>
        </aside>

        {/* Conteúdo */}
        <main className="main">
          <Suspense fallback={<p style={{ color: 'var(--text-3)' }}>Carregando…</p>}>
            <Atual onNavigate={irPara} />
          </Suspense>
        </main>
      </div>
    </AppCtx.Provider>
  );
}

const Central = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>{children}</div>
);

const BotaoNav = ({ ativo, onClick, icon, label }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.52rem 0.75rem',
    borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    background: ativo ? 'var(--card-hover)' : 'transparent',
    color: ativo ? 'var(--text)' : 'var(--text-3)', textAlign: 'left', transition: 'all 0.15s',
  }}
    onMouseEnter={e => { if (!ativo) e.currentTarget.style.color = 'var(--text-2)'; }}
    onMouseLeave={e => { if (!ativo) e.currentTarget.style.color = 'var(--text-3)'; }}>
    <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>{icon}</span> {label}
  </button>
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
        <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', textAlign: 'center' }}>Acesso da equipe Solve (sócios e associados).</div>
      </form>
    </Central>
  );
}
