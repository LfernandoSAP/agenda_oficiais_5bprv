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

> **Mudança 26/MAI/2026:** login agora é por **RE** (não mais por CPF). Usuários preferem decorar o RE.

**Oficial comum:**
1. Tela inicial pede **RE** (máscara `000000-X`)
2. Sistema valida formato e checa se RE está ativo no banco
3. RE válido → cria sessão e redireciona para `/agenda`
4. **Sem segundo fator** (não pede CPF, senha ou outro)

**Admin:**
1. RE → sistema detecta `isAdmin: true`
2. Pede **senha** → bcrypt compare → sessão admin
3. Redireciona para `/admin`

🚫 **Sem `middleware.ts` / `proxy.ts`** — proteção de rota é feita em cada Server Component via `auth()`. Edge Runtime não aceita Prisma/bcrypt.

🔁 **Rate limit:** 5 falhas/RE e 20 falhas/IP em janela de 10 min (`lib/rateLimit.ts`, tabela `LoginAttempt`).

### Admin master inicial
- **RE:** definido pela env `ADMIN_INITIAL_RE` (default `000000-0`)
- **Senha:** lida de `ADMIN_INITIAL_PASSWORD` no momento do seed — nunca commitada
- ⚠️ **Trocar a senha após primeiro login** em Admin → Config

🔒 Nunca commitar credenciais reais. Use `.env.local` (já no `.gitignore`).

---

## 📅 Funcionalidades

### Oficial (`/agenda`)
- Cards da semana (Seg–Dom) com gradiente colorido por tipo de escala
- 8 tipos: Exp. Normal, Folga Semanal, Férias, Dispensa Médica, Curso, Missão, EAP, Outros
- Borda esquerda 6px + emoji temático por tipo
- Feriados nacionais + Carnaval/Sexta Santa/Corpus Christi (nativos)
- Sábado/Domingo/Feriados com modal de confirmação antes de agendar
- Hoje destacado com ring dourado
- Navegação por semana (Anterior / Atual / Próxima)
- Legenda completa no rodapé
- 🔒 **Dias passados são bloqueados** (não permite agendar/alterar/excluir) — UI mostra "🔒 Dia encerrado", servidor valida em `POST/PUT/DELETE /api/agenda`

### Admin (`/admin`)
- **Agenda de Oficiais** (antiga "Grade"): tabela oficial × dias com cores por tipo
  - **Zebra rows** (branco/cinza alternando) para facilitar leitura
  - **Observações visíveis** abaixo do tipo (com hover/title)
  - **Filtro por Unidade:** select "Todas / EM / 1ª–4ª Cia" via URL param `?unidade=CIA_1` (persiste em F5)
  - **Admins não aparecem** na grade nem entram nos cards de estatística (Total, %, Agendas)
- **Usuários:** cadastrar/editar/desativar (RE, nome, posto, unidade, e-mail). Não exclui — só desativa.
- **Logs:** auditoria (login, criou/alterou/deletou agenda, alterou usuário, alterou senha)
- **Config:** alterar senha do admin

### Postos suportados
`CEL_PM` · `TEN_CEL_PM` · `MAJ_PM` · `CAP_PM` · `TEN_PM` · `P1`

### Unidades suportadas
`EM` (Estado-Maior) · `CIA_1` · `CIA_2` · `CIA_3` · `CIA_4` (exibido como "1ª Cia", "2ª Cia"...)

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
| `ADMIN_INITIAL_RE` | RE do admin master (formato `000000-X`). Default no seed: `000000-0` |
| `ADMIN_INITIAL_PASSWORD` | Senha inicial do admin master (mín. 8 caracteres) |

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
- **Framework setting:** `nextjs`
- **Deployment Protection:** desabilitado (`ssoProtection: null`)

### Build pipeline
- `npm install` → roda `postinstall: prisma generate`
- `npm run build` → `prisma generate && next build`

### ⚠️ Migrações de schema em produção
A pipeline da Vercel **não roda** `prisma db push` automaticamente. Quando o schema mudar:
1. **Opção A — fora da rede PM** (DNS bloqueia AWS Supabase nas portas 5432/6543): rodar `npx prisma db push` localmente.
2. **Opção B — SQL Editor do Supabase Dashboard:** colar `migracao_*.sql` (criado ad-hoc por mudança).
3. **Opção C — endpoint one-shot:** criar `/api/admin/migrate` protegido por env `MIGRATE_TOKEN`, rodar com `curl -X POST -H "x-migrate-token: <token>" ...` e remover depois. (Foi usado na migração CPF→RE de 26/MAI/2026.)

---

## 📁 Estrutura

```
/
├── prisma/
│   ├── schema.prisma         # User, Agenda, AuditLog, LoginAttempt
│   └── seed.ts               # cria admin master (RE de env)
├── app/
│   ├── (auth)/login/         # login institucional (RE → senha se admin)
│   ├── (dashboard)/
│   │   ├── agenda/           # agenda do oficial
│   │   └── admin/            # painel administrativo
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/    # NextAuth
│   │   │   └── verificar-re/     # checa RE existe + retorna isAdmin
│   │   ├── agenda/           # CRUD agendas (upsert, bloqueia dia passado)
│   │   ├── usuarios/         # gestão de oficiais
│   │   └── admin/            # logs + alterar senha
│   ├── layout.tsx            # Inter font + Toaster sonner
│   └── page.tsx              # redirect → /login
├── components/
│   ├── agenda/               # AgendaSemanal, DiaCard, ModalAgenda
│   ├── admin/                # DashboardAdmin, ModalUsuario
│   └── shared/
├── lib/
│   ├── auth.ts               # NextAuth config (RE-based)
│   ├── auth.config.ts        # callbacks JWT/session/authorized
│   ├── prisma.ts             # singleton client
│   ├── cpf.ts                # validador (ainda usado para o campo opcional CPF)
│   ├── validators.ts         # schemas Zod (reSchema, usuarioSchema c/ unidade)
│   ├── rateLimit.ts          # rate limit por RE + IP
│   ├── utils.ts              # helpers (getSemana, formatarPosto, formatarUnidade, ...)
│   ├── dateKey.ts            # ⚠️ converte Date → yyyy-MM-dd TZ-safe
│   └── feriados.ts           # feriados BR nativos
├── public/imagens/           # asa_rodoviaria, logo_coin2, logo_5rv
└── types/next-auth.d.ts      # extend Session/JWT
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

### Tamanhos dos logos
| Logo | /login mobile | /login desktop | /agenda + /admin mobile | /agenda + /admin desktop |
|------|---------------|----------------|-------------------------|--------------------------|
| **asa_rodoviaria.png** (retangular) | `w-[120px] h-[90px]` | `w-[200px] h-[150px]` | `w-[90px] h-[65px]` | `w-[130px] h-[95px]` |
| **logo_coin2.png** (quadrado central) | `w-20 h-20` | `w-36 h-36` | `w-16 h-16` | `w-20 h-20` |
| **logo_5rv.png** (quadrado direita) | `w-16 h-16` | `w-28 h-28` | `w-12 h-12` | `w-16 h-16` |

⚠️ A asa é horizontal — sempre container retangular (~1.3:1), não quadrado.

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

### Detalhes
- Tag "● PORTAL OPERACIONAL" dourada no login
- Brackets dourados nos 4 cantos (estilo HUD militar) no login
- Linha dourada decorativa no topo/rodapé dos headers
- Cards com hover: elevação 0.5px + barra dourada animada
- Hoje destacado com `ring-2 ring-[#c9a961] ring-offset-2`
- Dia passado: `opacity-50 grayscale cursor-not-allowed`
- Selects: `text-gray-900` para legibilidade das opções

---

## 📱 Responsividade

### Layout headers (/agenda e /admin)
- **Mobile (`< 640px`):** layout empilhado — logos centralizados em cima + perfil/Sair embaixo
- **Desktop (`≥ 640px`):** tudo em linha — logos + título à esquerda, perfil + Sair à direita

### Grid de cards (/agenda)
`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

### Filtro de Unidade (/admin)
- **Mobile:** abaixo do seletor de semana
- **Desktop:** à direita do seletor de semana, separado por border-l

---

## 🐛 Armadilhas resolvidas — NÃO REINTRODUZIR

### 1. Timezone bug (`@db.Date` em UTC-3)
PostgreSQL armazena `@db.Date` como UTC. Em UTC-3, `.getDate()` recua 1 dia.

**Solução:** `lib/dateKey.ts`. Server pages normalizam Date → string antes de enviar ao client.

❌ Nunca `format(date, "yyyy-MM-dd")` para comparar. Sempre `dateKey(date)`.

### 2. NextAuth + Edge Runtime
Next 16 deprecou `middleware.ts` para `proxy.ts`. Edge não aceita Prisma/bcrypt → 404 em todas as rotas.

**Solução:** sem middleware/proxy. Auth verificada em cada Server Component via `auth()`.

### 3. Prisma 7 incompatível
Prisma 7 mudou API (`url` no `prisma.config.ts`). Build quebra na Vercel.

**Solução:** Prisma 5.22. Schema usa `provider = "prisma-client-js"` + `@db.Date`.

### 4. Next.js 16 incompatibilidade Vercel
Build falha de várias formas. **Solução:** Next 15.5.

### 5. Vercel Deployment Protection
Projetos novos têm SSO protection → 401 em tudo (cookie `_vercel_sso_nonce`).

**Solução:** `PATCH /v9/projects/{id}` com `{ssoProtection: null, passwordProtection: null}`.

### 6. Framework não setado no Vercel
Sem `framework: "nextjs"` → 404 (`X-Vercel-Error: NOT_FOUND`).

**Solução:** `PATCH /v9/projects/{id}` com `{framework: "nextjs"}`.

### 7. Branch produção `main` vs local `master`
Sempre `git push origin master:main` para produção.

### 8. Prisma `findUnique` com filtro não-único
Usar `findFirst` quando há filtros não-únicos no `where`.

### 9. Upsert em vez de create
Constraint `@@unique([userId, data])` quebra `create` quando registro já existe.

**Solução:** `prisma.agenda.upsert` com `where: { userId_data: { userId, data } }`.

### 10. Zod v4 mudou API
`parsed.error.errors` → `parsed.error.issues`.

### 11. Senha Supabase com chars especiais
`@pmr!sorocaba#` → `%40pmr%21sorocaba%23`.

### 12. Imagem horizontal em container quadrado
A asa é horizontal. Container quadrado + `object-contain` = imagem visualmente pequena.

**Solução:** container retangular (~1.3:1).

### 13. Login via CPF → RE
Usuários preferem decorar o RE. CPF virou nullable.

**Solução:** `prisma.user.findFirst({ where: { re, ativo: true } })`. Rate limit migrou de `LoginAttempt.cpf` → `LoginAttempt.re`.

### 14. Bloqueio de dias passados
Não permitir agendar/alterar/excluir dias anteriores.

**Solução:** comparar `dateKey(dia) < dateKey(new Date())` em UI (DiaCard `disabled`) e server (`POST/PUT/DELETE /api/agenda`).

### 15. Admins poluindo estatísticas
Admins fiscalizam, não inserem agenda — não devem entrar no % "Lançaram esta semana".

**Solução:** server filtra `isAdmin: false` na grade e em `prisma.user.count` para stats. Continuam aparecendo na aba **Usuários** (gestão).

### 16. DNS PM bloqueia Supabase
Rede PM bloqueia portas 5432/6543 do AWS Supabase. `prisma db push` falha localmente.

**Solução:** rodar fora da rede PM, OU via SQL Editor do Supabase, OU endpoint one-shot `/api/admin/migrate` protegido por token (criado ad-hoc).

### 17. Opções de `<select>` transparentes
Sem `text-gray-900` explícito, opções renderizam com texto quase invisível em alguns navegadores.

**Solução:** `className="text-gray-900"` no `<select>` e em cada `<option>`.

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

# Inspecionar deploy (com logs runtime)
npx vercel inspect --logs https://agenda-oficiais-5bprv.vercel.app

# Logs filtrados por status
npx vercel logs --status-code 500 --since 10m --no-follow --expand --no-branch

# Realiar produção
npx vercel alias <new-url> agenda-oficiais-5bprv.vercel.app

# Banco
npx prisma studio
npx prisma db push            # cuidado fora da rede PM
npx prisma migrate reset      # apaga tudo (cuidado!)
```

---

## 👤 Co-autoria

Desenvolvido em parceria com Claude (Sonnet 4.6 / Opus 4.7) via Claude Code.
