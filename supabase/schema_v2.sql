-- ════════════════════════════════════════════════════════════════
-- SOLVE — Schema V2: Central de Trabalho (rodar no SQL Editor)
-- Incremental: NÃO apaga nada do schema.sql original.
-- Novos módulos: tarefas, ideias, mural, prospecção (pipeline) e
-- orçamentos/propostas comerciais. Tudo restrito a role='admin'.
-- ════════════════════════════════════════════════════════════════

-- ── Trigger utilitário de updated_at ──
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ── PROSPECÇÃO: evolui a tabela de leads para um funil comercial ──
alter table public.leads add column if not exists empresa        text default '';
alter table public.leads add column if not exists valor_estimado numeric(12,2) not null default 0;
alter table public.leads add column if not exists etapa          text not null default 'novo';
alter table public.leads add column if not exists proxima_acao   date;
alter table public.leads add column if not exists nota           text default '';
alter table public.leads add column if not exists resp_id        uuid references public.profiles(user_id) on delete set null;
alter table public.leads drop constraint if exists leads_etapa_check;
alter table public.leads add constraint leads_etapa_check
  check (etapa in ('novo','contatado','reuniao','proposta','ganho','perdido'));

-- ── TAREFAS (to-do compartilhado da equipe) ──
create table if not exists public.tarefas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text default '',
  status      text not null default 'a_fazer' check (status in ('a_fazer','fazendo','feito')),
  prioridade  text not null default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  prazo       date,
  resp_id     uuid references public.profiles(user_id) on delete set null,
  criador_id  uuid references public.profiles(user_id) on delete set null,
  cliente_id  uuid references public.clientes(id) on delete set null,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.tarefas enable row level security;
drop policy if exists tarefas_admin on public.tarefas;
create policy tarefas_admin on public.tarefas for all
  using (public.is_admin()) with check (public.is_admin());

-- ── IDEIAS (backlog de ideias da sociedade, com votos) ──
create table if not exists public.ideias (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descricao   text default '',
  categoria   text not null default 'Produto',
  status      text not null default 'nova' check (status in ('nova','avaliando','aprovada','em_execucao','concluida','descartada')),
  votos       int not null default 0,
  autor_id    uuid references public.profiles(user_id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.ideias enable row level security;
drop policy if exists ideias_admin on public.ideias;
create policy ideias_admin on public.ideias for all
  using (public.is_admin()) with check (public.is_admin());

-- ── NOTAS DE IDEIAS (brainstorm) ──
create table if not exists public.ideia_notas (
  id          uuid primary key default gen_random_uuid(),
  ideia_id    uuid not null references public.ideias(id) on delete cascade,
  tipo        text not null check (tipo in ('oportunidade','risco','pergunta','passo')),
  texto       text not null,
  autor_id    uuid references public.profiles(user_id) on delete set null,
  reacoes     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
alter table public.ideia_notas enable row level security;
drop policy if exists ideia_notas_admin on public.ideia_notas;
create policy ideia_notas_admin on public.ideia_notas for all
  using (public.is_admin()) with check (public.is_admin());

-- ── MURAL (comunicação interna rápida entre sócios) ──
create table if not exists public.mural (
  id          uuid primary key default gen_random_uuid(),
  autor_id    uuid references public.profiles(user_id) on delete set null,
  texto       text not null,
  fixado      boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.mural enable row level security;
drop policy if exists mural_admin on public.mural;
create policy mural_admin on public.mural for all
  using (public.is_admin()) with check (public.is_admin());

-- ── ORÇAMENTOS (propostas comerciais numeradas, com revisões) ──
create table if not exists public.orcamentos (
  id             uuid primary key default gen_random_uuid(),
  numero         bigint generated always as identity,
  cliente_id     uuid references public.clientes(id) on delete set null,
  contato        text default '',
  objeto         text default '',
  revisao        int not null default 0,
  data           date not null default current_date,
  validade_dias  int not null default 60,
  desconto_pct   numeric(5,2) not null default 0,
  cond_pagamento text default E'Subscrição mensal: 30 dias após aprovação da proposta.\nSetup / licenças: 100% em 30 dias, a partir da aprovação da proposta.',
  prazo_entrega  text default 'Até 15 dias, a partir da confirmação formal da proposta e da assinatura do contrato ou emissão da ordem de compra pelo cliente.',
  obs            text default '',
  status         text not null default 'rascunho' check (status in ('rascunho','enviado','aprovado','rejeitado','expirado')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
drop trigger if exists orcamentos_updated on public.orcamentos;
create trigger orcamentos_updated before update on public.orcamentos
  for each row execute function public.set_updated_at();
alter table public.orcamentos enable row level security;
drop policy if exists orcamentos_admin on public.orcamentos;
create policy orcamentos_admin on public.orcamentos for all
  using (public.is_admin()) with check (public.is_admin());

-- Itens do orçamento. secao: 'mensal' (subscrição recorrente) | 'unico' (setup/licenças)
create table if not exists public.orcamento_itens (
  id           uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  secao        text not null default 'mensal' check (secao in ('mensal','unico')),
  descricao    text not null,
  detalhe      text default '',
  qtd          numeric(12,2) not null default 1,
  valor_unit   numeric(12,2) not null default 0,
  ordem        int not null default 0
);
alter table public.orcamento_itens enable row level security;
drop policy if exists orcitens_admin on public.orcamento_itens;
create policy orcitens_admin on public.orcamento_itens for all
  using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- Sócios: cada sócio cria a conta pelo portal do site e você promove:
-- update public.profiles set role='admin'
--   where user_id = (select id from auth.users where email='EMAIL_DO_SOCIO');
-- ════════════════════════════════════════════════════════════════
