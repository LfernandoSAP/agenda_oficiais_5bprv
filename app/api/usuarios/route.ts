import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { usuarioSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const usuarios = await prisma.user.findMany({ orderBy: [{ posto: "asc" }, { nomeCompleto: "asc" }] });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = usuarioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { cpf, re, nomeCompleto, posto, email, isAdmin, senha } = parsed.data;

    if (isAdmin && !senha) {
      return NextResponse.json({ error: "Senha é obrigatória para administrador" }, { status: 400 });
    }

    const exists = await prisma.user.findFirst({ where: { OR: [{ cpf }, { re }] } });
    if (exists) {
      return NextResponse.json({ error: "CPF ou RE já cadastrado" }, { status: 409 });
    }

    const passwordHash = isAdmin && senha ? await bcrypt.hash(senha, 10) : null;

    const user = await prisma.user.create({
      data: {
        cpf,
        re,
        nomeCompleto,
        posto: posto as any,
        email: email || null,
        isAdmin: !!isAdmin,
        passwordHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        acao: isAdmin ? "CRIOU_USUARIO_ADMIN" : "CRIOU_USUARIO",
        entidade: "User",
        entidadeId: user.id,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/usuarios error:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, ativo, ...rest } = body;
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const parsed = usuarioSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { re, nomeCompleto, posto, email, isAdmin, senha } = parsed.data;

    const promovendo = !existing.isAdmin && isAdmin;
    const rebaixando = existing.isAdmin && !isAdmin;

    if (promovendo && !senha) {
      return NextResponse.json({ error: "Senha é obrigatória ao promover a administrador" }, { status: 400 });
    }

    let passwordHash: string | null | undefined = undefined;
    if (rebaixando) {
      passwordHash = null;
    } else if (isAdmin && senha) {
      passwordHash = await bcrypt.hash(senha, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        re,
        nomeCompleto,
        posto: posto as any,
        email: email || null,
        ativo: ativo ?? existing.ativo,
        isAdmin: !!isAdmin,
        ...(passwordHash !== undefined ? { passwordHash } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        acao: promovendo
          ? "PROMOVEU_ADMIN"
          : rebaixando
          ? "REBAIXOU_ADMIN"
          : "ALTEROU_USUARIO",
        entidade: "User",
        entidadeId: id,
        detalhes: {
          antes: { ...existing, passwordHash: undefined },
          depois: { re, nomeCompleto, posto, email, ativo, isAdmin: !!isAdmin },
        },
      },
    });

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("PUT /api/usuarios error:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}
