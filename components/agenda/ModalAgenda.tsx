"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { X } from "lucide-react";
import { formatarData } from "@/lib/utils";

const TIPOS = [
  { value: "CONVALESCENCA", label: "Convalescença" },
  { value: "CURSO", label: "Curso" },
  { value: "DEJEM", label: "Dejem" },
  { value: "DISP_SERVICO", label: "Disp. Serviço" },
  { value: "EAP", label: "EAP" },
  { value: "EXPEDIENTE_NORMAL", label: "Expediente Normal" },
  { value: "FERIAS", label: "Férias" },
  { value: "FOLGA", label: "Folga" },
  { value: "FOLGA_SEMANAL", label: "Folga Semanal" },
  { value: "LICENCA_PREMIO", label: "Licença Prêmio" },
  { value: "LTS", label: "LTS" },
  { value: "MISSAO", label: "Missão" },
  { value: "OUTROS", label: "Outros" },
];

interface Props {
  dia: Date;
  agenda?: { id: string; tipo: string; observacao: string | null } | null;
  userId: string;
  nomeOficial?: string;
  onClose: () => void;
  onSave: () => void;
}

export function ModalAgenda({ dia, agenda, userId, nomeOficial, onClose, onSave }: Props) {
  const [tipo, setTipo] = useState(agenda?.tipo ?? "EXPEDIENTE_NORMAL");
  const [observacao, setObservacao] = useState(agenda?.observacao ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    setLoading(true);
    try {
      const res = await fetch("/api/agenda", {
        method: agenda ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agenda?.id,
          userId,
          data: format(dia, "yyyy-MM-dd"),
          tipo,
          observacao: observacao.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Erro ao salvar");
        return;
      }
      toast.success(agenda ? "Agenda atualizada!" : "Agenda cadastrada!");
      onSave();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir() {
    if (!agenda) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agenda?id=${agenda.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Agenda excluída!");
      onSave();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1e3a5f]">
              {formatarData(dia, "EEEE, dd 'de' MMMM")}
            </h2>
            {nomeOficial && (
              <p className="text-xs text-[#c9a961] font-semibold uppercase tracking-wider mt-0.5">
                Oficial: {nomeOficial}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de escala</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-gray-900"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value} className="text-gray-900">{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observação <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value.slice(0, 200))}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] resize-none text-sm"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            />
            <p className="text-xs text-gray-400 text-right">{observacao.length}/200</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {agenda && (
            <button
              onClick={handleExcluir}
              disabled={loading}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50"
            >
              Excluir
            </button>
          )}
          <div className="flex-1 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={loading}
              className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4f7c] text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
