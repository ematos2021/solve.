import { useState, useEffect, useCallback } from 'react';
import { supabase, dtBR, nomeCurto } from '../lib/supabase';
import { Avatar } from '../components/ui';
import { useApp } from '../App';
import { FaThumbtack, FaTrash, FaPaperPlane } from 'react-icons/fa';

const QUEBRA_GELOS = [
  "Qual foi a maior lição que você aprendeu este mês?",
  "Se a nossa empresa fosse um filme, qual seria o gênero e quem seria o protagonista?",
  "Qual é a sua meta pessoal número 1 para esta semana?",
  "O que você anda lendo/assistindo que recomenda para a equipe?",
  "Compartilhe uma 'pequena vitória' que você teve hoje!",
  "Qual é o maior desafio que você está enfrentando agora e como podemos ajudar?",
  "Se você pudesse automatizar 100% de uma tarefa sua, qual seria?",
  "Qual é a melhor ideia que você já teve no chuveiro sobre o nosso negócio?"
];

// Sinos disponíveis
const BELLS = [
  { id: 'bell', icon: '🔔', name: 'Sino Clássico', type: 'bell' },
  { id: 'chime', icon: '🛎️', name: 'Ding-Ding', type: 'chime' },
  { id: 'gong', icon: '🪘', name: 'Gongo', type: 'gong' },
  { id: 'horn', icon: '🎺', name: 'Corneta', type: 'horn' },
  { id: 'magic', icon: '✨', name: 'Mágica', type: 'magic' },
];

const playSound = (type) => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  if (type === 'bell') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
    osc.start(now); osc.stop(now + 1);
  } else if (type === 'chime') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1046.50, now); 
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.start(now); osc.stop(now + 0.8);
    
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now + 0.15);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.8, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 1);
    osc2.start(now + 0.15); osc2.stop(now + 1);
  } else if (type === 'gong') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 3);
    osc.start(now); osc.stop(now + 3);
  } else if (type === 'horn') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  } else if (type === 'magic') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1108.73, now + 0.1);
    osc.frequency.setValueAtTime(1318.51, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    osc.start(now); osc.stop(now + 1.5);
  }
};

// Mural da equipe: avisos, decisões e atualizações rápidas entre os sócios.
// Substitui aquele grupo de WhatsApp que ninguém acha depois. 📌
export default function Mural() {
  const { session } = useApp();
  const [posts, setPosts] = useState([]);
  const [texto, setTexto] = useState('');
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('mural').select('*, autor:autor_id(nome)')
      .order('fixado', { ascending: false }).order('created_at', { ascending: false }).limit(200);
    setPosts(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const publicar = async (e) => {
    if (e) e.preventDefault();
    if (!texto.trim()) return;
    setBusy(true);
    await supabase.from('mural').insert({ texto: texto.trim(), autor_id: session.user.id });
    setTexto(''); setBusy(false); carregar();
  };

  const fixar = async (p) => {
    await supabase.from('mural').update({ fixado: !p.fixado }).eq('id', p.id);
    carregar();
  };

  const remover = async (p) => {
    if (!confirm('Remover esta publicação?')) return;
    await supabase.from('mural').delete().eq('id', p.id);
    carregar();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', width: '100%', maxWidth: 1400 }}>
      
      {/* Coluna Principal: Mural */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.1rem' }}>Mural da equipe</h1>

        <form onSubmit={publicar} className="card" style={{ padding: '0.9rem 1rem', marginBottom: '1.1rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-end' }}>
          <textarea id="txt-mural" className="input" rows={3} style={{ minHeight: 70 }} placeholder="Compartilhe um aviso, decisão ou atualização com os sócios… (Ctrl+Enter publica)"
            value={texto} onChange={e => setTexto(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) publicar(); }} />
          <button className="btn solid" type="submit" disabled={busy || !texto.trim()} style={{ flexShrink: 0 }}>
            <FaPaperPlane size={11} /> Publicar
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {posts.map(p => (
            <div key={p.id} className="card fade-in" style={{ padding: '0.85rem 1rem', borderColor: p.fixado ? 'var(--warn)' : 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
                <Avatar perfil={p.autor} />
                <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{nomeCurto(p.autor)}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{dtBR(p.created_at)}</span>
                {p.fixado && <span className="badge warn" style={{ background: 'rgba(255,193,7,0.1)' }}><FaThumbtack size={8} /> fixado</span>}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                  <button className="btn sm" title={p.fixado ? 'Desafixar' : 'Fixar no topo'} onClick={() => fixar(p)}><FaThumbtack size={10} /></button>
                  {p.autor_id === session.user.id && <button className="btn sm warn" onClick={() => remover(p)}><FaTrash size={10} /></button>}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{p.texto}</div>
            </div>
          ))}
          {!posts.length && (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem', opacity: 0.5 }}>💬</div>
              Mural vazio. Publique o primeiro aviso!
            </div>
          )}
        </div>
      </div>

      {/* Coluna Lúdica: Sinos sonoros */}
      <div style={{ flexShrink: 0, position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {BELLS.map(b => (
          <div 
            key={b.id}
            className="card" 
            style={{ 
              padding: 0,
              background: 'linear-gradient(145deg, rgba(255,193,7,0.08) 0%, rgba(255,193,7,0.02) 100%)', 
              borderColor: 'rgba(255,193,7,0.25)',
              borderRadius: '50%',
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onClick={() => playSound(b.type)}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15) rotate(10deg)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            title={b.name}
          >
            <div style={{ fontSize: '2rem' }}>
              {b.icon}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
