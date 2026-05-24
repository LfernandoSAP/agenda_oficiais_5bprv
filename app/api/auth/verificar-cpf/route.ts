import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limparCPF, validarCPF } from "@/lib/cpf";
import { checarRateLimit, registrarTentativa, extrairIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ipAddress = extrairIp(req);
  let cpfLimpo: string | null = null;

  try {
    const { cpf } = await req.json();
    cpfLimpo = limparCPF(cpf ?? "");

    const limite = await checarRateLimit(cpfLimpo, ipAddress);
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

    if (!validarCPF(cpfLimpo)) {
      await registrarTentativa({ cpf: cpfLimpo, ipAddress, sucesso: false, motivo: "CPF inválido" });
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { cpf: cpfLimpo, ativo: true },
      select: { isAdmin: true },
    });

    if (!user) {
      await registrarTentativa({ cpf: cpfLimpo, ipAddress, sucesso: false, motivo: "CPF não encontrado/inativo" });
      return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
    }

    return NextResponse.json({ isAdmin: user.isAdmin });
  } catch (err) {
    console.error("verificar-cpf error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
