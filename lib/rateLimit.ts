import { prisma } from "@/lib/prisma";

const WINDOW_MIN = 10;
const MAX_PER_CPF = 5;
const MAX_PER_IP = 20;

export interface RateLimitResult {
  bloqueado: boolean;
  motivo?: string;
  retryAfterSec?: number;
}

export async function checarRateLimit(
  cpf: string | null,
  ipAddress: string | null
): Promise<RateLimitResult> {
  const desde = new Date(Date.now() - WINDOW_MIN * 60 * 1000);

  const [falhasCpf, falhasIp] = await Promise.all([
    cpf
      ? prisma.loginAttempt.count({
          where: { cpf, sucesso: false, createdAt: { gte: desde } },
        })
      : Promise.resolve(0),
    ipAddress
      ? prisma.loginAttempt.count({
          where: { ipAddress, sucesso: false, createdAt: { gte: desde } },
        })
      : Promise.resolve(0),
  ]);

  if (falhasCpf >= MAX_PER_CPF) {
    return {
      bloqueado: true,
      motivo: `Muitas tentativas para este CPF. Aguarde ${WINDOW_MIN} minutos.`,
      retryAfterSec: WINDOW_MIN * 60,
    };
  }
  if (falhasIp >= MAX_PER_IP) {
    return {
      bloqueado: true,
      motivo: `Muitas tentativas deste IP. Aguarde ${WINDOW_MIN} minutos.`,
      retryAfterSec: WINDOW_MIN * 60,
    };
  }
  return { bloqueado: false };
}

export async function registrarTentativa(args: {
  cpf: string | null;
  ipAddress: string | null;
  sucesso: boolean;
  motivo?: string;
}) {
  try {
    await prisma.loginAttempt.create({
      data: {
        cpf: args.cpf ?? undefined,
        ipAddress: args.ipAddress ?? undefined,
        sucesso: args.sucesso,
        motivo: args.motivo,
      },
    });
  } catch (err) {
    console.error("registrarTentativa error:", err);
  }
}

export function extrairIp(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}
