import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = bcrypt.hashSync("[REDACTED]", 10);

  await prisma.user.upsert({
    where: { cpf: "16445111858" },
    update: {},
    create: {
      cpf: "16445111858",
      re: "000000-0",
      nomeCompleto: "Administrador Master",
      posto: "CEL_PM",
      isAdmin: true,
      passwordHash,
      ativo: true,
    },
  });

  console.log("✅ Seed concluído — admin master criado.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
