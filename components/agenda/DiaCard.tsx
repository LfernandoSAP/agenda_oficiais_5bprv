"use client";

import { format, isSaturday, isSunday, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarTipoEscala, cn } from "@/lib/utils";
import { dateKey } from "@/lib/dateKey";

const CORES_TIPO: Record<string, { bg: string; badge: string; accent: string; emoji: string }> = {
  CONVALESCENCA: {
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
  DEJEM: {
    bg: "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300",
    badge: "bg-indigo-500 text-white",
    accent: "border-l-indigo-500",
    emoji: "🌙",
  },
  DISP_SERVICO: {
    bg: "bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300",
    badge: "bg-pink-500 text-white",
    accent: "border-l-pink-500",
    emoji: "🛡️",
  },
  EAP: {
    bg: "bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-300",
    badge: "bg-cyan-500 text-white",
    accent: "border-l-cyan-500",
    emoji: "🎓",
  },
  EXPEDIENTE_NORMAL: {
    bg: "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300",
    badge: "bg-emerald-500 text-white",
    accent: "border-l-emerald-500",
    emoji: "💼",
  },
  FERIAS: {
    bg: "bg-gradient-to-br from-sky-50 to-blue-50 border-sky-300",
    badge: "bg-sky-500 text-white",
    accent: "border-l-sky-500",
    emoji: "✈️",
  },
  FOLGA: {
    bg: "bg-gradient-to-br from-lime-50 to-green-50 border-lime-300",
    badge: "bg-lime-500 text-white",
    accent: "border-l-lime-500",
    emoji: "🌿",
  },
  FOLGA_SEMANAL: {
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300",
    badge: "bg-amber-500 text-white",
    accent: "border-l-amber-500",
    emoji: "🌴",
  },
  LICENCA_PREMIO: {
    bg: "bg-gradient-to-br from-fuchsia-50 to-pink-50 border-fuchsia-300",
    badge: "bg-fuchsia-500 text-white",
    accent: "border-l-fuchsia-500",
    emoji: "🏅",
  },
  LTS: {
    bg: "bg-gradient-to-br from-red-50 to-rose-50 border-red-300",
    badge: "bg-red-500 text-white",
    accent: "border-l-red-500",
    emoji: "🏥",
  },
  MEIO_EXPEDIENTE: {
    bg: "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-300",
    badge: "bg-teal-500 text-white",
    accent: "border-l-teal-500",
    emoji: "🕐",
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
  const ehPassado = dateKey(dia) < dateKey(new Date());

  const cores = agenda ? CORES_TIPO[agenda.tipo] ?? CORES_TIPO.OUTROS : null;

  return (
    <button
      onClick={onClick}
      disabled={ehPassado}
      title={ehPassado ? "Não é permitido alterar dias anteriores" : undefined}
      className={cn(
        "group w-full text-left p-4 rounded-2xl border-2 border-l-[6px] transition-all duration-200",
        !ehPassado && "hover:shadow-xl hover:-translate-y-0.5",
        cores ? `${cores.bg} ${cores.accent}` : "bg-white border-gray-200 border-l-[#c9a961] hover:border-[#1e3a5f]",
        ehEspecial && !agenda && "opacity-60",
        ehPassado && "opacity-50 cursor-not-allowed grayscale",
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
          <p className="text-xs text-gray-400 italic">
            {ehPassado ? "🔒 Dia encerrado" : "Toque para definir"}
          </p>
          {!ehPassado && (
            <div className="mt-1 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-0 group-hover:w-full bg-[#c9a961] transition-all duration-500" />
            </div>
          )}
        </div>
      )}
    </button>
  );
}
