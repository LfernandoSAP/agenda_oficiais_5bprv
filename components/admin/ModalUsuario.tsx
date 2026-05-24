"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, ShieldCheck, User } from "lucide-react";
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
  const [isAdmin, setIsAdmin] = useState<boolean>(usuario?.isAdmin ?? false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const eraAdmin = !!usuario?.isAdmin;
  const promovendo = !eraAdmin && isAdmin;
  const senhaObrigatoria = isAdmin && (!usuario || promovendo);

  function handleReChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
    if (val.length > 6 && val[6] !== "-") val = val.slice(0, 6) + "-" + val.slice(6);
    if (val.length > 8) val = val.slice(0, 8);
    setRe(val);
  }

  async function handleSalvar() {
    if (senhaObrigatoria && senha.length < 6) {
      toast.error("Senha mínima de 6 caracteres");
      return;
    }
    if (isAdmin && senha && senha !== confirmarSenha) {
      toast.error("Senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        id: usuario?.id,
        cpf: limparCPF(cpf),
        re,
        nomeCompleto,
        posto,
        email: email || null,
        ativo,
        isAdmin,
      };
      if (isAdmin && senha) payload.senha = senha;

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acesso</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all " +
                  (!isAdmin
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50")
                }
              >
                <User size={16} /> Comum
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all " +
                  (isAdmin
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50")
                }
              >
                <ShieldCheck size={16} /> Admin
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isAdmin
                ? "Faz login com CPF + senha. Acesso ao painel administrativo."
                : "Faz login com CPF + RE. Acesso apenas à própria agenda."}
            </p>
          </div>

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

          {isAdmin && (
            <div className="border-t pt-4 space-y-3 bg-purple-50/40 -mx-6 px-6 py-4">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                {senhaObrigatoria ? "Definir senha de acesso" : "Resetar senha (opcional)"}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {senhaObrigatoria ? "Senha" : "Nova senha (deixe em branco para manter)"}
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {senha && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}

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
