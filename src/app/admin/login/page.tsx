"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { STORE_CONFIG } from "@/config/store";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsRateLimited(false);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setIsRateLimited(true);
        const waitMsg =
          typeof data.retryAfterSeconds === "number"
            ? ` Aguarde ${data.retryAfterSeconds} segundos antes de tentar novamente.`
            : "";
        setError(
          data.detail ||
            `Muitas tentativas de login realizadas.${waitMsg}`
        );
        setLoading(false);
        return;
      }

      if (res.status === 401 || !res.ok || !data.success) {
        setError(
          data.detail ||
            "Senha incorreta. Verifique a credencial administrativa da loja."
        );
        setLoading(false);
        return;
      }

      router.push("/admin/pedidos");
    } catch {
      setError("Erro de conexão ao autenticar. Verifique sua internet.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] bg-luxury-offwhite flex items-center justify-center px-4 py-8 sm:py-12 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-silk-200 p-6 sm:p-8 shadow-luxury-card space-y-6">
        <div className="text-center space-y-2">
          <div
            aria-hidden="true"
            className="w-12 h-12 mx-auto rounded-2xl bg-brand-light flex items-center justify-center text-brand"
          >
            <Lock className="w-6 h-6" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-brand">
            <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{STORE_CONFIG.name}</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-onyx-950">
            Painel da Loja
          </h1>
          <p className="text-xs sm:text-sm text-onyx-600">
            Acesso restrito à gestão operacional de pedidos da {STORE_CONFIG.name}
          </p>
        </div>

        {error && (
          <div
            id="admin-login-error"
            role="alert"
            className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
              isRateLimited
                ? "bg-amber-50 border-amber-300 text-amber-900"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <AlertCircle
              aria-hidden="true"
              className="w-4 h-4 flex-shrink-0 mt-0.5"
            />
            <div className="space-y-0.5">
              <p className="font-bold">
                {isRateLimited
                  ? "Limite de tentativas atingido (HTTP 429)"
                  : "Falha na autenticação"}
              </p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-bold uppercase tracking-wider text-onyx-700 mb-1.5"
            >
              Senha Administrativa
            </label>
            <div className="relative flex items-center">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-login-error" : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha da loja"
                className="w-full min-h-[48px] pl-4 pr-12 py-3 rounded-xl border border-silk-300 text-sm text-onyx-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-onyx-600 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="w-4 h-4" />
                ) : (
                  <Eye aria-hidden="true" className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-marina-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>
      </div>
    </main>
  );
}
