# PROMPT PARA CLAUDE CODE - AGENDA SEMANAL DOS COMANDANTES DO 5º BPRv

## 📋 CONTEXTO E OBJETIVO

Desenvolva uma aplicação web responsiva (mobile-first) chamada **"Agenda Semanal de Comandantes do 5º BPRv"** para ser publicada no **Vercel**. A aplicação substituirá o processo manual onde oficiais enviam suas agendas semanais por e-mail/mensagem ao RH, que compila tudo em planilhas Excel para entregar ao Comandante.

A nova solução permitirá que cada oficial cadastre sua própria agenda diretamente no sistema, e o RH/Comandante visualize tudo em um dashboard centralizado em tempo real.

---

## 🛠️ STACK TECNOLÓGICA OBRIGATÓRIA

- **Framework:** Next.js 14+ (App Router) com TypeScript
- **Estilização:** Tailwind CSS + shadcn/ui (componentes)
- **Banco de Dados:** Vercel Postgres (Neon) OU Supabase (PostgreSQL)
- **ORM:** Prisma
- **Autenticação:** NextAuth.js v5 (Auth.js) com Credentials Provider customizado
- **Validação:** Zod
- **Formulários:** React Hook Form
- **Datas:** date-fns (com locale pt-BR)
- **Ícones:** lucide-react
- **Toasts/Notificações:** sonner
- **Deploy:** Vercel
- **Variáveis de ambiente:** `.env.local` para dev e variáveis do Vercel para produção

---

## 🗄️ MODELAGEM DO BANCO DE DADOS (Prisma Schema)

```prisma
model User {
  id            String   @id @default(cuid())
  cpf           String   @unique // armazenar apenas números (11 dígitos)
  re            String   @unique // formato: 117021-0 (6 dígitos + traço + 1 dígito alfanumérico)
  nomeCompleto  String
  posto         Posto
  email         String?  // gmail para convites
  isAdmin       Boolean  @default(false)
  passwordHash  String?  // APENAS para usuários admin
  ativo         Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  agendas       Agenda[]
  logs          AuditLog[]
}

enum Posto {
  CEL_PM      // Cel PM
  TEN_CEL_PM  // Ten Cel PM
  MAJ_PM      // Maj PM
  CAP_PM      // Cap PM
  TEN_PM      // Ten PM
}

model Agenda {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  data        DateTime     @db.Date  // data específica (ex: 2026-05-18)
  tipo        TipoEscala
  observacao  String?      // texto livre para detalhar
  isFeriado   Boolean      @default(false)
  isFimSemana Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@unique([userId, data]) // um usuário só pode ter 1 escala por data
  @@index([data])
}

enum TipoEscala {
  EXPEDIENTE_NORMAL    // "Exp. normal"
  FOLGA_SEMANAL        // "Folga semanal"
  FERIAS               // "Férias"
  DISPENSA_MEDICA      // "Dispensa médica"
  CURSO                // "Curso/Capacitação"
  MISSAO               // "Missão/Operação"
  OUTROS               // texto livre na observação
}

model Feriado {
  id        String   @id @default(cuid())
  data      DateTime @db.Date @unique
  nome      String
  tipo      TipoFeriado
  createdAt DateTime @default(now())
}

enum TipoFeriado {
  NACIONAL
  ESTADUAL
  MUNICIPAL
  PONTO_FACULTATIVO
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  acao       String   // "CRIOU_AGENDA", "ALTEROU_AGENDA", "DELETOU_AGENDA", "LOGIN", etc.
  entidade   String   // "Agenda", "User", etc.
  entidadeId String?
  detalhes   Json?    // antes/depois das mudanças
  ipAddress  String?
  createdAt  DateTime @default(now())
  
  @@index([userId])
  @@index([createdAt])
}
```

---

## 🔐 REGRAS DE AUTENTICAÇÃO E AUTORIZAÇÃO

### Fluxo de Login (Usuários Comuns - Oficiais)
1. Tela inicial pede **CPF** (com máscara: `000.000.000-00`)
2. Sistema valida se o CPF existe e está ativo no banco
3. Se existir, redireciona para tela pedindo o **RE** (com máscara `000000-X`, onde X pode ser letra ou número)
4. Valida o RE confere com o CPF informado → cria sessão
5. **Não há senha para usuários comuns**

### Fluxo de Login (Admin)
1. Tela inicial pede **CPF**
2. Se o CPF for de um admin (`isAdmin = true`), o sistema pede **SENHA** (não o RE)
3. Valida senha com bcrypt → cria sessão admin

### Validação do CPF
- Deve validar dígitos verificadores do CPF (algoritmo oficial)
- Armazenar **apenas os números** (11 dígitos)
- Exibir sempre com máscara

### Validação do RE
- Formato obrigatório: `XXXXXX-X` (6 dígitos + traço + 1 caractere alfanumérico)
- Após o 7º caractere (índice 6) **sempre haverá um traço**
- O dígito verificador pode ser número (0-9) OU letra (A-Z)
- Placeholder do input: `"Digite seu RE com dígito"`
- Regex sugerida: `/^\d{6}-[0-9A-Za-z]$/`
- Aplicar máscara automaticamente enquanto o usuário digita

### Permissões
- **Usuário comum:** vê e edita APENAS sua própria agenda
- **Admin:** vê o dashboard completo, escala de todos, logs de auditoria, e pode cadastrar/editar/desativar usuários
- Proteger rotas com middleware do NextAuth verificando `session.user.isAdmin`

---

## 🌱 SEED INICIAL DO BANCO (obrigatório)

Criar um arquivo `prisma/seed.ts` que insere automaticamente o usuário admin master:

```typescript
{
  cpf: "16445111858",
  re: "000000-0", // placeholder, alterar depois
  nomeCompleto: "Administrador Master",
  posto: "CEL_PM",
  isAdmin: true,
  passwordHash: bcrypt.hashSync(process.env.ADMIN_INITIAL_PASSWORD!, 10),
  ativo: true
}
```

⚠️ **IMPORTANTE:** Na tela de admin, deve existir a opção "Alterar Senha" para que este usuário troque a senha após o primeiro acesso.

---

## 📱 TELAS E FUNCIONALIDADES

### 🏠 TELA 1 — Login (Página Inicial)
- **Header:** "Agenda Semanal de Comandantes do 5º BPRv"
- **Subtítulo:** "Acesso restrito a oficiais cadastrados"
- **Input único:** CPF (com máscara `000.000.000-00`)
- **Botão:** "Continuar"
- Após validar CPF:
  - Se for admin → mostra campo de senha
  - Se for usuário comum → mostra campo de RE
- Mensagens de erro claras (sem expor se o CPF existe ou não, por segurança)
- Design: limpo, profissional, com brasão/logo da PM (deixar placeholder para logo)
- Cores institucionais: tons de azul-marinho, branco e cinza

### 📅 TELA 2 — Agenda Semanal do Oficial
Após login do usuário comum:
- **Header:** Nome + Posto + RE do oficial logado + botão "Sair"
- **Seletor de semana:** botões `< Semana Anterior` | `Semana Atual` | `Próxima Semana >`
  - Mostrar período: "Semana de 18 a 22/MAI/2026"
- **Visualização em cards/grid:** 7 dias (Seg a Dom)
  - Cada card mostra: dia da semana, data, escala atual (ou "Não definido")
  - **Sábado, domingo e feriados:** aparecem com opacidade reduzida (50%) e fundo cinza-claro
  - Indicador visual: ícone 🎉 para feriado, ícone 🏖️ para fim de semana
- **Ao clicar em um dia normal:** abre modal para selecionar tipo de escala
- **Ao clicar em fim de semana ou feriado:** abre modal de aviso:
  > "⚠️ Esta data é um [feriado: Nome do Feriado / final de semana]. Deseja realmente agendar compromisso nesta data?"
  - Botões: `Cancelar` | `Sim, agendar mesmo assim`
- **Após agendar em feriado/fim de semana:** o card mostra um badge "⚠️ Agendado em dia especial" e mantém a opção de **cancelar** ou **reagendar**.
- **Modal de cadastro/edição de escala:**
  - Select com opções: Expediente Normal, Folga Semanal, Férias, Dispensa Médica, Curso, Missão, Outros
  - Campo de observação (texto livre, opcional, limite 200 caracteres)
  - Botões: `Salvar`, `Cancelar`, `Excluir` (se já existir)
- **Botão "Compartilhar na Google Agenda":**
  - Abre modal pedindo o e-mail Gmail do usuário (se não estiver cadastrado)
  - Gera convite com texto:
    > "O Sr. optou por compartilhar as informações do aplicativo AGENDA DOS COMANDANTES DO 5º BPRv."
  - **Implementação recomendada (sem OAuth complexo):** gerar link no formato `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...` para cada evento da semana
  - **Alternativa avançada (opcional):** integração via Google Calendar API com OAuth 2.0 — se for implementar, criar projeto no Google Cloud Console e usar `googleapis` npm package
  - Também gerar arquivo `.ics` para download (compatível com qualquer calendário)

### 📊 TELA 3 — Dashboard Administrativo
Acessível apenas para `isAdmin = true`:

**Seção 1 — Visão Geral:**
- Cards de estatísticas: total de oficiais, total de agendas cadastradas na semana, % de oficiais que já lançaram a semana
- Filtros: por semana, por posto, por status (lançado/pendente)

**Seção 2 — Grade Semanal Consolidada:**
- Tabela com linhas = oficiais e colunas = dias da semana
- Cada célula mostra o tipo de escala daquele oficial naquele dia
- Cores: verde (Exp. Normal), amarelo (Folga), azul (Curso), vermelho (Dispensa), cinza (Não lançado)
- Exportar para Excel (.xlsx) e PDF
- Filtro por semana com seletor de datas

**Seção 3 — Gestão de Usuários:**
- Lista de todos os usuários cadastrados
- Botão "Cadastrar Novo Oficial" → modal com campos: CPF, RE, Nome Completo, Posto (select), E-mail (opcional)
- Ações por usuário: Editar, Ativar/Desativar, Promover a Admin
- ⚠️ Nunca permitir excluir usuário definitivamente — apenas desativar (`ativo = false`)

**Seção 4 — Logs de Auditoria:**
- Tabela com todas as ações: data/hora, usuário, ação, detalhes
- Filtros: por data, por usuário, por tipo de ação
- Deve mostrar:
  - Data de **inserção** de cada usuário
  - Data/hora de **cada alteração** em qualquer agenda
  - Histórico de login

**Seção 5 — Configurações:**
- **Alterar Senha** (do admin logado): campos senha atual, nova senha, confirmar nova senha
- **Gerenciar Feriados:** cadastrar feriados nacionais/estaduais/municipais manualmente OU importar da API BrasilAPI (`https://brasilapi.com.br/api/feriados/v1/{ano}`)

---

## 🎨 DESIGN E UX

- **Mobile-first:** A maioria dos oficiais provavelmente acessará pelo celular
- **Responsivo:** funcionar bem em mobile, tablet e desktop
- **Acessibilidade:** labels nos inputs, contraste adequado, navegação por teclado
- **Tema:** cores institucionais (azul-marinho `#1e3a5f`, dourado `#c9a961` como destaque, branco e cinzas)
- **Tipografia:** Inter ou similar (sans-serif, profissional)
- **Feedback visual:** toasts de sucesso/erro em todas as ações
- **Loading states:** skeletons enquanto carrega dados
- **Confirmações:** modais de confirmação para ações destrutivas

---

## 🔒 SEGURANÇA

- Sanitizar todos os inputs (Zod validation)
- Rate limiting nas rotas de login (ex: 5 tentativas por minuto por IP) — usar Upstash Redis ou similar
- Senhas armazenadas com bcrypt (salt rounds = 10)
- HTTPS obrigatório (Vercel já fornece)
- Cookies de sessão `httpOnly`, `secure`, `sameSite: lax`
- CSRF protection (NextAuth já inclui)
- Variáveis sensíveis APENAS em `.env` (nunca commitar)
- Validar permissões em TODAS as rotas de API (não confiar só no frontend)

---

## 📁 ESTRUTURA DE PASTAS SUGERIDA

```
/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── agenda/page.tsx
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx (dashboard)
│   │   │   │   ├── usuarios/page.tsx
│   │   │   │   ├── logs/page.tsx
│   │   │   │   ├── feriados/page.tsx
│   │   │   │   └── configuracoes/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── agenda/route.ts
│   │   │   ├── usuarios/route.ts
│   │   │   ├── feriados/route.ts
│   │   │   └── calendar/google/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── agenda/
│   │   ├── admin/
│   │   └── shared/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── validators.ts (Zod schemas)
│   │   ├── utils.ts
│   │   └── cpf.ts (validador de CPF)
│   ├── hooks/
│   ├── types/
│   └── middleware.ts
├── public/
├── .env.local.example
├── README.md
└── package.json
```

---

## 📦 ENTREGAS ESPERADAS

1. **Código completo** funcionando localmente com `npm run dev`
2. **README.md** com:
   - Instruções de instalação local
   - Como configurar o banco de dados
   - Como rodar o seed do admin master
   - Como fazer deploy no Vercel passo a passo
   - Lista de variáveis de ambiente necessárias
3. **Arquivo `.env.local.example`** com todas as variáveis (sem valores)
4. **Migrations do Prisma** prontas
5. **Seed funcional** que cria o admin master automaticamente
6. **Testes básicos** (opcional, mas desejável) das funções críticas: validação de CPF, validação de RE, autenticação

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [ ] Aplicação publicada no Vercel funciona com banco PostgreSQL
- [ ] Admin master (CPF/senha definidos no seed via env vars) faz login com sucesso
- [ ] Admin consegue cadastrar novo oficial pelo painel
- [ ] Oficial consegue logar com CPF + RE
- [ ] Oficial consegue cadastrar/editar/excluir sua escala semanal
- [ ] Feriados e fins de semana aparecem inibidos visualmente, mas permitem agendamento com confirmação
- [ ] Dashboard mostra a grade consolidada de todos os oficiais
- [ ] Logs de auditoria registram todas as alterações com data/hora
- [ ] Compartilhamento na Google Agenda funciona (via link ou OAuth)
- [ ] Admin consegue alterar a própria senha
- [ ] Aplicação é responsiva e funciona bem no celular

---

## 🚀 ORDEM DE DESENVOLVIMENTO RECOMENDADA

1. Setup do projeto Next.js + Prisma + Tailwind + shadcn/ui
2. Schema do banco + migrations + seed do admin master
3. Sistema de autenticação (NextAuth com Credentials)
4. Tela de login (CPF → RE / senha)
5. Tela de agenda semanal do oficial
6. CRUD de agendas
7. Dashboard administrativo
8. Gestão de usuários (admin)
9. Logs de auditoria
10. Integração com feriados (BrasilAPI)
11. Compartilhamento Google Calendar
12. Polimento de UI/UX
13. url github do projeto: https://github.com/LfernandoSAP/agenda_oficiais_5bprv.git
14. Deploy no Vercel: https://vercel.com/lfernandosap-7867s-projects/agenda-oficiais-5bprv
15. use a aparencia visual do projeto: https://frontendaplicacoes5bprvvercel-31aa2byqh.vercel.app/

---

## 💡 INSTRUÇÕES FINAIS PARA O CLAUDE CODE

- **Comece criando o projeto do zero** com `npx create-next-app@latest` (TypeScript, App Router, Tailwind)
- **Pergunte antes de tomar decisões críticas** (ex: qual provedor de banco usar, se quero OAuth Google ou só link `.ics`)
- **Crie commits semânticos** a cada funcionalidade concluída
- **Documente decisões importantes** em comentários no código
- **Não invente requisitos:** se algo não estiver claro, pergunte
- **Priorize código limpo, tipado e testável**
- **Use Server Components do Next.js sempre que possível** (melhor performance)
- **Server Actions** para mutações simples (criar/editar agenda)
- **Route Handlers (API Routes)** para integrações externas (Google, BrasilAPI)
