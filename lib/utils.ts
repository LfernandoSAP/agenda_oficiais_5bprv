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

export function formatarPosto(posto: string): string {
  const map: Record<string, string> = {
    CEL_PM: "Cel PM",
    TEN_CEL_PM: "Ten Cel PM",
    MAJ_PM: "Maj PM",
    CAP_PM: "Cap PM",
    TEN_PM: "Ten PM",
    P1: "P1",
  };
  return map[posto] ?? posto;
}

export function formatarTipoEscala(tipo: string): string {
  const map: Record<string, string> = {
    EXPEDIENTE_NORMAL: "Exp. Normal",
    FOLGA_SEMANAL: "Folga Semanal",
    FERIAS: "Férias",
    DISPENSA_MEDICA: "Dispensa Médica",
    CURSO: "Curso/Capacitação",
    MISSAO: "Missão/Operação",
    OUTROS: "Outros",
  };
  return map[tipo] ?? tipo;
}

export function corTipoEscala(tipo: string): string {
  const map: Record<string, string> = {
    EXPEDIENTE_NORMAL: "bg-green-100 text-green-800",
    FOLGA_SEMANAL: "bg-yellow-100 text-yellow-800",
    FERIAS: "bg-blue-100 text-blue-800",
    DISPENSA_MEDICA: "bg-red-100 text-red-800",
    CURSO: "bg-purple-100 text-purple-800",
    MISSAO: "bg-orange-100 text-orange-800",
    OUTROS: "bg-gray-100 text-gray-800",
  };
  return map[tipo] ?? "bg-gray-100 text-gray-800";
}
