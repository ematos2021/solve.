import { useState, useEffect } from 'react';
import { supabase, brl, dataBR, diasAte, hoje, nomeCurto, codigoOrcamento } from '../lib/supabase';
import { Kpi, Avatar } from '../components/ui';
import { useApp } from '../App';
import { FaArrowRight } from 'react-icons/fa';

// Central do dia: o que a equipe precisa ver ao abrir o painel.
export default function Dashboard({ onNavigate }) {
  const { session } = useApp();
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const mes = hoje().slice(0, 7);
      const [ass, lanc, tks, lds, cli, tarefas, orcs, mural] = await Promise.all([
        supabase.from('assinaturas').select('*, clientes(empresa)'),
        supabase.from('lancamentos').select('*').gte('data', mes + '-01'),
        supabase.from('tickets').select('id,numero,assunto,status,prioridade').in('status', ['aberto', 'em_atendimento']),
        supabase.from('leads').select('*').not('etapa', 'in', '("ganho","perdido")'),
        supabase.from('clientes').select('id').eq('status', 'ativo'),
        supabase.from('tarefas').select('*, resp:resp_id(nome)').neq('status', 'feito').order('prazo', { ascending: true, nullsFirst: false }),
        supabase.from('orcamentos').select('*, clientes(empresa), orcamento_itens(*)').in('status', ['rascunho', 'enviado']),
        supabase.from('mural').select('*, autor:autor_id(nome)').order('fixado', { ascending: false }).order('created_at', { ascending: false }).limit(4),
      ]);

      const assinaturas = ass.data || [];
      const ativas = assinaturas.filter(a => a.status === 'ativa' || a.status === 'trial');
      const mrr = assinaturas.filter(a => a.status === 'ativa').reduce((s, a) => s + Number(a.valor_mensal), 0);
      const vencendo = ativas.filter(a => { const dd = diasAte(a.vencimento); return dd != null && dd <= 30; })
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      const entradas = (lanc.data || []).filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
      const saidas = (lanc.data || []).filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0);
      const funil = (lds.data || []).reduce((s, l) => s + Number(l.valor_estimado || 0), 0);
      const minhas = (tarefas.data || []).filter(t => t.resp_id === session.user.id);

      setD({
        mrr, ativas: ativas.length, vencendo, entradas, saidas,
        tickets: tks.data || [], leads: lds.data || [], funil,
        clientes: (cli.data || []).length,
        tarefas: tarefas.data || [], minhas,
        orcs: orcs.data || [], mural: mural.data || [],
      });
    })();
  }, [session]);

  if (!d) return <p style={{ color: 'var(--text-3)' }}>Carregando…</p>;
  const resultado = d.entradas - d.saidas;
  const atrasadas = d.tarefas.filter(t => t.prazo && diasAte(t.prazo) < 0);

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.1rem' }}>Visão geral</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.8rem', marginBottom: '1.4rem' }}>
        <Kpi label="MRR" value={brl(d.mrr)} sub={`${d.ativas} assinatura(s) · ${d.clientes} cliente(s)`} />
        <Kpi label="Resultado do mês" value={brl(resultado)} tone={resultado >= 0 ? 'ok' : 'danger'} sub={`${brl(d.entradas)} in · ${brl(d.saidas)} out`} />
        <Kpi label="Funil de vendas" value={brl(d.funil)} sub={`${d.leads.length} lead(s) em aberto`} />
        <Kpi label="Propostas em aberto" value={d.orcs.length} tone={d.orcs.length ? 'warn' : undefined} />
        <Kpi label="Minhas tarefas" value={d.minhas.length} tone={atrasadas.some(t => t.resp_id === session.user.id) ? 'danger' : undefined} sub={`${d.tarefas.length} da equipe · ${atrasadas.length} atrasada(s)`} />
        <Kpi label="Chamados abertos" value={d.tickets.length} tone={d.tickets.some(t => t.prioridade === 'urgente') ? 'danger' : undefined} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <Painel titulo="Tarefas da equipe" acao={() => onNavigate('tarefas')}>
          {d.tarefas.slice(0, 6).map(t => {
            const dd = t.prazo ? diasAte(t.prazo) : null;
            return (
              <Linha key={t.id}
                a={<><Avatar perfil={t.resp} /> <strong style={{ marginLeft: 6 }}>{t.titulo}</strong></>}
                b={t.prazo
                  ? <span style={{ color: dd < 0 ? 'var(--danger)' : dd <= 2 ? 'var(--warn)' : 'var(--text-3)', fontWeight: 700, fontSize: '0.78rem' }}>
                      {dd < 0 ? `atrasada ${-dd}d` : dd === 0 ? 'hoje' : dataBR(t.prazo)}
                    </span>
                  : <span className="badge">{t.status === 'fazendo' ? 'fazendo' : 'a fazer'}</span>} />
            );
          })}
          {!d.tarefas.length && <VazioLinha msg="Nenhuma tarefa pendente. 👌" />}
        </Painel>

        <Painel titulo="Propostas em negociação" acao={() => onNavigate('orcamentos')}>
          {d.orcs.slice(0, 6).map(o => {
            const it = o.orcamento_itens || [];
            const mensal = it.filter(i => i.secao === 'mensal').reduce((s, i) => s + Number(i.qtd) * Number(i.valor_unit), 0);
            return (
              <Linha key={o.id}
                a={<><strong>{codigoOrcamento(o)}</strong> <span style={{ color: 'var(--text-3)' }}>· {o.clientes?.empresa || '—'}</span></>}
                b={<span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{mensal ? brl(mensal) + '/mês' : '—'}</span>} />
            );
          })}
          {!d.orcs.length && <VazioLinha msg="Nenhuma proposta em aberto." />}
        </Painel>

        <Painel titulo="Próximos vencimentos" acao={() => onNavigate('assinaturas')}>
          {d.vencendo.slice(0, 6).map(a => {
            const dd = diasAte(a.vencimento);
            return (
              <Linha key={a.id}
                a={<><strong>{a.clientes?.empresa || '—'}</strong> <span style={{ color: 'var(--text-3)' }}>· {a.produto}</span></>}
                b={<span style={{ color: dd < 0 ? 'var(--danger)' : dd <= 7 ? 'var(--warn)' : 'var(--text-2)', fontWeight: 700, fontSize: '0.8rem' }}>
                  {dd < 0 ? `vencida há ${-dd}d` : dd === 0 ? 'vence hoje' : `${dd}d · ${dataBR(a.vencimento)}`}
                </span>} />
            );
          })}
          {!d.vencendo.length && <VazioLinha msg="Nada vencendo nos próximos 30 dias." />}
        </Painel>

        <Painel titulo="Mural — últimas da equipe" acao={() => onNavigate('mural')}>
          {d.mural.map(p => (
            <Linha key={p.id}
              a={<><strong>{nomeCurto(p.autor)}</strong> <span style={{ color: 'var(--text-3)' }}>· {p.texto}</span></>}
              b={p.fixado ? <span className="badge warn">fixado</span> : null} />
          ))}
          {!d.mural.length && <VazioLinha msg="Sem publicações no mural." />}
        </Painel>

        <Painel titulo="Suporte aguardando" acao={() => onNavigate('tickets')}>
          {d.tickets.slice(0, 6).map(t => (
            <Linha key={t.id}
              a={<><strong>#{t.numero}</strong> {t.assunto}</>}
              b={<span className={`badge ${t.prioridade === 'urgente' ? 'danger' : t.prioridade === 'alta' ? 'warn' : ''}`}>{t.prioridade}</span>} />
          ))}
          {!d.tickets.length && <VazioLinha msg="Nenhum chamado aberto. 👌" />}
        </Painel>

        <Painel titulo="Follow-ups de prospecção" acao={() => onNavigate('prospeccao')}>
          {d.leads.filter(l => l.proxima_acao).sort((a, b) => a.proxima_acao.localeCompare(b.proxima_acao)).slice(0, 6).map(l => {
            const dd = diasAte(l.proxima_acao);
            return (
              <Linha key={l.id}
                a={<><strong>{l.empresa || l.nome || l.produto || '—'}</strong> <span style={{ color: 'var(--text-3)' }}>· {l.etapa}</span></>}
                b={<span style={{ color: dd < 0 ? 'var(--danger)' : dd <= 1 ? 'var(--warn)' : 'var(--text-3)', fontWeight: 700, fontSize: '0.78rem' }}>
                  {dd < 0 ? `atrasado ${-dd}d` : dd === 0 ? 'hoje' : dataBR(l.proxima_acao)}
                </span>} />
            );
          })}
          {!d.leads.some(l => l.proxima_acao) && <VazioLinha msg="Nenhum follow-up agendado." />}
        </Painel>
      </div>
    </div>
  );
}

const Painel = ({ titulo, acao, children }) => (
  <div className="card" style={{ padding: '1rem 1.1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.7rem' }}>
      <h2 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-3)' }}>{titulo}</h2>
      <button className="btn sm" style={{ marginLeft: 'auto', border: 'none' }} onClick={acao}><FaArrowRight size={10} /></button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
  </div>
);

const Linha = ({ a, b }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.86rem' }}>
    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>{a}</span>
    {b}
  </div>
);

const VazioLinha = ({ msg }) => <div style={{ padding: '1.2rem 0', color: 'var(--text-4)', fontSize: '0.82rem', textAlign: 'center' }}>{msg}</div>;
