import { useState, useEffect } from 'react';
import { SOLUCOES, CLIENTES_PROVA, DEPOIMENTOS } from '../data/solucoes';
import { zapLink, registrarLead } from '../lib/supabase';
import {
  FaWhatsapp, FaArrowRight, FaCheck, FaPlay, FaTimes, FaChevronRight,
  FaShieldAlt, FaBolt, FaHeadset, FaLock, FaQuoteLeft,
} from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────
// Landing Solve — condução no padrão monday.com:
// nav fixa → hero (uma promessa) → prova social → soluções →
// método → números → depoimentos → CTA final → footer.
// Neurovendas aplicada: dor antes da solução, um CTA por bloco,
// prova social discreta, especificidade nos números, baixa fricção.
// ─────────────────────────────────────────────────────────────────

export default function Landing({ onPortal }) {
  const [demo, setDemo] = useState(null);        // solução em demonstração
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const falar = (s) => {
    registrarLead(s ? s.id : 'geral');
    window.open(zapLink(s
      ? `Olá! Vi o site da Solve e quero saber mais sobre a solução ${s.nome}.`
      : 'Olá! Vi o site da Solve e quero conversar sobre as soluções.'), '_blank');
  };

  return (
    <div style={{ background: 'var(--bg)' }}>
      {/* ═══ NAV FIXA ═══ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        background: scrolled ? 'rgba(10,10,11,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 62, gap: '1.6rem' }}>
          <Wordmark />
          <div className="hide-mobile" style={{ display: 'flex', gap: '1.4rem', marginLeft: '0.8rem' }}>
            {[['#solucoes', 'Soluções'], ['#metodo', 'Como funciona'], ['#resultados', 'Resultados']].map(([href, label]) => (
              <a key={href} href={href} style={{ color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}
                onMouseEnter={e => e.target.style.color = 'var(--text)'} onMouseLeave={e => e.target.style.color = 'var(--text-2)'}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button className="btn btn-quiet btn-sm" onClick={onPortal}><FaLock size={10} /> Portal do cliente</button>
            <button className="btn btn-primary btn-sm" onClick={() => falar(null)}>Falar com especialista</button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <header style={{ paddingTop: 150, paddingBottom: 70, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -300, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
          <div className="fade-up badge" style={{ marginBottom: '1.4rem' }}>Soluções prontas · implantação em dias, não meses</div>
          <h1 className="display fade-up" style={{ maxWidth: 830, margin: '0 auto', animationDelay: '0.05s' }}>
            Sua operação gera dados.<br />
            <span style={{ color: 'var(--text-3)' }}>A Solve transforma em decisão.</span>
          </h1>
          <p className="lead fade-up" style={{ maxWidth: 640, margin: '1.5rem auto 0', animationDelay: '0.1s' }}>
            Qualidade, produção, OEE, meio ambiente e varejo — sistemas testados em operação real,
            que sua equipe aprende a usar em uma semana e sua diretoria enxerga no primeiro mês.
          </p>
          <div className="fade-up" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '2.2rem', flexWrap: 'wrap', animationDelay: '0.15s' }}>
            <a className="btn btn-primary btn-lg" href="#solucoes">Conhecer as soluções <FaArrowRight size={13} /></a>
            <button className="btn btn-ghost btn-lg" onClick={() => falar(null)}><FaWhatsapp size={16} /> Conversar agora</button>
          </div>
          <div className="fade-up" style={{ marginTop: '1.1rem', fontSize: '0.78rem', color: 'var(--text-4)', animationDelay: '0.2s' }}>
            Sem cartão de crédito · valores sob consulta · demonstração guiada gratuita
          </div>
        </div>
      </header>

      {/* ═══ PROVA SOCIAL (discreta) ═══ */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '1.15rem 0', overflow: 'hidden', background: 'var(--bg-2)' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 32s linear infinite', gap: '4rem', alignItems: 'center' }}>
          {[...CLIENTES_PROVA, ...CLIENTES_PROVA].map((c, i) => (
            <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-4)', letterSpacing: 1.4, textTransform: 'uppercase', whiteSpace: 'nowrap', fontWeight: 600 }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ═══ SOLUÇÕES ═══ */}
      <section id="solucoes" style={{ padding: '5.5rem 0 3rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="eyebrow">Soluções</div>
            <h2 className="title" style={{ marginTop: '0.7rem' }}>Escolha o problema.<br />Nós já construímos a solução.</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {SOLUCOES.map((s, idx) => (
              <article key={s.id} className="card" style={{
                padding: '1.8rem', display: 'grid',
                gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)', gap: '2rem', alignItems: 'center',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                {/* Copy */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: -0.4 }}>{s.nome}</span>
                    <span className="badge">{s.categoria}</span>
                  </div>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.94rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>“{s.dor}”</p>
                  <p style={{ fontSize: '1.04rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '1rem' }}>{s.promessa}</p>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.3rem' }}>
                    {s.beneficios.map((b, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: 'var(--text-2)', fontSize: '0.9rem' }}>
                        <FaCheck size={11} style={{ color: 'var(--text)', marginTop: 4, flexShrink: 0 }} /> {b}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button className="btn btn-primary" onClick={() => falar(s)}>Quero esta solução <FaChevronRight size={11} /></button>
                    <button className="btn btn-ghost" onClick={() => setDemo(s)}><FaPlay size={11} /> Ver demonstração</button>
                  </div>
                </div>
                {/* Visual / métrica */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <DemoThumb s={s} onClick={() => setDemo(s)} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', padding: '0 0.3rem' }}>
                    <span style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: -1 }}>{s.metrica.valor}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>{s.metrica.legenda}</span>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-4)', padding: '0 0.3rem' }}>{s.publico}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MÉTODO / COMO FUNCIONA ═══ */}
      <section id="metodo" style={{ padding: '5rem 0', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="eyebrow">Como funciona</div>
            <h2 className="title" style={{ marginTop: '0.7rem' }}>Do primeiro contato ao resultado,<br />sem fricção.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
            {[
              { n: '01', t: 'Conversa de diagnóstico', d: 'Você conta o problema pelo WhatsApp. Sem formulário de 20 campos, sem robô.', icon: <FaWhatsapp /> },
              { n: '02', t: 'Demonstração guiada', d: 'Mostramos a solução rodando com casos parecidos com o seu. Você decide vendo, não imaginando.', icon: <FaPlay /> },
              { n: '03', t: 'Implantação assistida', d: 'Configuramos com seus dados e treinamos sua equipe. Em dias, não em meses.', icon: <FaBolt /> },
              { n: '04', t: 'Suporte que responde', d: 'Portal exclusivo do cliente com chamados acompanhados de ponta a ponta.', icon: <FaHeadset /> },
            ].map((p) => (
              <div key={p.n} className="card" style={{ padding: '1.5rem', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--text-4)', fontWeight: 800, fontSize: '0.85rem' }}>{p.n}</span>
                  <span style={{ color: 'var(--text-3)' }}>{p.icon}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.45rem' }}>{p.t}</h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-3)', lineHeight: 1.6 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NÚMEROS ═══ */}
      <section id="resultados" style={{ padding: '5rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          {[
            ['5', 'soluções em operação real'],
            ['dias', 'para implantar, não meses'],
            ['1 dia útil', 'prazo máximo de resposta no suporte'],
            ['0', 'taxas escondidas — valor fechado no contato'],
          ].map(([v, l], i) => (
            <div key={i}>
              <div style={{ fontSize: '2.3rem', fontWeight: 800, letterSpacing: -1 }}>{v}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-3)', marginTop: '0.3rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DEPOIMENTOS ═══ */}
      <section style={{ padding: '1rem 0 5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {DEPOIMENTOS.map((d, i) => (
              <figure key={i} className="card" style={{ padding: '1.5rem' }}>
                <FaQuoteLeft size={14} style={{ color: 'var(--text-4)', marginBottom: '0.8rem' }} />
                <blockquote style={{ fontSize: '0.92rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '1rem' }}>{d.texto}</blockquote>
                <figcaption style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                  <strong style={{ color: 'var(--text-2)' }}>{d.autor}</strong> · {d.empresa}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section style={{ padding: '5.5rem 0', borderTop: '1px solid var(--border)', background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.045) 0%, transparent 60%)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="title">O problema não vai se resolver sozinho.</h2>
          <p className="lead" style={{ maxWidth: 520, margin: '1rem auto 2rem' }}>
            Uma conversa de 15 minutos é suficiente para saber se temos a solução para a sua operação. Se não tivermos, dizemos.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => falar(null)}>
            <FaWhatsapp size={17} /> Falar com um especialista
          </button>
          <div style={{ marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-4)' }}>Resposta rápida em horário comercial</div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2.2rem 0', background: 'var(--bg-2)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Wordmark />
          <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-quiet btn-sm" onClick={onPortal}><FaLock size={10} /> Portal do cliente</button>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-4)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaShieldAlt size={11} /> Dados protegidos · acesso individual por cliente
            </span>
          </div>
        </div>
      </footer>

      {demo && <DemoModal s={demo} onClose={() => setDemo(null)} onFalar={() => { setDemo(null); falar(demo); }} />}
    </div>
  );
}

function Wordmark() {
  return (
    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: -0.5, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      solve<span style={{ color: 'var(--text-3)' }}>.</span>
    </span>
  );
}

// Miniatura de demonstração: tenta imagem real em /demos/{id}-1.png;
// sem imagem, mostra um mock abstrato elegante (nunca o código).
function DemoThumb({ s, onClick }) {
  const [temImg, setTemImg] = useState(true);
  return (
    <button onClick={onClick} style={{
      position: 'relative', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
      cursor: 'pointer', background: 'var(--bg-2)', aspectRatio: '16/9', padding: 0, width: '100%',
    }}>
      {temImg ? (
        <img src={`/demos/${s.id}-1.png`} alt={`Demonstração ${s.nome}`} onError={() => setTemImg(false)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }} />
      ) : (
        <MockUI nome={s.nome} />
      )}
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,10,11,0.35)', opacity: 0, transition: 'opacity 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
        <span className="btn btn-primary btn-sm"><FaPlay size={10} /> Ver por dentro</span>
      </span>
    </button>
  );
}

// Mock abstrato de interface — transmite "software profissional" sem expor nada.
function MockUI({ nome }) {
  return (
    <div style={{ width: '100%', height: '100%', padding: '10%', display: 'flex', flexDirection: 'column', gap: '6%' }}>
      <div style={{ display: 'flex', gap: '3%', alignItems: 'center' }}>
        <div style={{ width: '14%', height: 10, borderRadius: 4, background: 'var(--border-strong)' }} />
        <div style={{ marginLeft: 'auto', width: '18%', height: 14, borderRadius: 5, background: 'var(--text-4)' }} />
      </div>
      <div style={{ display: 'flex', gap: '4%', flex: 1 }}>
        {[0.9, 0.55, 0.75, 0.4].map((h, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ width: '100%', height: `${h * 100}%`, borderRadius: '4px 4px 0 0', background: `rgba(244,244,245,${0.14 + i * 0.05})` }} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--text-4)', letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center' }}>{nome}</div>
    </div>
  );
}

function DemoModal({ s, onClose, onFalar }) {
  const [idx, setIdx] = useState(0);
  const imgs = [1, 2, 3];
  return (
    <div className="fade-in" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,6,0.88)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem',
    }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 760, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{s.nome}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-3)' }}>{s.categoria}</div>
          </div>
          <button onClick={onClose} className="btn btn-quiet btn-sm" style={{ marginLeft: 'auto' }}><FaTimes size={14} /></button>
        </div>

        <div style={{ padding: '1.4rem' }}>
          <ImgOrMock id={s.id} idx={imgs[idx]} nome={s.nome} />
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', margin: '0.9rem 0 1.2rem' }}>
            {imgs.map((n, i) => (
              <button key={n} onClick={() => setIdx(i)} style={{
                width: idx === i ? 22 : 8, height: 8, borderRadius: 99, border: 'none', cursor: 'pointer',
                background: idx === i ? 'var(--text)' : 'var(--border-strong)', transition: 'all 0.2s',
              }} />
            ))}
          </div>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>Quer ver funcionando com um caso como o seu?</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Demonstração guiada, ao vivo e gratuita — 20 minutos.</div>
            </div>
            <button className="btn btn-primary" onClick={onFalar}><FaWhatsapp size={14} /> Agendar demonstração</button>
          </div>
          <div style={{ marginTop: '0.8rem', fontSize: '0.7rem', color: 'var(--text-4)', textAlign: 'center' }}>
            Por segurança e propriedade intelectual, o acesso completo à ferramenta é liberado apenas em demonstração assistida.
          </div>
        </div>
      </div>
    </div>
  );
}

function ImgOrMock({ id, idx, nome }) {
  const [ok, setOk] = useState(true);
  return (
    <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
      {ok ? (
        <img src={`/demos/${id}-${idx}.png`} alt={`${nome} — tela ${idx}`} onError={() => setOk(false)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <MockUI nome={nome} />
      )}
    </div>
  );
}
