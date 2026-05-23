"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addWeeks, startOfWeek, endOfWeek, isSaturday, isSunday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { getSemana, formatarPosto, formatarTipoEscala, corTipoEscala, cn } from "@/lib/utils";
import { DiaCard } from "./DiaCard";
import { ModalAgenda } from "./ModalAgenda";
import { LogOut, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { signOut } from "next-auth/react";

type Agenda = {
  id: string;
  data: Date;
  tipo: string;
  observacao: string | null;
  isFeriado: boolean;
  isFimSemana: boolean;
};

type Feriado = {
  id: string;
  data: Date;
  nome: string;
  tipo: string;
};

interface Props {
  session: any;
  agendas: Agenda[];
  feriados: Feriado[];
  offset: number;
}

export function AgendaSemanal({ session, agendas, feriados, offset }: Props) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [agendaSelecionada, setAgendaSelecionada] = useState<Agenda | null>(null);
  const [confirmFeriadoAberto, setConfirmFeriadoAberto] = useState(false);
  const [feriadoInfo, setFeriadoInfo] = useState<{ nome: string; tipo: string } | null>(null);

  const { dias, inicio, fim } = getSemana(offset);

  function irParaSemana(novoOffset: number) {
    router.push(`/agenda?semana=${novoOffset}`);
  }

  function handleDiaClick(dia: Date) {
    const agenda = agendas.find(
      (a) => format(new Date(a.data), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")
    );
    const feriado = feriados.find(
      (f) => format(new Date(f.data), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")
    );
    const ehFimDeSemana = isSaturday(dia) || isSunday(dia);

    if ((feriado || ehFimDeSemana) && !agenda) {
      setDiaSelecionado(dia);
      setAgendaSelecionada(agenda ?? null);
      setFeriadoInfo(
        feriado
          ? { nome: feriado.nome, tipo: feriado.tipo }
          : { nome: "Final de semana", tipo: "FIM_SEMANA" }
      );
      setConfirmFeriadoAberto(true);
    } else {
      setDiaSelecionado(dia);
      setAgendaSelecionada(agenda ?? null);
      setModalAberto(true);
    }
  }

  const periodoLabel = `${format(inicio, "dd", { locale: ptBR })} a ${format(fim, "dd/MMM/yyyy", { locale: ptBR }).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-4 py-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-[#c9a961] font-semibold text-sm">{formatarPosto(session.user.posto)}</p>
            <h1 className="font-bold text-lg leading-tight">{session.user.nomeCompleto}</h1>
            <p className="text-blue-200 text-sm">RE: {session.user.re}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1 text-blue-200 hover:text-white text-sm transition-colors mt-1"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Seletor de semana */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm">
          <button
            onClick={() => irParaSemana(offset - 1)}
            className="flex items-center gap-1 text-[#1e3a5f] font-medium hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Semana de</p>
            <p className="font-semibold text-[#1e3a5f]">{periodoLabel}</p>
          </div>

          <button
            onClick={() => irParaSemana(offset + 1)}
            className="flex items-center gap-1 text-[#1e3a5f] font-medium hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {offset !== 0 && (
          <button
            onClick={() => irParaSemana(0)}
            className="mb-4 text-sm text-[#1e3a5f] underline hover:no-underline"
          >
            Voltar para semana atual
          </button>
        )}

        {/* Grid de dias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {dias.map((dia) => {
            const agenda = agendas.find(
              (a) => format(new Date(a.data), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")
            );
            const feriado = feriados.find(
              (f) => format(new Date(f.data), "yyyy-MM-dd") === format(dia, "yyyy-MM-dd")
            );
            return (
              <DiaCard
                key={dia.toISOString()}
                dia={dia}
                agenda={agenda}
                feriado={feriado}
                onClick={() => handleDiaClick(dia)}
              />
            );
          })}
        </div>
      </main>

      {/* Modal confirmação feriado/fim de semana */}
      {confirmFeriadoAberto && diaSelecionado && feriadoInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-2xl text-center mb-3">⚠️</p>
            <h3 className="text-lg font-semibold text-center mb-2">Data especial</h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              Esta data é{" "}
              <strong>
                {feriadoInfo.tipo === "FIM_SEMANA"
                  ? "um final de semana"
                  : `um feriado: ${feriadoInfo.nome}`}
              </strong>
              . Deseja realmente agendar compromisso nesta data?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmFeriadoAberto(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmFeriadoAberto(false);
                  setModalAberto(true);
                }}
                className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg hover:bg-[#2a4f7c]"
              >
                Agendar mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agenda */}
      {modalAberto && diaSelecionado && (
        <ModalAgenda
          dia={diaSelecionado}
          agenda={agendaSelecionada}
          userId={session.user.id}
          onClose={() => {
            setModalAberto(false);
            setDiaSelecionado(null);
            setAgendaSelecionada(null);
          }}
          onSave={() => {
            setModalAberto(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
