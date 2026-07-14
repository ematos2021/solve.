// ─────────────────────────────────────────────────────────────────
// MODO DEMO — cliente Supabase falso com dados de exemplo.
// Ativo quando admin/.env não está configurado. Tudo roda no
// navegador (localStorage), para trabalhar no front-end sem backend.
// Ao preencher o .env, o app troca sozinho para o Supabase real.
// ─────────────────────────────────────────────────────────────────

const LS_KEY = 'solve-demo-db-v1';

const EU = 'demo-eugenio', RA = 'demo-rafael', MA = 'demo-marina';
export const DEMO_USER = { id: EU, email: 'eugeniomatos10@gmail.com' };

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2));
const agora = () => new Date().toISOString();
// Data ISO deslocada N dias de hoje (para o demo sempre parecer vivo)
const dia = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const ts = (n, h = 10) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 15, 0, 0); return d.toISOString(); };
// Dia do mês corrente (clampado para não cair no mês anterior)
const noMes = (offset) => { const d = new Date(); d.setDate(Math.max(1, d.getDate() - offset)); return d.toISOString().slice(0, 10); };

function seed() {
  const cMondial = 'cli-mondial', cMetal = 'cli-metalurgica', cFarma = 'cli-farmalab';
  const oMondial = 'orc-mondial', oFarma = 'orc-farmalab';
  const tk1 = 'tk-101', tk2 = 'tk-102';

  return {
    profiles: [
      { user_id: EU, nome: 'Eugênio Matos', empresa: 'Solve', telefone: '', role: 'admin', created_at: ts(-90) },
      { user_id: RA, nome: 'Rafael Souza', empresa: 'Solve', telefone: '', role: 'admin', created_at: ts(-90) },
      { user_id: MA, nome: 'Marina Costa', empresa: 'Solve', telefone: '', role: 'admin', created_at: ts(-90) },
    ],
    clientes: [
      { id: cMondial, empresa: 'MK Eletrodomésticos Mondial S.A.', contato: 'Sara Feitosa', email: 'sara.feitosa@mondial.com.br', whatsapp: '71998765432', obs: 'Conta estratégica — upgrade de licenciamento em negociação', status: 'ativo', created_at: ts(-200) },
      { id: cMetal, empresa: 'Metalúrgica Andrade Ltda', contato: 'Carlos Andrade', email: 'carlos@metandrade.com.br', whatsapp: '47991234567', obs: '', status: 'ativo', created_at: ts(-120) },
      { id: cFarma, empresa: 'Farmalab Indústria Farmacêutica', contato: 'Juliana Reis', email: 'juliana.reis@farmalab.ind.br', whatsapp: '11987654321', obs: 'Em fase de proposta de implantação', status: 'prospecto', created_at: ts(-15) },
    ],
    assinaturas: [
      { id: uid(), cliente_id: cMondial, produto: 'PRIME', valor_mensal: 4800, inicio: dia(-200), vencimento: dia(12), status: 'ativa', obs: '', created_at: ts(-200) },
      { id: uid(), cliente_id: cMondial, produto: 'GOqualy', valor_mensal: 2400, inicio: dia(-90), vencimento: dia(12), status: 'ativa', obs: '', created_at: ts(-90) },
      { id: uid(), cliente_id: cMetal, produto: 'EasyOEE', valor_mensal: 1900, inicio: dia(-120), vencimento: dia(5), status: 'ativa', obs: '', created_at: ts(-120) },
      { id: uid(), cliente_id: cMetal, produto: 'SGA', valor_mensal: 850, inicio: dia(-60), vencimento: dia(-3), status: 'atrasada', obs: 'Boleto reenviado dia ' + dia(-1).slice(8), created_at: ts(-60) },
      { id: uid(), cliente_id: cFarma, produto: 'GOqualy', valor_mensal: 2600, inicio: dia(-10), vencimento: dia(20), status: 'trial', obs: 'Trial de 30 dias', created_at: ts(-10) },
    ],
    lancamentos: [
      { id: uid(), tipo: 'entrada', categoria: 'Assinatura', descricao: 'Mensalidade PRIME + GOqualy', valor: 7200, data: noMes(6), cliente_id: cMondial, created_at: agora() },
      { id: uid(), tipo: 'entrada', categoria: 'Assinatura', descricao: 'Mensalidade EasyOEE', valor: 1900, data: noMes(4), cliente_id: cMetal, created_at: agora() },
      { id: uid(), tipo: 'entrada', categoria: 'Serviço avulso', descricao: 'Treinamento equipe qualidade', valor: 1500, data: noMes(2), cliente_id: cFarma, created_at: agora() },
      { id: uid(), tipo: 'saida', categoria: 'Infraestrutura', descricao: 'Cloud (AWS + Supabase)', valor: 380, data: noMes(7), cliente_id: null, created_at: agora() },
      { id: uid(), tipo: 'saida', categoria: 'Ferramentas', descricao: 'Licenças de software', valor: 220, data: noMes(5), cliente_id: null, created_at: agora() },
      { id: uid(), tipo: 'saida', categoria: 'Marketing', descricao: 'Anúncios Google', valor: 600, data: noMes(3), cliente_id: null, created_at: agora() },
      { id: uid(), tipo: 'saida', categoria: 'Pró-labore', descricao: 'Pró-labore sócios', valor: 4500, data: noMes(1), cliente_id: null, created_at: agora() },
    ],
    leads: [
      { id: uid(), nome: 'Roberto Lima', empresa: 'Indústria Bela Vista', contato: '47999887766', produto: 'EasyOEE', origem: 'site', status: 'novo', etapa: 'novo', valor_estimado: 1800, proxima_acao: null, nota: 'Clicou em "Quero esta solução" na página do EasyOEE.', resp_id: null, created_at: ts(-1, 16) },
      { id: uid(), nome: 'Ana Paula', empresa: 'Padaria Pão & Prosa', contato: 'anapaula@paoeprosa.com.br', produto: 'SIG Comércio', origem: 'site', status: 'novo', etapa: 'novo', valor_estimado: 450, proxima_acao: null, nota: '', resp_id: null, created_at: ts(0, 8) },
      { id: uid(), nome: 'Sérgio Rocha', empresa: 'Transportadora Rocha', contato: '11976543210', produto: 'PRIME', origem: 'indicação', status: 'contatado', etapa: 'contatado', valor_estimado: 3200, proxima_acao: dia(2), nota: 'Indicação do Carlos (Metalúrgica). Quer ver demonstração.', resp_id: RA, created_at: ts(-4) },
      { id: uid(), nome: 'Juliana Reis', empresa: 'Farmalab Indústria Farmacêutica', contato: '11987654321', produto: 'GOqualy', origem: 'manual', status: 'contatado', etapa: 'reuniao', valor_estimado: 3000, proxima_acao: dia(1), nota: 'Reunião de diagnóstico feita. Apresentar proposta PRO/1671.', resp_id: EU, created_at: ts(-12) },
      { id: uid(), nome: 'Sara Feitosa', empresa: 'MK Eletrodomésticos Mondial S.A.', contato: '71998765432', produto: 'Upgrade licenciamento', origem: 'manual', status: 'contatado', etapa: 'proposta', valor_estimado: 11070, proxima_acao: dia(-1), nota: 'Proposta PRO/1670 enviada. Follow-up com a Sara atrasado!', resp_id: EU, created_at: ts(-8) },
      { id: uid(), nome: 'Carlos Andrade', empresa: 'Metalúrgica Andrade Ltda', contato: '47991234567', produto: 'EasyOEE', origem: 'site', status: 'convertido', etapa: 'ganho', valor_estimado: 1900, proxima_acao: null, nota: 'Fechou EasyOEE + SGA.', resp_id: RA, created_at: ts(-130) },
      { id: uid(), nome: 'Marcos', empresa: 'Mercadinho União', contato: '48988776655', produto: 'SIG Comércio', origem: 'site', status: 'descartado', etapa: 'perdido', valor_estimado: 350, proxima_acao: null, nota: 'Achou caro. Voltar a contatar em 6 meses.', resp_id: MA, created_at: ts(-25) },
    ],
    tarefas: [
      { id: uid(), titulo: 'Follow-up da proposta de upgrade Mondial', descricao: 'Ligar para a Sara e validar dúvidas sobre as 30 licenças adicionais.', status: 'fazendo', prioridade: 'urgente', prazo: dia(-1), resp_id: EU, criador_id: EU, cliente_id: cMondial, done_at: null, created_at: ts(-3) },
      { id: uid(), titulo: 'Preparar kickoff da implantação Farmalab', descricao: 'Agenda, cronograma macro e checklist de acessos.', status: 'a_fazer', prioridade: 'alta', prazo: dia(3), resp_id: EU, criador_id: MA, cliente_id: cFarma, done_at: null, created_at: ts(-2) },
      { id: uid(), titulo: 'Módulo de relatórios do EasyOEE v2.4', descricao: 'Exportação em PDF e agendamento por e-mail.', status: 'fazendo', prioridade: 'alta', prazo: dia(7), resp_id: RA, criador_id: RA, cliente_id: null, done_at: null, created_at: ts(-6) },
      { id: uid(), titulo: 'Atualizar site: casos de sucesso', descricao: 'Depoimento da Metalúrgica Andrade + prints novos.', status: 'a_fazer', prioridade: 'normal', prazo: dia(10), resp_id: MA, criador_id: EU, cliente_id: null, done_at: null, created_at: ts(-1) },
      { id: uid(), titulo: 'Cobrar boleto atrasado SGA — Metalúrgica', descricao: '', status: 'a_fazer', prioridade: 'alta', prazo: dia(0), resp_id: MA, criador_id: MA, cliente_id: cMetal, done_at: null, created_at: ts(0, 9) },
      { id: uid(), titulo: 'Emitir notas fiscais das assinaturas', descricao: '', status: 'feito', prioridade: 'normal', prazo: dia(-2), resp_id: MA, criador_id: MA, cliente_id: null, done_at: ts(-2, 17), created_at: ts(-5) },
      { id: uid(), titulo: 'Reunião de diagnóstico Farmalab', descricao: 'Mapear processos de qualidade atuais.', status: 'feito', prioridade: 'alta', prazo: dia(-4), resp_id: EU, criador_id: EU, cliente_id: cFarma, done_at: ts(-4, 16), created_at: ts(-12) },
    ],
    ideias: [
      { id: uid(), titulo: 'Automatizar cobrança via Pix recorrente', descricao: 'Gerar cobrança automática no vencimento e baixar o lançamento no caixa sozinho.', categoria: 'Processo interno', status: 'em_execucao', votos: 4, autor_id: MA, created_at: ts(-20) },
      { id: uid(), titulo: 'Painel do cliente com indicadores em tempo real', descricao: 'Cada cliente vê os próprios KPIs (OEE, não conformidades) direto no portal.', categoria: 'Produto', status: 'avaliando', votos: 3, autor_id: RA, created_at: ts(-9) },
      { id: uid(), titulo: 'Plano anual com 2 meses de desconto', descricao: 'Melhora caixa e reduz churn. Testar na renovação da Metalúrgica.', categoria: 'Comercial', status: 'aprovada', votos: 2, autor_id: EU, created_at: ts(-14) },
      { id: uid(), titulo: 'Programa de indicação entre clientes', descricao: '10% de desconto por indicação convertida (caso Transportadora Rocha veio assim).', categoria: 'Marketing', status: 'nova', votos: 1, autor_id: MA, created_at: ts(-2) },
    ],
    mural: [
      { id: uid(), autor_id: EU, texto: 'Prioridade da semana: fechar o upgrade da Mondial. 🏆\nProposta PRO2026/00/1670 enviada — follow-up com a Sara é amanhã. Qualquer contato dela, me avisem.', fixado: true, created_at: ts(-2, 9) },
      { id: uid(), autor_id: RA, texto: 'Subi a v2.4 do EasyOEE em homologação. Testem os relatórios novos antes de sexta, por favor.', fixado: false, created_at: ts(-1, 14) },
      { id: uid(), autor_id: MA, texto: 'Caixa do mês fechado e conferido ✅ Resultado positivo — detalhes no Fluxo de caixa. Falta só o boleto atrasado da Metalúrgica (SGA).', fixado: false, created_at: ts(0, 8) },
    ],
    orcamentos: [
      {
        id: oMondial, numero: 1670, cliente_id: cMondial, contato: 'Sr(a). Sara Feitosa',
        objeto: 'Upgrade de licenciamento: 30 licenças adicionais Staff (nominativas) e ampliação da infraestrutura em nuvem para 130 usuários.',
        revisao: 0, data: dia(-2), validade_dias: 60, desconto_pct: 0,
        cond_pagamento: 'Subscrição mensal: 30 dias após aprovação da proposta.\nLicenciamento permanente: 100% em 30 dias, a partir da aprovação da proposta.',
        prazo_entrega: 'Até 15 dias, a partir da confirmação formal da proposta e da assinatura do contrato ou emissão da ordem de compra pelo cliente.',
        obs: 'Os serviços somente serão iniciados mediante o pagamento da primeira parcela.',
        status: 'enviado', created_at: ts(-2), updated_at: ts(-2),
      },
      {
        id: oFarma, numero: 1671, cliente_id: cFarma, contato: 'Sra. Juliana Reis',
        objeto: 'Implantação da solução GOqualy para gestão da qualidade e conformidade regulatória.',
        revisao: 0, data: dia(0), validade_dias: 30, desconto_pct: 5,
        cond_pagamento: 'Subscrição mensal: 30 dias após aprovação da proposta.\nImplantação: 50% no aceite + 50% na entrega.',
        prazo_entrega: 'Início em até 10 dias após aprovação; implantação concluída em 45 dias.',
        obs: '', status: 'rascunho', created_at: ts(0), updated_at: ts(0),
      },
    ],
    orcamento_itens: [
      { id: uid(), orcamento_id: oMondial, secao: 'mensal', descricao: 'Infraestrutura em nuvem + SLA Platinum', detalhe: '130 usuários · 25 GB DB | 20 GB S3 · suporte ilimitado', qtd: 1, valor_unit: 11070, ordem: 0 },
      { id: uid(), orcamento_id: oMondial, secao: 'unico', descricao: 'Licenças adicionais QMS Premium', detalhe: '30 licenças permanentes Staff, acesso nominativo', qtd: 30, valor_unit: 1167.33, ordem: 1 },
      { id: uid(), orcamento_id: oFarma, secao: 'mensal', descricao: 'Licença GOqualy Premium', detalhe: '10 usuários nominativos', qtd: 1, valor_unit: 2600, ordem: 0 },
      { id: uid(), orcamento_id: oFarma, secao: 'mensal', descricao: 'Suporte e SLA', detalhe: 'Atendimento em horário comercial', qtd: 1, valor_unit: 400, ordem: 1 },
      { id: uid(), orcamento_id: oFarma, secao: 'unico', descricao: 'Implantação e treinamento', detalhe: 'Setup + 3 workshops remotos', qtd: 1, valor_unit: 4500, ordem: 2 },
    ],
    tickets: [
      { id: tk1, numero: 101, user_id: 'user-cliente-1', produto: 'PRIME', assunto: 'Erro ao exportar relatório de auditoria', descricao: 'Ao clicar em Exportar PDF na tela de auditorias, aparece "erro inesperado". Preciso do relatório para amanhã.', prioridade: 'alta', status: 'aberto', created_at: ts(-1, 15), updated_at: ts(-1, 15) },
      { id: tk2, numero: 102, user_id: 'user-cliente-2', produto: 'EasyOEE', assunto: 'Como cadastrar um novo turno?', descricao: 'Abrimos um terceiro turno na fábrica e não achei onde configurar os horários.', prioridade: 'normal', status: 'em_atendimento', created_at: ts(-2, 11), updated_at: ts(-1, 9) },
    ],
    ticket_mensagens: [
      { id: uid(), ticket_id: tk2, autor_id: EU, staff: true, texto: 'Olá! Vá em Configurações → Turnos → Novo turno. Vou te enviar o passo a passo com prints por aqui. Qualquer dúvida, me chama!', created_at: ts(-1, 9) },
    ],
    promocoes: [
      { id: uid(), nome: 'Aniversário Solve — 15% off', produto: 'todas', desconto_pct: 15, inicio: dia(-5), fim: dia(30), ativo: true, obs: 'Válida para novos contratos fechados no período.', created_at: ts(-5) },
    ],
  };
}

// ── Banco em localStorage ──
function carregarDb() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrompido → reseeda */ }
  const db = seed();
  salvarDb(db);
  return db;
}
const salvarDb = (db) => localStorage.setItem(LS_KEY, JSON.stringify(db));

export function resetDemo() {
  localStorage.removeItem(LS_KEY);
  location.reload();
}

// ── Relações (equivalente aos embeds do PostgREST usados nas views) ──
const RELACOES = {
  assinaturas: { clientes: { tabela: 'clientes', fk: 'cliente_id', tipo: 'um' } },
  lancamentos: { clientes: { tabela: 'clientes', fk: 'cliente_id', tipo: 'um' } },
  tarefas: {
    resp: { tabela: 'profiles', fk: 'resp_id', chave: 'user_id', tipo: 'um' },
    criador: { tabela: 'profiles', fk: 'criador_id', chave: 'user_id', tipo: 'um' },
    clientes: { tabela: 'clientes', fk: 'cliente_id', tipo: 'um' },
  },
  leads: { resp: { tabela: 'profiles', fk: 'resp_id', chave: 'user_id', tipo: 'um' } },
  ideias: { autor: { tabela: 'profiles', fk: 'autor_id', chave: 'user_id', tipo: 'um' } },
  mural: { autor: { tabela: 'profiles', fk: 'autor_id', chave: 'user_id', tipo: 'um' } },
  orcamentos: {
    clientes: { tabela: 'clientes', fk: 'cliente_id', tipo: 'um' },
    orcamento_itens: { tabela: 'orcamento_itens', fk: 'orcamento_id', tipo: 'muitos' },
  },
};

// ── Query builder mínimo (cobre o que as views usam) ──
class Consulta {
  constructor(db, tabela) {
    this.db = db; this.tabela = tabela;
    this.op = 'select'; this.filtros = []; this.ordens = []; this.lim = null;
    this.unico = false; this.podeVazio = false; this.retorno = null;
  }
  select() { if (this.op === 'select') return this; this.retorno = true; return this; }
  insert(linhas) { this.op = 'insert'; this.linhas = Array.isArray(linhas) ? linhas : [linhas]; return this; }
  update(patch) { this.op = 'update'; this.patch = patch; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c, v) { this.filtros.push(r => String(r[c]) === String(v)); return this; }
  neq(c, v) { this.filtros.push(r => String(r[c]) !== String(v)); return this; }
  in(c, vals) { const s = vals.map(String); this.filtros.push(r => s.includes(String(r[c]))); return this; }
  not(c, op, val) {
    if (op === 'in') {
      const s = String(val).replace(/[()"']/g, '').split(',').map(x => x.trim());
      this.filtros.push(r => !s.includes(String(r[c])));
    }
    return this;
  }
  gte(c, v) { this.filtros.push(r => r[c] != null && String(r[c]) >= String(v)); return this; }
  lte(c, v) { this.filtros.push(r => r[c] != null && String(r[c]) <= String(v)); return this; }
  order(c, opts = {}) { this.ordens.push({ c, asc: opts.ascending !== false, nf: !!opts.nullsFirst }); return this; }
  limit(n) { this.lim = n; return this; }
  maybeSingle() { this.unico = true; this.podeVazio = true; return this; }
  single() { this.unico = true; return this; }

  _executar() {
    const linhas = this.db[this.tabela] || (this.db[this.tabela] = []);

    if (this.op === 'insert') {
      const inseridas = this.linhas.map(l => {
        const nova = { id: uid(), created_at: agora(), ...l };
        if (['tickets', 'orcamentos'].includes(this.tabela)) {
          nova.numero = l.numero ?? Math.max(0, ...linhas.map(r => r.numero || 0)) + 1;
        }
        if (this.tabela === 'orcamentos') nova.updated_at = nova.updated_at || agora();
        // defaults que o Postgres daria
        if (this.tabela === 'leads') { nova.status = nova.status || 'novo'; nova.etapa = nova.etapa || 'novo'; }
        return nova;
      });
      linhas.push(...inseridas);
      salvarDb(this.db);
      return this.unico ? inseridas[0] : inseridas;
    }

    let sel = linhas.filter(r => this.filtros.every(f => f(r)));

    if (this.op === 'update') {
      sel.forEach(r => Object.assign(r, this.patch, this.tabela === 'orcamentos' ? { updated_at: agora() } : null));
      salvarDb(this.db);
      return sel;
    }
    if (this.op === 'delete') {
      this.db[this.tabela] = linhas.filter(r => !sel.includes(r));
      salvarDb(this.db);
      return [];
    }

    // select: anexa relações e ordena
    const rels = RELACOES[this.tabela] || {};
    sel = sel.map(r => {
      const c = { ...r };
      for (const [alias, rel] of Object.entries(rels)) {
        const alvo = this.db[rel.tabela] || [];
        const chave = rel.chave || 'id';
        if (rel.tipo === 'muitos') {
          c[alias] = alvo.filter(x => String(x[rel.fk]) === String(r.id)).map(x => ({ ...x }));
        } else {
          const pai = alvo.find(x => String(x[chave]) === String(r[rel.fk]));
          c[alias] = pai ? { ...pai } : null;
        }
      }
      return c;
    });

    for (const o of [...this.ordens].reverse()) {
      sel.sort((a, b) => {
        const va = a[o.c], vb = b[o.c];
        if (va == null && vb == null) return 0;
        if (va == null) return o.nf ? -1 : 1;
        if (vb == null) return o.nf ? 1 : -1;
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return o.asc ? cmp : -cmp;
      });
    }
    if (this.lim != null) sel = sel.slice(0, this.lim);
    return this.unico ? (sel[0] ?? null) : sel;
  }

  then(resolver, rejeitar) {
    try {
      const data = this._executar();
      // Latência falsa para os spinners aparecerem como na vida real
      return new Promise(r => setTimeout(r, 60)).then(() => ({ data, error: null })).then(resolver, rejeitar);
    } catch (e) {
      return Promise.resolve({ data: null, error: { message: String(e) } }).then(resolver, rejeitar);
    }
  }
}

// ── Cliente demo (mesma interface usada do supabase-js) ──
export function criarClienteDemo() {
  const db = carregarDb();
  let sessao = { user: DEMO_USER };
  const ouvintes = [];
  const avisar = () => ouvintes.forEach(cb => cb('DEMO', sessao));

  return {
    demo: true,
    auth: {
      getSession: async () => ({ data: { session: sessao } }),
      onAuthStateChange: (cb) => { ouvintes.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      signInWithPassword: async () => { sessao = { user: DEMO_USER }; avisar(); return { error: null }; },
      signOut: async () => { sessao = null; avisar(); return { error: null }; },
    },
    from: (tabela) => new Consulta(db, tabela),
  };
}
