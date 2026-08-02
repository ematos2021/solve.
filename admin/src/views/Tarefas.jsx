import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, dataBR, diasAte, nomeCurto } from '../lib/supabase';
import { Modal, Field, Acoes, Avatar, PrioBadge } from '../components/ui';
import { useApp } from '../App';
import { FaPlus, FaPen, FaTrash, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';

const COLS = [
  { id: 'a_fazer', label: 'A fazer' },
  { id: 'fazendo', label: 'Em andamento' },
  { id: 'feito', label: 'Concluído' },
];
const NOVA = { titulo: '', descricao: '', status: 'a_fazer', prioridade: 'normal', prazo: '', resp_id: '', cliente_id: '', projeto_id: '' };

// Kanban de tarefas da equipe. Associados só veem tarefas dos próprios
// projetos (RLS); a lente de projetos da sidebar filtra para todos.
export default function Tarefas() {
  const { session, equipe, projetos, projFiltro, isAdmin } = useApp();
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtroResp, setFiltroResp] = useState('todos');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rapida, setRapida] = useState({}); // texto do quick-add por coluna

  const carregar = useCallback(async () => {
    const [t, c] = await Promise.all([
      supabase.from('tarefas').select('*, resp:resp_id(nome), criador:criador_id(nome), clientes(empresa)')
        .order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, empresa').order('empresa'),
    ]);
    setLista(t.data || []); setClientes(c.data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const nomeProjeto = (id) => projetos.find(p => p.id === id)?.nome;
  // Projeto padrão de tarefa nova: a lente ativa; associado nunca cria "sem projeto"
  const projetoPadrao = projFiltro !== 'todos' ? projFiltro : (isAdmin ? '' : (projetos[0]?.id || ''));

  const visiveis = useMemo(() => lista.filter(t => {
    if (projFiltro !== 'todos' && t.projeto_id !== projFiltro) return false;
    if (filtroResp === 'todos') return true;
    if (filtroResp === 'minhas') return t.resp_id === session.user.id;
    return t.resp_id === filtroResp;
  }), [lista, filtroResp, session, projFiltro]);

  const salvar = async () => {
    if (!edit.titulo.trim()) return alert('Informe o título.');
    if (!isAdmin && !edit.projeto_id) return alert('Escolha o projeto da tarefa.');
    setBusy(true);
    const { id, created_at, resp: _r, criador: _cr, clientes: _c, ...campos } = edit;
    campos.prazo = campos.prazo || null;
    campos.resp_id = campos.resp_id || null;
    campos.cliente_id = campos.cliente_id || null;
    campos.projeto_id = campos.projeto_id || null;
    campos.done_at = campos.status === 'feito' ? (edit.done_at || new Date().toISOString()) : null;
    if (id) await supabase.from('tarefas').update(campos).eq('id', id);
    else await supabase.from('tarefas').insert({ ...campos, criador_id: session.user.id });
    setBusy(false); setEdit(null); carregar();
  };

  const addRapida = async (status) => {
    const titulo = (rapida[status] || '').trim();
    if (!titulo) return;
    setRapida({ ...rapida, [status]: '' });
    await supabase.from('tarefas').insert({
      titulo, status, criador_id: session.user.id, resp_id: session.user.id,
      projeto_id: projetoPadrao || null,
    });
    carregar();
  };

  const mover = async (t, dir) => {
    const i = COLS.findIndex(c => c.id === t.status) + dir;
    if (i < 0 || i >= COLS.length) return;
    const status = COLS[i].id;
    await supabase.from('tarefas').update({ status, done_at: status === 'feito' ? new Date().toISOString() : null }).eq('id', t.id);
    carregar();
  };

  const remover = async (t) => {
    if (!confirm(`Remover a tarefa "${t.titulo}"?`)) return;
    await supabase.from('tarefas').delete().eq('id', t.id);
    carregar();
  };

  const limparConcluidas = async () => {
    const feitas = visiveis.filter(t => t.status === 'feito');
    if (!feitas.length) return;
    if (!confirm(`Arquivar (remover) ${feitas.length} tarefa(s) concluída(s)?`)) return;
    await supabase.from('tarefas').delete().in('id', feitas.map(t => t.id));
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tarefas</h1>
        <select className="input" style={{ maxWidth: 200, marginLeft: 'auto' }} value={filtroResp} onChange={e => setFiltroResp(e.target.value)}>
          <option value="todos">Toda a equipe</option>
          <option value="minhas">Minhas tarefas</option>
          {equipe.map(p => <option key={p.user_id} value={p.user_id}>{p.nome || p.user_id.slice(0, 6)}</option>)}
        </select>
        <button className="btn" onClick={limparConcluidas}>Arquivar concluídas</button>
        <button className="btn solid" onClick={() => setEdit({ ...NOVA, resp_id: session.user.id, projeto_id: projetoPadrao })}><FaPlus size={11} /> Nova tarefa</button>
      </div>

      <div className="kanban">
        {COLS.map(col => {
          const doStatus = visiveis.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="kanban-col">
              <div className="kanban-head">
                {col.label} <span className="kanban-count">{doStatus.length}</span>
              </div>
              {doStatus.map(t => {
                const d = t.prazo ? diasAte(t.prazo) : null;
                const atrasada = d != null && d < 0 && t.status !== 'feito';
                return (
                  <div key={t.id} className="kanban-card">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ flex: 1, fontWeight: 600, textDecoration: t.status === 'feito' ? 'line-through' : 'none', color: t.status === 'feito' ? 'var(--text-3)' : 'var(--text)' }}>{t.titulo}</span>
                      <Avatar perfil={t.resp} />
                    </div>
                    {t.descricao && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>{t.descricao}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
                      {t.prioridade !== 'normal' && <PrioBadge prio={t.prioridade} />}
                      {projFiltro === 'todos' && t.projeto_id && nomeProjeto(t.projeto_id) && <span className="badge info">{nomeProjeto(t.projeto_id)}</span>}
                      {t.clientes?.empresa && <span className="badge">{t.clientes.empresa}</span>}
                      {t.prazo && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: atrasada ? 'var(--danger)' : d <= 2 ? 'var(--warn)' : 'var(--text-3)' }}>
                          {atrasada ? `atrasada ${-d}d` : d === 0 ? 'hoje' : dataBR(t.prazo)}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                        {col.id !== 'a_fazer' && <button className="btn sm" style={{ padding: '0.2rem 0.4rem' }} title="Voltar etapa" onClick={() => mover(t, -1)}><FaArrowLeft size={9} /></button>}
                        {col.id !== 'feito' && <button className="btn sm" style={{ padding: '0.2rem 0.4rem' }} title={col.id === 'fazendo' ? 'Concluir' : 'Avançar etapa'} onClick={() => mover(t, 1)}>{col.id === 'fazendo' ? <FaCheck size={9} /> : <FaArrowRight size={9} />}</button>}
                        <button className="btn sm" style={{ padding: '0.2rem 0.4rem' }} onClick={() => setEdit({ ...t, prazo: t.prazo || '', resp_id: t.resp_id || '', cliente_id: t.cliente_id || '', projeto_id: t.projeto_id || '' })}><FaPen size={9} /></button>
                        <button className="btn sm warn" style={{ padding: '0.2rem 0.4rem' }} onClick={() => remover(t)}><FaTrash size={9} /></button>
                      </span>
                    </div>
                  </div>
                );
              })}
              {!doStatus.length && <div style={{ padding: '1rem 0.3rem', fontSize: '0.78rem', color: 'var(--text-4)', textAlign: 'center' }}>Nada aqui.</div>}
              <form onSubmit={e => { e.preventDefault(); addRapida(col.id); }}>
                <input className="input" style={{ fontSize: '0.8rem', padding: '0.45rem 0.7rem' }} placeholder="+ adicionar rápido…"
                  value={rapida[col.id] || ''} onChange={e => setRapida({ ...rapida, [col.id]: e.target.value })} />
              </form>
            </div>
          );
        })}
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar tarefa' : 'Nova tarefa'} onClose={() => setEdit(null)}>
          <div className="grid-2">
            <Field label="Título" span={2}><input className="input" value={edit.titulo} onChange={e => setEdit({ ...edit, titulo: e.target.value })} autoFocus /></Field>
            <Field label="Descrição" span={2}><textarea className="input" rows={2} value={edit.descricao} onChange={e => setEdit({ ...edit, descricao: e.target.value })} /></Field>
            <Field label="Responsável">
              <select className="input" value={edit.resp_id} onChange={e => setEdit({ ...edit, resp_id: e.target.value })}>
                <option value="">—</option>
                {equipe.map(p => <option key={p.user_id} value={p.user_id}>{p.nome || p.user_id.slice(0, 6)}</option>)}
              </select>
            </Field>
            <Field label="Prioridade">
              <select className="input" value={edit.prioridade} onChange={e => setEdit({ ...edit, prioridade: e.target.value })}>
                <option value="baixa">Baixa</option><option value="normal">Normal</option>
                <option value="alta">Alta</option><option value="urgente">Urgente</option>
              </select>
            </Field>
            <Field label="Prazo"><input className="input" type="date" value={edit.prazo} onChange={e => setEdit({ ...edit, prazo: e.target.value })} /></Field>
            <Field label="Cliente (opcional)">
              <select className="input" value={edit.cliente_id} onChange={e => setEdit({ ...edit, cliente_id: e.target.value })}>
                <option value="">—</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
              </select>
            </Field>
            <Field label="Projeto">
              <select className="input" value={edit.projeto_id || ''} onChange={e => setEdit({ ...edit, projeto_id: e.target.value })}>
                {isAdmin && <option value="">Interno — só sócios</option>}
                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </Field>
            <Field label="Situação">
              <select className="input" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>
                {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
          {edit.criador && <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: '0.7rem', textAlign: 'center' }}>Criada por {nomeCurto(edit.criador)}</div>}
        </Modal>
      )}
    </div>
  );
}
