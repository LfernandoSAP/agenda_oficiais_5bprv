"use client";

import { format, isSaturday, isSunday, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarTipoEscala, cn } from "@/lib/utils";

const CORES_TIPO: Record<string, { bg: string; badge: string; accent: string; emoji: string }> = {
  EXPEDIENTE_NORMAL: {
    bg: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300",
    badge: "bg-emerald-500 text-white",
    accent: "border-l-emerald-500",
    emoji: "💼",
  },
  FOLGA_SEMANAL: {
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300",
    badge: "bg-amber-500 text-white",
    accent: "border-l-amber-500",
    emoji: "🌴",
  },
  FERIAS: {
    bg: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-300",
    badge: "bg-sky-500 text-white",
    accent: "border-l-sky-500",
    emoji: "✈️",
  },
  DISPENSA_MEDICA: {
    bg: "bg-gradient-to-br from-rose-50 to-red-50 border-rose-300",
    badge: "bg-rose-500 text-white",
    accent: "border-l-rose-500",
    emoji: "🩺",
  },
  CURSO: {
    bg: "bg-gradient-to-br from-purple-50 to-violet-50 border-purple-300",
    badge: "bg-purple-500 text-white",
    accent: "border-l-purple-500",
    emoji: "📚",
  },
  MISSAO: {
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300",
    badge: "bg-orange-500 text-white",
    accent: "border-l-orange-500",
    emoji: "🎯",
  },
  OUTROS: {
    bg: "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-300",
    badge: "bg-slate-500 text-white",
    accent: "border-l-slate-500",
    emoji: "📋",
  },
};

interface Props {
  dia: Date;
  agenda?: { tipo: string; observacao: string | null } | null;
  feriado?: { nome: string } | null;
  onClick: () => void;
}

export function DiaCard({ dia, agenda, feriado, onClick }: Props) {
  const ehFimDeSemana = isSaturday(dia) || isSunday(dia);
  const ehEspecial = ehFimDeSemana || !!feriado;
  const hoje = isToday(dia);

  const cores = agenda ? CORES_TIPO[agenda.tipo] ?? CORES_TIPO.OUTROS : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left p-4 rounded-2xl border-2 border-l-[6px] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5",
        cores ? `${cores.bg} ${cores.accent}` : "bg-white border-gray-200 border-l-[#c9a961] hover:border-[#1e3a5f]",
        ehEspecial && !agenda && "opacity-60",
        hoje && "ring-2 ring-[#c9a961] ring-offset-2"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
            {format(dia, "EEEE", { locale: ptBR })}
          </p>
          <p
            className={cn(
              "text-4xl font-bold leading-none mt-1",
              hoje ? "text-[#c9a961]" : "text-[#1e3a5f]"
            )}
            style={{ fontFamily: "Georgia, serif" }}
          >
            {format(dia, "dd")}
          </p>
          <p className="text-[10px] text-gray-400 uppercase mt-0.5 tracking-wider">
            {format(dia, "MMM/yyyy", { locale: ptBR }).toUpperCase()}
          </p>
        </div>
        <div className="text-2xl">
          {feriado ? "🎉" : ehFimDeSemana ? "🏖️" : cores?.emoji}
        </div>
      </div>

      {hoje && (
        <p className="text-[10px] text-[#c9a961] font-bold uppercase tracking-wider mb-2">● Hoje</p>
      )}

      {feriado && (
        <p className="text-xs text-purple-700 font-semibold mb-2 truncate flex items-center gap-1">
          🎊 {feriado.nome}
        </p>
      )}

      {agenda ? (
        <div>
          <span className={cn("inline-block text-xs font-bold px-3 py-1 rounded-full shadow-sm", cores!.badge)}>
            {formatarTipoEscala(agenda.tipo)}
          </span>
          {agenda.observacao && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-2 italic">
              "{agenda.observacao}"
            </p>
          )}
          {ehEspecial && (
            <p className="text-[10px] text-amber-700 mt-2 font-bold uppercase tracking-wider">
              ⚠️ Agendado em dia especial
            </p>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-xs text-gray-400 italic">Toque para definir</p>
          <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full w-0 group-hover:w-full bg-[#c9a961] transition-all duration-500" />
          </div>
        </div>
      )}
    </button>
  );
}
