# Agenda Semanal de Comandantes — 5º BPRv

Aplicação web responsiva (mobile-first) para gestão de agenda semanal dos oficiais do 5º Batalhão de Polícia Rodoviária do Sudoeste Paulista.

🌐 **Produção:** https://agenda-oficiais-5bprv.vercel.app
📂 **Repositório:** https://github.com/LfernandoSAP/agenda_oficiais_5bprv

---

## 🛠️ Stack

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
| Imagens | next/image (com `<Image fill>`) | - |
| Deploy | Vercel | - |

⚠️ **Não atualizar Next.js para 16 ou Prisma para 7** — incompatibilidades conhecidas com Vercel/runtime (ver seção "Armadilhas").

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

🚫 **Sem `middleware.ts` / `proxy.ts`** — proteção de rota é feita em cada Server Component via `auth()`. Edge Runtime não aceita Prisma/bcrypt.

### Admin master inicial
| Campo | Valor |
|-------|-------|
| CPF | `164.451.118-58` |
| Senha | `[REDACTED]` |

⚠️ **Trocar a senha após primeiro login** em Admin → Config.

---

## 📅 Funcionalidades

### Oficial (`/agenda`)
- Cards da semana (Seg–Dom) com gradiente colorido por tipo de escala
- 7 tipos: Exp. Normal, Folga Semanal, Férias, Dispensa Médica, Curso, Missão, Outros
- Borda esquerda 6px + emoji temático por tipo
- Feriados nacionais + Carnaval/Sexta Santa/Corpus Christi (nativos)
- Sábado/Domingo/Feriados com modal de confirmação antes de agendar
- Hoje destacado com ring dourado
- Navegação por semana (Anterior / Atual / Próxima)
- Legenda completa no rodapé

### Admin (`/admin`)
- **Grade:** tabela oficial × dias com cores por tipo
- **Usuários:** cadastrar/editar/desativar (CPF, RE, nome, posto, e-mail). Não exclui — só desativa.
- **Logs:** auditoria (login, criou/alterou/deletou agenda, alterou usuário, alterou senha)
- **Config:** alterar senha do admin

### Postos suportados
`CEL_PM` (Cel PM) · `TEN_CEL_PM` (Ten Cel PM) · `MAJ_PM` (Maj PM) · `CAP_PM` (Cap PM) · `TEN_PM` (Ten PM)

---

## 🌱 Setup local

```bash
git clone https://github.com/LfernandoSAP/agenda_oficiais_5bprv.git
cd agenda_oficiais_5bprv
npm install
cp .env.local.example .env.local   # preencha as creds
npx prisma db push                  # sincroniza schema
npx prisma db seed                  # cria admin master
npm run dev
```

### Variáveis de ambiente

| Nome | Onde obter |
|------|-----------|
| `DATABASE_URL` | Supabase → Settings → Database → **Transaction pooler** (porta 6543) — `?pgbouncer=true` |
| `DIRECT_URL` | Supabase → **Direct connection** (porta 5432) |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | URL pública (ex: `https://agenda-oficiais-5bprv.vercel.app`) |

⚠️ Senhas com caracteres especiais (`@`, `#`, `!`) precisam **URL-encoding** na connection string:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`

Prisma lê apenas `.env` (não `.env.local`). Manter ambos sincronizados.

---

## 🚀 Deploy

### Branch de produção
**Vercel está configurado para `main`**. O repositório usa `master` localmente — push com `git push origin master:main` envia para a branch de produção.

### Fluxo
```bash
git push origin master:main              # auto-deploy Vercel
# ou
npx vercel deploy --prod --yes           # deploy manual
npx vercel alias <new-url> agenda-oficiais-5bprv.vercel.app   # se precisar realiar
```

### Vercel — IDs do projeto (caso precise via API)
- **projectId:** `prj_zLaUaOhIfrtM9q2dDbVHACJCwYCi`
- **orgId (team):** `team_jBrXZj8ohAoocm18YBroKzny`
- **GitHub repo:** `LfernandoSAP/agenda_oficiais_5bprv`
- **Production branch:** `main`
- **Framework setting:** `nextjs` (deve estar configurado, senão Vercel não serve nada e dá 404)
- **Deployment Protection:** **desabilitado** (`ssoProtection: null`, `passwordProtection: null`) — se ativado, retorna 401 em tudo

### Build pipeline
- `npm install` → roda `postinstall: prisma generate`
- `npm run build` → `prisma generate && next build`

---

## 📁 Estrutura

```
/
├── prisma/
│   ├── schema.prisma         # User, Agenda, Feriado (não usada), AuditLog
│   └── seed.ts               # cria admin master CPF 164.451.118-58
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
│   ├── layout.tsx            # Inter font + Toaster sonner
│   └── page.tsx              # redirect → /login
├── components/
│   ├── agenda/               # AgendaSemanal, DiaCard, ModalAgenda
│   ├── admin/                # DashboardAdmin, ModalUsuario
│   └── shared/
├── lib/
│   ├── auth.ts               # NextAuth config (Prisma + bcrypt) — Node runtime
│   ├── auth.config.ts        # config edge-safe (reservado, não em uso)
│   ├── prisma.ts             # singleton client
│   ├── cpf.ts                # validador oficial + máscara
│   ├── validators.ts         # schemas Zod
│   ├── utils.ts              # helpers (getSemana, formatarPosto, etc.)
│   ├── dateKey.ts            # ⚠️ converte Date → yyyy-MM-dd TZ-safe
│   └── feriados.ts           # feriados BR nativos (algoritmo Páscoa)
├── public/imagens/           # asa_rodoviaria, logo_coin2, logo_5rv
└── types/next-auth.d.ts      # extend Session/JWT com isAdmin, posto, etc.
```

---

## 🎨 Padrões Visuais

### Cores institucionais
- **Azul-marinho escuro:** `#0a1f3d`
- **Azul-marinho:** `#1e3a5f`
- **Dourado:** `#c9a961`
- Gradiente header: `linear-gradient(135deg, #0a1f3d 0%, #1e3a5f 50%, #0a1f3d 100%)`

### Tipografia
- **Sans-serif:** Inter (corpo)
- **Serif:** Georgia (títulos: "5º BPRv", número grande do dia no card)

### Tamanhos dos logos (regra atual)
| Logo | /login mobile | /login desktop | /agenda + /admin mobile | /agenda + /admin desktop |
|------|---------------|----------------|-------------------------|--------------------------|
| **asa_rodoviaria.png** (retangular) | `w-[120px] h-[90px]` | `w-[200px] h-[150px]` | `w-[90px] h-[65px]` | `w-[130px] h-[95px]` |
| **logo_coin2.png** (quadrado central) | `w-20 h-20` | `w-36 h-36` | `w-16 h-16` | `w-20 h-20` |
| **logo_5rv.png** (quadrado direita) | `w-16 h-16` | `w-28 h-28` | `w-12 h-12` | `w-16 h-16` |

⚠️ **A asa é horizontal (formato de asa)** — sempre usar container retangular (~1.3:1), não quadrado, ou ela aparece pequena devido ao `object-contain`.

### Espaçamento entre logos
- Login mobile: `gap-5` (20px) — desktop: `gap-10` (40px)
- /agenda + /admin: `gap-5` (20px)

### Cards de agenda (por tipo)
| Tipo | Gradient | Badge | Emoji |
|------|----------|-------|-------|
| EXPEDIENTE_NORMAL | emerald-50→green-50 | bg-emerald-500 | 💼 |
| FOLGA_SEMANAL | amber-50→yellow-50 | bg-amber-500 | 🌴 |
| FERIAS | sky-50→blue-50 | bg-sky-500 | ✈️ |
| DISPENSA_MEDICA | rose-50→red-50 | bg-rose-500 | 🩺 |
| CURSO | purple-50→violet-50 | bg-purple-500 | 📚 |
| MISSAO | orange-50→amber-50 | bg-orange-500 | 🎯 |
| OUTROS | slate-50→gray-50 | bg-slate-500 | 📋 |

### Detalhes
- Tag "● PORTAL OPERACIONAL" dourada no login
- Brackets dourados nos 4 cantos (estilo HUD militar) no login
- Linha dourada decorativa no topo e rodapé dos headers (gradient com via-[#c9a961])
- Cards com hover: elevação 0.5px + barra dourada animada (group-hover)
- Hoje destacado com `ring-2 ring-[#c9a961] ring-offset-2`

---

## 📱 Responsividade

### Layout headers (/agenda e /admin)
- **Mobile (`< 640px`):** layout empilhado — 3 logos centralizados em cima + perfil/Sair embaixo separados por linha dourada
- **Desktop (`≥ 640px`):** tudo em linha — logos + título à esquerda, perfil + Sair à direita

### Grid de cards (/agenda)
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

---

## 🐛 Armadilhas resolvidas — NÃO REINTRODUZIR

### 1. Timezone bug (`@db.Date` em UTC-3)
PostgreSQL armazena `@db.Date` como data UTC. Em UTC-3, `.getDate()` recuava 1 dia → agenda salva em terça aparecia na segunda.

**Solução:** `lib/dateKey.ts` com heurística — se `Date` está em UTC midnight (vem do banco), usa `getUTCDate()`; senão usa local. Server pages também normalizam Date → string antes de enviar ao client.

❌ Não usar `format(date, "yyyy-MM-dd")` para comparar datas — sempre `dateKey(date)`.

### 2. NextAuth + Edge Runtime
Next.js 16 deprecou `middleware.ts` em favor de `proxy.ts`. Edge Runtime não aceita Prisma/bcrypt → 404 em todas as rotas.

**Solução:** sem middleware/proxy. Auth verificada em cada Server Component via `auth()` de `lib/auth.ts`.

### 3. Prisma 7 incompatível
Prisma 7 mudou API (`url` no `prisma.config.ts`, não em `schema.prisma`). Build quebra na Vercel.

**Solução:** Prisma 5.22 (estável). Schema usa `provider = "prisma-client-js"` + `@db.Date` no campo `data`.

### 4. Next.js 16 incompatibilidade Vercel
Build falha de várias formas (Turbopack, types). **Solução:** Next 15.5.

### 5. Vercel Deployment Protection
Por padrão, projetos novos têm SSO protection → 401 em tudo (cookie `_vercel_sso_nonce`).

**Solução:** desabilitar via API: `PATCH /v9/projects/{id}` com `{ssoProtection: null, passwordProtection: null}`.

### 6. Framework não setado no Vercel
Sem `framework: "nextjs"` no projeto Vercel → retorna 404 (`X-Vercel-Error: NOT_FOUND`) mesmo com deploy Ready.

**Solução:** `PATCH /v9/projects/{id}` com `{framework: "nextjs"}`.

### 7. Branch produção `main` vs local `master`
Repo foi inicializado com `master`, Vercel deploya `main`. Push para preview, não produção.

**Solução:** sempre `git push origin master:main` para deploy de produção automático.

### 8. Prisma `findUnique` com filtro não-único
`findUnique({where: {cpf, ativo: true}})` falha — `ativo` não é único.

**Solução:** usar `findFirst` quando há filtros não-únicos no `where`.

### 9. Upsert em vez de create
Constraint `@@unique([userId, data])` quebra `create` quando registro já existe.

**Solução:** `prisma.agenda.upsert` com `where: { userId_data: { userId, data } }`.

### 10. Zod v4 mudou API
`parsed.error.errors` → `parsed.error.issues`.

### 11. Senha Supabase com chars especiais
`@pmr!sorocaba#` no DATABASE_URL precisa virar `%40pmr%21sorocaba%23`.

### 12. Imagem horizontal em container quadrado
A asa rodoviária é uma asa horizontal. Container quadrado + `object-contain` = imagem visualmente pequena.

**Solução:** container retangular (~1.3:1 — vide tabela de tamanhos).

---

## 📦 Scripts

```bash
npm run dev          # dev server local
npm run build        # prisma generate + next build
npm run start        # production server
npm run db:push      # sincroniza schema → banco
npm run db:seed      # cria admin master
npm run db:studio    # Prisma Studio (UI do banco)
```

---

## 🔧 Comandos úteis (debug / operação)

```bash
# Ver deploys recentes
npx vercel ls --prod

# Inspecionar deploy
npx vercel inspect <deployment-url>

# Realiar produção
npx vercel alias <new-url> agenda-oficiais-5bprv.vercel.app

# Logs do banco
npx prisma studio

# Sincronizar schema sem perder dados (cuidado)
npx prisma db push

# Resetar banco completo (apaga tudo)
npx prisma migrate reset
```

---

## 👤 Co-autoria

Desenvolvido em parceria com Claude (Sonnet 4.6 / Opus 4.7) via Claude Code.
