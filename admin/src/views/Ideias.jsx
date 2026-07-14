import { useState, useEffect, useCallback } from 'react';
import { supabase, dataBR, nomeCurto } from '../lib/supabase';
import { Modal, Field, Acoes, Avatar } from '../components/ui';
import { useApp } from '../App';
import { FaPlus, FaPen, FaTrash, FaThumbsUp } from 'react-icons/fa';

const STATUS = [
  { id: 'nova', label: 'Nova', cls: 'info' },
  { id: 'avaliando', label: 'Em avaliação', cls: 'warn' },
  { id: 'aprovada', label: 'Aprovada', cls: 'ok' },
  { id: 'em_execucao', label: 'Em execução', cls: 'ok' },
  { id: 'concluida', label: 'Concluída', cls: '' },
  { id: 'descartada', label: 'Descartada', cls: 'danger' },
];
const CATEGORIAS = ['Produto', 'Comercial', 'Marketing', 'Processo interno', 'Novo negócio'];
const NOVA = { titulo: '', descricao: '', categoria: 'Produto', status: 'nova' };

// Backlog de ideias da sociedade: qualquer sócio registra, todos votam.
export default function Ideias() {
  const { session } = useApp();
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('ativas');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('ideias').select('*, autor:autor_id(nome)')
      .order('votos', { ascending: false }).order('created_at', { ascending: false });
    setLista(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const visiveis = lista.filter(i => {
    if (filtro === 'todas') return true;
    if (filtro === 'ativas') return !['concluida', 'descartada'].includes(i.status);
    return i.status === filtro;
  });

  const salvar = async () => {
    if (!edit.titulo.trim()) return alert('Dê um título à ideia.');
    setBusy(true);
    const { id, created_at, votos, autor: _a, ...campos } = edit;
    if (id) await supabase.from('ideias').update(campos).eq('id', id);
    else await supabase.from('ideias').insert({ ...campos, autor_id: session.user.id });
    setBusy(false); setEdit(null); carregar();
  };

  const votar = async (i) => {
    await supabase.from('ideias').update({ votos: i.votos + 1 }).eq('id', i.id);
    carregar();
  };

  const remover = async (i) => {
    if (!confirm(`Remover a ideia "${i.titulo}"?`)) return;
    await supabase.from('ideias').delete().eq('id', i.id);
    carregar();
  };

  const stInfo = (s) => STATUS.find(x => x.id === s) || STATUS[0];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ideias</h1>
        <select className="input" style={{ maxWidth: 190, marginLeft: 'auto' }} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="ativas">Ativas</option>
          <option value="todas">Todas</option>
          {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button className="btn solid" onClick={() => setEdit({ ...NOVA })}><FaPlus size={11} /> Nova ideia</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.9rem' }}>
        {visiveis.map(i => {
          const st = stInfo(i.status);
          return (
            <div key={i.id} className="card" style={{ padding: '0.95rem 1.05rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{i.titulo}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: 2 }}>
                    {i.categoria} · {nomeCurto(i.autor)} · {dataBR(i.created_at)}
                  </div>
                </div>
                <Avatar perfil={i.autor} />
              </div>
              {i.descricao && <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', flex: 1 }}>{i.descricao}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: 'auto' }}>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="btn sm" onClick={() => votar(i)} title="Apoiar esta ideia">
                    <FaThumbsUp size={10} /> {i.votos}
                  </button>
                  <button className="btn sm" onClick={() => setEdit({ ...i })}><FaPen size={10} /></button>
                  <button className="btn sm warn" onClick={() => remover(i)}><FaTrash size={10} /></button>
                </span>
              </div>
            </div>
          );
        })}
        {!visiveis.length && (
          <div className="card" style={{ padding: '2.2rem', textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
            Nenhuma ideia neste filtro. Registre a próxima grande jogada da Solve. 💡
          </div>
        )}
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar ideia' : 'Nova ideia'} onClose={() => setEdit(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Título" span={2}><input className="input" value={edit.titulo} onChange={e => setEdit({ ...edit, titulo: e.target.value })} autoFocus /></Field>
            <Field label="Descrição" span={2}><textarea className="input" rows={3} value={edit.descricao} onChange={e => setEdit({ ...edit, descricao: e.target.value })} placeholder="Qual o problema, a oportunidade e o próximo passo?" /></Field>
            <Field label="Categoria">
              <select className="input" value={edit.categoria} onChange={e => setEdit({ ...edit, categoria: e.target.value })}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>
                {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
