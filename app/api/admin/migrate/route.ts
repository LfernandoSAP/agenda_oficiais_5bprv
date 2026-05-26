import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-migrate-token");
  if (!process.env.MIGRATE_TOKEN || token !== process.env.MIGRATE_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const passos: { sql: string; status: string; err?: string }[] = [];

  async function run(sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      passos.push({ sql, status: "ok" });
    } catch (e: any) {
      passos.push({ sql, status: "erro", err: e?.message ?? String(e) });
    }
  }

  await run(`DO $$ BEGIN CREATE TYPE "Unidade" AS ENUM ('EM', 'CIA_1', 'CIA_2', 'CIA_3', 'CIA_4'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
  await run(`ALTER TABLE "User" ALTER COLUMN "cpf" DROP NOT NULL;`);
  await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unidade" "Unidade";`);
  await run(`ALTER TABLE "LoginAttempt" RENAME COLUMN "cpf" TO "re";`);
  await run(`DROP INDEX IF EXISTS "LoginAttempt_cpf_createdAt_idx";`);
  await run(`CREATE INDEX IF NOT EXISTS "LoginAttempt_re_createdAt_idx" ON "LoginAttempt"("re", "createdAt");`);

  return NextResponse.json({ ok: true, passos });
}
