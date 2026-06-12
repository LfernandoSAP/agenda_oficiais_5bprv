"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { signOut } from "next-auth/react";
import { LogOut, Users, BarChart3, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { getSemana, formatarPosto, formatarTipoEscala, formatarUnidade, cn } from "@/lib/utils";
import { dateKey } from "@/lib/dateKey";
import type { Feriado } from "@/lib/feriados";
import { ModalUsuario } from "./ModalUsuario";
import { ModalAgenda } from "../agenda/ModalAgenda";
import { toast } from "sonner";

type Tab = "grade" | "usuarios" | "logs" | "configuracoes";

const UNIDADES_FILTRO = [
  { value: "TODAS", label: "Todas as Cias" },
  { value: "EM", label: "EM" },
  { value: "CIA_1", label: "1ª Cia" },
  { value: "CIA_2", label: "2ª Cia" },
  { value: "CIA_3", label: "3ª Cia" },
  { value: "CIA_4", label: "4ª Cia" },
];

interface Props {
  session: any;
  usuarios: any[];
  usuariosGrade: any[];
  agendas: any[];
  feriados: Feriado[];
  totalOficiais: number;
  offset: number;
  unidadeFiltro: string;
}

export function DashboardAdmin({ session, usuarios, usuariosGrade, agendas, feriados, totalOficiais, offset, unidadeFiltro }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("grade");
  const [modalUsuario, setModalUsuario] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState<any>(null);
  const [modalAgenda, setModalAgenda] = useState<null | {
    dia: Date;
    userId: string;
    nomeOficial: string;
    agenda: any | null;
  }>(null);

  const { dias, inicio, fim } = getSemana(offset);

  function abrirModalAgenda(dia: Date, oficial: any, agenda: any | null) {
    setModalAgenda({
      dia,
      userId: oficial.id,
      nomeOficial: `${formatarPosto(oficial.posto)} ${oficial.nomeCompleto}`,
      agenda,
    });
  }

  const oficiosComAgenda = new Set(agendas.map((a) => a.userId)).size;
  const pctLancado = totalOficiais > 0 ? Math.round((oficiosComAgenda / totalOficiais) * 100) : 0;

  function irParaSemana(novoOffset: number) {
    const u = unidadeFiltro && unidadeFiltro !== "TODAS" ? `&unidade=${unidadeFiltro}` : "";
    router.push(`/admin?semana=${novoOffset}${u}`);
  }

  function trocarUnidade(novaUnidade: string) {
    const s = `semana=${offset}`;
    const u = novaUnidade !== "TODAS" ? `&unidade=${novaUnidade}` : "";
    router.push(`/admin?${s}${u}`);
  }

  const periodoLabel = `${format(inicio, "dd", { locale: ptBR })} a ${format(fim, "dd/MMM/yyyy", { locale: ptBR }).toUpperCase()}`;
  const unidadeLabel = UNIDADES_FILTRO.find((u) => u.value === unidadeFiltro)?.label ?? "Todas as Cias";

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50"
      style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif", color: "#000", fontSize: "1.2em" }}
    >
      <header
        className="relative shadow-2xl print:hidden"
        style={{ background: "linear-gradient(135deg, #0a1f3d 0%, #1e3a5f 50%, #0a1f3d 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile: empilhado */}
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
              <div>
                <p className="text-[#c9a961] text-[10px] tracking-[0.2em] uppercase font-semibold">Painel Admin</p>
                <p className="text-white font-bold text-sm leading-tight">5º BPRv</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-1 text-[#c9a961] hover:text-white hover:bg-[#c9a961]/10 px-2.5 py-1.5 rounded-lg text-xs transition-all border border-[#c9a961]/30 flex-shrink-0"
              >
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
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
                <p className="text-[#c9a961] text-xs tracking-[0.2em] uppercase font-semibold">Painel Administrativo</p>
                <h1 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                  5º BPRv
                </h1>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-[#c9a961] hover:text-white hover:bg-[#c9a961]/10 px-3 py-2 rounded-lg text-sm transition-all border border-[#c9a961]/30"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a961]/50 to-transparent" />
      </header>

      <div className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { id: "grade", icon: <BarChart3 size={16} />, label: "Agenda de Oficiais" },
            { id: "usuarios", icon: <Users size={16} />, label: "Usuários" },
            { id: "logs", icon: <FileText size={16} />, label: "Logs" },
            { id: "configuracoes", icon: <Settings size={16} />, label: "Config" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors",
                tab === t.id
                  ? "border-[#c9a961] text-[#1e3a5f]"
                  : "border-transparent text-black hover:text-[#1e3a5f]"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 print:hidden">
          <div className="bg-white rounded-xl p-4 shadow-md border border-[#c9a961]/30">
            <p className="text-xs font-bold uppercase tracking-wider text-black">Total de oficiais</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalOficiais}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-[#c9a961]/30">
            <p className="text-xs font-bold uppercase tracking-wider text-black">Agendas na semana</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{agendas.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-[#c9a961]/30 col-span-2 sm:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-black">Lançaram esta semana</p>
            <p className="text-3xl font-bold text-emerald-700">{pctLancado}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pctLancado}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 bg-white rounded-xl p-3 shadow-sm print:hidden">
          <div className="flex items-center justify-between sm:gap-4 flex-1">
            <button onClick={() => irParaSemana(offset - 1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={18} />
            </button>
            <p className="font-semibold text-[#1e3a5f] text-sm text-center">Semana de {periodoLabel}</p>
            <button onClick={() => irParaSemana(offset + 1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={18} />
            </button>
          </div>
          {tab === "grade" && (
            <div className="flex items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-4">
              <label className="text-xs text-black uppercase tracking-wider font-bold whitespace-nowrap">Unidade:</label>
              <select
                value={unidadeFiltro}
                onChange={(e) => trocarUnidade(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-gray-900"
              >
                {UNIDADES_FILTRO.map((u) => (
                  <option key={u.value} value={u.value} className="text-gray-900">{u.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {tab === "grade" && (
          <>
            <div className="flex justify-end mb-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#2a4f7c] shadow-md"
              >
                🖨️ Imprimir / PDF
              </button>
            </div>

            {/* Cabeçalho institucional — só na impressão */}
            <div className="hidden print:block mb-4 border-b-2 border-[#1e3a5f] pb-3">
              <div className="flex items-center justify-center gap-4 mb-2">
                <div className="relative w-[78px] h-[57px] flex-shrink-0">
                  <Image src="/imagens/asa_rodoviaria.png" alt="Asa" fill className="object-contain" />
                </div>
                <div className="relative w-14 h-14 flex-shrink-0">
                  <Image src="/imagens/logo_coin2.png" alt="Brasão" fill className="object-contain" />
                </div>
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image src="/imagens/logo_5rv.png" alt="5º BPRv" fill className="object-contain" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[#c9a961] text-xs uppercase tracking-[0.2em] font-bold">5º BPRv — Policiamento Rodoviário</p>
                <h1 className="text-[#1e3a5f] font-bold text-xl" style={{ fontFamily: "Georgia, serif" }}>
                  Agenda de Oficiais
                </h1>
                <p className="text-sm text-black mt-1">
                  Semana de {periodoLabel} · Unidade: {unidadeLabel}
                </p>
              </div>
            </div>

            <GradeConsolidada
              usuarios={usuariosGrade.filter((u: any) => u.ativo)}
              agendas={agendas}
              dias={dias}
              feriados={feriados}
              onCelClick={abrirModalAgenda}
            />
          </>
        )}

        {tab === "usuarios" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1e3a5f]">Oficiais cadastrados</h2>
              <button
                onClick={() => { setUsuarioEdit(null); setModalUsuario(true); }}
                className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a4f7c]"
              >
                + Cadastrar oficial
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#c9a961]/30">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-black">Nome</th>
                    <th className="text-left px-4 py-3 font-bold text-black">Posto</th>
                    <th className="text-left px-4 py-3 font-bold text-black">Unidade</th>
                    <th className="text-left px-4 py-3 font-bold text-black">RE</th>
                    <th className="text-left px-4 py-3 font-bold text-black">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usuarios.map((u, idx) => (
                    <tr key={u.id} className={cn(idx % 2 === 0 ? "bg-white" : "bg-slate-100", "hover:bg-amber-50")}>
                      <td className="px-4 py-3 font-bold text-black">{u.nomeCompleto}</td>
                      <td className="px-4 py-3 text-black">{formatarPosto(u.posto)}</td>
                      <td className="px-4 py-3 text-black">{formatarUnidade(u.unidade)}</td>
                      <td className="px-4 py-3 text-black font-mono">{u.re}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", u.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {u.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {u.isAdmin && <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Admin</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => { setUsuarioEdit(u); setModalUsuario(true); }}
                          className="text-[#1e3a5f] hover:underline text-xs font-medium"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "logs" && <LogsAuditoria />}
        {tab === "configuracoes" && <Configuracoes />}
      </main>

      {modalUsuario && (
        <ModalUsuario
          usuario={usuarioEdit}
          onClose={() => setModalUsuario(false)}
          onSave={() => { setModalUsuario(false); router.refresh(); }}
        />
      )}

      {modalAgenda && (
        <ModalAgenda
          dia={modalAgenda.dia}
          agenda={modalAgenda.agenda}
          userId={modalAgenda.userId}
          nomeOficial={modalAgenda.nomeOficial}
          onClose={() => setModalAgenda(null)}
          onSave={() => { setModalAgenda(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function GradeConsolidada({ usuarios, agendas, dias, feriados, onCelClick }: any) {
  const cores: Record<string, string> = {
    CONVALESCENCA: "bg-rose-200 text-rose-900",
    CURSO: "bg-purple-200 text-purple-900",
    DEJEM: "bg-indigo-200 text-indigo-900",
    DISP_SERVICO: "bg-pink-200 text-pink-900",
    EAP: "bg-cyan-200 text-cyan-900",
    EXPEDIENTE_NORMAL: "bg-emerald-200 text-emerald-900",
    FERIAS: "bg-sky-200 text-sky-900",
    FOLGA: "bg-lime-200 text-lime-900",
    FOLGA_SEMANAL: "bg-amber-200 text-amber-900",
    LICENCA_PREMIO: "bg-fuchsia-200 text-fuchsia-900",
    LTS: "bg-red-200 text-red-900",
    MEIO_EXPEDIENTE: "bg-teal-200 text-teal-900",
    MISSAO: "bg-orange-200 text-orange-900",
    OUTROS: "bg-slate-200 text-slate-900",
  };

  const hojeKey = dateKey(new Date());

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm print:overflow-visible print:shadow-none">
      <table className="w-full text-xs bg-white border-collapse border border-black">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-3 py-3 font-bold text-black min-w-[140px] border border-black">Oficial</th>
            {dias.map((d: Date) => {
              const key = dateKey(d);
              const feriado = feriados.find((f: Feriado) => f.data === key);
              return (
                <th key={d.toISOString()} className="px-2 py-3 font-bold text-black min-w-[90px] border border-black">
                  <div>{format(d, "EEE", { locale: ptBR })}</div>
                  <div className="text-gray-700">{format(d, "dd/MM")}</div>
                  {feriado && <div className="text-purple-700 text-[10px] truncate max-w-[80px] font-semibold">{feriado.nome}</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u: any, idx: number) => (
            <tr
              key={u.id}
              className={cn(
                "transition-colors",
                idx % 2 === 0 ? "bg-white" : "bg-slate-100",
                "hover:bg-amber-50"
              )}
            >
              <td className="px-3 py-2 font-bold text-black border border-black">
                <div>{u.nomeCompleto.split(" ")[0]}</div>
                <div className="text-gray-700 font-normal">{formatarPosto(u.posto)}</div>
              </td>
              {dias.map((d: Date) => {
                const key = dateKey(d);
                const agenda = agendas.find(
                  (a: any) => a.userId === u.id && dateKey(a.data) === key
                );
                const ehPassado = key < hojeKey;
                return (
                  <td
                    key={d.toISOString()}
                    onClick={() => onCelClick?.(d, u, agenda ?? null)}
                    title={ehPassado ? "Dia encerrado — admin pode alterar" : agenda ? "Clique para alterar" : "Clique para cadastrar"}
                    className={cn(
                      "px-2 py-2 align-top text-center transition-colors cursor-pointer hover:bg-amber-100 border border-black",
                      ehPassado && "opacity-70"
                    )}
                  >
                    {agenda ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("inline-block px-2 py-0.5 rounded font-bold text-[11px] shadow-sm", cores[agenda.tipo] ?? "bg-gray-200 text-black")}>
                          {formatarTipoEscala(agenda.tipo)}
                        </span>
                        {agenda.observacao && (
                          <p
                            className="text-xs text-black leading-tight max-w-[90px] line-clamp-3 print:line-clamp-none print:max-w-none print:whitespace-pre-line"
                            title={agenda.observacao}
                            style={{ fontFamily: "'Times New Roman', Times, serif" }}
                          >
                            “{agenda.observacao}”
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogsAuditoria() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function carregar() {
    setLoading(true);
    const res = await fetch("/api/admin/logs");
    const data = await res.json();
    setLogs(data);
    setLoaded(true);
    setLoading(false);
  }

  if (!loaded) {
    return (
      <div className="text-center py-12">
        <button onClick={carregar} disabled={loading} className="bg-[#1e3a5f] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2a4f7c] disabled:opacity-50">
          {loading ? "Carregando..." : "Carregar logs"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-[#c9a961]/30">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            <th className="text-left px-4 py-3 font-bold text-black">Data/Hora</th>
            <th className="text-left px-4 py-3 font-bold text-black">Usuário</th>
            <th className="text-left px-4 py-3 font-bold text-black">Ação</th>
            <th className="text-left px-4 py-3 font-bold text-black">Entidade</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((l: any) => (
            <tr key={l.id} className="hover:bg-amber-50">
              <td className="px-4 py-3 text-black text-xs whitespace-nowrap">
                {format(new Date(l.createdAt), "dd/MM/yyyy HH:mm")}
              </td>
              <td className="px-4 py-3 text-black">{l.user?.nomeCompleto ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{l.acao}</td>
              <td className="px-4 py-3 text-black">{l.entidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Configuracoes() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmar) { toast.error("Senhas não conferem"); return; }
    if (novaSenha.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!res.ok) { toast.error("Senha atual incorreta"); return; }
      toast.success("Senha alterada!");
      setSenhaAtual(""); setNovaSenha(""); setConfirmar("");
    } catch {
      toast.error("Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">Alterar senha</h2>
      <form onSubmit={handleAlterarSenha} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#1e3a5f] text-white py-2 rounded-lg font-semibold hover:bg-[#2a4f7c] disabled:opacity-50">
          {loading ? "Salvando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
