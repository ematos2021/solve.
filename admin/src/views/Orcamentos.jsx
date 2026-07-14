import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase, brl, dataBR, hoje, codigoOrcamento } from '../lib/supabase';
import { Field, Vazio, Kpi } from '../components/ui';
import { CATALOGO, OBJETOS_SUGERIDOS } from '../data/catalogo';
import { FaPlus, FaPen, FaTrash, FaPrint, FaCopy, FaArrowLeft, FaSave } from 'react-icons/fa';

const STATUS = [
  { id: 'rascunho', label: 'Rascunho', cls: '' },
  { id: 'enviado', label: 'Enviado', cls: 'info' },
  { id: 'aprovado', label: 'Aprovado', cls: 'ok' },
  { id: 'rejeitado', label: 'Rejeitado', cls: 'danger' },
  { id: 'expirado', label: 'Expirado', cls: 'warn' },
];
const stInfo = (s) => STATUS.find(x => x.id === s) || STATUS[0];

const ITEM_NOVO = (secao) => ({ _key: Math.random(), secao, descricao: '', detalhe: '', qtd: 1, valor_unit: '' });
const NOVO = {
  cliente_id: '', contato: '', objeto: '', revisao: 0, data: hoje(), validade_dias: 60,
  desconto_pct: 0, status: 'rascunho',
  cond_pagamento: 'Subscrição mensal: 30 dias após aprovação da proposta.\nSetup / licenças: 100% em 30 dias, a partir da aprovação da proposta.',
  prazo_entrega: 'Até 15 dias, a partir da confirmação formal da proposta e da assinatura do contrato ou emissão da ordem de compra pelo cliente.',
  obs: '',
};

const totalItens = (itens, secao) => itens.filter(i => i.secao === secao)
  .reduce((s, i) => s + (Number(i.qtd) || 0) * (Number(i.valor_unit) || 0), 0);
const comDesconto = (v, pct) => v * (1 - (Number(pct) || 0) / 100);

// Orçamentos: propostas comerciais numeradas (PRO<ano>/<rev>/<seq>) com
// subscrição mensal + investimento único, desconto e impressão em PDF.
export default function Orcamentos() {
  const [lista, setLista] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [edit, setEdit] = useState(null);       // { orc, itens }
  const [printDoc, setPrintDoc] = useState(null);
  const [busy, setBusy] = useState(false);

  const carregar = useCallback(async () => {
    const [o, c] = await Promise.all([
      supabase.from('orcamentos').select('*, clientes(empresa), orcamento_itens(*)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, empresa, contato').order('empresa'),
    ]);
    setLista(o.data || []); setClientes(c.data || []);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const abrir = (o) => setEdit({
    orc: { ...o, clientes: undefined, orcamento_itens: undefined },
    itens: (o.orcamento_itens || []).sort((a, b) => a.ordem - b.ordem).map(i => ({ ...i, _key: i.id })),
  });

  // Nova proposta: se só existe um cliente (ex.: Mondial), já entra selecionado.
  const novo = () => {
    const unico = clientes.length === 1 ? clientes[0] : null;
    setEdit({
      orc: { ...NOVO, cliente_id: unico?.id || '', contato: unico?.contato ? `Sr(a). ${unico.contato}` : '' },
      itens: [],
    });
  };

  const salvar = async () => {
    const { orc, itens } = edit;
    if (!orc.cliente_id) return alert('Selecione o cliente.');
    setBusy(true);
    const { id, numero, created_at, updated_at, ...campos } = orc;
    campos.desconto_pct = Number(campos.desconto_pct) || 0;
    campos.validade_dias = Number(campos.validade_dias) || 60;
    campos.revisao = Number(campos.revisao) || 0;
    let orcId = id;
    if (id) await supabase.from('orcamentos').update(campos).eq('id', id);
    else {
      const { data, error } = await supabase.from('orcamentos').insert(campos).select('id').single();
      if (error) { setBusy(false); return alert('Erro ao salvar: ' + error.message); }
      orcId = data.id;
    }
    // Itens: apaga e regrava na ordem atual (simples e à prova de bugs de diff)
    await supabase.from('orcamento_itens').delete().eq('orcamento_id', orcId);
    const validos = itens.filter(i => i.descricao.trim());
    if (validos.length) {
      await supabase.from('orcamento_itens').insert(validos.map((i, idx) => ({
        orcamento_id: orcId, secao: i.secao, descricao: i.descricao, detalhe: i.detalhe || '',
        qtd: Number(i.qtd) || 1, valor_unit: Number(i.valor_unit) || 0, ordem: idx,
      })));
    }
    setBusy(false); setEdit(null); carregar();
  };

  // Nova revisão: duplica proposta + itens com revisao+1, volta a rascunho.
  const revisar = async (o) => {
    if (!confirm(`Criar a revisão ${String(o.revisao + 1).padStart(2, '0')} de ${codigoOrcamento(o)}?`)) return;
    const { id, numero, created_at, updated_at, clientes: _c, orcamento_itens, ...campos } = o;
    const { data, error } = await supabase.from('orcamentos')
      .insert({ ...campos, revisao: o.revisao + 1, data: hoje(), status: 'rascunho' }).select('id').single();
    if (error) return alert('Erro: ' + error.message);
    const itens = (orcamento_itens || []).map(({ id: _i, orcamento_id: _o, ...it }) => ({ ...it, orcamento_id: data.id }));
    if (itens.length) await supabase.from('orcamento_itens').insert(itens);
    carregar();
  };

  const mudarStatus = async (o, status) => {
    await supabase.from('orcamentos').update({ status }).eq('id', o.id);
    carregar();
  };

  const remover = async (o) => {
    if (!confirm(`Remover a proposta ${codigoOrcamento(o)}?`)) return;
    await supabase.from('orcamentos').delete().eq('id', o.id);
    carregar();
  };

  // KPIs
  const abertos = lista.filter(o => ['rascunho', 'enviado'].includes(o.status));
  const valorAberto = abertos.reduce((s, o) => {
    const it = o.orcamento_itens || [];
    return s + comDesconto(totalItens(it, 'mensal') * 12 + totalItens(it, 'unico'), o.desconto_pct);
  }, 0);
  const aprovados = lista.filter(o => o.status === 'aprovado').length;

  if (edit) return <Editor edit={edit} setEdit={setEdit} clientes={clientes} salvar={salvar} busy={busy} onPrint={() => setPrintDoc({ ...edit.orc, orcamento_itens: edit.itens, clientes: clientes.find(c => c.id === edit.orc.cliente_id) })} printDoc={printDoc} setPrintDoc={setPrintDoc} />;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Orçamentos</h1>
        <button className="btn solid" style={{ marginLeft: 'auto' }} onClick={novo}><FaPlus size={11} /> Nova proposta</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        <Kpi label="Em negociação" value={abertos.length} sub={`${brl(valorAberto)} (12 meses + setup)`} />
        <Kpi label="Aprovados" value={aprovados} tone="ok" />
        <Kpi label="Total de propostas" value={lista.length} />
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Código</th><th>Cliente</th><th>Objeto</th><th className="num">Mensal</th><th className="num">Setup</th><th>Data</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {lista.map(o => {
              const it = o.orcamento_itens || [];
              const mensal = comDesconto(totalItens(it, 'mensal'), o.desconto_pct);
              const unico = comDesconto(totalItens(it, 'unico'), o.desconto_pct);
              return (
                <tr key={o.id}>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{codigoOrcamento(o)}</td>
                  <td><strong>{o.clientes?.empresa || '—'}</strong>{o.contato && <div style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>{o.contato}</div>}</td>
                  <td style={{ color: 'var(--text-2)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.objeto || '—'}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{mensal ? brl(mensal) : '—'}</td>
                  <td className="num" style={{ fontWeight: 700 }}>{unico ? brl(unico) : '—'}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{dataBR(o.data)}</td>
                  <td>
                    <select className="input" style={{ width: 'auto', padding: '0.25rem 1.8rem 0.25rem 0.55rem', fontSize: '0.76rem' }}
                      value={o.status} onChange={e => mudarStatus(o, e.target.value)}>
                      {STATUS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    <button className="btn sm" title="Imprimir / PDF" style={{ marginRight: 4 }} onClick={() => setPrintDoc(o)}><FaPrint size={10} /></button>
                    <button className="btn sm" title="Nova revisão" style={{ marginRight: 4 }} onClick={() => revisar(o)}><FaCopy size={10} /></button>
                    <button className="btn sm" style={{ marginRight: 4 }} onClick={() => abrir(o)}><FaPen size={10} /></button>
                    <button className="btn sm warn" onClick={() => remover(o)}><FaTrash size={10} /></button>
                  </td>
                </tr>
              );
            })}
            {!lista.length && <Vazio msg="Nenhuma proposta ainda. Crie a primeira — ela sai numerada e pronta para PDF." />}
          </tbody>
        </table>
      </div>

      {printDoc && <PreviewProposta o={printDoc} onClose={() => setPrintDoc(null)} />}
    </div>
  );
}

/* ───────────────────────── Editor da proposta ───────────────────────── */

function Editor({ edit, setEdit, clientes, salvar, busy, onPrint, printDoc, setPrintDoc }) {
  const { orc, itens } = edit;
  const setOrc = (patch) => setEdit({ ...edit, orc: { ...orc, ...patch } });
  const setItem = (key, patch) => setEdit({ ...edit, itens: itens.map(i => i._key === key ? { ...i, ...patch } : i) });
  const addItem = (secao) => setEdit({ ...edit, itens: [...itens, ITEM_NOVO(secao)] });
  const delItem = (key) => setEdit({ ...edit, itens: itens.filter(i => i._key !== key) });

  // Adiciona um item do catálogo já preenchido (descrição, detalhe e preço)
  const addDoCatalogo = (secao, idx) => {
    if (idx === '') return;
    const c = CATALOGO[Number(idx)];
    setEdit({ ...edit, itens: [...itens, { _key: Math.random(), secao, descricao: c.descricao, detalhe: c.detalhe, qtd: 1, valor_unit: c.valor }] });
  };

  const escolherCliente = (id) => {
    const c = clientes.find(x => x.id === id);
    setOrc({ cliente_id: id, contato: orc.contato || c?.contato || '' });
  };

  const totMensal = totalItens(itens, 'mensal');
  const totUnico = totalItens(itens, 'unico');
  const pct = Number(orc.desconto_pct) || 0;

  // Chamada como função (não <Secao/>) para não remontar os inputs a cada tecla
  const secaoItens = ({ secao, titulo, hint }) => {
    const grupos = [...new Set(CATALOGO.filter(c => c.secao === secao).map(c => c.grupo))];
    return (
    <div className="card" style={{ padding: '1rem 1.1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-3)' }}>{titulo}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>{hint}</div>
        </div>
        <select className="input" style={{ marginLeft: 'auto', maxWidth: 340, fontSize: '0.8rem' }} value=""
          onChange={e => addDoCatalogo(secao, e.target.value)}>
          <option value="">＋ Adicionar do catálogo…</option>
          {grupos.map(g => (
            <optgroup key={g} label={g}>
              {CATALOGO.map((c, idx) => c.secao === secao && c.grupo === g
                ? <option key={idx} value={idx}>{c.descricao} — {brl(c.valor)}</option> : null)}
            </optgroup>
          ))}
        </select>
        <button className="btn sm" onClick={() => addItem(secao)}><FaPlus size={9} /> Em branco</button>
      </div>
      <table className="tbl">
        <thead><tr><th style={{ width: '38%' }}>Descrição</th><th>Detalhe</th><th className="num" style={{ width: 70 }}>Qtd</th><th className="num" style={{ width: 130 }}>Valor unit. (R$)</th><th className="num" style={{ width: 120 }}>Total</th><th style={{ width: 40 }}></th></tr></thead>
        <tbody>
          {itens.filter(i => i.secao === secao).map(i => (
            <tr key={i._key}>
              <td><input className="input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} value={i.descricao} onChange={e => setItem(i._key, { descricao: e.target.value })} placeholder="Ex.: Licenças QMS Premium — 30 licenças Staff" /></td>
              <td><input className="input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} value={i.detalhe} onChange={e => setItem(i._key, { detalhe: e.target.value })} placeholder="Perfil, tipo de acesso…" /></td>
              <td><input className="input num" type="number" min="0" step="1" style={{ fontSize: '0.82rem', padding: '0.4rem 0.5rem', textAlign: 'right' }} value={i.qtd} onChange={e => setItem(i._key, { qtd: e.target.value })} /></td>
              <td><input className="input" type="number" min="0" step="0.01" style={{ fontSize: '0.82rem', padding: '0.4rem 0.5rem', textAlign: 'right' }} value={i.valor_unit} onChange={e => setItem(i._key, { valor_unit: e.target.value })} /></td>
              <td className="num" style={{ fontWeight: 700 }}>{brl((Number(i.qtd) || 0) * (Number(i.valor_unit) || 0))}</td>
              <td><button className="btn sm warn" onClick={() => delItem(i._key)}><FaTrash size={9} /></button></td>
            </tr>
          ))}
          {!itens.some(i => i.secao === secao) && <Vazio msg="Sem itens — escolha no catálogo acima." />}
        </tbody>
      </table>
    </div>
  ); };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={() => setEdit(null)}><FaArrowLeft size={10} /> Voltar</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {orc.id ? `Proposta ${codigoOrcamento(orc)}` : 'Nova proposta'}
        </h1>
        <span className={`badge ${stInfo(orc.status).cls}`}>{stInfo(orc.status).label}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn" onClick={onPrint}><FaPrint size={11} /> Visualizar / PDF</button>
          <button className="btn solid" onClick={salvar} disabled={busy}><FaSave size={11} /> {busy ? 'Salvando…' : 'Salvar'}</button>
        </span>
      </div>

      {/* Cabeçalho da proposta */}
      <div className="card" style={{ padding: '1rem 1.1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
          <Field label="Cliente" span={2}>
            <select className="input" value={orc.cliente_id} onChange={e => escolherCliente(e.target.value)}>
              <option value="">Selecione…</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select>
          </Field>
          <Field label="A/C (contato)" span={2}><input className="input" value={orc.contato} onChange={e => setOrc({ contato: e.target.value })} placeholder="Sr(a). …" /></Field>
          <Field label="Objeto da proposta (clique para ver sugestões)" span={4}>
            <input className="input" list="objetos-sugeridos" value={orc.objeto} onChange={e => setOrc({ objeto: e.target.value })} placeholder="Escolha uma sugestão ou escreva…" />
            <datalist id="objetos-sugeridos">
              {OBJETOS_SUGERIDOS.map(o => <option key={o} value={o} />)}
            </datalist>
          </Field>
          <Field label="Data"><input className="input" type="date" value={orc.data} onChange={e => setOrc({ data: e.target.value })} /></Field>
          <Field label="Revisão"><input className="input" type="number" min="0" value={orc.revisao} onChange={e => setOrc({ revisao: e.target.value })} /></Field>
          <Field label="Validade (dias)"><input className="input" type="number" min="1" value={orc.validade_dias} onChange={e => setOrc({ validade_dias: e.target.value })} /></Field>
          <Field label="Desconto (%)"><input className="input" type="number" min="0" max="100" step="0.5" value={orc.desconto_pct} onChange={e => setOrc({ desconto_pct: e.target.value })} /></Field>
        </div>
      </div>

      {secaoItens({ secao: 'mensal', titulo: 'Subscrição mensal', hint: 'Valores recorrentes: licença de uso, cloud, SLA…' })}
      {secaoItens({ secao: 'unico', titulo: 'Investimento único (setup)', hint: 'Pagamentos únicos: licenças permanentes, implantação, treinamento…' })}

      {/* Totais */}
      <div className="card" style={{ padding: '1rem 1.1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
        <Kpi label="Total mensal" value={brl(comDesconto(totMensal, pct))} sub={pct ? `${brl(totMensal)} − ${pct}%` : 'recorrente'} />
        <Kpi label="Total setup" value={brl(comDesconto(totUnico, pct))} sub={pct ? `${brl(totUnico)} − ${pct}%` : 'pagamento único'} />
        <Kpi label="Contrato 12 meses" value={brl(comDesconto(totMensal * 12 + totUnico, pct))} sub="12× mensal + setup" tone="ok" />
      </div>

      {/* Condições */}
      <div className="card" style={{ padding: '1rem 1.1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <Field label="Condições de pagamento"><textarea className="input" rows={3} value={orc.cond_pagamento} onChange={e => setOrc({ cond_pagamento: e.target.value })} /></Field>
        <Field label="Prazo de entrega"><textarea className="input" rows={3} value={orc.prazo_entrega} onChange={e => setOrc({ prazo_entrega: e.target.value })} /></Field>
        <Field label="Observações (entram na proposta)" span={2}><textarea className="input" rows={2} value={orc.obs} onChange={e => setOrc({ obs: e.target.value })} /></Field>
      </div>

      {printDoc && <PreviewProposta o={printDoc} onClose={() => setPrintDoc(null)} />}
    </div>
  );
}

/* ─────────────── Documento da proposta (preview + impressão) ─────────────── */

function PreviewProposta({ o, onClose }) {
  const imprimir = () => window.print();
  return createPortal(
    <>
      {/* Preview na tela (layout em bloco: rolagem sempre funciona) */}
      <div onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(5,5,6,0.88)',
        overflowY: 'scroll', overscrollBehavior: 'contain', padding: '1.2rem',
      }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', gap: '0.6rem', margin: '0 auto 0.9rem', maxWidth: 820, justifyContent: 'flex-end' }}>
          <button className="btn" style={{ background: 'var(--bg-2)' }} onClick={onClose}>Fechar</button>
          <button className="btn solid" onClick={imprimir}><FaPrint size={11} /> Imprimir / Salvar PDF</button>
        </div>
        <div style={{ margin: '0 auto', maxWidth: 820, borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          <DocProposta o={o} />
        </div>
      </div>
      {/* Cópia dedicada à impressão (CSS .print-doc cuida do resto) */}
      <div className="print-doc"><DocProposta o={o} /></div>
    </>,
    document.body
  );
}

function DocProposta({ o }) {
  const itens = (o.orcamento_itens || []).filter(i => (i.descricao || '').trim())
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const mensais = itens.filter(i => i.secao === 'mensal');
  const unicos = itens.filter(i => i.secao === 'unico');
  const pct = Number(o.desconto_pct) || 0;
  const totMensal = totalItens(itens, 'mensal');
  const totUnico = totalItens(itens, 'unico');
  const empresa = o.clientes?.empresa || '—';
  const codigo = codigoOrcamento(o);

  // Identidade Solve: preto, cinza e branco. Sem cor de marca de terceiros.
  const PRETO = '#141416', TXT = '#1e1e21', CINZA = '#5a5a60', SUAVE = '#8c8c92', BORDA = '#d9d9dd';
  const cor = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };

  const S = {
    page: { background: '#fff', color: TXT, fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", fontSize: '12.5px', lineHeight: 1.6, ...cor },
    corpo: { padding: '18px 52px 24px' },
    sec: { fontSize: '13px', fontWeight: 800, color: PRETO, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 9px', paddingBottom: 5, borderBottom: '2px solid ' + PRETO },
    tbl: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', ...cor },
    th: { textAlign: 'left', background: '#f2f2f4', color: PRETO, fontWeight: 800, padding: '7px 10px', border: '1px solid ' + BORDA, ...cor },
    td: { padding: '7px 10px', border: '1px solid ' + BORDA, verticalAlign: 'top' },
    num: { textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
    tot: { fontWeight: 800, background: '#f7f7f8', ...cor },
    small: { fontSize: '11.5px', color: CINZA, whiteSpace: 'pre-wrap' },
  };

  // Bloco de seção: título + conteúdo viajam juntos na quebra de página
  const Secao = ({ titulo, children }) => (
    <div className="sec-bloco" style={{ marginTop: 26 }}>
      <div style={S.sec}>{titulo}</div>
      {children}
    </div>
  );

  const TabelaResumo = ({ titulo, its, total, pagto }) => !its.length ? null : (
    <table style={{ ...S.tbl, marginBottom: 14 }}>
      <thead>
        <tr>
          <th style={S.th}>{titulo}</th>
          <th style={{ ...S.th, width: 110 }}>Pagamento</th>
          <th style={{ ...S.th, ...S.num, width: 120 }}>Valor em R$</th>
        </tr>
      </thead>
      <tbody>
        {its.map((i, idx) => (
          <tr key={idx}>
            <td style={S.td}>{i.descricao}{Number(i.qtd) > 1 ? ' — ' + Number(i.qtd) + ' un.' : ''}</td>
            <td style={S.td}>{pagto}</td>
            <td style={{ ...S.td, ...S.num, fontWeight: 700 }}>{brl((Number(i.qtd) || 0) * (Number(i.valor_unit) || 0))}</td>
          </tr>
        ))}
        {pct > 0 && (
          <tr>
            <td colSpan={2} style={{ ...S.td, ...S.num, color: CINZA }}>Desconto comercial ({pct}%)</td>
            <td style={{ ...S.td, ...S.num, color: CINZA }}>− {brl(total * pct / 100)}</td>
          </tr>
        )}
        <tr>
          <td colSpan={2} style={{ ...S.td, ...S.num, ...S.tot }}>TOTAL — {pagto.toLowerCase()}</td>
          <td style={{ ...S.td, ...S.num, ...S.tot }}>{brl(comDesconto(total, pct))}</td>
        </tr>
      </tbody>
    </table>
  );

  const TabelaDetalhe = ({ titulo, its }) => !its.length ? null : (
    <table style={{ ...S.tbl, marginBottom: 16 }}>
      <thead>
        <tr>
          <th style={{ ...S.th, width: '42%' }}>{titulo}</th>
          <th style={S.th}>Detalhe</th>
          <th style={{ ...S.th, ...S.num, width: 48 }}>Qtd</th>
          <th style={{ ...S.th, ...S.num, width: 105 }}>Valor unit.</th>
          <th style={{ ...S.th, ...S.num, width: 105 }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {its.map((i, idx) => (
          <tr key={idx}>
            <td style={{ ...S.td, fontWeight: 600 }}>{i.descricao}</td>
            <td style={{ ...S.td, color: CINZA }}>{i.detalhe || '—'}</td>
            <td style={{ ...S.td, ...S.num }}>{Number(i.qtd) || 0}</td>
            <td style={{ ...S.td, ...S.num }}>{brl(i.valor_unit)}</td>
            <td style={{ ...S.td, ...S.num, fontWeight: 700 }}>{brl((Number(i.qtd) || 0) * (Number(i.valor_unit) || 0))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const Marca = () => (
    <div style={{ fontWeight: 800, fontSize: '21px', letterSpacing: '-0.6px', color: PRETO }}>
      solve<span style={{ color: SUAVE }}>.</span>
    </div>
  );

  return (
    <div style={S.page}>

      {/* ═══ CAPA — minimalista, preto e branco ═══ */}
      <div className="quebra-depois" style={{ position: 'relative', minHeight: '269mm', padding: '30px 52px', display: 'flex', flexDirection: 'column', ...cor }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Marca />
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: SUAVE, textTransform: 'uppercase', letterSpacing: '2px' }}>Soluções de gestão</span>
        </div>
        <div style={{ borderTop: '1px solid ' + BORDA, marginTop: 18 }} />

        <div style={{ marginTop: '32%' }}>
          <div style={{ width: 64, height: 7, background: PRETO, marginBottom: 26, ...cor }} />
          <div style={{ fontSize: '46px', fontWeight: 800, color: PRETO, letterSpacing: '-1.5px', lineHeight: 1.04 }}>PROPOSTA</div>
          <div style={{ fontSize: '46px', fontWeight: 300, color: CINZA, letterSpacing: '-1.5px', lineHeight: 1.04 }}>COMERCIAL</div>
          <div style={{ fontSize: '15px', color: TXT, marginTop: 20, fontWeight: 600 }}># {codigo}</div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ borderTop: '1px solid ' + BORDA, marginBottom: 16 }} />
          <div style={{ display: 'flex', fontSize: '13px' }}>
            <div>
              <div><strong>Revisão:</strong> {String(o.revisao ?? 0).padStart(2, '0')}</div>
              <div><strong>Data:</strong> {dataBR(o.data)}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', color: CINZA }}>
              <div>À <strong style={{ color: TXT }}>{empresa}</strong></div>
              {o.contato && <div>{o.contato}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTEÚDO ═══ */}
      <div style={S.corpo}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid ' + BORDA, paddingBottom: 10 }}>
          <Marca />
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: SUAVE }}># {codigo}</span>
        </div>

        <Secao titulo="1 · Objeto">
          <p style={{ margin: '0 0 8px' }}>{o.objeto || 'Fornecimento de solução de gestão para ' + empresa + '.'}</p>
          <p style={{ ...S.small, margin: 0 }}>
            A Solve desenvolve soluções de gestão sob medida para indústria e comércio — qualidade, produção,
            meio ambiente e atendimento — com implantação rápida, suporte próximo e evolução contínua.
            Nossas soluções operam 100% via web, com dados hospedados em nuvem segura e acesso de qualquer lugar.
          </p>
        </Secao>

        <Secao titulo="2 · Resumo da proposta">
          <p style={{ ...S.small, margin: '0 0 8px' }}>Nos valores apresentados estão inclusos todos os impostos incidentes, vigentes e aplicáveis.</p>
          <TabelaResumo titulo="Subscrição Mensal" its={mensais} total={totMensal} pagto="Mensal" />
          <TabelaResumo titulo="Investimento Inicial de Setup" its={unicos} total={totUnico} pagto="Único" />
        </Secao>

        {(mensais.length || unicos.length) ? (
          <Secao titulo="3 · Detalhamento da proposta">
            <p style={{ ...S.small, margin: '0 0 8px' }}>A seguir, as seções que discriminam os valores desta proposta.</p>
            <TabelaDetalhe titulo="Subscrição mensal" its={mensais} />
            <TabelaDetalhe titulo="Investimento único (setup)" its={unicos} />
          </Secao>
        ) : null}

        <Secao titulo="4 · Prazos de entrega">
          <table style={S.tbl}>
            <thead><tr><th style={{ ...S.th, width: 190 }}>Item</th><th style={S.th}>Prazo</th></tr></thead>
            <tbody><tr>
              <td style={{ ...S.td, fontWeight: 700 }}>Licenças, implantação e serviços</td>
              <td style={{ ...S.td, whiteSpace: 'pre-wrap' }}>{o.prazo_entrega}</td>
            </tr></tbody>
          </table>
        </Secao>

        <Secao titulo="5 · Condições de pagamento">
          <p style={{ ...S.small, margin: 0 }}>{o.cond_pagamento}</p>
          {o.obs && <p style={{ ...S.small, margin: '8px 0 0' }}><strong style={{ color: TXT }}>IMPORTANTE:</strong> {o.obs}</p>}
        </Secao>

        <Secao titulo="6 · Validade da proposta">
          <p style={{ ...S.small, margin: 0 }}>
            Esta proposta é válida por {o.validade_dias || 60} ({numeroPorExtenso(o.validade_dias || 60)}) dias, a partir da data de
            emissão, tornando nula toda e qualquer eventual proposta anterior.
          </p>
        </Secao>

        <Secao titulo="7 · Aceite da proposta">
          <p style={{ ...S.small, margin: '0 0 10px' }}>
            A presente proposta regulará a relação de prestação de serviços entre a Solve e {empresa} para
            todos os efeitos. Ao aceitar esta proposta, o cliente declara ter recebido, lido e aceito o objetivo e o
            escopo do projeto, os custos envolvidos, o prazo de implementação e o prazo de pagamentos.
          </p>
          <div style={{ fontSize: '11.5px', color: CINZA, lineHeight: 2 }}>
            Dados para faturamento:<br />
            Razão Social: ____________________________________________<br />
            CNPJ: ____________________________ &nbsp; I.E.: ____________________________<br />
            Endereço / CEP / Cidade / Estado: ____________________________________________<br />
            E-mail para envio da Nota Fiscal: ____________________________________________<br />
            Local e data: ____________________________________________
          </div>
          <div style={{ display: 'flex', gap: 48, marginTop: 44 }}>
            {[empresa, 'SOLVE'].map(p => (
              <div key={p} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid ' + SUAVE, paddingTop: 6, fontSize: '11px', fontWeight: 700 }}>{p}</div>
                <div style={{ fontSize: '10.5px', color: CINZA }}>Assinatura do representante legal</div>
              </div>
            ))}
          </div>
        </Secao>

        <div style={{ marginTop: 36, paddingTop: 10, borderTop: '1px solid ' + BORDA, fontSize: '10.5px', color: SUAVE, display: 'flex' }}>
          <span>Solve — Soluções de Gestão</span>
          <span style={{ marginLeft: 'auto' }}>Proposta {codigo} · rev. {String(o.revisao ?? 0).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}

// 30 → "trinta", 60 → "sessenta"… (para o texto de validade, como no modelo)
function numeroPorExtenso(n) {
  const mapa = { 15: 'quinze', 30: 'trinta', 45: 'quarenta e cinco', 60: 'sessenta', 90: 'noventa', 120: 'cento e vinte' };
  return mapa[n] || String(n);
}
