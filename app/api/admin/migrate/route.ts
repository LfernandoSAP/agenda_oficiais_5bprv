import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-migrate-token");
  if (!token || token !== process.env.MIGRATE_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const log: string[] = [];

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "TipoEscala" RENAME VALUE 'DISPENSA_MEDICA' TO 'CONVALESCENCA'`
    );
    log.push("renamed DISPENSA_MEDICA -> CONVALESCENCA");
  } catch (e: any) {
    log.push(`skip rename: ${e?.message ?? e}`);
  }

  const novos = ["DEJEM", "DISP_SERVICO", "FOLGA", "LICENCA_PREMIO", "LTS"];
  for (const v of novos) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "TipoEscala" ADD VALUE IF NOT EXISTS '${v}'`
      );
      log.push(`added ${v}`);
    } catch (e: any) {
      log.push(`fail ${v}: ${e?.message ?? e}`);
    }
  }

  return NextResponse.json({ ok: true, log });
}
