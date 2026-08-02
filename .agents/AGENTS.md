# Regras do Projeto Solve

Este arquivo define as diretrizes arquiteturais, de segurança e de desenvolvimento para o projeto Solve. Estas regras devem ser aplicadas em todas as interações.

## 1. Arquitetura do Projeto
O projeto **Solve** é composto por três frentes principais que compartilham o mesmo repositório:
- **`site/` (Site Solve)**: Frontend público em React/Vite. Serve como vitrine e portal do cliente. Roda na porta 5200.
- **`admin/` (Solve Central)**: Frontend privado em React/Vite. Central de trabalho dos sócios e associados (CRM, tarefas, fluxo de caixa, mural). Roda na porta 5205 e é empacotado para Android via Capacitor.
- **`supabase/`**: Diretório contendo os schemas e migrations em SQL.

## 2. Regras de Negócio e Frontend
- **Escopo do `site/`**: NUNCA adicione lógicas de negócios restritas, relatórios administrativos ou dados sensíveis neste diretório. Ele é puramente público (exceto a área restrita do próprio cliente).
- **Escopo do `admin/`**: Todo o desenvolvimento aqui pressupõe que o usuário autenticado possui a permissão adequada (ver Regras de Segurança). O design deve seguir os padrões já estabelecidos na interface (uso do `react-icons`, classes globais, etc).
- **Mobile (Capacitor)**: O código do `admin/` também roda nativamente no Android. Qualquer alteração de navegação deve levar em conta o comportamento mobile (ex: botão voltar do Android). Apenas evite APIs estritamente exclusivas de Web quando houver alternativas híbridas (ex: WebView ignora `window.print()`, requerendo tratativas locais).

## 3. Segurança e Supabase (Regra de Ouro)
- **RLS (Row Level Security)**: Sempre que criarmos ou alterarmos tabelas (`schema_vX.sql`), é OBRIGATÓRIO habilitar o RLS e garantir que as políticas de acesso estejam configuradas.
- **Roles**:
  - `role = 'admin'`: Sócios com acesso irrestrito à central (Mural, Fluxo de Caixa, etc).
  - `role = 'associado'`: Convidados com acesso limitado a projetos específicos. NUNCA exponha informações globais (como fluxo de caixa) para associados.
  - `role = 'cliente'` (padrão): Acesso apenas via Portal no `site/` para visualização de tickets próprios.
- Toda proteção de acesso a dados administrativos deve ser feita e garantida no SERVIDOR (via RLS no banco), e não apenas escondendo a UI no navegador.
- **Chaves de Acesso**: NUNCA exponha ou crie scripts que exponham a chave `service_role`. A `anon key` é pública e segura desde que o RLS esteja ativo. As chaves devem residir apenas em arquivos `.env`.

## 4. Banco de Dados (Migrations)
- As atualizações de banco de dados (`schema_vX.sql`) devem ser sempre incrementais. Não apague tabelas existentes ou dados em produção sem validação estrita.

Siga estas diretrizes ao sugerir alterações de código, analisar bugs ou planejar novas funcionalidades.
