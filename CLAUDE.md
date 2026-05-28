# Instruções para Claude Code — Agenda 5º BPRv

Este arquivo orienta sessões futuras do Claude Code trabalhando neste projeto. Leia inteiro antes de editar.

---

## ⚠️ NÃO REGREDIR — versões travadas

| Pacote | Versão atual | Por quê |
|--------|--------------|---------|
| `next` | `^15.5.x` | Next 16 quebra build na Vercel + deprecia middleware → proxy |
| `prisma` | `^5.22.x` | Prisma 7 mudou API de datasource (url vai pro `prisma.config.ts`) |
| `@prisma/client` | `^5.22.x` | idem |
| `next-auth` | `^5.0.0-beta.31` | v4 não tem mesma API |
| `react` | `19.x` | compatível com Next 15 |

**Se o usuário pedir update, ALERTAR primeiro sobre as regressões anteriores.**

---

## 🚫 ARQUIVOS PROIBIDOS — não criar

| Arquivo | Por quê |
|---------|---------|
| `middleware.ts` | Edge Runtime quebra Prisma/bcrypt → 404 em tudo. Auth é server-side em cada page. |
| `proxy.ts` | Mesmo motivo. |
| `prisma.config.ts` | É de Prisma 7. No 5.x, config fica no `schema.prisma`. |

---

## 🔑 Login (atualizado 26/MAI/2026 — só RE, sem CPF)

**Fluxo:**
- Comum: digita RE → entra direto em `/agenda`
- Admin: digita RE → pede senha → entra em `/admin`

**Por quê:** usuários preferem decorar o RE; CPF virou nullable. Login antigo (`verificar-cpf`) foi removido. Endpoint atual: `POST /api/auth/verificar-re`.

**Rate limit:** `lib/rateLimit.ts` — 5 falhas/RE e 20 falhas/IP em 10 min, tabela `LoginAttempt` (campo `re`, antes era `cpf`).

```ts
// Auth (lib/auth.ts) — sempre por RE
const user = await prisma.user.findFirst({ where: { re, ativo: true } });
if (user.isAdmin) { /* bcrypt.compare(senha, hash) */ }
```

---

## 🏛️ Unidades (novo 26/MAI/2026)

Enum `Unidade { EM, CIA_1, CIA_2, CIA_3, CIA_4 }`. Campo `User.unidade` é **nullable**.

Display: `formatarUnidade()` em `lib/utils.ts` retorna `"EM"`, `"1ª Cia"`, ..., `"4ª Cia"`, ou `"—"` para null.

Filtro no painel admin via URL param `?unidade=CIA_1` — server filtra `prisma.user.findMany({ where: { unidade } })`.

---

## 🛡️ Admins não entram em estatísticas

Na aba **Agenda de Oficiais** do painel admin:
- Server passa **dois arrays**: `usuariosTodos` (para aba Usuários) e `usuariosGrade` (para grade — sem admins, com filtro de unidade aplicado).
- `totalOficiais` count usa `where: { isAdmin: false, ativo: true, unidade? }`.

❌ Não usar `usuariosTodos` no `GradeConsolidada`. Sempre `usuariosGrade`.

---

## 🚫 Bloqueio de dias passados (novo 26/MAI/2026)

Não permitir agendar/alterar/excluir dias anteriores ao atual.

**Server (`app/api/agenda/route.ts`):**
```ts
function ehDataPassada(dataIso: string): boolean {
  return dataIso < dateKey(new Date());
}
// usar em POST (data nova), PUT (existing.data), DELETE (existing.data)
```

**UI:** `DiaCard.tsx` recebe `disabled={ehPassado}`, classes `opacity-50 grayscale cursor-not-allowed`, label "🔒 Dia encerrado". `AgendaSemanal.tsx` faz guard com `toast.error` antes de abrir modal.

---

## 🔑 Padrões de código — manter

### Comparação de datas
**SEMPRE** usar `dateKey()` de `lib/dateKey.ts`. Nunca `format(date, "yyyy-MM-dd")`.

```ts
import { dateKey } from "@/lib/dateKey";

const key = dateKey(dia);                          // ✓ tz-safe
const agenda = agendas.find(a => dateKey(a.data) === key);  // ✓
```

### Server → Client (Date)
**Normalizar Date para string** antes de passar Server Component → Client Component:

```ts
const agendas = (await prisma.agenda.findMany({...})).map(a => ({
  ...a,
  data: dateKey(a.data),   // ← Date → "yyyy-MM-dd"
}));
```

### Prisma findUnique vs findFirst
- `findUnique`: APENAS campos únicos no `where`
- Quando precisar filtrar por campo não-único (ex: `ativo: true`): usar `findFirst`

### Mutations de agenda
**Sempre `upsert`** em `POST /api/agenda`. Unique key é `userId_data`.

```ts
prisma.agenda.upsert({
  where: { userId_data: { userId, data: dataObj } },
  update: { tipo, observacao },
  create: { ... },
});
```

### Validação
Usar Zod v4 — `.issues` (não `.errors`):
```ts
if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message });
```

### Auth em pages
```ts
const session = await auth();
if (!session) redirect("/login");
if (!session.user.isAdmin) redirect("/agenda");  // se for /admin
```

### Try/catch nas API routes
Sempre envolver em try/catch e logar erro:
```ts
try {
  // ...
  return NextResponse.json(result);
} catch (err: any) {
  console.error("POST /api/X error:", err);
  return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
}
```

### Selects (UI)
Sempre `text-gray-900` no `<select>` e em cada `<option>`. Sem isso, opções renderizam quase invisíveis em alguns navegadores.

---

## 🎨 Design system — manter consistência

### Cores
- Azul-marinho escuro: `#0a1f3d`
- Azul-marinho: `#1e3a5f`
- Dourado: `#c9a961`

### Logos (sempre os 3 nessa ordem: asa, brasão, 5rv)
| Logo | Formato | Container |
|------|---------|-----------|
| `asa_rodoviaria.png` | **retangular ~1.3:1** | Sempre `w-[Xpx] h-[Ypx]` (não quadrado!) |
| `logo_coin2.png` | quadrado | `w-{N} h-{N}` |
| `logo_5rv.png` | quadrado | `w-{N} h-{N}` |

⚠️ Asa em container quadrado fica visualmente pequena. Sempre pixel values explícitos.

### Tamanhos por página
Login: asa `w-[120px] h-[90px]` mobile / `w-[200px] h-[150px]` desktop
/agenda + /admin: asa `w-[90px] h-[65px]` mobile / `w-[130px] h-[95px]` desktop

### Header pattern
```tsx
<header className="relative shadow-2xl" style={{ background: "linear-gradient(135deg, #0a1f3d 0%, #1e3a5f 50%, #0a1f3d 100%)" }}>
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
  {/* content */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a961]/50 to-transparent" />
</header>
```

### Mobile vs Desktop
**Dois layouts separados** com `sm:hidden` e `hidden sm:flex` — não tentar fazer tudo num só responsivo.

### Grade admin (painel)
- **Zebra rows**: alternar `bg-white` / `bg-slate-100`, hover `bg-amber-50`
- **Observação visível**: linha abaixo do badge do tipo, `text-xs` (12px) + `font-family: Times New Roman serif` (inline) + `line-clamp-3` + `title=` para hover completo. Sem italic.
- **Bordas da grade**: `border-collapse` no `<table>` + `border border-black` em todos `<th>`/`<td>` (preto, vertical+horizontal). Não usar `divide-y`.

### Fontes globais
- `/admin` root: **sans-serif** (`system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif`)
- Observações (grade + modal): **Times New Roman serif** via inline style
- Modal textarea obs: `text-base` (16px), sem italic

---

## 🚀 Deploy & Vercel

### Branch produção
Vercel deploya da branch `main`. Local é `master`. Push:

```bash
git push origin master:main
```

### Manual (quando push GitHub falha)
```bash
npx vercel deploy --prod --yes
# pega a URL retornada
npx vercel alias <new-url> agenda-oficiais-5bprv.vercel.app
```

### Vercel IDs
- `projectId`: `prj_zLaUaOhIfrtM9q2dDbVHACJCwYCi`
- `orgId`: `team_jBrXZj8ohAoocm18YBroKzny`

### Env vars no Vercel (production)
- `DATABASE_URL` — Supabase Transaction pooler
- `DIRECT_URL` — Supabase Direct connection
- `AUTH_SECRET` — gerado randomBytes(32) base64
- `NEXTAUTH_URL` — `https://agenda-oficiais-5bprv.vercel.app`

### Checklist se 404 em produção
1. Vercel project `framework: "nextjs"` setado? (não vem por padrão)
2. `ssoProtection` desabilitado?
3. Alias apontando pro deploy mais recente?
4. Push foi para `main` (não `master`)?

### ⚠️ Migrações de schema
Vercel **não roda** `prisma db push` no build. Quando o schema mudar:
- A) `npx prisma db push` fora da rede PM (DNS PM bloqueia 5432/6543 do AWS Supabase)
- B) SQL no Supabase Dashboard → SQL Editor
- C) Endpoint one-shot `/api/admin/migrate` (criar, rodar via curl com `MIGRATE_TOKEN`, deletar). Padrão usado em 26/MAI/2026.

### Diagnóstico de erros runtime
```bash
npx vercel logs --status-code 500 --since 10m --no-follow --expand --no-branch
npx vercel inspect --logs https://agenda-oficiais-5bprv.vercel.app
```

---

## 🗄️ Banco (Supabase)

### Connection strings (.env e .env.local)
Prisma lê APENAS `.env` em CLI commands. `.env.local` é para o runtime Next.js.

Senha tem `@pmr!sorocaba#` — chars especiais precisam URL-encoding:
- `@` → `%40`, `#` → `%23`, `!` → `%21`
- Resultado: `%40pmr%21sorocaba%23`

### Schema (atual)
- `User`: **cpf nullable** (não usado mais como login), **re único** (login), posto enum, **unidade enum nullable**, isAdmin, passwordHash, ativo
- `Agenda`: userId + data (unique compound), tipo enum, observacao
- `Feriado`: existe mas **não é mais usada** (feriados nativos em `lib/feriados.ts`)
- `AuditLog`: registra todas as ações
- `LoginAttempt`: rate limit. Campo `re` (era `cpf` antes de 26/MAI/2026)

⚠️ Campo `data: DateTime @db.Date` — armazena UTC midnight. Sempre `dateKey()` no client.

---

## 📋 Tipos de escala (TipoEscala enum)
`CONVALESCENCA` · `CURSO` · `DEJEM` · `DISP_SERVICO` · `EAP` · `EXPEDIENTE_NORMAL` · `FERIAS` · `FOLGA` · `FOLGA_SEMANAL` · `LICENCA_PREMIO` · `LTS` · `MISSAO` · `OUTROS`

> 27/MAI/2026: `DISPENSA_MEDICA` renomeado para `CONVALESCENCA`. Adicionados `DEJEM`, `DISP_SERVICO`, `FOLGA`, `LICENCA_PREMIO`, `LTS`. Ordem alfabética. Tipos exibidos sem barra (`Curso`, não `Curso/Capacitação`; `Missão`, não `Missão/Operação`; `Expediente Normal`).

Cores em `components/agenda/DiaCard.tsx`. Adicionar novo tipo requer:
1. Atualizar enum no `schema.prisma` + db push
2. Adicionar no `lib/validators.ts` (agendaSchema enum)
3. Adicionar mapping em `lib/utils.ts` (formatarTipoEscala, corTipoEscala)
4. Adicionar cores em `DiaCard.tsx` (CORES_TIPO)
5. Adicionar na legenda em `AgendaSemanal.tsx`
6. Adicionar no select de `ModalAgenda.tsx`
7. Adicionar nas cores da `GradeConsolidada` em `DashboardAdmin.tsx`

---

## 🎯 Postos (Posto enum)
`CEL_PM` · `TEN_CEL_PM` · `MAJ_PM` · `CAP_PM` · `TEN_PM` · `P1`

Mapping para display em `lib/utils.ts` → `formatarPosto()`.

---

## 🏛️ Unidades (Unidade enum)
`EM` · `CIA_1` · `CIA_2` · `CIA_3` · `CIA_4`

Display em `lib/utils.ts` → `formatarUnidade()` (`"EM"`, `"1ª Cia"`, ..., `"—"` se null).

---

## 🇧🇷 Feriados

Nativos via algoritmo Gregoriano de Páscoa em `lib/feriados.ts`. Funcionam offline para qualquer ano.

Atual: nacionais + Carnaval (-47/-48 da Páscoa) + Sexta Santa (-2) + Corpus Christi (+60) + Revolução Constitucionalista SP (9/jul).

---

## 🔍 Debugging comum

| Sintoma | Causa provável | Solução |
|---------|---------------|---------|
| Agenda salva mas não aparece no dia certo | Timezone | Verificar uso de `dateKey()` |
| 404 em tudo | Vercel sem framework setado OU SSO protection ativada | API Vercel: PATCH projeto |
| 401 em login após deploy | `AUTH_SECRET` não setado | `npx vercel env add AUTH_SECRET production` |
| Build falha "errors" missing | Zod v4 — usar `.issues` | trocar `parsed.error.errors` → `parsed.error.issues` |
| Edge Function unsupported modules | Middleware importando Prisma | remover middleware/proxy |
| "P1012" Prisma error | Schema com `url` em datasource (Prisma 7) | downgrade para Prisma 5 |
| Senha auth Supabase | Chars especiais não encodados | URL-encode `@#!` etc |
| "column X does not exist" no runtime | Schema atualizado mas DB Supabase não migrou | Rodar SQL no Supabase Editor OU endpoint one-shot |
| Opções de select transparentes | Cor de texto não definida | `text-gray-900` no select e options |
| `P1001 Can't reach DB server` no `prisma db push` | DNS PM bloqueia Supabase | Rodar fora da rede PM ou via SQL Editor |

---

## 💬 Estilo de comunicação preferido pelo usuário

- Caveman ultra ativo nas sessões
- Updates curtos com símbolos (✅ ⚠️ ❌)
- Tabelas para listar mudanças
- Pergunta antes de fazer mudanças grandes (DB migrations, dep upgrades, mudanças visuais)
- Mostra plano com tradeoffs (opção A/B/C) antes de aplicar quando há ambiguidade

---

## 📜 Histórico — para contexto

Projeto criado do zero a partir do `SPEC.md`. Stack: Supabase (DB) + Vercel (hosting) — ambos tier free. Login via link/`.ics` (não OAuth Google).

Visual baseado no portal interno do 5º BPRv — gradiente azul + dourado, brackets HUD, logos institucionais.

### Marcos
- **Inicial:** login CPF→RE/senha, 5 postos, 7 tipos de escala
- **24/MAI:** EAP adicionado (cyan), rate limit (5/CPF, 20/IP), posto P1, label "Nome completo" → "Nome de guerra"
- **27/MAI/2026:**
  - `DISPENSA_MEDICA` → `CONVALESCENCA` (rename via ALTER TYPE)
  - +5 tipos: `DEJEM`, `DISP_SERVICO`, `FOLGA`, `LICENCA_PREMIO`, `LTS` (total 13)
  - Select em ordem alfabética; labels sem barra ("Curso" não "Curso/Capacitação")
  - Migração via endpoint efêmero `/api/admin/migrate` com `MIGRATE_TOKEN` (depois removido)
  - ⚠️ Env de token deve ser **non-sensitive** (`--no-sensitive`) ou Vercel CLI mascara como vazio no `pull`
- **26/MAI/2026 (mudança grande):**
  - Login só por RE (CPF removido como identificador, virou campo opcional)
  - Enum `Unidade` adicionado, campo `User.unidade`
  - `LoginAttempt.cpf` renomeado para `re`
  - Aba "Grade" renomeada para "Agenda de Oficiais"
  - Grade admin: zebra rows + observações visíveis
  - Bloqueio agendar/alterar/excluir dia passado (UI + server)
  - Filtro Unidade no painel admin (URL `?unidade=`)
  - Admins excluídos da grade e stats (continuam em Usuários)
  - Selects com `text-gray-900` (opções estavam transparentes)
  - DNS PM bloqueia Supabase — usou `/api/admin/migrate` one-shot
- **28/MAI/2026 (tipografia admin):**
  - `/admin` root: Times New Roman → **sans-serif** (system-ui)
  - Observações continuam em **Times New Roman serif** (grade display + modal textarea), inline style
  - Removido `italic` das observações (Times regular fica mais legível)
  - Observação grade: `text-[10px]` → `text-xs` (12px); textarea modal: `text-sm` → `text-base` (16px)
  - Grade admin: tabela com `border-collapse` + `border border-black` em todas as células (substituiu `divide-y` cinza claro)
