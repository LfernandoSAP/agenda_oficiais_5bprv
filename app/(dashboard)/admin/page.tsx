import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardAdmin } from "@/components/admin/DashboardAdmin";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { getFeriadosEntre } from "@/lib/feriados";
import { dateKey } from "@/lib/dateKey";

const UNIDADES_VALIDAS = ["EM", "CIA_1", "CIA_2", "CIA_3", "CIA_4"] as const;
type UnidadeFiltro = (typeof UNIDADES_VALIDAS)[number] | "TODAS";

interface Props {
  searchParams: Promise<{ semana?: string; unidade?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/agenda");

  const params = await searchParams;
  const offset = parseInt(params.semana ?? "0");
  const base = addWeeks(new Date(), offset);
  const inicio = startOfWeek(base, { weekStartsOn: 1 });
  const fim = endOfWeek(base, { weekStartsOn: 1 });

  const unidadeParam = (params.unidade ?? "TODAS").toUpperCase() as UnidadeFiltro;
  const unidadeFiltro: UnidadeFiltro =
    unidadeParam === "TODAS" || UNIDADES_VALIDAS.includes(unidadeParam as any)
      ? unidadeParam
      : "TODAS";

  // Todos os usuários (inclui admins) para a aba Usuários
  const usuariosTodos = await prisma.user.findMany({
    orderBy: [{ ativo: "desc" }, { posto: "asc" }, { nomeCompleto: "asc" }],
  });

  // Apenas oficiais (não-admin) para a grade — filtrar por unidade se selecionado
  const usuariosOficiais = usuariosTodos.filter((u) => {
    if (u.isAdmin) return false;
    if (unidadeFiltro === "TODAS") return true;
    return u.unidade === unidadeFiltro;
  });

  const idsOficiais = usuariosOficiais.map((u) => u.id);

  const [agendasRaw, totalOficiaisFiltrados] = await Promise.all([
    prisma.agenda.findMany({
      where: {
        data: { gte: inicio, lte: fim },
        userId: { in: idsOficiais },
      },
      include: { user: { select: { nomeCompleto: true, posto: true, re: true } } },
    }),
    prisma.user.count({
      where: {
        ativo: true,
        isAdmin: false,
        ...(unidadeFiltro !== "TODAS" ? { unidade: unidadeFiltro as any } : {}),
      },
    }),
  ]);

  // Normaliza Date -> string para o client
  const agendas = agendasRaw.map((a) => ({
    ...a,
    data: dateKey(a.data),
  }));

  const feriados = getFeriadosEntre(dateKey(inicio), dateKey(fim));

  return (
    <DashboardAdmin
      session={session}
      usuarios={usuariosTodos}
      usuariosGrade={usuariosOficiais}
      agendas={agendas as any}
      feriados={feriados}
      totalOficiais={totalOficiaisFiltrados}
      offset={offset}
      unidadeFiltro={unidadeFiltro}
    />
  );
}
