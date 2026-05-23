import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { usuarioSchema } from "@/lib/validators";
import { limparCPF } from "@/lib/cpf";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const usuarios = await prisma.user.findMany({ orderBy: [{ posto: "asc" }, { nomeCompleto: "asc" }] });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = usuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { cpf, re, nomeCompleto, posto, email } = parsed.data;

  const exists = await prisma.user.findFirst({ where: { OR: [{ cpf }, { re }] } });
  if (exists) {
    return NextResponse.json({ error: "CPF ou RE já cadastrado" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { cpf, re, nomeCompleto, posto: posto as any, email: email || null },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, acao: "CRIOU_USUARIO", entidade: "User", entidadeId: user.id },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ativo, ...rest } = body;
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const parsed = usuarioSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { re, nomeCompleto, posto, email } = parsed.data;

  const user = await prisma.user.update({
    where: { id },
    data: { re, nomeCompleto, posto: posto as any, email: email || null, ativo: ativo ?? existing.ativo },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id, acao: "ALTEROU_USUARIO", entidade: "User", entidadeId: id,
      detalhes: { antes: existing, depois: { re, nomeCompleto, posto, email, ativo } },
    },
  });

  return NextResponse.json(user);
}
