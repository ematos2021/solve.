import { useState, useEffect, useCallback } from 'react';
import { supabase, dtBR, nomeCurto } from '../lib/supabase';
import { Avatar } from '../components/ui';
import { useApp } from '../App';
import { FaThumbtack, FaTrash, FaPaperPlane } from 'react-icons/fa';

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
    e.preventDefault();
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
    <div className="fade-in" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.1rem' }}>Mural da equipe</h1>

      <form onSubmit={publicar} className="card" style={{ padding: '0.9rem 1rem', marginBottom: '1.1rem', display: 'flex', gap: '0.7rem', alignItems: 'flex-end' }}>
        <textarea className="input" rows={2} style={{ minHeight: 54 }} placeholder="Compartilhe um aviso, decisão ou atualização com os sócios… (Ctrl+Enter publica)"
          value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) publicar(e); }} />
        <button className="btn solid" type="submit" disabled={busy || !texto.trim()} style={{ flexShrink: 0 }}>
          <FaPaperPlane size={11} /> Publicar
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {posts.map(p => (
          <div key={p.id} className="card" style={{ padding: '0.85rem 1rem', borderColor: p.fixado ? 'var(--border-strong)' : 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
              <Avatar perfil={p.autor} />
              <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{nomeCurto(p.autor)}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{dtBR(p.created_at)}</span>
              {p.fixado && <span className="badge warn"><FaThumbtack size={8} /> fixado</span>}
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button className="btn sm" title={p.fixado ? 'Desafixar' : 'Fixar no topo'} onClick={() => fixar(p)}><FaThumbtack size={10} /></button>
                {p.autor_id === session.user.id && <button className="btn sm warn" onClick={() => remover(p)}><FaTrash size={10} /></button>}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>{p.texto}</div>
          </div>
        ))}
        {!posts.length && (
          <div className="card" style={{ padding: '2.2rem', textAlign: 'center', color: 'var(--text-3)' }}>
            Mural vazio. Publique o primeiro aviso para a equipe.
          </div>
        )}
      </div>
    </div>
  );
}
