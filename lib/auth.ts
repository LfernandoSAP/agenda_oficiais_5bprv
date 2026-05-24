import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { limparCPF } from "./cpf";
import { authConfig } from "./auth.config";
import { checarRateLimit, registrarTentativa, extrairIp } from "./rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        cpf: { label: "CPF" },
        re: { label: "RE" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        const cpf = limparCPF((credentials?.cpf as string) ?? "");
        if (!cpf) return null;

        const ipAddress = request instanceof Request ? extrairIp(request) : null;

        const limite = await checarRateLimit(cpf, ipAddress);
        if (limite.bloqueado) {
          throw new Error(limite.motivo ?? "Muitas tentativas. Tente novamente em alguns minutos.");
        }

        const user = await prisma.user.findFirst({ where: { cpf, ativo: true } });
        if (!user) {
          await registrarTentativa({ cpf, ipAddress, sucesso: false, motivo: "Usuário não encontrado" });
          return null;
        }

        if (user.isAdmin) {
          const senha = (credentials?.senha as string) ?? "";
          if (!user.passwordHash) {
            await registrarTentativa({ cpf, ipAddress, sucesso: false, motivo: "Admin sem senha" });
            return null;
          }
          const ok = await bcrypt.compare(senha, user.passwordHash);
          if (!ok) {
            await registrarTentativa({ cpf, ipAddress, sucesso: false, motivo: "Senha incorreta" });
            return null;
          }
        } else {
          const re = (credentials?.re as string) ?? "";
          if (!re || user.re.toLowerCase() !== re.toLowerCase()) {
            await registrarTentativa({ cpf, ipAddress, sucesso: false, motivo: "RE incorreto" });
            return null;
          }
        }

        await Promise.all([
          registrarTentativa({ cpf, ipAddress, sucesso: true }),
          prisma.auditLog.create({
            data: {
              userId: user.id,
              acao: "LOGIN",
              entidade: "User",
              entidadeId: user.id,
              ipAddress: ipAddress ?? undefined,
            },
          }),
        ]);

        return {
          id: user.id,
          name: user.nomeCompleto,
          email: user.email ?? undefined,
          isAdmin: user.isAdmin,
          posto: user.posto,
          nomeCompleto: user.nomeCompleto,
          re: user.re,
        } as any;
      },
    }),
  ],
});
