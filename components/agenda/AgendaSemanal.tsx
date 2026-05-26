"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format, isSaturday, isSunday } from "date-fns";
import { toast } from "sonner";
import { ptBR } from "date-fns/locale";
import { getSemana, formatarPosto } from "@/lib/utils";
import { dateKey } from "@/lib/dateKey";
import type { Feriado } from "@/lib/feriados";
import { DiaCard } from "./DiaCard";
import { ModalAgenda } from "./ModalAgenda";
import { LogOut, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { signOut } from "next-auth/react";

type Agenda = {
  id: string;
  data: string | Date;
  tipo: string;
  observacao: string | null;
  isFeriado: boolean;
  isFimSemana: boolean;
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
    const key = dateKey(dia);
    const hojeKey = dateKey(new Date());
    if (key < hojeKey) {
      toast.error("Não é permitido agendar ou alterar dias anteriores ao atual");
      return;
    }
    const agenda = agendas.find((a) => dateKey(a.data) === key);
    const feriado = feriados.find((f) => f.data === key);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
      {/* Header institucional com logos */}
      <header
        className="relative shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0a1f3d 0%, #1e3a5f 50%, #0a1f3d 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />

        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          {/* Mobile: empilhado, logos centralizados em cima + perfil abaixo */}
          <div className="flex flex-col sm:hidden gap-3">
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-[90px] h-[65px] flex-shrink-0 drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]">
                <Image src="/imagens/asa_rodoviaria.png" alt="Asa" fill className="object-contain" />
              </div>
              <div className="relative w-16 h-16 flex-shrink-0 drop-shadow-[0_0_12px_rgba(201,169,97,0.5)]">
                <Image src="/imagens/logo_coin2.png" alt="Brasão" fill className="object-contain" />
              </div>
              <div className="relative w-12 h-12 flex-shrink-0 drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]">
                <Image src="/imagens/logo_5rv.png" alt="5º BPRv" fill className="object-contain" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-[#c9a961]/20 pt-3">
              <div className="min-w-0 flex-1">
                <p className="text-[#c9a961] text-[10px] font-semibold tracking-wide uppercase">{formatarPosto(session.user.posto)}</p>
                <p className="text-white font-bold text-sm leading-tight truncate">{session.user.nomeCompleto}</p>
                <p className="text-blue-200/70 text-[10px]">RE: {session.user.re}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1 text-[#c9a961] hover:text-white hover:bg-[#c9a961]/10 px-2.5 py-1.5 rounded-lg text-xs transition-all border border-[#c9a961]/30 flex-shrink-0"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>

          {/* Desktop: tudo em linha */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="relative w-[130px] h-[95px] flex-shrink-0 drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]">
                <Image src="/imagens/asa_rodoviaria.png" alt="Asa" fill className="object-contain" />
              </div>
              <div className="relative w-20 h-20 flex-shrink-0 drop-shadow-[0_0_12px_rgba(201,169,97,0.5)]">
                <Image src="/imagens/logo_coin2.png" alt="Brasão" fill className="object-contain" />
              </div>
              <div className="relative w-16 h-16 flex-shrink-0 drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]">
                <Image src="/imagens/logo_5rv.png" alt="5º BPRv" fill className="object-contain" />
              </div>
              <div className="border-l border-[#c9a961]/30 pl-4 ml-2">
                <p className="text-[#c9a961] text-xs tracking-[0.2em] uppercase">Agenda Operacional</p>
                <h1 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                  5º BPRv
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[#c9a961] text-xs font-semibold tracking-wide">{formatarPosto(session.user.posto)}</p>
                <p className="text-white font-bold text-sm leading-tight">{session.user.nomeCompleto}</p>
                <p className="text-blue-200/70 text-xs">RE: {session.user.re}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1.5 text-[#c9a961] hover:text-white hover:bg-[#c9a961]/10 px-3 py-2 rounded-lg text-sm transition-all border border-[#c9a961]/30"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a961]/50 to-transparent" />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tag operacional */}
        <div className="flex justify-center mb-4">
          <span className="px-4 py-1 text-xs tracking-[0.25em] uppercase text-[#1e3a5f] border border-[#c9a961]/50 rounded-full bg-white shadow-sm flex items-center gap-2">
            <Calendar size={12} className="text-[#c9a961]" /> Programação Semanal
          </span>
        </div>

        {/* Seletor de semana */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-[#c9a961]/20">
          <button
            onClick={() => irParaSemana(offset - 1)}
            className="flex items-center gap-1 text-[#1e3a5f] font-medium hover:bg-[#1e3a5f]/5 px-3 py-2 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="text-center">
            <p className="text-xs text-[#c9a961] uppercase tracking-[0.2em] font-semibold">Semana de</p>
            <p className="font-bold text-[#1e3a5f] text-lg" style={{ fontFamily: "Georgia, serif" }}>{periodoLabel}</p>
          </div>

          <button
            onClick={() => irParaSemana(offset + 1)}
            className="flex items-center gap-1 text-[#1e3a5f] font-medium hover:bg-[#1e3a5f]/5 px-3 py-2 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {offset !== 0 && (
          <button
            onClick={() => irParaSemana(0)}
            className="mb-4 text-sm text-[#1e3a5f] underline hover:no-underline font-medium"
          >
            ← Voltar para semana atual
          </button>
        )}

        {/* Grid de dias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dias.map((dia) => {
            const key = dateKey(dia);
            const agenda = agendas.find((a) => dateKey(a.data) === key);
            const feriado = feriados.find((f) => f.data === key);
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

        {/* Legenda */}
        <div className="mt-8 bg-white rounded-2xl p-4 shadow-md border border-[#c9a961]/20">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c9a961] font-semibold mb-3">Legenda</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Exp. Normal", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
              { label: "Folga Semanal", cls: "bg-amber-100 text-amber-800 border-amber-300" },
              { label: "Férias", cls: "bg-sky-100 text-sky-800 border-sky-300" },
              { label: "Dispensa Médica", cls: "bg-rose-100 text-rose-800 border-rose-300" },
              { label: "Curso", cls: "bg-purple-100 text-purple-800 border-purple-300" },
              { label: "Missão", cls: "bg-orange-100 text-orange-800 border-orange-300" },
              { label: "EAP", cls: "bg-cyan-100 text-cyan-800 border-cyan-300" },
              { label: "Outros", cls: "bg-slate-100 text-slate-800 border-slate-300" },
            ].map((t) => (
              <span key={t.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${t.cls}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Modal feriado/fim de semana */}
      {confirmFeriadoAberto && diaSelecionado && feriadoInfo && (
        <div className="fixed inset-0 bg-[#0a1f3d]/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border-t-4 border-amber-400">
            <p className="text-3xl text-center mb-2">⚠️</p>
            <h3 className="text-lg font-bold text-center mb-2 text-[#1e3a5f]">Data especial</h3>
            <p className="text-gray-600 text-center text-sm mb-6">
              Esta data é{" "}
              <strong className="text-[#1e3a5f]">
                {feriadoInfo.tipo === "FIM_SEMANA"
                  ? "um final de semana"
                  : `um feriado: ${feriadoInfo.nome}`}
              </strong>
              . Deseja realmente agendar compromisso nesta data?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmFeriadoAberto(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium"
              >Cancelar</button>
              <button
                onClick={() => { setConfirmFeriadoAberto(false); setModalAberto(true); }}
                className="flex-1 bg-gradient-to-r from-[#1e3a5f] to-[#0a1f3d] text-white py-2.5 rounded-lg font-semibold hover:shadow-lg"
              >Agendar</button>
            </div>
          </div>
        </div>
      )}

      {modalAberto && diaSelecionado && (
        <ModalAgenda
          dia={diaSelecionado}
          agenda={agendaSelecionada}
          userId={session.user.id}
          onClose={() => { setModalAberto(false); setDiaSelecionado(null); setAgendaSelecionada(null); }}
          onSave={() => { setModalAberto(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
