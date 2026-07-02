import { useState, useEffect, useCallback } from 'react';
import { supabase, dtBR } from '../lib/supabase';
import { Vazio, Kpi } from '../components/ui';
import { FaWhatsapp, FaTrash } from 'react-icons/fa';

const STATUS = ['novo', 'contatado', 'convertido', 'descartado'];
const CLS = { novo: 'info', contatado: 'warn', convertido: 'ok', descartado: '' };

// Leads capturados pelo site (cliques em "Quero esta solução" / WhatsApp).
export default function Leads() {
  const [lista, setLista] = useState([]);
  const [filtro, setFiltro] = useState('todos');

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    setLista(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = lista.filter(l => filtro === 'todos' || l.status === filtro);
  const taxa = lista.length ? Math.round(lista.filter(l => l.status === 'convertido').length / lista.length * 100) : 0;

  const mudar = async (l, status) => {
    await supabase.from('leads').update({ status }).eq('id', l.id);
    carregar();
  };
  const remover = async (l) => {
    if (!confirm('Remover este lead?')) return;
    await supabase.from('leads').delete().eq('id', l.id);
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Leads</h1>
        <select className="input" style={{ maxWidth: 170, marginLeft: 'auto' }} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="todos">Todos</option>
          {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        <Kpi label="Total de leads" value={lista.length} />
        <Kpi label="Novos" value={lista.filter(l => l.status === 'novo').length} tone="warn" />
        <Kpi label="Convertidos" value={lista.filter(l => l.status === 'convertido').length} tone="ok" sub={`${taxa}% de conversão`} />
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Quando</th><th>Interesse</th><th>Origem</th><th>Contato</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtrados.map(l => (
              <tr key={l.id}>
                <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{dtBR(l.created_at)}</td>
                <td style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.8rem' }}>{l.produto || 'geral'}</td>
                <td style={{ color: 'var(--text-3)' }}>{l.origem}</td>
                <td style={{ color: 'var(--text-2)' }}>{l.nome || '—'} {l.contato && <span style={{ color: 'var(--text-4)' }}>· {l.contato}</span>}</td>
                <td>
                  <select className="input" style={{ width: 'auto', padding: '0.25rem 1.8rem 0.25rem 0.55rem', fontSize: '0.76rem' }}
                    value={l.status} onChange={e => mudar(l, e.target.value)}>
                    {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm warn" onClick={() => remover(l)}><FaTrash size={10} /></button>
                </td>
              </tr>
            ))}
            {!filtrados.length && <Vazio msg="Nenhum lead — divulgue o site e eles aparecem aqui automaticamente." />}
          </tbody>
        </table>
      </div>
    </div>
  );
}
