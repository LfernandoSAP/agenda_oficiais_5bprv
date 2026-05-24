import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const cpf = process.env.ADMIN_INITIAL_CPF;
  const senha = process.env.ADMIN_INITIAL_PASSWORD;

  if (!cpf || cpf.replace(/\D/g, "").length !== 11) {
    throw new Error(
      "ADMIN_INITIAL_CPF ausente ou inválido. Defina no .env (11 dígitos)."
    );
  }
  if (!senha || senha.length < 8) {
    throw new Error(
      "ADMIN_INITIAL_PASSWORD ausente ou muito curta. Defina no .env (mín 8 caracteres)."
    );
  }

  const passwordHash = bcrypt.hashSync(senha, 10);

  await prisma.user.upsert({
    where: { cpf: cpf.replace(/\D/g, "") },
    update: {},
    create: {
      cpf: cpf.replace(/\D/g, ""),
      re: "000000-0",
      nomeCompleto: "Administrador Master",
      posto: "CEL_PM",
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
