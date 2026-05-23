import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardAdmin } from "@/components/admin/DashboardAdmin";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";

interface Props {
  searchParams: Promise<{ semana?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/agenda");

  const params = await searchParams;
  const offset = parseInt(params.semana ?? "0");
  const base = addWeeks(new Date(), offset);
  const inicio = startOfWeek(base, { weekStartsOn: 1 });
  const fim = endOfWeek(base, { weekStartsOn: 1 });

  const [usuarios, agendas, feriados, stats] = await Promise.all([
    prisma.user.findMany({
      where: { ativo: true },
      orderBy: [{ posto: "asc" }, { nomeCompleto: "asc" }],
    }),
    prisma.agenda.findMany({
      where: { data: { gte: inicio, lte: fim } },
      include: { user: { select: { nomeCompleto: true, posto: true, re: true } } },
    }),
    prisma.feriado.findMany({ where: { data: { gte: inicio, lte: fim } } }),
    prisma.user.count({ where: { ativo: true } }),
  ]);

  return (
    <DashboardAdmin
      session={session}
      usuarios={usuarios}
      agendas={agendas}
      feriados={feriados}
      totalOficiais={stats}
      offset={offset}
    />
  );
}
