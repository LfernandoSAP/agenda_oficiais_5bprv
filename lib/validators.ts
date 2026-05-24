import { z } from "zod";
import { validarCPF } from "./cpf";

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos")
  .refine(validarCPF, "CPF inválido");

export const reSchema = z
  .string()
  .regex(/^\d{6}-[0-9A-Za-z]$/, "RE inválido. Formato: 000000-X");

export const loginCpfSchema = z.object({
  cpf: cpfSchema,
});

export const loginReSchema = z.object({
  cpf: cpfSchema,
  re: reSchema,
});

export const loginSenhaSchema = z.object({
  cpf: cpfSchema,
  senha: z.string().min(1, "Senha obrigatória"),
});

export const agendaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  tipo: z.enum([
    "EXPEDIENTE_NORMAL",
    "FOLGA_SEMANAL",
    "FERIAS",
    "DISPENSA_MEDICA",
    "CURSO",
    "MISSAO",
    "OUTROS",
  ]),
  observacao: z.string().max(200).nullable().optional(),
});

export const usuarioSchema = z.object({
  cpf: cpfSchema,
  re: reSchema,
  nomeCompleto: z.string().min(2, "Nome de guerra obrigatório"),
  posto: z.enum(["CEL_PM", "TEN_CEL_PM", "MAJ_PM", "CAP_PM", "TEN_PM", "P1"]),
  email: z
    .union([z.email("E-mail inválido"), z.literal(""), z.null()])
    .optional(),
  isAdmin: z.boolean().optional().default(false),
  senha: z.string().min(6, "Senha mínima de 6 caracteres").optional(),
});

export const alterarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Senha atual obrigatória"),
    novaSenha: z.string().min(6, "Mínimo 6 caracteres"),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: "Senhas não conferem",
    path: ["confirmarSenha"],
  });
