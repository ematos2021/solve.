-- ════════════════════════════════════════════════════════════════
-- SOLVE — Schema V4: Projetos e Associados
-- Incremental. Rodar DEPOIS de schema.sql, schema_v2.sql e schema_v3.sql.
--
-- Modelo:
--   · Novo papel 'associado': entra na Central com acesso limitado
--     (visão geral, ideias, tarefas e assinaturas DO PROJETO dele).
--   · Nova entidade 'projetos' (Prime, MRQ, Cuidar, Areal…) com membros.
--   · Regra de ouro (garantida AQUI, no servidor, via RLS):
--       – linha SEM projeto  → só sócios (admin) veem. Todo o histórico
--         atual de vocês fica automaticamente invisível para associados.
--       – linha COM projeto  → sócios + membros DAQUELE projeto.
--     Associado jamais vê ideias/tarefas de outro projeto, nem as
--     discussões dos sócios — mesmo mexendo no navegador.
-- ════════════════════════════════════════════════════════════════

-- ── Papel 'associado' ──
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('cliente','admin','associado'));

-- ── Projetos ──
create table if not exists public.projetos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  descricao  text default '',
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

-- Vínculo pessoa ↔ projeto (quem é membro enxerga o conteúdo do projeto)
create table if not exists public.projeto_membros (
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  user_id    uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (projeto_id, user_id)
);

-- ── Colunas de projeto nos módulos escopados ──
alter table public.ideias      add column if not exists projeto_id uuid references public.projetos(id) on delete set null;
alter table public.tarefas     add column if not exists projeto_id uuid references public.projetos(id) on delete set null;
alter table public.assinaturas add column if not exists projeto_id uuid references public.projetos(id) on delete set null;

-- ── Funções auxiliares (SECURITY DEFINER: evitam recursão de política) ──

-- Faz parte da equipe (sócio ou associado)? Portão de entrada da Central.
create or replace function public.is_equipe()
returns boolean language sql security definer stable
set search_path = public as
$$ select exists(select 1 from public.profiles
                 where user_id = auth.uid() and role in ('admin','associado')); $$;

-- É membro deste projeto?
create or replace function public.is_membro(p uuid)
returns boolean language sql security definer stable
set search_path = public as
$$ select exists(select 1 from public.projeto_membros
                 where projeto_id = p and user_id = auth.uid()); $$;

-- Pode ver conteúdo com este projeto? (a regra de ouro)
create or replace function public.pode_ver_projeto(p uuid)
returns boolean language sql security definer stable
set search_path = public as
$$ select public.is_admin() or (p is not null and public.is_membro(p)); $$;

-- Pode ver esta ideia? (notas de brainstorm herdam o projeto da ideia)
create or replace function public.pode_ver_ideia(iid uuid)
returns boolean language sql security definer stable
set search_path = public as
$$ select exists(select 1 from public.ideias i
                 where i.id = iid and public.pode_ver_projeto(i.projeto_id)); $$;

-- O alvo divide algum projeto comigo? (para ver nome/avatar dos colegas)
create or replace function public.mesmo_projeto(alvo uuid)
returns boolean language sql security definer stable
set search_path = public as
$$ select exists(select 1 from public.projeto_membros a
                 join public.projeto_membros b on a.projeto_id = b.projeto_id
                 where a.user_id = auth.uid() and b.user_id = alvo); $$;

-- Este cliente tem assinatura num projeto meu? (para o associado ver o
-- nome da empresa nas assinaturas do projeto dele, e nada além disso)
create or replace function public.cliente_do_meu_projeto(cid uuid)
returns boolean language sql security definer stable
set search_path = public as
$$ select exists(select 1 from public.assinaturas a
                 join public.projeto_membros m on m.projeto_id = a.projeto_id
                 where a.cliente_id = cid and m.user_id = auth.uid()); $$;

-- ── Políticas: PROJETOS ──
alter table public.projetos enable row level security;
drop policy if exists projetos_select on public.projetos;
drop policy if exists projetos_write on public.projetos;
create policy projetos_select on public.projetos for select
  using (public.is_admin() or public.is_membro(id));
create policy projetos_write on public.projetos for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.projeto_membros enable row level security;
drop policy if exists membros_select on public.projeto_membros;
drop policy if exists membros_write on public.projeto_membros;
create policy membros_select on public.projeto_membros for select
  using (public.is_admin() or user_id = auth.uid());
create policy membros_write on public.projeto_membros for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Políticas: IDEIAS e NOTAS (antes: só admin; agora: admin OU membro) ──
drop policy if exists ideias_admin on public.ideias;
drop policy if exists ideias_acesso on public.ideias;
create policy ideias_acesso on public.ideias for all
  using (public.pode_ver_projeto(projeto_id))
  with check (public.pode_ver_projeto(projeto_id));

drop policy if exists ideia_notas_admin on public.ideia_notas;
drop policy if exists ideia_notas_acesso on public.ideia_notas;
create policy ideia_notas_acesso on public.ideia_notas for all
  using (public.pode_ver_ideia(ideia_id))
  with check (public.pode_ver_ideia(ideia_id));

-- ── Políticas: TAREFAS ──
drop policy if exists tarefas_admin on public.tarefas;
drop policy if exists tarefas_acesso on public.tarefas;
create policy tarefas_acesso on public.tarefas for all
  using (public.pode_ver_projeto(projeto_id))
  with check (public.pode_ver_projeto(projeto_id));

-- ── Políticas: ASSINATURAS (associado só LÊ as do projeto dele) ──
drop policy if exists assinaturas_admin on public.assinaturas;
drop policy if exists assinaturas_select on public.assinaturas;
drop policy if exists assinaturas_write on public.assinaturas;
create policy assinaturas_select on public.assinaturas for select
  using (public.pode_ver_projeto(projeto_id));
create policy assinaturas_write on public.assinaturas
  for all using (public.is_admin()) with check (public.is_admin());

-- Associado vê a empresa das assinaturas do projeto dele (somente leitura;
-- as políticas de escrita de clientes continuam só-admin, intocadas)
drop policy if exists clientes_select_projeto on public.clientes;
create policy clientes_select_projeto on public.clientes for select
  using (public.cliente_do_meu_projeto(id));

-- ── Políticas: PROFILES (associado vê sócios e colegas de projeto) ──
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (
    user_id = auth.uid()
    or public.is_admin()
    or (public.is_equipe() and role = 'admin')   -- equipe vê os sócios
    or public.mesmo_projeto(user_id)             -- e os colegas do próprio projeto
  );

-- Mural, prospecção, orçamentos, caixa, promoções e demais tabelas
-- continuam EXCLUSIVOS dos sócios (políticas originais intactas).

-- ════════════════════════════════════════════════════════════════
-- Fluxo para adicionar um associado (tudo também disponível na tela
-- "Projetos" da Central, sem SQL):
--   1. A pessoa cria a conta normalmente pelo portal do site.
--   2. Na Central → Projetos, crie o projeto (ex.: Cuidar) e adicione
--      a pessoa como membro — ela é promovida a 'associado' na hora.
-- Ou via SQL:
--   update public.profiles set role='associado'
--     where user_id = (select id from auth.users where email='EMAIL');
--   insert into public.projeto_membros (projeto_id, user_id)
--     values ('<id do projeto>', (select id from auth.users where email='EMAIL'));
-- ════════════════════════════════════════════════════════════════
