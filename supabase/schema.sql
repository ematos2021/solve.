-- ════════════════════════════════════════════════════════════════
-- SOLVE — Schema completo (rodar no SQL Editor do Supabase)
-- Tabelas + Row Level Security. A segurança mora AQUI, no servidor.
-- ════════════════════════════════════════════════════════════════

-- ── Perfis (espelho de auth.users com papel) ──
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text default '',
  empresa    text default '',
  telefone   text default '',
  role       text not null default 'cliente' check (role in ('cliente','admin')),
  created_at timestamptz not null default now()
);

-- Função SECURITY DEFINER evita recursão de política e centraliza a checagem.
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public as
$$ select exists(select 1 from public.profiles where user_id = auth.uid() and role = 'admin'); $$;

-- Perfil criado automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  insert into public.profiles (user_id, nome, empresa)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nome', ''),
          coalesce(new.raw_user_meta_data->>'empresa', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles for select
  using (user_id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update
  using (user_id = auth.uid() or public.is_admin());

-- ── Tickets de suporte ──
create table if not exists public.tickets (
  id         uuid primary key default gen_random_uuid(),
  numero     bigint generated always as identity,
  user_id    uuid not null references auth.users(id) on delete cascade,
  produto    text not null default '',
  assunto    text not null,
  descricao  text not null default '',
  prioridade text not null default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  status     text not null default 'aberto' check (status in ('aberto','em_atendimento','resolvido','fechado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tickets enable row level security;
drop policy if exists tickets_select on public.tickets;
drop policy if exists tickets_insert on public.tickets;
drop policy if exists tickets_update on public.tickets;
create policy tickets_select on public.tickets for select
  using (user_id = auth.uid() or public.is_admin());
create policy tickets_insert on public.tickets for insert
  with check (user_id = auth.uid());
create policy tickets_update on public.tickets for update
  using (user_id = auth.uid() or public.is_admin());

-- ── Mensagens dos tickets (thread) ──
create table if not exists public.ticket_mensagens (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  autor_id   uuid not null references auth.users(id) on delete cascade,
  staff      boolean not null default false,
  texto      text not null,
  created_at timestamptz not null default now()
);
alter table public.ticket_mensagens enable row level security;
drop policy if exists tmsg_select on public.ticket_mensagens;
drop policy if exists tmsg_insert on public.ticket_mensagens;
create policy tmsg_select on public.ticket_mensagens for select
  using (exists(select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin())));
create policy tmsg_insert on public.ticket_mensagens for insert
  with check (
    autor_id = auth.uid()
    and exists(select 1 from public.tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin()))
  );

-- ── Leads capturados pelo site (anônimo pode INSERIR, só admin lê) ──
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text default '',
  contato    text default '',
  produto    text default '',
  origem     text default 'site',
  status     text not null default 'novo' check (status in ('novo','contatado','convertido','descartado')),
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;
drop policy if exists leads_insert on public.leads;
drop policy if exists leads_admin on public.leads;
create policy leads_insert on public.leads for insert with check (true);
create policy leads_admin on public.leads for select using (public.is_admin());
drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update using (public.is_admin());
drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete using (public.is_admin());

-- ── Clientes (carteira comercial — só admin) ──
create table if not exists public.clientes (
  id         uuid primary key default gen_random_uuid(),
  empresa    text not null,
  contato    text default '',
  email      text default '',
  whatsapp   text default '',
  obs        text default '',
  status     text not null default 'ativo' check (status in ('ativo','inativo','prospecto')),
  created_at timestamptz not null default now()
);
alter table public.clientes enable row level security;
drop policy if exists clientes_admin on public.clientes;
create policy clientes_admin on public.clientes for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Assinaturas (produto, valor, vencimento — só admin) ──
create table if not exists public.assinaturas (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references public.clientes(id) on delete cascade,
  produto      text not null,
  valor_mensal numeric(12,2) not null default 0,
  inicio       date not null default current_date,
  vencimento   date not null,
  status       text not null default 'ativa' check (status in ('ativa','atrasada','cancelada','trial')),
  obs          text default '',
  created_at   timestamptz not null default now()
);
alter table public.assinaturas enable row level security;
drop policy if exists assinaturas_admin on public.assinaturas;
create policy assinaturas_admin on public.assinaturas for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Fluxo de caixa (entradas e saídas/custos — só admin) ──
create table if not exists public.lancamentos (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null check (tipo in ('entrada','saida')),
  categoria  text not null default 'Geral',
  descricao  text default '',
  valor      numeric(12,2) not null,
  data       date not null default current_date,
  cliente_id uuid references public.clientes(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.lancamentos enable row level security;
drop policy if exists lancamentos_admin on public.lancamentos;
create policy lancamentos_admin on public.lancamentos for all
  using (public.is_admin()) with check (public.is_admin());

-- ── Promoções (só admin) ──
create table if not exists public.promocoes (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  produto      text default 'todas',
  desconto_pct numeric(5,2) not null default 0,
  inicio       date not null default current_date,
  fim          date,
  ativo        boolean not null default true,
  obs          text default '',
  created_at   timestamptz not null default now()
);
alter table public.promocoes enable row level security;
drop policy if exists promocoes_admin on public.promocoes;
create policy promocoes_admin on public.promocoes for all
  using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- Depois de criar sua conta pelo site, promova-se a admin:
-- update public.profiles set role='admin'
--   where user_id = (select id from auth.users where email='SEU_EMAIL');
-- ════════════════════════════════════════════════════════════════
