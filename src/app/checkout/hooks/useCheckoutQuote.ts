"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrderPricingSummary } from "@/lib/pricing";
import { normalizeCep } from "@/lib/shipping";

export interface QuoteCartItem {
  id: string;
  quantity: number;
}

/**
 * Hook de Cotação Autoritativa (Especificação Seção B.2 & G).
 * Cancela cotações concorrentes via AbortController para eliminar waterfalls e race conditions.
 * Aplica debounce de 300 ms em mudanças de CEP válido (8 dígitos).
 */
export function useCheckoutQuote(params: {
  items: QuoteCartItem[];
  deliveryMode: "entrega" | "retirada";
  paymentMethod: "whatsapp" | "pix" | "cartao";
  cep?: string | null;
  couponCode?: string | null;
}) {
  const { items, deliveryMode, paymentMethod, cep, couponCode } = params;
  const normalizedInputCep = normalizeCep(cep);

  const [debouncedCep, setDebouncedCep] = useState<string | null>(
    normalizedInputCep
  );
  const [quote, setQuote] = useState<OrderPricingSummary | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (normalizedInputCep === null) {
      setDebouncedCep(null);
      return;
    }
    if (normalizedInputCep === debouncedCep) {
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedCep(normalizedInputCep);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [normalizedInputCep, debouncedCep]);

  const debouncingCep =
    normalizedInputCep !== null && normalizedInputCep !== debouncedCep;
  const effectiveCep = normalizedInputCep === null ? null : debouncedCep;
  const normalizedCouponCode =
    couponCode && couponCode.trim().length > 0
      ? couponCode.trim().toUpperCase()
      : null;

  const fetchQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingQuote(true);
    setQuoteError(null);

    try {
      const res = await fetch("/api/checkout/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          deliveryMode,
          paymentMethod,
          cep: effectiveCep,
          couponCode: normalizedCouponCode,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.quote) {
        setQuote(data.quote);
      } else {
        setQuoteError(
          data.detail || "Não foi possível calcular a cotação no momento."
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setQuoteError("Erro de comunicação ao calcular frete e descontos.");
    } finally {
      if (abortRef.current === controller) {
        setLoadingQuote(false);
      }
    }
  }, [
    items,
    deliveryMode,
    paymentMethod,
    effectiveCep,
    normalizedCouponCode,
  ]);

  useEffect(() => {
    fetchQuote();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchQuote]);

  return {
    quote,
    loadingQuote,
    debouncingCep,
    quoteError,
    refreshQuote: fetchQuote,
  };
}
