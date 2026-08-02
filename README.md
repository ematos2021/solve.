# Solve — Plataforma de Soluções de Gestão

Dois aplicativos, um único Supabase:

| App | Pasta | Porta | Uso |
|---|---|---|---|
| **Site Solve** (público) | `site/` | 5200 | Vitrine das soluções + Portal do cliente (login e tickets). É o único que vai ao ar. |
| **Solve Central** (privado) | `admin/` | 5205 | Central de trabalho dos sócios: mural da equipe, tarefas, ideias, funil de prospecção, orçamentos/propostas em PDF, clientes, assinaturas, fluxo de caixa, promoções e suporte. Roda no localhost, em URL privada ou como **app de celular** (`admin/android/`). |

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
2. No painel do Supabase, abra **SQL Editor** e execute, **em ordem**: `supabase/schema.sql`, `schema_v2.sql`, `schema_v3.sql` e `schema_v4.sql`. Quem já tinha o banco criado roda só os que faltam — todos são incrementais e não apagam nada.
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

### Associados e projetos (schema v4)

Além dos sócios (`admin`), existe o papel **`associado`**: alguém convidado para colaborar
em um projeto específico (ex.: Prime, MRQ, Cuidar, Areal), com acesso limitado à Central —
apenas **Visão geral, Ideias, Tarefas e Assinaturas do projeto dele** (assinaturas em modo
somente leitura).

- **Regra de ouro (garantida por RLS, no servidor):** conteúdo *sem* projeto é exclusivo dos
  sócios — todo o histórico de vocês continua invisível para associados. Conteúdo *com*
  projeto é visto por sócios + membros daquele projeto. Associado jamais enxerga outro
  projeto, o mural, o caixa, a prospecção ou os orçamentos — mesmo fuçando o navegador.
- **Fluxo de convite (sem SQL):** a pessoa cria a conta pelo portal do site → na Central,
  tela **Projetos** (menu lateral → Gerenciar projetos), adicione-a como membro. Ela é
  promovida a `associado` automaticamente; ao ser removida do último projeto, volta a `cliente`.
- **Lente de projetos:** no menu lateral, clicar num projeto filtra Ideias, Tarefas e
  Assinaturas por aquele projeto (para sócios e associados).

## App de celular (Android / iOS)

A Central roda como app instalado no celular, com ícone na tela inicial e sem barra de
navegador. Não há segundo código-fonte: o [Capacitor](https://capacitorjs.com) empacota o
mesmo build React (`admin/dist`) numa casca nativa. O que você corrigir na Central vale
para o site, para a versão publicada e para o app.

O projeto Android já está pronto em `admin/android/` (pacote `br.com.solve.central`,
nome "Solve Central"). O que muda dentro do app:

- **Botão "voltar" do Android** fecha o modal ou a gaveta do menu; na tela inicial, encerra o app.
- **Propostas em PDF** usam o serviço de impressão do Android (o mesmo diálogo do sistema,
  com "Salvar como PDF") — a WebView ignora `window.print()`. O layout é o mesmo do desktop.
- **Sessão** fica no armazenamento nativo, não no `localStorage`: ninguém é deslogado porque
  o Android limpou o cache da WebView.
- **Backup automático desligado** (`allowBackup=false`): o token de acesso não sobe para o
  Google Drive da conta pessoal.

### Caminho A — montar o APK na nuvem (nada para instalar)

Serve para quem não quer o Android Studio na máquina. Requer só o repositório no GitHub.

1. Em **Settings → Secrets and variables → Actions**, crie:
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (mesmos valores de `admin/.env`).
2. Aba **Actions → "APK Android (Solve Central)" → Run workflow**.
3. Ao terminar (~5 min), baixe o `.apk` em **Artifacts**, no fim da página da execução.

Sem chave de assinatura configurada, sai um APK de teste — instala e funciona normalmente,
só não serve para a Play Store. Para assinar de verdade, veja "Chave de assinatura" abaixo.

### Caminho B — montar na sua máquina

Pré-requisitos (o Java 8 que está instalado aqui **não** serve; o `compileSdk 36` exige JDK 21):

1. Instale o [Android Studio](https://developer.android.com/studio) — ele já traz o JDK 21 e o SDK.
2. Abra-o uma vez e aceite os SDKs sugeridos (*More Actions → SDK Manager*, Android 16 / API 36).
3. Aponte o `JAVA_HOME` para o JDK do Studio, no PowerShell:

```powershell
[Environment]::SetEnvironmentVariable('JAVA_HOME', "$env:LOCALAPPDATA\Programs\Android Studio\jbr", 'User')
[Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
```

(feche e reabra o terminal). Depois, dentro de `admin/`:

```bash
npm run apk       # gera o APK de teste
npm run android   # ou: abre o projeto no Android Studio (Run ▶ instala no celular plugado)
```

O arquivo sai em `admin/android/app/build/outputs/apk/debug/app-debug.apk`.

### Instalar no celular

Mande o `.apk` por WhatsApp/Drive/cabo, abra no celular e confirme
*"Instalar apps de fontes desconhecidas"* para o app que abriu o arquivo (Arquivos, Chrome…).
É uma permissão por aplicativo e pode ser desligada logo depois.

### Chave de assinatura (para atualizar sem desinstalar, e para a Play Store)

Crie **uma vez** e guarde para sempre — perder essa chave significa não conseguir mais
publicar atualizações do mesmo app:

```bash
keytool -genkey -v -keystore solve.jks -alias solve -keyalg RSA -keysize 2048 -validity 10000
```

Coloque o `solve.jks` em `admin/android/` e crie `admin/android/keystore.properties`:

```properties
storeFile=solve.jks
storePassword=SUA_SENHA
keyAlias=solve
keyPassword=SUA_SENHA
```

Ambos estão no `.gitignore` — nunca vão para o git. Com eles no lugar,
`npm run apk:release` gera o APK assinado em `app/build/outputs/apk/release/`.

Para usar o Caminho A assinado, cadastre quatro secrets no GitHub:
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` e
`ANDROID_KEYSTORE_BASE64` — este último é o arquivo `.jks` convertido em texto:

```powershell
# copia o conteúdo já pronto para colar no secret
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\solve.jks")) | Set-Clipboard
```

### Publicar uma atualização

Suba `versionCode` (inteiro, só cresce) e `versionName` em
`admin/android/app/build.gradle` e gere o APK de novo. Quem já tem o app instalado
atualiza por cima, mantendo a sessão — desde que assinado com a mesma chave.

### Play Store (quando quiser)

Conta de desenvolvedor Google Play: US$ 25, pagamento único. A loja aceita **AAB**,
não APK: `cd admin/android && gradlew.bat bundleRelease` →
`app/build/outputs/bundle/release/app-release.aab`. Como é uma ferramenta interna,
o caminho natural é *Teste interno* ou *Distribuição privada*, sem listagem pública.

### iOS

O projeto iOS só pode ser gerado e compilado **num Mac** (Xcode + CocoaPods) — não há
como fazer APK/IPA de iPhone no Windows. Tendo um Mac com Xcode:

```bash
cd admin && npm install && npx cap add ios && npm run ios
```

Todo o código React e os ajustes nativos deste projeto já funcionam lá; a exceção é a
impressão, que cai no plano B (exporta a proposta e abre o menu de compartilhar) porque
o plugin de impressão nativo foi escrito só para Android. Instalar no seu próprio iPhone
exige uma conta Apple gratuita; distribuir para outras pessoas exige o Apple Developer
Program (US$ 99/ano).

### Ícone e splash

Os PNGs de origem estão em `admin/assets/` (ícone, camadas do ícone adaptativo e splash).
Troque-os pelo que quiser — mantendo os nomes e o tamanho — e rode `npm run icones`
em `admin/` para regerar todas as resoluções do Android.

## Publicar a Central em URL privada (para os associados)

A Central foi pensada para localhost, mas com o RLS do v4 é seguro publicá-la: quem protege
os dados é o servidor do Supabase, não o navegador. Para publicar (ex.: Vercel):

1. Crie um projeto no [vercel.com](https://vercel.com) apontando para este repositório,
   com **Root Directory = `admin`** (framework: Vite; build `npm run build`; output `dist`).
2. Em *Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (mesmos valores do `admin/.env`).
3. Deploy. A URL resultante já nasce com `noindex` (não aparece em buscadores) e só mostra
   dados após login de conta `admin` ou `associado` — qualquer outra conta vê "Acesso restrito".

Passos equivalentes funcionam no Netlify (base directory `admin`, publish `admin/dist`).

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
