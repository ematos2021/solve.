import { useState, useEffect, useCallback } from 'react';
import { supabase, dataBR } from '../lib/supabase';
import { Modal, Field, Acoes, Avatar } from '../components/ui';
import { useApp } from '../App';
import { FaPlus, FaPen, FaTrash, FaUserPlus, FaTimes, FaFolderOpen } from 'react-icons/fa';

const NOVO = { nome: '', descricao: '', ativo: true };

// Gestão de projetos (Prime, MRQ, Cuidar, Areal…) e dos associados.
// Adicionar alguém a um projeto promove a conta a 'associado' na hora;
// remover de todos os projetos rebaixa de volta a 'cliente'.
// O que o associado PODE ver é decidido no banco (RLS) — esta tela só organiza.
export default function Projetos() {
  const { recarregarProjetos } = useApp();
  const [projetos, setProjetos] = useState([]);
  const [membros, setMembros] = useState([]);    // vínculos projeto ↔ pessoa
  const [pessoas, setPessoas] = useState([]);    // todos os perfis (admin vê todos)
  const [edit, setEdit] = useState(null);
  const [addEm, setAddEm] = useState({});        // user_id selecionado por projeto
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const [p, m, pe] = await Promise.all([
      supabase.from('projetos').select('*').order('nome'),
      supabase.from('projeto_membros').select('*'),
      supabase.from('profiles').select('user_id, nome, empresa, role').order('nome'),
    ]);
    setProjetos(p.data || []); setMembros(m.data || []); setPessoas(pe.data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const pessoa = (uid) => pessoas.find(x => x.user_id === uid);
  const membrosDe = (pid) => membros.filter(m => m.projeto_id === pid);

  const salvar = async () => {
    if (!edit.nome.trim()) return alert('Dê um nome ao projeto.');
    setBusy(true);
    const { id, created_at, ...campos } = edit;
    if (id) await supabase.from('projetos').update(campos).eq('id', id);
    else await supabase.from('projetos').insert(campos);
    setBusy(false); setEdit(null); carregar(); recarregarProjetos();
  };

  const remover = async (p) => {
    if (!confirm(`Remover o projeto "${p.nome}"? Ideias, tarefas e assinaturas vinculadas NÃO são apagadas — ficam sem projeto (visíveis só aos sócios).`)) return;
    await supabase.from('projetos').delete().eq('id', p.id);
    carregar(); recarregarProjetos();
  };

  const alternarAtivo = async (p) => {
    await supabase.from('projetos').update({ ativo: !p.ativo }).eq('id', p.id);
    carregar(); recarregarProjetos();
  };

  // Adiciona membro; se a conta ainda é 'cliente', promove a 'associado'
  const addMembro = async (p) => {
    const uid = addEm[p.id];
    if (!uid) return;
    const alvo = pessoa(uid);
    await supabase.from('projeto_membros').insert({ projeto_id: p.id, user_id: uid });
    if (alvo && alvo.role === 'cliente') {
      await supabase.from('profiles').update({ role: 'associado' }).eq('user_id', uid);
    }
    setAddEm({ ...addEm, [p.id]: '' });
    carregar();
  };

  // Remove do projeto; associado sem nenhum projeto volta a ser 'cliente'
  const delMembro = async (p, uid) => {
    const alvo = pessoa(uid);
    if (!confirm(`Remover ${alvo?.nome || 'esta pessoa'} do projeto "${p.nome}"?`)) return;
    await supabase.from('projeto_membros').delete().eq('projeto_id', p.id).eq('user_id', uid);
    const restantes = membros.filter(m => m.user_id === uid && m.projeto_id !== p.id);
    if (alvo?.role === 'associado' && !restantes.length) {
      await supabase.from('profiles').update({ role: 'cliente' }).eq('user_id', uid);
    }
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Projetos</h1>
        <button className="btn solid" style={{ marginLeft: 'auto' }} onClick={() => setEdit({ ...NOVO })}><FaPlus size={11} /> Novo projeto</button>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.1rem', maxWidth: 720 }}>
        Membros de um projeto (associados) enxergam apenas a visão geral, as ideias, as tarefas e as
        assinaturas <strong>daquele projeto</strong>. O que não tem projeto continua exclusivo dos sócios —
        garantido no servidor, não no navegador.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.9rem' }}>
        {projetos.map(p => {
          const doProj = membrosDe(p.id);
          const candidatos = pessoas.filter(x =>
            x.role !== 'admin' && !doProj.some(m => m.user_id === x.user_id));
          return (
            <div key={p.id} className="card" style={{ padding: '1rem 1.05rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', opacity: p.ativo ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FaFolderOpen size={12} style={{ color: 'var(--info)' }} /> {p.nome}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: 2 }}>desde {dataBR(p.created_at)}</div>
                </div>
                <button className={`badge ${p.ativo ? 'ok' : ''}`} style={{ cursor: 'pointer' }} onClick={() => alternarAtivo(p)}>
                  {p.ativo ? 'Ativo' : 'Pausado'}
                </button>
              </div>
              {p.descricao && <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{p.descricao}</div>}

              <div>
                <div className="label" style={{ marginBottom: '0.45rem' }}>Membros (associados)</div>
                {doProj.map(m => {
                  const perf = pessoa(m.user_id);
                  return (
                    <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.3rem 0', fontSize: '0.83rem' }}>
                      <Avatar perfil={perf} />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {perf?.nome || m.user_id.slice(0, 8)}
                        {perf?.empresa && <span style={{ color: 'var(--text-4)' }}> · {perf.empresa}</span>}
                      </span>
                      <button className="btn sm warn" style={{ padding: '0.18rem 0.4rem' }} title="Remover do projeto" onClick={() => delMembro(p, m.user_id)}><FaTimes size={9} /></button>
                    </div>
                  );
                })}
                {!doProj.length && <div style={{ fontSize: '0.76rem', color: 'var(--text-4)', padding: '0.2rem 0 0.4rem' }}>Sem associados ainda.</div>}
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.4rem' }}>
                  <select className="input" style={{ fontSize: '0.78rem', padding: '0.35rem 1.8rem 0.35rem 0.6rem' }}
                    value={addEm[p.id] || ''} onChange={e => setAddEm({ ...addEm, [p.id]: e.target.value })}>
                    <option value="">Adicionar pessoa…</option>
                    {candidatos.map(c => (
                      <option key={c.user_id} value={c.user_id}>
                        {c.nome || c.user_id.slice(0, 8)}{c.role === 'associado' ? ' (associado)' : ''}
                      </option>
                    ))}
                  </select>
                  <button className="btn sm" disabled={!addEm[p.id]} onClick={() => addMembro(p)}><FaUserPlus size={10} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, marginTop: 'auto', justifyContent: 'flex-end' }}>
                <button className="btn sm" onClick={() => setEdit({ ...p })}><FaPen size={10} /></button>
                <button className="btn sm warn" onClick={() => remover(p)}><FaTrash size={10} /></button>
              </div>
            </div>
          );
        })}
        {!projetos.length && (
          <div className="card" style={{ padding: '2.2rem', textAlign: 'center', color: 'var(--text-3)', gridColumn: '1 / -1' }}>
            Nenhum projeto ainda. Crie o primeiro (ex.: Prime, MRQ, Cuidar, Areal) e adicione os associados. 📁
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.74rem', color: 'var(--text-4)', marginTop: '1.1rem', maxWidth: 720 }}>
        Para adicionar alguém que ainda não aparece na lista: a pessoa precisa primeiro criar a própria conta
        pelo portal do site (Portal do cliente → Criar conta). Depois é só selecioná-la aqui — ela vira
        associada automaticamente.
      </p>

      {edit && (
        <Modal titulo={edit.id ? 'Editar projeto' : 'Novo projeto'} onClose={() => setEdit(null)}>
          <div className="grid-2">
            <Field label="Nome" span={2}><input className="input" value={edit.nome} onChange={e => setEdit({ ...edit, nome: e.target.value })} autoFocus placeholder="ex.: Cuidar" /></Field>
            <Field label="Descrição" span={2}><textarea className="input" rows={2} value={edit.descricao} onChange={e => setEdit({ ...edit, descricao: e.target.value })} placeholder="Do que se trata este projeto?" /></Field>
            <Field label="Situação" span={2}>
              <select className="input" value={edit.ativo ? '1' : '0'} onChange={e => setEdit({ ...edit, ativo: e.target.value === '1' })}>
                <option value="1">Ativo</option><option value="0">Pausado</option>
              </select>
            </Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
