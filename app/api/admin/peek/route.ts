import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-peek-token");
  if (!process.env.PEEK_TOKEN || token !== process.env.PEEK_TOKEN) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, re: true, nomeCompleto: true, ativo: true, posto: true },
  });

  return NextResponse.json({ admins });
}
