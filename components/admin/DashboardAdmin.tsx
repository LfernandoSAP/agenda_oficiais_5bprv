"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { signOut } from "next-auth/react";
import { LogOut, Users, BarChart3, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { getSemana, formatarPosto, formatarTipoEscala, cn } from "@/lib/utils";
import { dateKey } from "@/lib/dateKey";
import type { Feriado } from "@/lib/feriados";
import { ModalUsuario } from "./ModalUsuario";
import { toast } from "sonner";

type Tab = "grade" | "usuarios" | "logs" | "configuracoes";

interface Props {
  session: any;
  usuarios: any[];
  agendas: any[];
  feriados: Feriado[];
  totalOficiais: number;
  offset: number;
}

export function DashboardAdmin({ session, usuarios, agendas, feriados, totalOficiais, offset }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("grade");
  const [modalUsuario, setModalUsuario] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState<any>(null);

  const { dias, inicio, fim } = getSemana(offset);

  const oficiosComAgenda = new Set(agendas.map((a) => a.userId)).size;
  const pctLancado = totalOficiais > 0 ? Math.round((oficiosComAgenda / totalOficiais) * 100) : 0;

  function irParaSemana(novoOffset: number) {
    router.push(`/admin?semana=${novoOffset}`);
  }

  const periodoLabel = `${format(inicio, "dd", { locale: ptBR })} a ${format(fim, "dd/MMM/yyyy", { locale: ptBR }).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
      <header
        className="relative shadow-2xl"
        style={{ background: "linear-gradient(135deg, #0a1f3d 0%, #1e3a5f 50%, #0a1f3d 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile: empilhado */}
          <div className="flex flex-col sm:hidden gap-3">
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-12 h-12 flex-shrink-0 drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]">
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
                <p className="text-white font-bold text-sm leading-tight">5º BPRv • Sudoeste Paulista</p>
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
              <div className="relative w-16 h-16 flex-shrink-0 drop-shadow-[0_0_8px_rgba(201,169,97,0.3)]">
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
                  5º BPRv <span className="text-[#c9a961]">•</span> Sudoeste Paulista
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

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { id: "grade", icon: <BarChart3 size={16} />, label: "Grade" },
            { id: "usuarios", icon: <Users size={16} />, label: "Usuários" },
            { id: "logs", icon: <FileText size={16} />, label: "Logs" },
            { id: "configuracoes", icon: <Settings size={16} />, label: "Config" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                tab === t.id
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Total de oficiais</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalOficiais}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">Agendas na semana</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{agendas.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-500">Lançaram esta semana</p>
            <p className="text-3xl font-bold text-green-600">{pctLancado}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${pctLancado}%` }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-3 shadow-sm">
          <button onClick={() => irParaSemana(offset - 1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={18} />
          </button>
          <p className="font-semibold text-[#1e3a5f] text-sm">Semana de {periodoLabel}</p>
          <button onClick={() => irParaSemana(offset + 1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={18} />
          </button>
        </div>

        {tab === "grade" && (
          <GradeConsolidada usuarios={usuarios} agendas={agendas} dias={dias} feriados={feriados} />
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
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Posto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">RE</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.nomeCompleto}</td>
                      <td className="px-4 py-3 text-gray-600">{formatarPosto(u.posto)}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono">{u.re}</td>
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
    </div>
  );
}

function GradeConsolidada({ usuarios, agendas, dias, feriados }: any) {
  const cores: Record<string, string> = {
    EXPEDIENTE_NORMAL: "bg-green-100 text-green-800",
    FOLGA_SEMANAL: "bg-yellow-100 text-yellow-800",
    FERIAS: "bg-blue-100 text-blue-800",
    DISPENSA_MEDICA: "bg-red-100 text-red-800",
    CURSO: "bg-purple-100 text-purple-800",
    MISSAO: "bg-orange-100 text-orange-800",
    OUTROS: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm">
      <table className="w-full text-xs bg-white">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-3 font-medium text-gray-600 min-w-[140px]">Oficial</th>
            {dias.map((d: Date) => {
              const key = dateKey(d);
              const feriado = feriados.find((f: Feriado) => f.data === key);
              return (
                <th key={d.toISOString()} className="px-2 py-3 font-medium text-gray-600 min-w-[90px]">
                  <div>{format(d, "EEE", { locale: ptBR })}</div>
                  <div className="text-gray-400">{format(d, "dd/MM")}</div>
                  {feriado && <div className="text-purple-500 text-[10px] truncate max-w-[80px]">{feriado.nome}</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y">
          {usuarios.map((u: any) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">
                <div>{u.nomeCompleto.split(" ")[0]}</div>
                <div className="text-gray-400 font-normal">{formatarPosto(u.posto)}</div>
              </td>
              {dias.map((d: Date) => {
                const key = dateKey(d);
                const agenda = agendas.find(
                  (a: any) => a.userId === u.id && dateKey(a.data) === key
                );
                return (
                  <td key={d.toISOString()} className="px-2 py-2 text-center">
                    {agenda ? (
                      <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-medium", cores[agenda.tipo] ?? "bg-gray-100")}>
                        {formatarTipoEscala(agenda.tipo).split("/")[0].trim()}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Data/Hora</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Usuário</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Ação</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Entidade</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((l: any) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                {format(new Date(l.createdAt), "dd/MM/yyyy HH:mm")}
              </td>
              <td className="px-4 py-3">{l.user?.nomeCompleto ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-blue-600">{l.acao}</td>
              <td className="px-4 py-3 text-gray-600">{l.entidade}</td>
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
