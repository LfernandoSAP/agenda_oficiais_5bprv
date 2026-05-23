import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { limparCPF } from "./cpf";
import { authConfig } from "./auth.config";

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
      async authorize(credentials) {
        const cpf = limparCPF((credentials?.cpf as string) ?? "");
        if (!cpf) return null;

        const user = await prisma.user.findUnique({ where: { cpf, ativo: true } });
        if (!user) return null;

        if (user.isAdmin) {
          const senha = (credentials?.senha as string) ?? "";
          if (!user.passwordHash) return null;
          const ok = await bcrypt.compare(senha, user.passwordHash);
          if (!ok) return null;
        } else {
          const re = (credentials?.re as string) ?? "";
          if (!re || user.re.toLowerCase() !== re.toLowerCase()) return null;
        }

        await prisma.auditLog.create({
          data: {
            userId: user.id,
            acao: "LOGIN",
            entidade: "User",
            entidadeId: user.id,
          },
        });

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
