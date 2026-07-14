import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, brl, dataBR, dtBR, diasAte } from '../lib/supabase';
import { Modal, Field, Acoes, Avatar, Kpi } from '../components/ui';
import { useApp } from '../App';
import { FaPlus, FaPen, FaTrash, FaArrowRight, FaWhatsapp, FaUserPlus } from 'react-icons/fa';

const ETAPAS = [
  { id: 'novo', label: 'Novo' },
  { id: 'contatado', label: 'Contatado' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'proposta', label: 'Proposta' },
  { id: 'ganho', label: 'Ganho 🏆' },
  { id: 'perdido', label: 'Perdido' },
];
const NOVO = { nome: '', empresa: '', contato: '', produto: '', origem: 'manual', etapa: 'novo', valor_estimado: '', proxima_acao: '', nota: '', resp_id: '' };

// Funil de prospecção: leads do site caem em "Novo"; os sócios trabalham o funil.
export default function Prospeccao() {
  const { equipe } = useApp();
  const [lista, setLista] = useState([]);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mostrarPerdidos, setMostrarPerdidos] = useState(false);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('leads').select('*, resp:resp_id(nome)')
      .order('created_at', { ascending: false });
    setLista(data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const emAberto = useMemo(() => lista.filter(l => !['ganho', 'perdido'].includes(l.etapa)), [lista]);
  const valorFunil = emAberto.reduce((s, l) => s + Number(l.valor_estimado || 0), 0);
  const ganhos = lista.filter(l => l.etapa === 'ganho');
  const taxa = lista.length ? Math.round(ganhos.length / lista.length * 100) : 0;
  const acaoAtrasada = emAberto.filter(l => l.proxima_acao && diasAte(l.proxima_acao) < 0).length;

  const colunas = ETAPAS.filter(e => mostrarPerdidos || e.id !== 'perdido');

  const salvar = async () => {
    if (!edit.empresa.trim() && !edit.nome.trim()) return alert('Informe a empresa ou o nome do contato.');
    setBusy(true);
    const { id, created_at, resp: _r, status, ...campos } = edit;
    campos.valor_estimado = Number(campos.valor_estimado) || 0;
    campos.proxima_acao = campos.proxima_acao || null;
    campos.resp_id = campos.resp_id || null;
    if (id) await supabase.from('leads').update(campos).eq('id', id);
    else await supabase.from('leads').insert(campos);
    setBusy(false); setEdit(null); carregar();
  };

  const mudarEtapa = async (l, etapa) => {
    await supabase.from('leads').update({ etapa }).eq('id', l.id);
    carregar();
  };

  const remover = async (l) => {
    if (!confirm('Remover este lead do funil?')) return;
    await supabase.from('leads').delete().eq('id', l.id);
    carregar();
  };

  // Ganhou: vira cliente na carteira comercial e marca a etapa.
  const converter = async (l) => {
    const empresa = l.empresa || l.nome || 'Novo cliente';
    if (!confirm(`Marcar como GANHO e criar o cliente "${empresa}"?`)) return;
    await supabase.from('clientes').insert({
      empresa, contato: l.nome || '', whatsapp: (l.contato || '').replace(/\D/g, '').length >= 10 ? l.contato : '',
      email: (l.contato || '').includes('@') ? l.contato : '',
      obs: `Origem: prospecção (${l.origem})${l.produto ? ' · interesse: ' + l.produto : ''}`, status: 'ativo',
    });
    await supabase.from('leads').update({ etapa: 'ganho', status: 'convertido' }).eq('id', l.id);
    carregar();
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Prospecção</h1>
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-3)', cursor: 'pointer' }}>
          <input type="checkbox" checked={mostrarPerdidos} onChange={e => setMostrarPerdidos(e.target.checked)} /> mostrar perdidos
        </label>
        <button className="btn solid" onClick={() => setEdit({ ...NOVO })}><FaPlus size={11} /> Novo lead</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '0.8rem', marginBottom: '1.1rem' }}>
        <Kpi label="Valor no funil" value={brl(valorFunil)} sub={`${emAberto.length} lead(s) em aberto`} />
        <Kpi label="Ganhos" value={ganhos.length} tone="ok" sub={`${taxa}% de conversão`} />
        <Kpi label="Ações atrasadas" value={acaoAtrasada} tone={acaoAtrasada ? 'danger' : 'ok'} sub="follow-ups vencidos" />
      </div>

      <div className="kanban">
        {colunas.map(col => {
          const doCol = lista.filter(l => l.etapa === col.id);
          const valor = doCol.reduce((s, l) => s + Number(l.valor_estimado || 0), 0);
          return (
            <div key={col.id} className="kanban-col" style={{ minWidth: 215 }}>
              <div className="kanban-head">
                {col.label} <span className="kanban-count">{doCol.length}{valor > 0 ? ` · ${brl(valor)}` : ''}</span>
              </div>
              {doCol.map(l => {
                const d = l.proxima_acao ? diasAte(l.proxima_acao) : null;
                const proxIdx = ETAPAS.findIndex(e => e.id === l.etapa) + 1;
                const prox = ETAPAS[proxIdx];
                return (
                  <div key={l.id} className="kanban-card">
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.empresa || l.nome || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
                          {l.nome && l.empresa ? l.nome + ' · ' : ''}{l.produto || 'geral'} · {l.origem}
                        </div>
                      </div>
                      <Avatar perfil={l.resp} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: '0.74rem' }}>
                      {Number(l.valor_estimado) > 0 && <span style={{ fontWeight: 700 }}>{brl(l.valor_estimado)}</span>}
                      {l.proxima_acao && (
                        <span style={{ fontWeight: 700, color: d < 0 ? 'var(--danger)' : d <= 1 ? 'var(--warn)' : 'var(--text-3)' }}>
                          {d < 0 ? `ação atrasada ${-d}d` : d === 0 ? 'ação hoje' : `próx.: ${dataBR(l.proxima_acao)}`}
                        </span>
                      )}
                      <span style={{ color: 'var(--text-4)', marginLeft: 'auto' }}>{dtBR(l.created_at)}</span>
                    </div>
                    {l.nota && <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: 4 }}>{l.nota}</div>}
                    <div style={{ display: 'flex', gap: 3, marginTop: '0.55rem', flexWrap: 'wrap' }}>
                      {(l.contato || '').replace(/\D/g, '').length >= 10 && (
                        <a className="btn sm" href={`https://wa.me/55${l.contato.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><FaWhatsapp size={10} /></a>
                      )}
                      {!['ganho', 'perdido'].includes(l.etapa) && (
                        <button className="btn sm" title="Marcar ganho e criar cliente" onClick={() => converter(l)}><FaUserPlus size={10} /> ganhou</button>
                      )}
                      {prox && prox.id !== 'perdido' && !['ganho', 'perdido'].includes(l.etapa) && (
                        <button className="btn sm" title={`Avançar para ${prox.label}`} onClick={() => mudarEtapa(l, prox.id)}><FaArrowRight size={9} /></button>
                      )}
                      <span style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                        <button className="btn sm" onClick={() => setEdit({ ...l, valor_estimado: l.valor_estimado || '', proxima_acao: l.proxima_acao || '', resp_id: l.resp_id || '' })}><FaPen size={9} /></button>
                        <button className="btn sm warn" onClick={() => remover(l)}><FaTrash size={9} /></button>
                      </span>
                    </div>
                  </div>
                );
              })}
              {!doCol.length && <div style={{ padding: '0.9rem 0.3rem', fontSize: '0.76rem', color: 'var(--text-4)', textAlign: 'center' }}>Vazio.</div>}
            </div>
          );
        })}
      </div>

      {edit && (
        <Modal titulo={edit.id ? 'Editar lead' : 'Novo lead'} onClose={() => setEdit(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Empresa"><input className="input" value={edit.empresa || ''} onChange={e => setEdit({ ...edit, empresa: e.target.value })} autoFocus /></Field>
            <Field label="Pessoa de contato"><input className="input" value={edit.nome || ''} onChange={e => setEdit({ ...edit, nome: e.target.value })} /></Field>
            <Field label="Telefone / e-mail"><input className="input" value={edit.contato || ''} onChange={e => setEdit({ ...edit, contato: e.target.value })} /></Field>
            <Field label="Produto de interesse"><input className="input" value={edit.produto || ''} onChange={e => setEdit({ ...edit, produto: e.target.value })} placeholder="PRIME, GOqualy…" /></Field>
            <Field label="Etapa">
              <select className="input" value={edit.etapa} onChange={e => setEdit({ ...edit, etapa: e.target.value })}>
                {ETAPAS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Valor estimado (R$/mês)"><input className="input" type="number" step="0.01" value={edit.valor_estimado} onChange={e => setEdit({ ...edit, valor_estimado: e.target.value })} /></Field>
            <Field label="Próxima ação em"><input className="input" type="date" value={edit.proxima_acao} onChange={e => setEdit({ ...edit, proxima_acao: e.target.value })} /></Field>
            <Field label="Responsável">
              <select className="input" value={edit.resp_id} onChange={e => setEdit({ ...edit, resp_id: e.target.value })}>
                <option value="">—</option>
                {equipe.map(p => <option key={p.user_id} value={p.user_id}>{p.nome || p.user_id.slice(0, 6)}</option>)}
              </select>
            </Field>
            <Field label="Anotações" span={2}><textarea className="input" rows={2} value={edit.nota || ''} onChange={e => setEdit({ ...edit, nota: e.target.value })} placeholder="Contexto da negociação, objeções, combinados…" /></Field>
          </div>
          <Acoes onCancel={() => setEdit(null)} onOk={salvar} busy={busy} />
        </Modal>
      )}
    </div>
  );
}
