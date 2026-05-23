import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agendaSchema } from "@/lib/validators";
import { isSaturday, isSunday } from "date-fns";

async function logAudit(userId: string, acao: string, entidadeId: string, detalhes: any, ip: string) {
  await prisma.auditLog.create({
    data: { userId, acao, entidade: "Agenda", entidadeId, detalhes, ipAddress: ip },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = agendaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { data, tipo, observacao } = parsed.data;
  const dataObj = new Date(data + "T12:00:00Z");
  const feriadoExiste = await prisma.feriado.findUnique({ where: { data: dataObj } });

  const agenda = await prisma.agenda.create({
    data: {
      userId: session.user.id,
      data: dataObj,
      tipo: tipo as any,
      observacao,
      isFeriado: !!feriadoExiste,
      isFimSemana: isSaturday(dataObj) || isSunday(dataObj),
    },
  });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit(session.user.id, "CRIOU_AGENDA", agenda.id, { tipo, data }, ip);

  return NextResponse.json(agenda, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...rest } = body;
  const parsed = agendaSchema.safeParse(rest);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await prisma.agenda.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const { tipo, observacao } = parsed.data;
  const agenda = await prisma.agenda.update({
    where: { id },
    data: { tipo: tipo as any, observacao },
  });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit(session.user.id, "ALTEROU_AGENDA", id, { antes: existing, depois: { tipo, observacao } }, ip);

  return NextResponse.json(agenda);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const existing = await prisma.agenda.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.agenda.delete({ where: { id } });

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  await logAudit(session.user.id, "DELETOU_AGENDA", id, existing, ip);

  return NextResponse.json({ ok: true });
}
