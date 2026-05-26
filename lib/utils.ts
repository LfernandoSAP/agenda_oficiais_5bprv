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
    P1: "P1",
  };
  return map[posto] ?? posto;
}

export function formatarTipoEscala(tipo: string): string {
  const map: Record<string, string> = {
    CURSO: "Curso/Capacitação",
    DISPENSA_MEDICA: "Dispensa Médica",
    EAP: "EAP",
    EXPEDIENTE_NORMAL: "Exp. Normal",
    FERIAS: "Férias",
    FOLGA_SEMANAL: "Folga Semanal",
    MISSAO: "Missão/Operação",
    OUTROS: "Outros",
  };
  return map[tipo] ?? tipo;
}

export function corTipoEscala(tipo: string): string {
  const map: Record<string, string> = {
    CURSO: "bg-purple-100 text-purple-800",
    DISPENSA_MEDICA: "bg-red-100 text-red-800",
    EAP: "bg-cyan-100 text-cyan-800",
    EXPEDIENTE_NORMAL: "bg-green-100 text-green-800",
    FERIAS: "bg-blue-100 text-blue-800",
    FOLGA_SEMANAL: "bg-yellow-100 text-yellow-800",
    MISSAO: "bg-orange-100 text-orange-800",
    OUTROS: "bg-gray-100 text-gray-800",
  };
  return map[tipo] ?? "bg-gray-100 text-gray-800";
}
