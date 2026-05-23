import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limparCPF, validarCPF } from "@/lib/cpf";

export async function POST(req: NextRequest) {
  const { cpf } = await req.json();
  const cpfLimpo = limparCPF(cpf ?? "");

  if (!validarCPF(cpfLimpo)) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { cpf: cpfLimpo, ativo: true },
    select: { isAdmin: true },
  });

  if (!user) {
    // Não revelar se CPF existe ou não — resposta genérica
    return NextResponse.json({ error: "Acesso negado" }, { status: 401 });
  }

  return NextResponse.json({ isAdmin: user.isAdmin });
}
