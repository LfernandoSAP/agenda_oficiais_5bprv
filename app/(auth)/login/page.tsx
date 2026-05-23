"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { formatarCPF, limparCPF, validarCPF } from "@/lib/cpf";

type Etapa = "cpf" | "re" | "senha";

export default function LoginPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("cpf");
  const [cpf, setCpf] = useState("");
  const [re, setRe] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatarCPF(e.target.value));
  }

  function handleReChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
    if (val.length > 6 && val[6] !== "-") val = val.slice(0, 6) + "-" + val.slice(6);
    if (val.length > 8) val = val.slice(0, 8);
    setRe(val);
  }

  async function handleCpfSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      toast.error("CPF inválido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verificar-cpf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Acesso negado");
        return;
      }
      setIsAdmin(data.isAdmin);
      setEtapa(data.isAdmin ? "senha" : "re");
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        cpf: limparCPF(cpf),
        re: isAdmin ? "" : re,
        senha: isAdmin ? senha : "",
        redirect: false,
      });
      if (result?.error) {
        toast.error("Credenciais inválidas");
        return;
      }
      router.push(isAdmin ? "/admin" : "/agenda");
      router.refresh();
    } catch {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo placeholder */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-[#c9a961] rounded-full flex items-center justify-center mb-4 text-[#1e3a5f] text-4xl font-bold">
            5
          </div>
          <h1 className="text-white text-2xl font-bold text-center leading-tight">
            Agenda Semanal de Comandantes
          </h1>
          <p className="text-[#c9a961] text-lg font-semibold mt-1">5º BPRv</p>
          <p className="text-blue-200 text-sm mt-2 text-center">
            Acesso restrito a oficiais cadastrados
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {etapa === "cpf" && (
            <form onSubmit={handleCpfSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-lg tracking-widest"
                  inputMode="numeric"
                />
              </div>
              <button
                type="submit"
                disabled={loading || limparCPF(cpf).length < 11}
                className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold text-lg hover:bg-[#2a4f7c] disabled:opacity-50 transition-colors"
              >
                {loading ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {etapa === "re" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <p className="text-sm text-gray-500 mb-4">CPF: {cpf}</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RE (Registro de Efetivo)
                </label>
                <input
                  type="text"
                  value={re}
                  onChange={handleReChange}
                  placeholder="Digite seu RE com dígito"
                  maxLength={8}
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-lg tracking-widest uppercase"
                />
                <p className="text-xs text-gray-400 mt-1">Formato: 000000-X</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEtapa("cpf"); setRe(""); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || !/^\d{6}-[0-9A-Za-z]$/.test(re)}
                  className="flex-2 flex-grow bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold hover:bg-[#2a4f7c] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          )}

          {etapa === "senha" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <p className="text-sm text-gray-500 mb-4">CPF: {cpf} • Admin</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-lg"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEtapa("cpf"); setSenha(""); }}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading || !senha}
                  className="flex-2 flex-grow bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold hover:bg-[#2a4f7c] disabled:opacity-50 transition-colors"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-blue-300 text-xs text-center mt-6">
          5º Batalhão de Polícia Rodoviária • Sistema Interno
        </p>
      </div>
    </div>
  );
}
