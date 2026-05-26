import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const re = process.env.ADMIN_INITIAL_RE ?? "000000-0";
  const senha = process.env.ADMIN_INITIAL_PASSWORD;

  if (!/^\d{6}-[0-9A-Za-z]$/.test(re)) {
    throw new Error("ADMIN_INITIAL_RE inválido. Formato: 000000-X.");
  }
  if (!senha || senha.length < 8) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD ausente ou muito curta. Defina no .env (mín 8 caracteres)."
    );
  }

  const passwordHash = bcrypt.hashSync(senha, 10);

  await prisma.user.upsert({
    where: { re },
    update: {},
    create: {
      re,
      nomeCompleto: "Administrador Master",
      posto: "CEL_PM",
      unidade: "EM",
      isAdmin: true,
      passwordHash,
      ativo: true,
    },
  });

  console.log("✅ Seed concluído — admin master criado/atualizado.");
  console.log("⚠️  Faça login e troque a senha em Admin → Config.");
}

main()
  .catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
