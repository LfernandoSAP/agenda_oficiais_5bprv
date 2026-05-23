# Agenda Semanal de Comandantes — 5º BPRv

Aplicação web responsiva (mobile-first) para gestão de agenda semanal dos oficiais do 5º Batalhão de Polícia Rodoviária do Sudoeste Paulista.

🌐 **Produção:** https://agenda-oficiais-5bprv.vercel.app
📂 **Repositório:** https://github.com/LfernandoSAP/agenda_oficiais_5bprv

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilização | Tailwind CSS v4 |
| Banco | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| Autenticação | NextAuth.js v5 (Auth.js) com Credentials |
| Validação | Zod |
| Datas | date-fns (pt-BR) |
| Ícones | lucide-react |
| Toasts | sonner |
| Deploy | Vercel |

---

## 🔐 Fluxo de Autenticação

**Oficial comum:**
1. Tela inicial pede **CPF** (máscara `000.000.000-00`)
2. Sistema valida CPF (algoritmo oficial) e checa se está ativo
3. Pede **RE** (formato `000000-X`, 6 dígitos + traço + 1 alfanumérico)
4. Valida RE bate com CPF → cria sessão JWT

**Admin:**
1. CPF → sistema detecta `isAdmin: true`
2. Pede **senha** → bcrypt compare → sessão admin

Sem proxy/middleware Edge — a verificação de sessão ocorre em cada Server Component via `auth()`. Cookies HttpOnly via NextAuth.

---

## 📅 Funcionalidades

### Oficial (`/agenda`)
- Visualização em cards da semana (Seg–Dom) com cores por tipo de escala
- 7 tipos: Exp. Normal, Folga Semanal, Férias, Dispensa Médica, Curso, Missão, Outros
- Feriados nacionais + Carnaval, Sexta-feira Santa, Corpus Christi (calculados via algoritmo Gregoriano)
- Estadual SP (9 de julho) incluso
- Sábado/Domingo/Feriados com aviso antes de agendar
- Navegação por semana (← → atual / anterior / próxima)

### Admin (`/admin`)
- **Grade Consolidada:** tabela oficial × dias com cores por tipo
- **Usuários:** cadastrar/editar/desativar oficiais (CPF, RE, nome, posto, e-mail)
- **Logs:** auditoria de todas as ações (login, criou/alterou/deletou agenda etc.)
- **Configurações:** alterar senha do admin

### Postos suportados
`Cel PM`, `Ten Cel PM`, `Maj PM`, `Cap PM`, `Ten PM`

---

## 🌱 Setup local

```bash
# 1. Clone e instale
git clone https://github.com/LfernandoSAP/agenda_oficiais_5bprv.git
cd agenda_oficiais_5bprv
npm install

# 2. Copie env e preencha com credenciais Supabase
cp .env.local.example .env.local

# 3. Aplique schema + cria admin master
npx prisma db push
npx prisma db seed

# 4. Roda dev server
npm run dev
```

### Variáveis de ambiente

| Nome | Onde obter |
|------|-----------|
| `DATABASE_URL` | Supabase → Settings → Database → **Transaction pooler** (porta 6543) |
| `DIRECT_URL` | Supabase → Settings → Database → **Direct connection** (porta 5432) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | URL pública (ex: `https://agenda-oficiais-5bprv.vercel.app`) |

⚠️ Senhas com caracteres especiais (`@`, `#`, `!`) precisam ser URL-encoded na connection string.

---

## 🚀 Deploy

Push para a branch `main` → Vercel faz build automático em produção.

```bash
# Adicionar/atualizar env vars no Vercel
npx vercel env add DATABASE_URL production
# (repetir para DIRECT_URL, AUTH_SECRET, NEXTAUTH_URL)

# Deploy automatico via GitHub
git push origin master:main
```

### Admin master inicial

| Campo | Valor |
|-------|-------|
| CPF | `164.451.118-58` |
| Senha | `[REDACTED]` |

⚠️ **Alterar a senha imediatamente após o primeiro login** em Admin → Config.

---

## 📁 Estrutura

```
/
├── prisma/
│   ├── schema.prisma         # User, Agenda, Feriado, AuditLog
│   └── seed.ts               # cria admin master
├── app/
│   ├── (auth)/login/         # tela de login institucional
│   ├── (dashboard)/
│   │   ├── agenda/           # agenda do oficial
│   │   └── admin/            # dashboard administrativo
│   ├── api/
│   │   ├── auth/             # NextAuth + verificar-cpf
│   │   ├── agenda/           # CRUD agendas (upsert)
│   │   ├── usuarios/         # gestão de oficiais
│   │   └── admin/            # logs + alterar senha
│   ├── layout.tsx
│   └── page.tsx              # redirect → /login
├── components/
│   ├── agenda/               # AgendaSemanal, DiaCard, ModalAgenda
│   ├── admin/                # DashboardAdmin, ModalUsuario
│   └── shared/
├── lib/
│   ├── auth.ts               # NextAuth config (Prisma + bcrypt)
│   ├── auth.config.ts        # config edge-safe (reservado p/ futuro)
│   ├── prisma.ts             # singleton client
│   ├── cpf.ts                # validador oficial + máscara
│   ├── validators.ts         # schemas Zod
│   ├── utils.ts              # helpers (semana, formatadores)
│   ├── dateKey.ts            # ⚠️ converte Date → yyyy-MM-dd TZ-safe
│   └── feriados.ts           # feriados BR nativos (algoritmo Páscoa)
├── public/imagens/           # asa_rodoviaria, logo_coin2, logo_5rv
└── types/next-auth.d.ts
```

---

## 🐛 Notas de arquitetura — armadilhas resolvidas

### 1. Timezone bug (UTC-3) — RESOLVIDO
O campo `data: DateTime @db.Date` é armazenado pelo Postgres como **data UTC**. Prisma retorna `Date(YYYY-MM-DDT00:00:00.000Z)`. Em UTC-3, `.getDate()` recuava 1 dia, fazendo agendas aparecerem no card do dia anterior.

**Solução:** `lib/dateKey.ts` detecta se o `Date` está em UTC midnight (vem do banco) e usa `getUTCDate()`; senão usa componentes locais (vindo de `date-fns startOfWeek`). Server pages também normalizam para string antes de passar ao client.

### 2. NextAuth + Edge Runtime — RESOLVIDO
Next.js 16 deprecou `middleware.ts` em favor de `proxy.ts`, e Edge Runtime não aceita Prisma/bcrypt. **Solução:** removido totalmente — autenticação é verificada em cada Server Component via `auth()`.

### 3. Prisma 7 incompatibilidade com Vercel — RESOLVIDO
Downgrade para Prisma 5.22 (estável). Schema usa `provider = "prisma-client-js"` com `@db.Date` para o campo `data`.

### 4. Feriados nativos
Removida dependência da API BrasilAPI. `lib/feriados.ts` calcula feriados via algoritmo Gregoriano de Páscoa (Carnaval = -47/-48 dias, Sexta Santa = -2, Corpus Christi = +60). Funciona para qualquer ano, offline.

### 5. Upsert em vez de create
`POST /api/agenda` usa `prisma.agenda.upsert` com unique `(userId, data)` — permite o oficial re-cadastrar/atualizar o mesmo dia sem erro de constraint.

### 6. findFirst em vez de findUnique
Prisma `findUnique` não aceita filtros não-únicos no `where`. Trocado para `findFirst` quando filtra por `cpf + ativo`.

---

## 🎨 Design

- **Cores institucionais:** azul-marinho `#0a1f3d` / `#1e3a5f`, dourado `#c9a961`
- **Tipografia:** Inter (sans-serif) + Georgia (serif para títulos)
- **Logos:** asa rodoviária + brasão 5º BPRv + escudo 5RV nos headers
- **Cards:** gradiente sutil por tipo de escala, borda esquerda colorida (6px)
- **Tag "Portal Operacional":** estilo institucional com cantos decorativos
- **Brackets dourados:** nos cantos da tela de login (estilo HUD militar)

---

## 📦 Scripts

```bash
npm run dev          # dev server local
npm run build        # build + prisma generate
npm run start        # production server
npm run db:push      # sincroniza schema → banco
npm run db:seed      # cria admin master
npm run db:studio    # Prisma Studio (UI do banco)
```

---

## 👤 Co-autoria

Desenvolvido em parceria com Claude (Sonnet 4.6 / Opus 4.7) via Claude Code.
