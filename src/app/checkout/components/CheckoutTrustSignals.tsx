"use client";

import React from "react";
import { Store, MessageCircle, RefreshCw, Award } from "lucide-react";

/**
 * Hoisted static list (`rendering-hoist-jsx` from `react-best-practices`).
 */
const TRUST_SIGNALS = [
  {
    icon: Store,
    title: "Loja Física em Lages – SC",
    desc: "Retire seu pedido sem custo na Rua Blumenau, Nº 623.",
  },
  {
    icon: MessageCircle,
    title: "Consultoria no WhatsApp",
    desc: "Tire dúvidas sobre cronograma capilar com nossa equipe.",
  },
  {
    icon: RefreshCw,
    title: "Trocas e Devoluções",
    desc: "Satisfação garantida ou troca facilitada em até 7 dias.",
  },
  {
    icon: Award,
    title: "Produtos 100% Originais",
    desc: "Revendedora autorizada Madressenza, Truss, Wella e Braé.",
  },
] as const;

export function CheckoutTrustSignals() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-silk-200">
      {TRUST_SIGNALS.map((sig) => {
        const Icon = sig.icon;
        return (
          <div
            key={sig.title}
            className="flex items-start space-x-3 p-3.5 rounded-xl bg-white/70 border border-silk-200/80 text-left"
          >
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0 text-brand mt-0.5"
            >
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-onyx-900">{sig.title}</p>
              <p className="text-[11px] text-onyx-600 mt-0.5 leading-snug">
                {sig.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
