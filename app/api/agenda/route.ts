import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agendaSchema } from "@/lib/validators";
import { isSaturday, isSunday } from "date-fns";
import { getFeriadoEm } from "@/lib/feriados";
import { dateKey } from "@/lib/dateKey";

function ehDataPassada(dataIso: string): boolean {
  const hoje = dateKey(new Date());
  return dataIso < hoje;
}

async function logAudit(userId: string, acao: string, entidadeId: string, detalhes: any, ip: string) {
  try {
    await prisma.auditLog.create({
      data: { userId, acao, entidade: "Agenda", entidadeId, detalhes, ipAddress: ip },
    });
  } catch (err) {
    console.error("audit log error:", err);
  }
}

function resolveTargetUserId(body: any, session: any): string {
  const target = body?.userId;
  if (target && target !== session.user.id) {
    if (!session.user.isAdmin) throw new Error("Somente admin pode alterar agenda de outro oficial");
    return target;
  }
  return session.user.id;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const targetUserId = resolveTargetUserId(body, session);
    const parsed = agendaSchema.safeParse(body);
    if (!parsed.success) {
      console.error("validation error:", parsed.error.issues);
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }

    const { data, tipo, observacao } = parsed.data;
    if (ehDataPassada(data) && !session.user.isAdmin) {
      return NextResponse.json({ error: "Não é permitido agendar dias anteriores ao atual" }, { status: 400 });
    }
    const dataObj = new Date(data + "T12:00:00Z");
    const feriado = getFeriadoEm(data);

    const agenda = await prisma.agenda.upsert({
      where: { userId_data: { userId: targetUserId, data: dataObj } },
      update: { tipo: tipo as any, observacao },
      create: {
        userId: targetUserId,
        data: dataObj,
        tipo: tipo as any,
        observacao,
        isFeriado: !!feriado,
        isFimSemana: isSaturday(dataObj) || isSunday(dataObj),
      },
    });

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const acao = targetUserId !== session.user.id ? "ADMIN_CRIOU_OU_ALTEROU_AGENDA" : "CRIOU_OU_ALTEROU_AGENDA";
    await logAudit(session.user.id, acao, agenda.id, { tipo, data, targetUserId }, ip);

    return NextResponse.json(agenda, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/agenda error:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, ...rest } = body;
    const parsed = agendaSchema.safeParse(rest);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });

    const existing = await prisma.agenda.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (ehDataPassada(dateKey(existing.data)) && !session.user.isAdmin) {
      return NextResponse.json({ error: "Não é permitido alterar agenda de dia anterior ao atual" }, { status: 400 });
    }

    const { tipo, observacao } = parsed.data;
    const agenda = await prisma.agenda.update({
      where: { id },
      data: { tipo: tipo as any, observacao },
    });

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const acao = existing.userId !== session.user.id ? "ADMIN_ALTEROU_AGENDA" : "ALTEROU_AGENDA";
    await logAudit(session.user.id, acao, id, { antes: existing, depois: { tipo, observacao } }, ip);

    return NextResponse.json(agenda);
  } catch (err: any) {
    console.error("PUT /api/agenda error:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const existing = await prisma.agenda.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    if (existing.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (ehDataPassada(dateKey(existing.data)) && !session.user.isAdmin) {
      return NextResponse.json({ error: "Não é permitido excluir agenda de dia anterior ao atual" }, { status: 400 });
    }

    await prisma.agenda.delete({ where: { id } });

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const acao = existing.userId !== session.user.id ? "ADMIN_DELETOU_AGENDA" : "DELETOU_AGENDA";
    await logAudit(session.user.id, acao, id, existing, ip);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/agenda error:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}
