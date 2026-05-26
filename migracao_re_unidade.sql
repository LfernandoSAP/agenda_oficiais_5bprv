-- =====================================================
-- Migração: login por RE + Unidade
-- Execute no Supabase SQL Editor (Database > SQL Editor)
-- =====================================================

-- 1. Criar enum Unidade
DO $$ BEGIN
  CREATE TYPE "Unidade" AS ENUM ('EM', 'CIA_1', 'CIA_2', 'CIA_3', 'CIA_4');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. User: tornar cpf nullable + adicionar unidade
ALTER TABLE "User" ALTER COLUMN "cpf" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unidade" "Unidade";

-- 3. LoginAttempt: renomear cpf -> re
ALTER TABLE "LoginAttempt" RENAME COLUMN "cpf" TO "re";

-- 4. Recriar índice antigo
DROP INDEX IF EXISTS "LoginAttempt_cpf_createdAt_idx";
CREATE INDEX IF NOT EXISTS "LoginAttempt_re_createdAt_idx" ON "LoginAttempt"("re", "createdAt");

-- 5. (opcional) garantir índice já existe — sem erro se já tem
CREATE INDEX IF NOT EXISTS "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- Pronto. Conferir:
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'User';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'LoginAttempt';
