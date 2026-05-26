"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

type Etapa = "re" | "senha";

export default function LoginPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("re");
  const [re, setRe] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  function handleReChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value.replace(/[^0-9A-Za-z-]/g, "").toUpperCase();
    if (val.length > 6 && val[6] !== "-") val = val.slice(0, 6) + "-" + val.slice(6);
    if (val.length > 8) val = val.slice(0, 8);
    setRe(val);
  }

  async function handleReSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}-[0-9A-Za-z]$/.test(re)) { toast.error("RE inválido"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verificar-re", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ re }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? "Acesso negado"); return; }

      if (data.isAdmin) {
        setIsAdmin(true);
        setEtapa("senha");
      } else {
        // Comum: login direto sem segundo fator
        const result = await signIn("credentials", { re, senha: "", redirect: false });
        if (result?.error) { toast.error("Credenciais inválidas"); return; }
        router.push("/agenda");
        router.refresh();
      }
    } catch { toast.error("Erro de conexão"); }
    finally { setLoading(false); }
  }

  async function handleLoginAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", { re, senha, redirect: false });
      if (result?.error) { toast.error("Credenciais inválidas"); return; }
      router.push("/admin");
      router.refresh();
    } catch { toast.error("Erro ao fazer login"); }
    finally { setLoading(false); }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{
        background: "linear-gradient(135deg, #0a1f3d 0%, #1e3a5f 50%, #0a1f3d 100%)",
      }}
    >
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#c9a961]/60 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#c9a961]/60 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#c9a961]/60 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#c9a961]/60 rounded-br-lg" />

      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <span className="px-4 py-1.5 text-xs tracking-[0.25em] uppercase text-[#c9a961] border border-[#c9a961]/40 rounded-full bg-[#c9a961]/5">
            ● Portal Operacional
          </span>
        </div>

        <div className="flex items-center justify-center gap-5 sm:gap-10 mb-6">
          <div className="relative w-[120px] h-[90px] sm:w-[200px] sm:h-[150px] drop-shadow-[0_0_15px_rgba(201,169,97,0.3)]">
            <Image src="/imagens/asa_rodoviaria.png" alt="Asa Rodoviária" fill className="object-contain" priority />
          </div>
          <div className="relative w-20 h-20 sm:w-36 sm:h-36 drop-shadow-[0_0_25px_rgba(201,169,97,0.4)]">
            <Image src="/imagens/logo_coin2.png" alt="Brasão 5º BPRv" fill className="object-contain" priority />
          </div>
          <div className="relative w-16 h-16 sm:w-28 sm:h-28 drop-shadow-[0_0_15px_rgba(201,169,97,0.3)]">
            <Image src="/imagens/logo_5rv.png" alt="5º BPRv" fill className="object-contain" priority />
          </div>
        </div>

        <div className="text-center mb-2">
          <h1
            className="text-4xl sm:text-5xl font-bold text-[#c9a961] tracking-wide"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", textShadow: "0 0 20px rgba(201,169,97,0.3)" }}
          >
            5º BPRv
          </h1>
          <p className="text-blue-100/80 text-sm sm:text-base tracking-[0.2em] uppercase mt-1">
            O Guardião das Rodovias do Sudoeste Paulista
          </p>
        </div>

        <div className="flex items-center justify-center my-6">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#c9a961]/50" />
          <div className="w-2 h-2 bg-[#c9a961] rotate-45 mx-2" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#c9a961]/50" />
        </div>

        <p className="text-blue-200/90 text-sm text-center mb-6 font-medium">
          Agenda Semanal de Comandantes — Acesso restrito a oficiais cadastrados
        </p>

        <div className="bg-[#0d2348]/80 backdrop-blur-sm border border-[#c9a961]/20 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto">
          {etapa === "re" && (
            <form onSubmit={handleReSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2 tracking-wide">RE</label>
                <input
                  type="text" value={re} onChange={handleReChange}
                  placeholder="000000-X" maxLength={8} required autoFocus
                  className="w-full px-4 py-3 bg-[#0a1f3d]/60 border border-[#c9a961]/30 rounded-lg text-white placeholder-white/30 text-lg tracking-widest uppercase focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/30 transition-all"
                />
                <p className="text-xs text-blue-200/50 mt-1.5">Formato: 6 dígitos + traço + 1 caractere</p>
              </div>
              <button
                type="submit" disabled={loading || !/^\d{6}-[0-9A-Za-z]$/.test(re)}
                className="w-full bg-gradient-to-r from-[#c9a961] to-[#b08e4a] text-[#0a1f3d] py-3 rounded-lg font-bold text-lg uppercase tracking-wider hover:shadow-[0_0_20px_rgba(201,169,97,0.5)] disabled:opacity-40 transition-all"
              >
                {loading ? "Verificando..." : "Continuar →"}
              </button>
            </form>
          )}

          {etapa === "senha" && (
            <form onSubmit={handleLoginAdmin} className="space-y-5">
              <p className="text-sm text-blue-200/70">
                RE: <span className="text-white font-medium">{re}</span> • <span className="text-[#c9a961]">Admin</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-[#c9a961] mb-2 tracking-wide">Senha</label>
                <input
                  type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha" required autoFocus
                  className="w-full px-4 py-3 bg-[#0a1f3d]/60 border border-[#c9a961]/30 rounded-lg text-white placeholder-white/30 text-lg focus:outline-none focus:border-[#c9a961] focus:ring-2 focus:ring-[#c9a961]/30 transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button" onClick={() => { setEtapa("re"); setSenha(""); setIsAdmin(false); }}
                  className="flex-1 border border-[#c9a961]/40 text-[#c9a961] py-3 rounded-lg font-medium hover:bg-[#c9a961]/10 transition-colors"
                >Voltar</button>
                <button
                  type="submit" disabled={loading || !senha}
                  className="flex-[2] bg-gradient-to-r from-[#c9a961] to-[#b08e4a] text-[#0a1f3d] py-3 rounded-lg font-bold uppercase tracking-wider hover:shadow-[0_0_20px_rgba(201,169,97,0.5)] disabled:opacity-40 transition-all"
                >{loading ? "Entrando..." : "Entrar"}</button>
              </div>
            </form>
          )}
        </div>

        <p className="text-blue-200/50 text-xs text-center mt-6 tracking-wider">
          5º Batalhão de Polícia Rodoviária • Sistema Interno
        </p>
      </div>
    </div>
  );
}
