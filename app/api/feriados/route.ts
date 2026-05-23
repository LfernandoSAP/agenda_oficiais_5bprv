import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const feriados = await prisma.feriado.findMany({ orderBy: { data: "asc" } });
  return NextResponse.json(feriados);
}
