import { useState, useEffect } from 'react';
import { supabase, brl, dataBR, diasAte, hoje } from '../lib/supabase';
import { Kpi } from '../components/ui';
import { FaArrowRight } from 'react-icons/fa';

// Visão geral do negócio: MRR, vencimentos, caixa do mês, suporte e leads.
export default function Dashboard({ onNavigate }) {
  const [d, setD] = useState(null);

  useEffect(() => {
    (async () => {
      const mes = hoje().slice(0, 7);
      const [ass, lanc, tks, lds, cli] = await Promise.all([
        supabase.from('assinaturas').select('*, clientes(empresa)'),
        supabase.from('lancamentos').select('*').gte('data', mes + '-01'),
        supabase.from('tickets').select('id,numero,assunto,status,prioridade,created_at').in('status', ['aberto', 'em_atendimento']),
        supabase.from('leads').select('*').eq('status', 'novo').order('created_at', { ascending: false }),
        supabase.from('clientes').select('id').eq('status', 'ativo'),
      ]);
      const assinaturas = ass.data || [];
      const ativas = assinaturas.filter(a => a.status === 'ativa' || a.status === 'trial');
      const mrr = assinaturas.filter(a => a.status === 'ativa').reduce((s, a) => s + Number(a.valor_mensal), 0);
      const vencendo = ativas.filter(a => { const dd = diasAte(a.vencimento); return dd != null && dd <= 30; })
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      const entradas = (lanc.data || []).filter(l => l.tipo === 'entrada').reduce((s, l) => s + Number(l.valor), 0);
      const saidas = (lanc.data || []).filter(l => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0);
      setD({ mrr, ativas: ativas.length, vencendo, entradas, saidas, tickets: tks.data || [], leads: lds.data || [], clientes: (cli.data || []).length });
    })();
  }, []);

  if (!d) return <p style={{ color: 'var(--text-3)' }}>Carregando…</p>;
  const resultado = d.entradas - d.saidas;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.1rem' }}>Visão geral</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '0.8rem', marginBottom: '1.4rem' }}>
        <Kpi label="MRR (receita recorrente)" value={brl(d.mrr)} sub={`${d.ativas} assinatura(s) ativa(s)`} />
        <Kpi label="Resultado do mês" value={brl(resultado)} tone={resultado >= 0 ? 'ok' : 'danger'} sub={`${brl(d.entradas)} in · ${brl(d.saidas)} out`} />
        <Kpi label="Vencem em 30 dias" value={d.vencendo.length} tone={d.vencendo.length ? 'warn' : 'ok'} />
        <Kpi label="Chamados abertos" value={d.tickets.length} tone={d.tickets.some(t => t.prioridade === 'urgente') ? 'danger' : undefined} />
        <Kpi label="Leads novos" value={d.leads.length} sub={`${d.clientes} cliente(s) ativo(s)`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
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

        <Painel titulo="Suporte aguardando" acao={() => onNavigate('tickets')}>
          {d.tickets.slice(0, 6).map(t => (
            <Linha key={t.id}
              a={<><strong>#{t.numero}</strong> {t.assunto}</>}
              b={<span className={`badge ${t.prioridade === 'urgente' ? 'danger' : t.prioridade === 'alta' ? 'warn' : ''}`}>{t.prioridade}</span>} />
          ))}
          {!d.tickets.length && <VazioLinha msg="Nenhum chamado aberto. 👌" />}
        </Painel>

        <Painel titulo="Leads para contatar" acao={() => onNavigate('leads')}>
          {d.leads.slice(0, 6).map(l => (
            <Linha key={l.id}
              a={<><strong>{l.produto || 'geral'}</strong> <span style={{ color: 'var(--text-3)' }}>· {l.origem}</span></>}
              b={<span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>{dataBR(l.created_at)}</span>} />
          ))}
          {!d.leads.length && <VazioLinha msg="Sem leads novos no momento." />}
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
    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a}</span>
    {b}
  </div>
);

const VazioLinha = ({ msg }) => <div style={{ padding: '1.2rem 0', color: 'var(--text-4)', fontSize: '0.82rem', textAlign: 'center' }}>{msg}</div>;
