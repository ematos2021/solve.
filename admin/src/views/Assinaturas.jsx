import { useState, useEffect, useCallback } from 'react';
import { supabase, brl, dataBR, diasAte, hoje } from '../lib/supabase';
import { Modal, Field, Acoes, Vazio, Kpi } from '../components/ui';
import { FaPlus, FaPen, FaTrash, FaRedo } from 'react-icons/fa';

const PRODUTOS = ['PRIME', 'GOqualy', 'EasyOEE', 'SGA', 'SIG Comércio'];
const NOVO = { cliente_id: '', produto: 'PRIME', valor_mensal: '', inicio: hoje(), vencimento: '', status: 'ativa', obs: '' };

export default function Assinaturas() {
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const [a, c] = await Promise.all([
      supabase.from('assinaturas').select('*, clientes(empresa)').order('vencimento'),
      supabase.from('clientes').select('id, empresa').order('empresa'),
    ]);
    setLista(a.data || []); setClientes(c.data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = lista.filter(a => {
    if (filtro === 'todas') return true;
    if (filtro === 'vencendo') { const d = diasAte(a.vencimento); return (a.status === 'ativa' || a.status === 'trial') && d != null && d <= 30; }
    return a.status === filtro;
  });

  const mrr = lista.filter(a => a.status === 'ativa').reduce((s, a) => s + Number(a.valor_mensal), 0);
  const atrasadas = lista.filter(a => a.status === 'atrasada').length;

  const salvar = async () => {
    if (!edit.cliente_id) return alert('Selecione o cliente.');
    if (!edit.vencimento) return alert('Informe o vencimento.');
    setBusy(true);
    const { id, created_at, clientes: _c, ...campos } = edit;
    campos.valor_mensal = Number(campos.valor_mensal) || 0;
    if (id) await supabase.from('assinaturas').update(campos).eq('id', id);
    else await supabase.from('assinaturas').insert(campos);
    setBusy(false); setEdit(null); carregar();
  };

  // Renovar: empurra o vencimento +1 mês e garante status ativa.
  const renovar = async (a) => {
    const v = new Date(a.vencimento + 'T00:00:00');
    v.setMonth(v.getMonth() + 1);
    await supabase.from('assinaturas').update({ vencimento: v.toISOString().slice(0, 10), status: 'ativa' }).eq('id', a.id);
    carregar();
  };

  const remover = async (a) => {
    if (!confirm('Remover esta assinatura?')) return;
    await supabase.from('assinaturas').delete().eq('id', a.id);
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Assinaturas</h1>
        <select className="input" style={{ maxWidth: 190, marginLeft: 'auto' }} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="todas">Todas</option>
          <option value="vencendo">Vencendo em 30d</option>
          <option value="ativa">Ativas</option>
          <option value="trial">Trial</option>
          <option value="atrasada">Atrasadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <button className="btn solid" onClick={() => setEdit({ ...NOVO })}><FaPlus size={11} /> Nova</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        <Kpi label="MRR" value={brl(mrr)} />
        <Kpi label="Ativas" value={lista.filter(a => a.status === 'ativa').length} tone="ok" />
        <Kpi label="Atrasadas" value={atrasadas} tone={atrasadas ? 'danger' : undefined} />
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Cliente</th><th>Produto</th><th className="num">Valor/mês</th><th>Vencimento</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtradas.map(a => {
              const d = diasAte(a.vencimento);
              const corVenc = d == null ? 'var(--text-2)' : d < 0 ? 'var(--danger)' : d <= 7 ? 'var(--warn)' : 'var(--text-2)';
              return (
                <tr key={a.id}>
                  <td><strong>{a.clientes?.empresa || '—'}</strong>{a.obs && <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{a.obs}</div>}</td>
                  <td>{a.produto}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{brl(a.valor_mensal)}</td>
                  <td style={{ color: corVenc, fontWeight: 600 }}>
                    {dataBR(a.vencimento)}
                    {d != null && (a.status === 'ativa' || a.status === 'trial' || a.status === 'atrasada') &&
                      <span style={{ fontSize: '0.72rem', marginLeft: 6, opacity: 0.8 }}>{d < 0 ? `(${-d}d atrás)` : `(${d}d)`}</span>}
                  </td>
                  <td><span className={`badge ${a.status === 'ativa' ? 'ok' : a.status === 'atrasada' ? 'danger' : a.status === 'trial' ? 'info' : ''}`}>{a.status}</span></td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {a.status !== 'cancelada' && <button className="btn sm" title="Renovar +1 mês" style={{ marginRight: 4 }} onClick={() => renovar(a)}><FaRedo size={9} /> +1 mês</button>}
                    <button className="btn sm" style={{ marginRight: 4 }} onClick={() => setEdit({ ...a })}><FaPen size={10} /></button>
                    <button className="btn sm warn" onClick={() => remover(a)}><FaTrash size={10} /></button>
                  </td>
                </tr>
              );
            })}
            {!filtradas.length && <Vazio msg="Nenhuma assinatura neste filtro." />}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar assinatura' : 'Nova assinatura'} onClose={() => setEdit(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Cliente" span={2}>
              <select className="input" value={edit.cliente_id} onChange={e => setEdit({ ...edit, cliente_id: e.target.value })}>
                <option value="">Selecione…</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
              </select>
            </Field>
            <Field label="Produto">
              <select className="input" value={edit.produto} onChange={e => setEdit({ ...edit, produto: e.target.value })}>
                {PRODUTOS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Valor mensal (R$)"><input className="input" type="number" step="0.01" value={edit.valor_mensal} onChange={e => setEdit({ ...edit, valor_mensal: e.target.value })} /></Field>
            <Field label="Início"><input className="input" type="date" value={edit.inicio} onChange={e => setEdit({ ...edit, inicio: e.target.value })} /></Field>
            <Field label="Vencimento"><input className="input" type="date" value={edit.vencimento} onChange={e => setEdit({ ...edit, vencimento: e.target.value })} /></Field>
            <Field label="Status">
              <select className="input" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>
                <option value="ativa">Ativa</option><option value="trial">Trial</option>
                <option value="atrasada">Atrasada</option><option value="cancelada">Cancelada</option>
              </select>
            </Field>
            <Field label="Observações"><input className="input" value={edit.obs} onChange={e => setEdit({ ...edit, obs: e.target.value })} /></Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
