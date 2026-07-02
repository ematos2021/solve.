# Solve — Plataforma de Soluções de Gestão

Dois aplicativos, um único Supabase:

| App | Pasta | Porta | Uso |
|---|---|---|---|
| **Site Solve** (público) | `site/` | 5200 | Vitrine das soluções + Portal do cliente (login e tickets). É o único que vai ao ar. |
| **Solve Gestão** (privado) | `admin/` | 5205 | Roda **somente no seu localhost**: fluxo de caixa, clientes, assinaturas, vencimentos, custos, promoções, leads e resposta de tickets. |

## Setup (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. No painel do Supabase, abra **SQL Editor** e execute todo o conteúdo de `supabase/schema.sql`.
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

Só usuários com `role = 'admin'` conseguem entrar no Solve Gestão e ver dados administrativos — isso é garantido **no servidor** (RLS), não no navegador.

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
