import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reSchema } from "@/lib/validators";
import { checarRateLimit, registrarTentativa, extrairIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ipAddress = extrairIp(req);
  let reLimpo: string | null = null;

  try {
    const { re } = await req.json();
    reLimpo = ((re as string) ?? "").trim().toUpperCase();

    const limite = await checarRateLimit(reLimpo, ipAddress);
    if (limite.bloqueado) {
      return NextResponse.json(
        { error: limite.motivo },
        {
          status: 429,
          headers: limite.retryAfterSec
            ? { "Retry-After": String(limite.retryAfterSec) }
            : undefined,
        }
      );
    }

    const parsed = reSchema.safeParse(reLimpo);
    if (!parsed.success) {
      await registrarTentativa({ re: reLimpo, ipAddress, sucesso: false, motivo: "RE inválido" });
      return NextResponse.json({ error: "RE inválido" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { re: reLimpo, ativo: true },
      select: { isAdmin: true },
    });

    if (!user) {
      await registrarTentativa({ re: reLimpo, ipAddress, sucesso: false, motivo: "RE não encontrado/inativo" });
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
    }

    return NextResponse.json({ isAdmin: user.isAdmin });
  } catch (err) {
    console.error("verificar-re error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
