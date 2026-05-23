import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgendaSemanal } from "@/components/agenda/AgendaSemanal";
import { getSemana } from "@/lib/utils";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";

interface Props {
  searchParams: Promise<{ semana?: string }>;
}

export default async function AgendaPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const offset = parseInt(params.semana ?? "0");
  const base = addWeeks(new Date(), offset);
  const inicio = startOfWeek(base, { weekStartsOn: 1 });
  const fim = endOfWeek(base, { weekStartsOn: 1 });

  const [agendas, feriados] = await Promise.all([
    prisma.agenda.findMany({
      where: {
        userId: session.user.id,
        data: { gte: inicio, lte: fim },
      },
    }),
    prisma.feriado.findMany({
      where: { data: { gte: inicio, lte: fim } },
    }),
  ]);

  return (
    <AgendaSemanal
      session={session}
      agendas={agendas}
      feriados={feriados}
      offset={offset}
    />
  );
}
