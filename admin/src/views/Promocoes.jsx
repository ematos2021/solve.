import { useState, useEffect, useCallback } from 'react';
import { supabase, dataBR, hoje } from '../lib/supabase';
import { Modal, Field, Acoes, Vazio } from '../components/ui';
import { FaPlus, FaPen, FaTrash } from 'react-icons/fa';

const PRODUTOS = ['todas', 'PRIME', 'GOqualy', 'EasyOEE', 'SGA', 'SIG Comércio'];
const NOVA = { nome: '', produto: 'todas', desconto_pct: '', inicio: hoje(), fim: '', ativo: true, obs: '' };

export default function Promocoes() {
  const [lista, setLista] = useState([]);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('promocoes').select('*').order('created_at', { ascending: false });
    setLista(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    if (!edit.nome.trim()) return alert('Dê um nome à promoção.');
    setBusy(true);
    const { id, created_at, ...campos } = edit;
    campos.desconto_pct = Number(campos.desconto_pct) || 0;
    campos.fim = campos.fim || null;
    if (id) await supabase.from('promocoes').update(campos).eq('id', id);
    else await supabase.from('promocoes').insert(campos);
    setBusy(false); setEdit(null); carregar();
  };

  const alternar = async (p) => {
    await supabase.from('promocoes').update({ ativo: !p.ativo }).eq('id', p.id);
    carregar();
  };

  const remover = async (p) => {
    if (!confirm('Remover esta promoção?')) return;
    await supabase.from('promocoes').delete().eq('id', p.id);
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Promoções</h1>
        <button className="btn solid" style={{ marginLeft: 'auto' }} onClick={() => setEdit({ ...NOVA })}><FaPlus size={11} /> Nova</button>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Promoção</th><th>Produto</th><th className="num">Desconto</th><th>Vigência</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td><strong>{p.nome}</strong>{p.obs && <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{p.obs}</div>}</td>
                <td>{p.produto}</td>
                <td className="num" style={{ fontWeight: 700 }}>{Number(p.desconto_pct)}%</td>
                <td style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>{dataBR(p.inicio)} — {p.fim ? dataBR(p.fim) : 'sem fim'}</td>
                <td>
                  <button className={`badge ${p.ativo ? 'ok' : ''}`} style={{ cursor: 'pointer' }} onClick={() => alternar(p)}>
                    {p.ativo ? 'Ativa' : 'Pausada'}
                  </button>
                </td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button className="btn sm" style={{ marginRight: 4 }} onClick={() => setEdit({ ...p })}><FaPen size={10} /></button>
                  <button className="btn sm warn" onClick={() => remover(p)}><FaTrash size={10} /></button>
                </td>
              </tr>
            ))}
            {!lista.length && <Vazio msg="Nenhuma promoção cadastrada." />}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar promoção' : 'Nova promoção'} onClose={() => setEdit(null)}>
          <div className="grid-2">
            <Field label="Nome" span={2}><input className="input" value={edit.nome} onChange={e => setEdit({ ...edit, nome: e.target.value })} autoFocus placeholder="ex.: Black Friday Indústria" /></Field>
            <Field label="Produto">
              <select className="input" value={edit.produto} onChange={e => setEdit({ ...edit, produto: e.target.value })}>
                {PRODUTOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Desconto (%)"><input className="input" type="number" step="0.5" value={edit.desconto_pct} onChange={e => setEdit({ ...edit, desconto_pct: e.target.value })} /></Field>
            <Field label="Início"><input className="input" type="date" value={edit.inicio} onChange={e => setEdit({ ...edit, inicio: e.target.value })} /></Field>
            <Field label="Fim (opcional)"><input className="input" type="date" value={edit.fim || ''} onChange={e => setEdit({ ...edit, fim: e.target.value })} /></Field>
            <Field label="Observações" span={2}><input className="input" value={edit.obs} onChange={e => setEdit({ ...edit, obs: e.target.value })} /></Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
