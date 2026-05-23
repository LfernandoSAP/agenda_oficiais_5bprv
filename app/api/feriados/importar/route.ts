import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const ano = new Date().getFullYear();
  const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`);
  if (!res.ok) return NextResponse.json({ error: "Erro ao buscar BrasilAPI" }, { status: 502 });

  const feriadosAPI: { date: string; name: string; type: string }[] = await res.json();

  let importados = 0;
  for (const f of feriadosAPI) {
    const data = new Date(f.date + "T12:00:00Z");
    await prisma.feriado.upsert({
      where: { data },
      update: { nome: f.name },
      create: { data, nome: f.name, tipo: "NACIONAL" },
    });
    importados++;
  }

  return NextResponse.json({ importados });
}
