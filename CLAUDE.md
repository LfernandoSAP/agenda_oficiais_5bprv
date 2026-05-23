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
**Sempre `upsert`** em `POST /api/agenda`. A unique key é `userId_data`.

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
**Sempre** envolver em try/catch e logar erro:
```ts
try {
  // ...
  return NextResponse.json(result);
} catch (err: any) {
  console.error("POST /api/X error:", err);
  return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
}
```

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

⚠️ A asa em container quadrado fica visualmente pequena. Sempre usar pixel values explícitos.

### Tamanhos por página (atual)
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

---

## 🗄️ Banco (Supabase)

### Connection strings (.env e .env.local)
Prisma lê APENAS `.env` em CLI commands. `.env.local` é para o runtime Next.js.

Senha tem `@pmr!sorocaba#` — chars especiais precisam URL-encoding:
- `@` → `%40`, `#` → `%23`, `!` → `%21`
- Resultado: `%40pmr%21sorocaba%23`

### Schema
- `User`: cpf único (só dígitos), re único, posto enum, isAdmin
- `Agenda`: userId + data (unique compound), tipo enum, observacao
- `Feriado`: existe mas **não é mais usada** (feriados são nativos em `lib/feriados.ts`)
- `AuditLog`: registra todas as ações

⚠️ Campo `data: DateTime @db.Date` — armazena UTC midnight. Sempre `dateKey()` no client.

---

## 📋 Tipos de escala (TipoEscala enum)
`EXPEDIENTE_NORMAL` · `FOLGA_SEMANAL` · `FERIAS` · `DISPENSA_MEDICA` · `CURSO` · `MISSAO` · `OUTROS`

Cores definidas em `components/agenda/DiaCard.tsx`. Adicionar novo tipo requer:
1. Atualizar enum no `schema.prisma` + db push
2. Adicionar no `lib/validators.ts` (agendaSchema enum)
3. Adicionar mapping em `lib/utils.ts` (formatarTipoEscala, corTipoEscala)
4. Adicionar cores em `DiaCard.tsx` (CORES_TIPO)
5. Adicionar na legenda em `AgendaSemanal.tsx`

---

## 🎯 Postos (Posto enum)
`CEL_PM` · `TEN_CEL_PM` · `MAJ_PM` · `CAP_PM` · `TEN_PM`

Mapping para display em `lib/utils.ts` → `formatarPosto()`.

---

## 🇧🇷 Feriados

Nativos via algoritmo Gregoriano de Páscoa em `lib/feriados.ts`. Funcionam para qualquer ano, offline.

Atual: nacionais + Carnaval (-47/-48 da Páscoa) + Sexta Santa (-2) + Corpus Christi (+60) + Revolução Constitucionalista SP (9/jul).

Para adicionar municipais (ex: aniversário de Sorocaba):
```ts
{ data: `${year}-08-15`, nome: "Aniversário de Sorocaba", tipo: "MUNICIPAL" }
```

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

---

## 💬 Estilo de comunicação preferido pelo usuário

- Caveman ultra (compactíssimo) está ativo nas sessões anteriores
- Usuário prefere updates curtos com símbolos (✅ ⚠️ ❌)
- Tabelas para listar mudanças
- Pergunta antes de fazer mudanças grandes (DB migrations, dep upgrades)

---

## 📜 Histórico — para contexto

Projeto criado do zero a partir do `SPEC.md`. Stack escolhido: Supabase (DB) + Vercel (hosting) — ambos tier free. Login via link/`.ics` (não OAuth Google) por simplicidade.

Visual baseado no portal interno do 5º BPRv (`frontendaplicacoes5bprvvercel-31aa2byqh.vercel.app`) — gradiente azul + dourado, brackets HUD, logos institucionais.

Bugs significativos resolvidos: timezone (UTC-3 vs `@db.Date`), Vercel framework não detectado, Next 16/Prisma 7 incompatíveis.
