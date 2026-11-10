"use client";

import { useState, useRef, useCallback } from "react";

export interface CepFeedback {
  type: "success" | "warn";
  text: string;
}

export interface UseCepLookupOptions {
  timeoutMs?: number;
  onAddressResolved?: (resolved: { address: string; city: string }) => void;
  onSettled?: () => void;
}

/**
 * Hook resiliente de consulta ao ViaCEP (Mitigação de Risco #5).
 * Aplica timeout estrito de 4 segundos (AbortController) e garante que
 * os campos de endereço e cidade permaneçam sempre editáveis manualmente
 * caso a API externa demore ou falhe.
 */
export function useCepLookup(options: UseCepLookupOptions = {}) {
  const { timeoutMs = 4000, onAddressResolved, onSettled } = options;
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<CepFeedback | null>(null);
  const [isManualFallback, setIsManualFallback] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const lookupCep = useCallback(
    async (rawCep: string) => {
      const digits = rawCep.replace(/\D/g, "").slice(0, 8);
      if (digits.length !== 8) {
        setCepFeedback(null);
        setIsManualFallback(false);
        return;
      }

      // Cancela requisição anterior em voo (evita race condition ao digitar rápido)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      setCepLoading(true);
      setCepFeedback(null);

      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        };

        if (data.erro) {
          setIsManualFallback(true);
          setCepFeedback({
            type: "warn",
            text: "CEP não localizado. Por favor, preencha o endereço manualmente abaixo.",
          });
        } else {
          const logradouro = data.logradouro || "";
          const bairro = data.bairro || "";
          const localidade = data.localidade || "Lages";
          const uf = data.uf || "SC";

          const street = logradouro
            ? `${logradouro}${bairro ? `, ${bairro}` : ""}`
            : "";

          setIsManualFallback(!street);
          onAddressResolved?.({
            address: street,
            city: `${localidade} - ${uf}`,
          });
          setCepFeedback({
            type: "success",
            text: `${localidade}/${uf} localizado com sucesso. Complete com o número e complemento.`,
          });
        }
      } catch {
        setIsManualFallback(true);
        setCepFeedback({
          type: "warn",
          text: "Não foi possível consultar o CEP em até 4 segundos. Preencha seu endereço manualmente abaixo.",
        });
      } finally {
        clearTimeout(timeoutId);
        setCepLoading(false);
        onSettled?.();
      }
    },
    [timeoutMs, onAddressResolved, onSettled]
  );

  return {
    cepLoading,
    cepFeedback,
    isManualFallback,
    lookupCep,
    clearCepFeedback: () => setCepFeedback(null),
  };
}
