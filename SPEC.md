# ESPECIFICAÇÃO — AGENDA SEMANAL DOS COMANDANTES DO 5º BPRv

> 📌 **Este documento reflete o estado ATUAL do sistema em produção** (atualizado 26/MAI/2026).
> A versão original (prompt de criação) está preservada ao final em [Apêndice A](#apêndice-a--prompt-original-de-criação).
> Operação e armadilhas técnicas: ver [README.md](README.md) e [CLAUDE.md](CLAUDE.md).

---

## 📋 CONTEXTO E OBJETIVO

Aplicação web responsiva (mobile-first) chamada **"Agenda Semanal de Comandantes do 5º BPRv"**, publicada no Vercel. Substitui o processo manual onde oficiais enviavam suas agendas semanais por e-mail/mensagem ao RH, que compilava em Excel para o Comandante.

Cada oficial cadastra sua própria agenda no sistema. O RH/Comandante (perfil admin) visualiza tudo num dashboard consolidado em tempo real.

🌐 **Produção:** https://agenda-oficiais-5bprv.vercel.app

---

## 🛠️ STACK TECNOLÓGICO (atual)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) + TypeScript | 15.5.18 |
| Estilização | Tailwind CSS | v4 |
| Banco | PostgreSQL (Supabase) | - |
| ORM | Prisma | 5.22 |
| Autenticação | NextAuth.js v5 (Auth.js) + Credentials | beta.31 |
| Validação | Zod | v4 |
| Datas | date-fns (pt-BR) | 4.2 |
| Ícones | lucide-react | 1.16 |
| Toasts | sonner | 2.0 |
| Deploy | Vercel | - |

⚠️ **Não atualizar Next 16 ou Prisma 7** — ver README seção "Armadilhas".

---

## 🗄️ MODELAGEM DO BANCO (atual — Prisma 5.22)

```prisma
model User {
  id           String   @id @default(cuid())
  cpf          String?  @unique               // NULLABLE — não é mais login (campo opcional)
  re           String   @unique               // login do sistema
  nomeCompleto String                          // "Nome de guerra"
  posto        Posto
  unidade      Unidade?                        // NULL para oficiais antigos
  email        String?
  isAdmin      Boolean  @default(false)
  passwordHash String?                         // só para admins
  ativo        Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt

  agendas Agenda[]
  logs    AuditLog[]
}

enum Posto {
  CEL_PM      // Cel PM
  TEN_CEL_PM  // Ten Cel PM
  MAJ_PM      // Maj PM
  CAP_PM      // Cap PM
  TEN_PM      // Ten PM
  P1          // P1
}

enum Unidade {
  EM          // Estado-Maior
  CIA_1       // 1ª Cia
  CIA_2       // 2ª Cia
  CIA_3       // 3ª Cia
  CIA_4       // 4ª Cia
}

model Agenda {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  data        DateTime     @db.Date            // UTC midnight — usar dateKey() no client!
  tipo        TipoEscala
  observacao  String?                          // máx 200 chars
  isFeriado   Boolean      @default(false)
  isFimSemana Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([userId, data])
  @@index([data])
}

enum TipoEscala {
  CURSO                  // Curso/Capacitação
  DISPENSA_MEDICA        // Dispensa Médica
  EAP                    // EAP (Estágio de Aperfeiçoamento Profissional)
  EXPEDIENTE_NORMAL      // Exp. Normal
  FERIAS                 // Férias
  FOLGA_SEMANAL          // Folga Semanal
  MISSAO                 // Missão/Operação
  OUTROS                 // texto livre na observação
}

model Feriado {
  id        String      @id @default(cuid())
  data      DateTime    @db.Date @unique
  nome      String
  tipo      TipoFeriado
  createdAt DateTime    @default(now())
}
// ⚠️ Não é mais usada — feriados são nativos em lib/feriados.ts (algoritmo Páscoa Gregoriana)

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
  acao       String                            // "LOGIN", "CRIOU_OU_ALTEROU_AGENDA", "ALTEROU_USUARIO", etc
  entidade   String                            // "Agenda", "User"
  entidadeId String?
  detalhes   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}

model LoginAttempt {
  id        String   @id @default(cuid())
  re        String?                            // antes era `cpf` — renomeado 26/MAI/2026
  ipAddress String?
  sucesso   Boolean  @default(false)
  motivo    String?
  createdAt DateTime @default(now())

  @@index([re, createdAt])
  @@index([ipAddress, createdAt])
}
```

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO (atual)

### Fluxo de Login

**Oficial comum:**
1. Tela inicial pede **RE** (máscara `000000-X`, 6 dígitos + traço + 1 alfanumérico)
2. Sistema valida formato e checa se RE está ativo no banco
3. RE válido → cria sessão JWT e redireciona para `/agenda`
4. **Sem segundo fator** (não pede CPF nem senha)

**Admin:**
1. RE → sistema detecta `isAdmin: true`
2. Pede **SENHA** → bcrypt compare → cria sessão admin
3. Redireciona para `/admin`

### Validação do RE
- Formato: `XXXXXX-X` (regex `/^\d{6}-[0-9A-Za-z]$/`)
- Dígito final pode ser número (0-9) OU letra (A-Z)
- Máscara aplicada automaticamente enquanto digita

### CPF (legado)
- Campo no User permanece, mas **nullable e não usado para login**
- Validador `lib/cpf.ts` permanece para casos futuros (cadastro com CPF opcional, etc.)

### Rate limiting
- **5 falhas/RE** e **20 falhas/IP** em janela de 10 min
- Implementado em `lib/rateLimit.ts` via tabela `LoginAttempt`

### Permissões
- **Comum:** vê e edita APENAS sua própria agenda
- **Admin:** vê dashboard completo, escala de todos, logs, gerencia usuários
- Proteção em cada Server Component via `auth()` (sem `middleware.ts` — Edge não aceita Prisma)

### Admin master inicial
- `ADMIN_INITIAL_RE` (env, default `000000-0`)
- `ADMIN_INITIAL_PASSWORD` (env, mín 8 caracteres, nunca commitada)
- ⚠️ Trocar senha após primeiro login em Admin → Config

---

## 📱 TELAS E FUNCIONALIDADES

### 🏠 Tela 1 — Login (`/login`)
- Header: "● Portal Operacional" + logos (asa rodoviária + brasão 5º BPRv + logo 5RV)
- Título: "5º BPRv" (Georgia) + "O Guardião das Rodovias do Sudoeste Paulista"
- Subtítulo: "Agenda Semanal de Comandantes — Acesso restrito a oficiais cadastrados"
- **Input único:** RE (`000000-X`) → botão "Continuar"
- Se admin → mostra campo de senha
- Se comum → login direto após RE
- Brackets dourados HUD nos 4 cantos
- Cores institucionais: `#0a1f3d`, `#1e3a5f`, `#c9a961`

### 📅 Tela 2 — Agenda do Oficial (`/agenda`)
- **Header:** logos + posto + nome de guerra + RE + botão Sair
- **Seletor de semana:** `< Anterior | Semana de DD a DD/MES/YYYY | Próxima >`
- **Grid de 7 cards** (Seg–Dom): gradiente colorido por tipo, borda 6px à esquerda + emoji, ring dourado em "hoje"
- **Sábado/domingo/feriados:** opacidade reduzida, modal de confirmação antes de agendar
- **Dias passados:** card cinza com cadeado "🔒 Dia encerrado" — clique bloqueado (toast de erro + UI desabilitada)
- **Modal de cadastro/edição:**
  - Select de tipo (8 opções, ver enum acima)
  - Textarea de observação (200 chars máx)
  - Botões: Salvar / Cancelar / Excluir (se já existir)
- **Legenda** completa no rodapé com cores

### 📊 Tela 3 — Painel Admin (`/admin`)

#### Aba "Agenda de Oficiais"
- **Cards de estatísticas:** Total de oficiais, Agendas na semana, % lançaram esta semana
  - ⚠️ **Admins não contam** nessas estatísticas
- **Seletor de semana** + **Select de Unidade** (Todas / EM / 1ª–4ª Cia) — URL param `?unidade=CIA_1`
- **Grade consolidada:** linhas = oficiais, colunas = dias
  - **Zebra rows** (branco/cinza alternando) + hover âmbar
  - Cada célula: badge colorido com tipo + observação truncada (`line-clamp-3` + `title=` para hover)
  - Coluna Oficial: primeiro nome + posto
- **Admins não aparecem** na grade

#### Aba "Usuários"
- Lista todos os usuários (inclui admins, ativos e inativos)
- Botão "Cadastrar oficial" → modal com:
  - Tipo de acesso (Comum / Admin)
  - RE (obrigatório)
  - Unidade (select obrigatório)
  - Nome de guerra
  - Posto
  - E-mail (opcional)
  - Senha (se admin)
- Coluna **Unidade** na tabela
- Ações por linha: **Editar** (não exclui — só desativa)

#### Aba "Logs"
- Tabela de auditoria: Data/Hora · Usuário · Ação · Entidade
- Botão "Carregar logs" (lazy load)

#### Aba "Config"
- Alterar senha do admin logado (senha atual + nova + confirmar)

---

## 🔒 BLOQUEIO DE DIAS PASSADOS (regra de negócio)

Não é permitido **agendar, alterar nem excluir** agendas de dias anteriores à data atual.

- **UI** (`DiaCard.tsx`, `AgendaSemanal.tsx`): cartão desabilitado, ícone de cadeado, `cursor-not-allowed`, toast de erro se clique
- **Server** (`app/api/agenda/route.ts`): guarda em POST/PUT/DELETE com `dataIso < dateKey(new Date())` → 400

---

## 🎨 DESIGN E UX

- **Mobile-first:** maioria acessa pelo celular
- **Responsivo:** dois layouts separados (`sm:hidden` / `hidden sm:flex`) — não tudo num responsivo só
- **Cores institucionais:** azul-marinho `#1e3a5f`, dourado `#c9a961`
- **Tipografia:** Inter (sans), Georgia (serif para títulos grandes)
- **Feedback visual:** toasts sonner em todas as ações
- **Confirmações:** modais para ações destrutivas e dias especiais

### Cards de agenda (por tipo)
| Tipo | Gradient | Badge | Emoji |
|------|----------|-------|-------|
| EXPEDIENTE_NORMAL | emerald-50→green-50 | bg-emerald-500 | 💼 |
| FOLGA_SEMANAL | amber-50→yellow-50 | bg-amber-500 | 🌴 |
| FERIAS | sky-50→blue-50 | bg-sky-500 | ✈️ |
| DISPENSA_MEDICA | rose-50→red-50 | bg-rose-500 | 🩺 |
| CURSO | purple-50→violet-50 | bg-purple-500 | 📚 |
| MISSAO | orange-50→amber-50 | bg-orange-500 | 🎯 |
| EAP | cyan-50→teal-50 | bg-cyan-500 | 🎓 |
| OUTROS | slate-50→gray-50 | bg-slate-500 | 📋 |

---

## 🔒 SEGURANÇA

- Inputs sanitizados via Zod
- Rate limiting login: 5/RE + 20/IP em 10min
- Senhas em bcrypt (salt rounds = 10)
- HTTPS obrigatório (Vercel)
- Cookies `httpOnly`, `secure`, `sameSite: lax`
- CSRF via NextAuth
- Permissões validadas em TODA rota de API (`await auth()` + check `isAdmin`)
- Sem credenciais no repo (`.env.local` no `.gitignore`)
- Sem `middleware.ts` (Edge quebra Prisma)

---

## 📁 ESTRUTURA DE PASTAS (atual)

```
/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # cria admin master (RE de env)
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── agenda/page.tsx
│   │   └── admin/
│   │       └── page.tsx              # query + filtro de unidade
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── verificar-re/route.ts # checa RE + retorna isAdmin
│   │   ├── agenda/route.ts           # POST/PUT/DELETE (bloqueia dia passado)
│   │   ├── usuarios/route.ts         # GET/POST/PUT (com unidade)
│   │   └── admin/
│   │       ├── logs/route.ts
│   │       └── senha/route.ts
│   ├── layout.tsx
│   └── page.tsx                      # redirect → /login
├── components/
│   ├── agenda/
│   │   ├── AgendaSemanal.tsx
│   │   ├── DiaCard.tsx               # disabled se dia passado
│   │   └── ModalAgenda.tsx
│   ├── admin/
│   │   ├── DashboardAdmin.tsx        # filtro Unidade, zebra grade
│   │   └── ModalUsuario.tsx          # sem CPF, com Unidade
│   └── shared/
├── lib/
│   ├── auth.ts                       # NextAuth (login por RE)
│   ├── auth.config.ts                # JWT/session/authorized callbacks
│   ├── prisma.ts
│   ├── cpf.ts                        # validador de CPF (uso opcional)
│   ├── validators.ts                 # Zod (reSchema, usuarioSchema com unidade)
│   ├── rateLimit.ts                  # rate limit por RE
│   ├── utils.ts                      # formatarPosto, formatarUnidade, getSemana
│   ├── dateKey.ts                    # ⚠️ Date → "yyyy-MM-dd" TZ-safe
│   └── feriados.ts                   # feriados BR nativos
├── public/
│   └── imagens/                      # asa_rodoviaria, logo_coin2, logo_5rv
├── types/next-auth.d.ts
├── README.md
├── CLAUDE.md                         # instruções para sessões futuras
├── SPEC.md                           # este arquivo
└── package.json
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

- [x] Publicação no Vercel + PostgreSQL Supabase
- [x] Admin master via env vars (`ADMIN_INITIAL_RE` + `ADMIN_INITIAL_PASSWORD`)
- [x] Admin cadastra novo oficial pelo painel (com Unidade)
- [x] Oficial loga apenas com RE
- [x] Oficial cadastra/edita/exclui sua escala semanal
- [x] Feriados/fim de semana inibidos visualmente + confirmação
- [x] Dias passados bloqueados (agendar/alterar/excluir)
- [x] Dashboard com grade consolidada (filtro por Unidade)
- [x] Admins não impactam estatísticas
- [x] Logs registram alterações com data/hora
- [x] Admin altera própria senha
- [x] Responsivo mobile + desktop
- [x] Rate limit em login

### Pendentes (não implementados ainda)
- [ ] Exportar grade para Excel/PDF
- [ ] Compartilhamento Google Agenda + `.ics`
- [ ] Filtros adicionais nos logs (por usuário, ação, data)

---

## 🚀 ORDEM DE DESENVOLVIMENTO (histórica)

1. ✅ Setup Next.js + Prisma + Tailwind
2. ✅ Schema + migrations + seed admin
3. ✅ Autenticação NextAuth (inicialmente CPF→RE/senha, depois só RE)
4. ✅ Tela de login
5. ✅ Agenda semanal do oficial
6. ✅ CRUD agendas
7. ✅ Dashboard admin (renomeado "Grade" → "Agenda de Oficiais")
8. ✅ Gestão de usuários (com Unidade)
9. ✅ Logs auditoria
10. ✅ Feriados nativos
11. ⏳ Compartilhamento Google Calendar
12. ✅ Polimento de UI/UX
13. ✅ GitHub: https://github.com/LfernandoSAP/agenda_oficiais_5bprv.git
14. ✅ Vercel: https://agenda-oficiais-5bprv.vercel.app
15. ✅ Visual baseado em https://frontendaplicacoes5bprvvercel-31aa2byqh.vercel.app/

---

## 📜 HISTÓRICO DE EVOLUÇÃO

### Marcos principais

- **Inicial:** login CPF→RE (comum) / CPF→senha (admin), 5 postos, 7 tipos de escala
- **~24/MAI/2026:** EAP adicionado (cyan), rate limit login (5/CPF, 20/IP em 10min), posto P1, label "Nome completo" → "Nome de guerra"
- **26/MAI/2026 — mudança grande:**
  - Login só por **RE** (CPF virou campo opcional)
  - Enum `Unidade` adicionado (EM, CIA_1..CIA_4)
  - `LoginAttempt.cpf` renomeado para `re` (rate limit por RE)
  - Aba "Grade" renomeada para "Agenda de Oficiais"
  - Grade admin: zebra rows + observações visíveis
  - **Bloqueio de dias passados** (UI + server)
  - Filtro **Unidade** no painel admin (URL `?unidade=`)
  - Admins **excluídos** da grade e estatísticas (continuam na aba Usuários)
  - Selects com `text-gray-900` (opções estavam transparentes)

---

# Apêndice A — Prompt original de criação

> 📜 Mantido por valor histórico. Não reflete o estado atual em diversos pontos (login, postos, unidades, tipos de escala). Para o estado atual, ver acima.

## PROMPT PARA CLAUDE CODE - AGENDA SEMANAL DOS COMANDANTES DO 5º BPRv (versão original)

### 📋 CONTEXTO E OBJETIVO

Desenvolva uma aplicação web responsiva (mobile-first) chamada **"Agenda Semanal de Comandantes do 5º BPRv"** para ser publicada no **Vercel**. A aplicação substituirá o processo manual onde oficiais enviam suas agendas semanais por e-mail/mensagem ao RH, que compila tudo em planilhas Excel para entregar ao Comandante.

A nova solução permitirá que cada oficial cadastre sua própria agenda diretamente no sistema, e o RH/Comandante visualize tudo em um dashboard centralizado em tempo real.

### 🛠️ STACK ORIGINAL

- Framework: Next.js 14+ (App Router) com TypeScript
- Estilização: Tailwind CSS + shadcn/ui (componentes)
- Banco: Vercel Postgres (Neon) OU Supabase (PostgreSQL)
- ORM: Prisma
- Autenticação: NextAuth.js v5 (Auth.js) com Credentials Provider customizado
- Validação: Zod
- Formulários: React Hook Form
- Datas: date-fns (com locale pt-BR)
- Ícones: lucide-react
- Toasts: sonner
- Deploy: Vercel

### 🔐 REGRAS ORIGINAIS DE AUTENTICAÇÃO

- Fluxo: CPF → (RE para comum, Senha para admin)
- Validação CPF (algoritmo oficial), armazenar 11 dígitos sem máscara
- Validação RE com regex `/^\d{6}-[0-9A-Za-z]$/`

> ⚠️ **Hoje (26/MAI/2026):** login é apenas por RE. CPF virou opcional. Ver seção atual acima.

### 🎯 POSTOS ORIGINAIS
`CEL_PM` · `TEN_CEL_PM` · `MAJ_PM` · `CAP_PM` · `TEN_PM`

> ⚠️ Hoje inclui também `P1`.

### 📋 TIPOS DE ESCALA ORIGINAIS
`EXPEDIENTE_NORMAL` · `FOLGA_SEMANAL` · `FERIAS` · `DISPENSA_MEDICA` · `CURSO` · `MISSAO` · `OUTROS`

> ⚠️ Hoje inclui também `EAP`.

### 💡 INSTRUÇÕES FINAIS ORIGINAIS

- Pergunta antes de tomar decisões críticas (ex: provedor de banco, OAuth Google ou só link `.ics`)
- Commits semânticos
- Server Components + Server Actions quando possível
- Route Handlers para integrações externas
