import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ⚠️ ENDPOINT EFÊMERO — remover após rodar a migration.
// Padrão one-shot: DNS PM bloqueia Supabase, então roda via runtime Vercel.
export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token || token !== process.env.MIGRATE_TOKEN) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    await prisma.$executeRawUnsafe(
      `ALTER TYPE "TipoEscala" ADD VALUE IF NOT EXISTS 'MEIO_EXPEDIENTE' BEFORE 'MISSAO';`
    );

    const valores = await prisma.$queryRawUnsafe(
      `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TipoEscala' ORDER BY e.enumsortorder;`
    );

    return NextResponse.json({ ok: true, valores });
  } catch (err: any) {
    console.error("POST /api/admin/migrate error:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}
