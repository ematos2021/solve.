import { useState, useEffect, useCallback } from 'react';
import { supabase, dataBR } from '../lib/supabase';
import { Modal, Field, Acoes, Vazio } from '../components/ui';
import { FaPlus, FaPen, FaTrash, FaWhatsapp } from 'react-icons/fa';

const NOVO = { empresa: '', contato: '', email: '', whatsapp: '', obs: '', status: 'ativo' };

export default function Clientes() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState('');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').order('empresa');
    setLista(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = lista.filter(c => !busca.trim() || c.empresa.toLowerCase().includes(busca.toLowerCase()) || (c.contato || '').toLowerCase().includes(busca.toLowerCase()));

  const salvar = async () => {
    if (!edit.empresa.trim()) return alert('Informe a empresa.');
    setBusy(true);
    const { id, created_at, ...campos } = edit;
    if (id) await supabase.from('clientes').update(campos).eq('id', id);
    else await supabase.from('clientes').insert(campos);
    setBusy(false); setEdit(null); carregar();
  };

  const remover = async (c) => {
    if (!confirm(`Remover ${c.empresa}? As assinaturas ligadas serão removidas junto.`)) return;
    await supabase.from('clientes').delete().eq('id', c.id);
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Clientes</h1>
        <input className="input" style={{ maxWidth: 260, marginLeft: 'auto' }} placeholder="Buscar…" value={busca} onChange={e => setBusca(e.target.value)} />
        <button className="btn solid" onClick={() => setEdit({ ...NOVO })}><FaPlus size={11} /> Novo</button>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Empresa</th><th>Contato</th><th>WhatsApp</th><th>Status</th><th>Desde</th><th></th></tr></thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id}>
                <td><strong>{c.empresa}</strong>{c.obs && <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{c.obs}</div>}</td>
                <td style={{ color: 'var(--text-2)' }}>{c.contato || '—'}<div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{c.email}</div></td>
                <td>{c.whatsapp
                  ? <a className="btn sm" href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><FaWhatsapp size={11} /> {c.whatsapp}</a>
                  : '—'}</td>
                <td><span className={`badge ${c.status === 'ativo' ? 'ok' : c.status === 'prospecto' ? 'info' : ''}`}>{c.status}</span></td>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{dataBR(c.created_at)}</td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button className="btn sm" style={{ marginRight: 4 }} onClick={() => setEdit({ ...c })}><FaPen size={10} /></button>
                  <button className="btn sm warn" onClick={() => remover(c)}><FaTrash size={10} /></button>
                </td>
              </tr>
            ))}
            {!filtrados.length && <Vazio msg="Nenhum cliente. Cadastre o primeiro." />}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar cliente' : 'Novo cliente'} onClose={() => setEdit(null)}>
          <div className="grid-2">
            <Field label="Empresa" span={2}><input className="input" value={edit.empresa} onChange={e => setEdit({ ...edit, empresa: e.target.value })} autoFocus /></Field>
            <Field label="Pessoa de contato"><input className="input" value={edit.contato} onChange={e => setEdit({ ...edit, contato: e.target.value })} /></Field>
            <Field label="E-mail"><input className="input" value={edit.email} onChange={e => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="WhatsApp"><input className="input" value={edit.whatsapp} onChange={e => setEdit({ ...edit, whatsapp: e.target.value })} placeholder="DDD + número" /></Field>
            <Field label="Status">
              <select className="input" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>
                <option value="ativo">Ativo</option><option value="prospecto">Prospecto</option><option value="inativo">Inativo</option>
              </select>
            </Field>
            <Field label="Observações" span={2}><input className="input" value={edit.obs} onChange={e => setEdit({ ...edit, obs: e.target.value })} /></Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
