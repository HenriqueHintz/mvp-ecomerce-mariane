"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { OrderPricingSummary } from "@/lib/pricing";

export interface QuoteCartItem {
  id: string;
  quantity: number;
}

/**
 * Hook de Cotação Autoritativa (Especificação Seção B.2 & G).
 * Cancela cotações concorrentes via AbortController para eliminar waterfalls e race conditions.
 */
export function useCheckoutQuote(params: {
  items: QuoteCartItem[];
  deliveryMode: "entrega" | "retirada";
  paymentMethod: "whatsapp" | "pix" | "cartao";
}) {
  const { items, deliveryMode, paymentMethod } = params;
  const [quote, setQuote] = useState<OrderPricingSummary | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
  }, [items, deliveryMode, paymentMethod]);

  useEffect(() => {
    fetchQuote();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchQuote]);

  return {
    quote,
    loadingQuote,
    quoteError,
    refreshQuote: fetchQuote,
  };
}
