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

export const loginReSchema = z.object({
  re: reSchema,
});

export const loginSenhaSchema = z.object({
  re: reSchema,
  senha: z.string().min(1, "Senha obrigatória"),
});

export const agendaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  tipo: z.enum([
    "CONVALESCENCA",
    "CURSO",
    "DEJEM",
    "DISP_SERVICO",
    "EAP",
    "EXPEDIENTE_NORMAL",
    "FERIAS",
    "FOLGA",
    "FOLGA_SEMANAL",
    "LICENCA_PREMIO",
    "LTS",
    "MEIO_EXPEDIENTE",
    "MISSAO",
    "OUTROS",
  ]),
  observacao: z.string().max(200).nullable().optional(),
});

export const usuarioSchema = z.object({
  re: reSchema,
  nomeCompleto: z.string().min(2, "Nome de guerra obrigatório"),
  posto: z.enum(["CEL_PM", "TEN_CEL_PM", "MAJ_PM", "CAP_PM", "TEN_PM", "ASP_TEN_PM", "P1"]),
  unidade: z.enum(["EM", "CIA_1", "CIA_2", "CIA_3", "CIA_4"]).nullable().optional(),
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
