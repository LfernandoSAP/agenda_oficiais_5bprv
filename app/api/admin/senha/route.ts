import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { senhaAtual, novaSenha } = await req.json();
  if (!senhaAtual || !novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ok = await bcrypt.compare(senhaAtual, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });

  const hash = await bcrypt.hash(novaSenha, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, acao: "ALTEROU_SENHA", entidade: "User", entidadeId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
