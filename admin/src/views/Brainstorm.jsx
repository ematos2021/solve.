import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, dtBR, nomeCurto } from '../lib/supabase';
import { Avatar } from '../components/ui';
import { useApp } from '../App';
import { FaArrowLeft, FaTrash, FaThumbsUp, FaCheckSquare, FaLightbulb } from 'react-icons/fa';

// As quatro lentes do brainstorm. Estrutura leve o bastante para não
// travar a conversa, e específica o bastante para a ideia sair do lugar.
const TIPOS = [
  { id: 'oportunidade', label: 'Oportunidades', dica: 'Por que isso pode dar muito certo?', acento: 'var(--ok)' },
  { id: 'risco', label: 'Riscos', dica: 'O que pode dar errado?', acento: 'var(--danger)' },
  { id: 'pergunta', label: 'Perguntas em aberto', dica: 'O que precisamos descobrir?', acento: 'var(--info)' },
  { id: 'passo', label: 'Próximos passos', dica: 'O que fazemos primeiro?', acento: 'var(--warn)' },
];
const REACOES = ['👍', '🔥', '🤔'];

export default function Brainstorm({ ideia, onBack, onMudou }) {
  const { session } = useApp();
  const uid = session.user.id;
  const [notas, setNotas] = useState([]);
  const [rapida, setRapida] = useState({});
  const [votos, setVotos] = useState(ideia.votos);
  const [status, setStatus] = useState(ideia.status);

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('ideia_notas')
      .select('*, autor:autor_id(nome)').eq('ideia_id', ideia.id).order('created_at');
    setNotas(data || []);
  }, [ideia.id]);
  useEffect(() => { carregar(); }, [carregar]);

  // Quem já contribuiu (avatares empilhados no topo)
  const participantes = useMemo(() => {
    const vistos = new Map();
    notas.forEach(n => { if (n.autor_id && !vistos.has(n.autor_id)) vistos.set(n.autor_id, n.autor); });
    return [...vistos.values()];
  }, [notas]);

  const addNota = async (tipo) => {
    const texto = (rapida[tipo] || '').trim();
    if (!texto) return;
    setRapida({ ...rapida, [tipo]: '' });
    await supabase.from('ideia_notas').insert({ ideia_id: ideia.id, tipo, texto, autor_id: uid, reacoes: {} });
    carregar();
  };

  const delNota = async (n) => {
    if (!confirm('Remover esta nota?')) return;
    await supabase.from('ideia_notas').delete().eq('id', n.id);
    carregar();
  };

  // Reação é um toggle: entra ou sai da lista daquele emoji.
  const reagir = async (n, emoji) => {
    const r = { ...(n.reacoes || {}) };
    const lista = r[emoji] || [];
    r[emoji] = lista.includes(uid) ? lista.filter(x => x !== uid) : [...lista, uid];
    if (!r[emoji].length) delete r[emoji];
    setNotas(notas.map(x => x.id === n.id ? { ...x, reacoes: r } : x));  // resposta instantânea
    await supabase.from('ideia_notas').update({ reacoes: r }).eq('id', n.id);
  };

  // O pulo do gato: um "próximo passo" vira tarefa de verdade no kanban.
  const virarTarefa = async (n) => {
    if (!confirm(`Criar a tarefa "${n.texto}" e atribuir a você?`)) return;
    await supabase.from('tarefas').insert({
      titulo: n.texto,
      descricao: `Veio do brainstorm da ideia: ${ideia.titulo}`,
      status: 'a_fazer', prioridade: 'normal', resp_id: uid, criador_id: uid,
    });
    alert('Tarefa criada! Ela está em Tarefas → A fazer.');
  };

  const votar = async () => {
    const v = votos + 1;
    setVotos(v);
    await supabase.from('ideias').update({ votos: v }).eq('id', ideia.id);
    onMudou?.();
  };

  const mudarStatus = async (s) => {
    setStatus(s);
    await supabase.from('ideias').update({ status: s }).eq('id', ideia.id);
    onMudou?.();
  };

  return (
    <div className="fade-in">
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={onBack}><FaArrowLeft size={10} /> Ideias</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaLightbulb size={14} style={{ color: 'var(--warn)' }} /> {ideia.titulo}
        </h1>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="input" style={{ width: 'auto', padding: '0.3rem 1.9rem 0.3rem 0.6rem', fontSize: '0.8rem' }}
            value={status} onChange={e => mudarStatus(e.target.value)}>
            <option value="nova">Nova</option><option value="avaliando">Em avaliação</option>
            <option value="aprovada">Aprovada</option><option value="em_execucao">Em execução</option>
            <option value="concluida">Concluída</option><option value="descartada">Descartada</option>
          </select>
          <button className="btn sm" onClick={votar}><FaThumbsUp size={10} /> {votos}</button>
        </span>
      </div>

      {/* Contexto + termômetro discreto de participação */}
      <div className="card" style={{ padding: '0.9rem 1.05rem', marginBottom: '1.1rem', display: 'flex', gap: '1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>
            {ideia.categoria} · por {nomeCurto(ideia.autor)}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-2)' }}>{ideia.descricao || 'Sem descrição — use as notas abaixo para desenvolver a ideia.'}</div>
        </div>
        <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'center' }}>
          <Stat n={notas.length} label={notas.length === 1 ? 'nota' : 'notas'} />
          <Stat n={notas.filter(n => n.tipo === 'passo').length} label="passos" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex' }}>
              {participantes.map((p, i) => (
                <span key={i} style={{ marginLeft: i ? -7 : 0 }}><Avatar perfil={p} /></span>
              ))}
              {!participantes.length && <span style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>ninguém ainda</span>}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>na conversa</div>
          </div>
        </div>
      </div>

      {/* Quadro de notas */}
      <div className="kanban">
        {TIPOS.map(t => {
          const doTipo = notas.filter(n => n.tipo === t.id);
          return (
            <div key={t.id} className="kanban-col">
              <div className="kanban-head" style={{ paddingBottom: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: t.acento, display: 'inline-block' }} />
                {t.label} <span className="kanban-count">{doTipo.length}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-4)', padding: '0 0.3rem 0.6rem' }}>{t.dica}</div>

              {doTipo.map(n => (
                <div key={n.id} className="nota fade-in" style={{ '--acento': t.acento }}>
                  <div style={{ color: 'var(--text)', marginBottom: '0.45rem' }}>{n.texto}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {REACOES.map(e => {
                      const quem = n.reacoes?.[e] || [];
                      const eu = quem.includes(uid);
                      return (
                        <button key={e} className={`reacao ${eu ? 'on' : ''}`} onClick={() => reagir(n, e)}
                          title={quem.length ? `${quem.length} reação(ões)` : 'Reagir'}>
                          {e}{quem.length > 0 && <span>{quem.length}</span>}
                        </button>
                      );
                    })}
                    <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {t.id === 'passo' && (
                        <button className="btn sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.66rem' }}
                          title="Transformar em tarefa" onClick={() => virarTarefa(n)}>
                          <FaCheckSquare size={9} /> tarefa
                        </button>
                      )}
                      {n.autor_id === uid && (
                        <button className="btn sm warn" style={{ padding: '0.15rem 0.35rem' }} onClick={() => delNota(n)}><FaTrash size={8} /></button>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: '0.45rem', fontSize: '0.64rem', color: 'var(--text-4)' }}>
                    <Avatar perfil={n.autor} /> {nomeCurto(n.autor)} · {dtBR(n.created_at)}
                  </div>
                </div>
              ))}

              <form onSubmit={e => { e.preventDefault(); addNota(t.id); }}>
                <input className="input" style={{ fontSize: '0.8rem', padding: '0.45rem 0.7rem' }}
                  placeholder="+ escreva e dê Enter…"
                  value={rapida[t.id] || ''} onChange={e => setRapida({ ...rapida, [t.id]: e.target.value })} />
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Stat = ({ n, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
    <div style={{ fontSize: '0.62rem', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
  </div>
);
