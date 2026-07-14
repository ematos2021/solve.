-- ════════════════════════════════════════════════════════════════
-- SOLVE — Schema V3: Brainstorm das ideias
-- Incremental. Rodar DEPOIS de schema.sql e schema_v2.sql.
-- ════════════════════════════════════════════════════════════════

-- ── Notas de brainstorm (uma ideia → várias notas dos sócios) ──
-- reacoes: mapa emoji → lista de user_ids, ex.: {"🔥": ["uuid1","uuid2"]}
create table if not exists public.ideia_notas (
  id         uuid primary key default gen_random_uuid(),
  ideia_id   uuid not null references public.ideias(id) on delete cascade,
  tipo       text not null default 'oportunidade'
             check (tipo in ('oportunidade','risco','pergunta','passo')),
  texto      text not null,
  autor_id   uuid references public.profiles(user_id) on delete set null,
  reacoes    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists ideia_notas_ideia_idx on public.ideia_notas(ideia_id);

alter table public.ideia_notas enable row level security;
drop policy if exists ideia_notas_admin on public.ideia_notas;
create policy ideia_notas_admin on public.ideia_notas for all
  using (public.is_admin()) with check (public.is_admin());
