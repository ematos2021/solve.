import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, brl, dataBR, hoje } from '../lib/supabase';
import { Modal, Field, Acoes, Vazio, Kpi } from '../components/ui';
import { FaPlus, FaTrash, FaPen } from 'react-icons/fa';

const CATS_ENTRADA = ['Assinatura', 'Implantação', 'Serviço avulso', 'Outra receita'];
const CATS_SAIDA = ['Infraestrutura', 'Ferramentas', 'Marketing', 'Impostos', 'Pró-labore', 'Outro custo'];
const NOVO = { tipo: 'entrada', categoria: 'Assinatura', descricao: '', valor: '', data: hoje(), cliente_id: null };

export default function Caixa() {
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mes, setMes] = useState(hoje().slice(0, 7));
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const [l, c] = await Promise.all([
      supabase.from('lancamentos').select('*, clientes(empresa)').order('data', { ascending: false }),
      supabase.from('clientes').select('id, empresa').order('empresa'),
    ]);
    setLista(l.data || []); setClientes(c.data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const doMes = useMemo(() => lista.filter(l => (l.data || '').slice(0, 7) === mes), [lista, mes]);
  const entradas = doMes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
  const saidas = doMes.filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0);

  // Série dos últimos 6 meses para o mini-gráfico
  const serie = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const k = d.toISOString().slice(0, 7);
      const doM = lista.filter(l => (l.data || '').slice(0, 7) === k);
      out.push({
        k, label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        in: doM.filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0),
        out: doM.filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0),
      });
    }
    return out;
  }, [lista]);
  const maxSerie = Math.max(1, ...serie.flatMap(s => [s.in, s.out]));

  const salvar = async () => {
    const valor = Number(edit.valor);
    if (!valor || valor <= 0) return alert('Informe um valor válido.');
    setBusy(true);
    const { id, created_at, clientes: _c, ...campos } = edit;
    campos.valor = valor;
    campos.cliente_id = campos.cliente_id || null;
    if (id) await supabase.from('lancamentos').update(campos).eq('id', id);
    else await supabase.from('lancamentos').insert(campos);
    setBusy(false); setEdit(null); carregar();
  };

  const remover = async (l) => {
    if (!confirm('Remover este lançamento?')) return;
    await supabase.from('lancamentos').delete().eq('id', l.id);
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Fluxo de caixa</h1>
        <input className="input" type="month" style={{ maxWidth: 170, marginLeft: 'auto' }} value={mes} onChange={e => setMes(e.target.value)} />
        <button className="btn solid" onClick={() => setEdit({ ...NOVO })}><FaPlus size={11} /> Lançamento</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        <Kpi label="Entradas no mês" value={brl(entradas)} tone="ok" />
        <Kpi label="Saídas no mês" value={brl(saidas)} tone={saidas > entradas ? 'danger' : undefined} />
        <Kpi label="Resultado" value={brl(entradas - saidas)} tone={entradas - saidas >= 0 ? 'ok' : 'danger'} />
      </div>

      {/* Mini gráfico 6 meses */}
      <div className="card" style={{ padding: '1rem 1.1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-3)', marginBottom: '0.8rem' }}>
          Últimos 6 meses <span style={{ fontWeight: 500, textTransform: 'none', marginLeft: 8 }}>▮ entradas · ▯ saídas</span>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-end', height: 110 }}>
          {serie.map(s => (
            <div key={s.k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                <div title={`Entradas: ${brl(s.in)}`} style={{ width: 16, height: `${(s.in / maxSerie) * 100}%`, minHeight: 2, background: 'var(--text-2)', borderRadius: '3px 3px 0 0' }} />
                <div title={`Saídas: ${brl(s.out)}`} style={{ width: 16, height: `${(s.out / maxSerie) * 100}%`, minHeight: 2, background: 'var(--border-strong)', borderRadius: '3px 3px 0 0' }} />
              </div>
              <span style={{ fontSize: '0.68rem', color: s.k === mes ? 'var(--text)' : 'var(--text-4)', fontWeight: s.k === mes ? 700 : 400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto', maxHeight: 420 }}>
        <table className="tbl">
          <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th className="num">Valor</th><th></th></tr></thead>
          <tbody>
            {doMes.map(l => (
              <tr key={l.id}>
                <td style={{ color: 'var(--text-3)' }}>{dataBR(l.data)}</td>
                <td><span className={`badge ${l.tipo === 'entrada' ? 'ok' : 'danger'}`}>{l.tipo}</span></td>
                <td>{l.categoria}</td>
                <td style={{ color: 'var(--text-2)' }}>{l.descricao || '—'}{l.clientes?.empresa && <span style={{ color: 'var(--text-4)' }}> · {l.clientes.empresa}</span>}</td>
                <td className="num" style={{ fontWeight: 700, color: l.tipo === 'entrada' ? 'var(--ok)' : 'var(--danger)' }}>
                  {l.tipo === 'saida' ? '−' : '+'}{brl(l.valor)}
                </td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button className="btn sm" style={{ marginRight: 4 }} onClick={() => setEdit({ ...l })}><FaPen size={10} /></button>
                  <button className="btn sm warn" onClick={() => remover(l)}><FaTrash size={10} /></button>
                </td>
              </tr>
            ))}
            {!doMes.length && <Vazio msg="Sem lançamentos neste mês." />}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar lançamento' : 'Novo lançamento'} onClose={() => setEdit(null)}>
          <div className="grid-2">
            <Field label="Tipo">
              <select className="input" value={edit.tipo} onChange={e => setEdit({ ...edit, tipo: e.target.value, categoria: e.target.value === 'entrada' ? CATS_ENTRADA[0] : CATS_SAIDA[0] })}>
                <option value="entrada">Entrada</option><option value="saida">Saída / custo</option>
              </select>
            </Field>
            <Field label="Categoria">
              <select className="input" value={edit.categoria} onChange={e => setEdit({ ...edit, categoria: e.target.value })}>
                {(edit.tipo === 'entrada' ? CATS_ENTRADA : CATS_SAIDA).map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Valor (R$)"><input className="input" type="number" step="0.01" value={edit.valor} onChange={e => setEdit({ ...edit, valor: e.target.value })} autoFocus /></Field>
            <Field label="Data"><input className="input" type="date" value={edit.data} onChange={e => setEdit({ ...edit, data: e.target.value })} /></Field>
            <Field label="Cliente (opcional)" span={2}>
              <select className="input" value={edit.cliente_id || ''} onChange={e => setEdit({ ...edit, cliente_id: e.target.value || null })}>
                <option value="">—</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
              </select>
            </Field>
            <Field label="Descrição" span={2}><input className="input" value={edit.descricao} onChange={e => setEdit({ ...edit, descricao: e.target.value })} /></Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
