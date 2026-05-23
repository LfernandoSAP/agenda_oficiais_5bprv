"use client";

import { format, isSaturday, isSunday, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarTipoEscala, corTipoEscala, cn } from "@/lib/utils";

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

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md",
        ehEspecial ? "opacity-60 bg-gray-100 border-gray-200" : "bg-white border-gray-200 hover:border-[#1e3a5f]",
        hoje && "border-[#c9a961] opacity-100 ring-2 ring-[#c9a961]/30"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {format(dia, "EEE", { locale: ptBR })}
          </p>
          <p className={cn("text-2xl font-bold", hoje ? "text-[#c9a961]" : "text-[#1e3a5f]")}>
            {format(dia, "dd")}
          </p>
          <p className="text-xs text-gray-400">{format(dia, "MMM/yyyy", { locale: ptBR }).toUpperCase()}</p>
        </div>
        <div className="text-xl">
          {feriado ? "🎉" : ehFimDeSemana ? "🏖️" : null}
        </div>
      </div>

      {feriado && (
        <p className="text-xs text-purple-600 font-medium mb-1 truncate">{feriado.nome}</p>
      )}

      {agenda ? (
        <div>
          <span className={cn("inline-block text-xs font-semibold px-2 py-1 rounded-full", corTipoEscala(agenda.tipo))}>
            {formatarTipoEscala(agenda.tipo)}
          </span>
          {agenda.observacao && (
            <p className="text-xs text-gray-500 mt-1 truncate">{agenda.observacao}</p>
          )}
          {ehEspecial && (
            <p className="text-xs text-amber-600 mt-1 font-medium">⚠️ Dia especial</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Não definido</p>
      )}
    </button>
  );
}
