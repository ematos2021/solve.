# Solve — Plataforma de Soluções de Gestão

Dois aplicativos, um único Supabase:

| App | Pasta | Porta | Uso |
|---|---|---|---|
| **Site Solve** (público) | `site/` | 5200 | Vitrine das soluções + Portal do cliente (login e tickets). É o único que vai ao ar. |
| **Solve Central** (privado) | `admin/` | 5205 | Central de trabalho dos sócios, **somente no localhost**: mural da equipe, tarefas, ideias, funil de prospecção, orçamentos/propostas em PDF, clientes, assinaturas, fluxo de caixa, promoções e suporte. |

## Módulos da Central de trabalho

- **Visão geral** — MRR, resultado do mês, funil de vendas, propostas em aberto, tarefas da equipe, follow-ups e suporte, tudo numa tela.
- **Mural da equipe** — avisos e decisões entre os sócios, com posts fixáveis.
- **Tarefas** — kanban compartilhado (A fazer → Em andamento → Concluído) com responsável, prioridade, prazo e cliente vinculado.
- **Ideias** — backlog de ideias da sociedade com votos e status (nova → avaliando → aprovada → em execução).
- **Prospecção** — funil comercial em kanban (novo → contatado → reunião → proposta → ganho/perdido) com valor estimado, próxima ação e conversão em cliente com 1 clique. Os leads do site caem automaticamente em "Novo".
- **Orçamentos** — propostas comerciais numeradas (`PRO2026/00/0001`), com seções de subscrição mensal e investimento único, desconto, condições de pagamento, revisões e **impressão/PDF com layout profissional** (botão Visualizar/PDF → Salvar como PDF).
- **Clientes / Assinaturas / Fluxo de caixa / Promoções / Suporte** — os módulos originais.

## Setup (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. No painel do Supabase, abra **SQL Editor** e execute todo o conteúdo de `supabase/schema.sql` **e depois** `supabase/schema_v2.sql` (módulos da central de trabalho). Quem já tinha o banco criado roda só o `schema_v2.sql` — ele é incremental e não apaga nada.
3. Copie a URL e a **anon key** (Settings → API) para os dois arquivos de ambiente:
   - `site/.env` (copie de `site/.env.example`)
   - `admin/.env` (copie de `admin/.env.example`)
4. Instale e rode:

```bash
cd site  && npm install && npm run dev   # http://localhost:5200
cd admin && npm install && npm run dev   # http://localhost:5205
```

5. Crie sua conta de acesso pelo próprio portal do site (Portal do cliente → Criar conta). Depois, promova-se a administrador no SQL Editor:

```sql
update public.profiles set role = 'admin'
where user_id = (select id from auth.users where email = 'SEU_EMAIL_AQUI');
```

Só usuários com `role = 'admin'` conseguem entrar na Central e ver dados administrativos — isso é garantido **no servidor** (RLS), não no navegador.

### Adicionar sócios

Cada sócio cria a própria conta pelo portal do site (com o nome completo — ele aparece nos avatares de tarefas e mural) e você o promove com o mesmo comando SQL acima, trocando o e-mail. Todos os admins compartilham a mesma central: tarefas, mural, ideias, funil e orçamentos são visíveis para toda a sociedade.

## Segurança — decisões tomadas

- **Nenhum código das suas soluções (PRIME, SIG, GOqualy, EasyOEE, SGA) existe neste projeto.** As demonstrações do site são imagens/vídeos estáticos (`site/public/demos/`) + demonstração guiada por WhatsApp. Nada para um curioso inspecionar, nada de direitos autorais expostos.
- **Row Level Security (RLS) em todas as tabelas.** Cliente só lê os próprios tickets; tabelas administrativas (caixa, clientes, assinaturas, promoções, leads) exigem `role = 'admin'` verificado no banco.
- **A anon key pode aparecer no navegador — isso é o desenho do Supabase.** O que protege os dados são as políticas RLS. A chave `service_role` **jamais** deve aparecer em nenhum destes apps.
- **`.env` está no `.gitignore`** — as chaves não vão para o git.
- O app de gestão não tem build de deploy documentado de propósito: é local.
- Recomendado ativar no painel Supabase: *Auth → Email → Confirm email* e *Auth → Passwords → Leaked password protection*.

## Adicionar imagens de demonstração

Coloque capturas de tela reais em `site/public/demos/` com os nomes:
`prime-1.png`, `prime-2.png`, `sig-1.png`, `goqualy-1.png`, `easyoee-1.png`, `sga-1.png` (até 3 por solução).
Sem imagem, o site mostra um placeholder elegante — nunca o código.
