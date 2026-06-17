import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSemana(offset = 0) {
  const base = addWeeks(new Date(), offset);
  const inicio = startOfWeek(base, { weekStartsOn: 1 });
  const fim = endOfWeek(base, { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicio, end: fim });
  return { inicio, fim, dias };
}

export function formatarData(data: Date, fmt = "dd/MM/yyyy") {
  return format(data, fmt, { locale: ptBR });
}

export function formatarUnidade(unidade: string | null | undefined): string {
  if (!unidade) return "—";
  const map: Record<string, string> = {
    EM: "EM",
    CIA_1: "1ª Cia",
    CIA_2: "2ª Cia",
    CIA_3: "3ª Cia",
    CIA_4: "4ª Cia",
  };
  return map[unidade] ?? unidade;
}

export function formatarPosto(posto: string): string {
  const map: Record<string, string> = {
    CEL_PM: "Cel PM",
    TEN_CEL_PM: "Ten Cel PM",
    MAJ_PM: "Maj PM",
    CAP_PM: "Cap PM",
    TEN_PM: "Ten PM",
    ASP_TEN_PM: "Asp Of PM",
    P1: "P1",
  };
  return map[posto] ?? posto;
}

export function formatarTipoEscala(tipo: string): string {
  const map: Record<string, string> = {
    CONVALESCENCA: "Convalescença",
    CURSO: "Curso",
    DEJEM: "Dejem",
    DISP_SERVICO: "Disp. Serviço",
    EAP: "EAP",
    EXPEDIENTE_NORMAL: "Expediente Normal",
    FERIAS: "Férias",
    FOLGA: "Folga",
    FOLGA_SEMANAL: "Folga Semanal",
    LICENCA_PREMIO: "Licença Prêmio",
    LTS: "LTS",
    MEIO_EXPEDIENTE: "Meio Expediente",
    MISSAO: "Missão",
    OUTROS: "Outros",
  };
  return map[tipo] ?? tipo;
}

export function corTipoEscala(tipo: string): string {
  const map: Record<string, string> = {
    CONVALESCENCA: "bg-rose-100 text-rose-800",
    CURSO: "bg-purple-100 text-purple-800",
    DEJEM: "bg-indigo-100 text-indigo-800",
    DISP_SERVICO: "bg-pink-100 text-pink-800",
    EAP: "bg-cyan-100 text-cyan-800",
    EXPEDIENTE_NORMAL: "bg-emerald-100 text-emerald-800",
    FERIAS: "bg-sky-100 text-sky-800",
    FOLGA: "bg-lime-100 text-lime-800",
    FOLGA_SEMANAL: "bg-amber-100 text-amber-800",
    LICENCA_PREMIO: "bg-fuchsia-100 text-fuchsia-800",
    LTS: "bg-red-100 text-red-800",
    MEIO_EXPEDIENTE: "bg-teal-100 text-teal-800",
    MISSAO: "bg-orange-100 text-orange-800",
    OUTROS: "bg-slate-100 text-slate-800",
  };
  return map[tipo] ?? "bg-gray-100 text-gray-800";
}
