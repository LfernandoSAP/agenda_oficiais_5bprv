"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { formatarCPF, limparCPF } from "@/lib/cpf";

const POSTOS = [
  { value: "CEL_PM", label: "Cel PM" },
  { value: "TEN_CEL_PM", label: "Ten Cel PM" },
  { value: "MAJ_PM", label: "Maj PM" },
  { value: "CAP_PM", label: "Cap PM" },
  { value: "TEN_PM", label: "Ten PM" },
];

interface Props {
  usuario?: any;
  onClose: () => void;
  onSave: () => void;
}

export function ModalUsuario({ usuario, onClose, onSave }: Props) {
  const [cpf, setCpf] = useState(usuario ? formatarCPF(usuario.cpf) : "");
  const [re, setRe] = useState(usuario?.re ?? "");
  const [nomeCompleto, setNomeCompleto] = useState(usuario?.nomeCompleto ?? "");
  const [posto, setPosto] = useState(usuario?.posto ?? "TEN_PM");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [ativo, setAtivo] = useState(usuario?.ativo ?? true);
  const [loading, setLoading] = useState(false);

  function handleReChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
    if (val.length > 6 && val[6] !== "-") val = val.slice(0, 6) + "-" + val.slice(6);
    if (val.length > 8) val = val.slice(0, 8);
    setRe(val);
  }

  async function handleSalvar() {
    setLoading(true);
    try {
      const payload = {
        id: usuario?.id,
        cpf: limparCPF(cpf),
        re,
        nomeCompleto,
        posto,
        email: email || null,
        ativo,
      };
      const res = await fetch("/api/usuarios", {
        method: usuario ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      toast.success(usuario ? "Oficial atualizado!" : "Oficial cadastrado!");
      onSave();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1e3a5f]">
            {usuario ? "Editar oficial" : "Cadastrar oficial"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input
              type="text" value={cpf} maxLength={14}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              disabled={!!usuario}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RE</label>
            <input type="text" value={re} onChange={handleReChange} maxLength={8} placeholder="000000-X" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posto</label>
            <select value={posto} onChange={(e) => setPosto(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
              {POSTOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (opcional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="oficial@pm.gov.br" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]" />
          </div>
          {usuario && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ativo" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Usuário ativo</label>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
          <button onClick={handleSalvar} disabled={loading} className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-lg hover:bg-[#2a4f7c] text-sm font-semibold disabled:opacity-50">
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
