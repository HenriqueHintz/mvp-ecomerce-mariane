"use client";

import React from "react";
import { CheckCircle2, Truck } from "lucide-react";
import { formatBRL, toReais } from "@/lib/pricing";

export interface FreeShippingBarProps {
  remainingForFreeShippingCents: number;
  freeShippingProgress: number;
  compact?: boolean;
}

export default function FreeShippingBar({
  remainingForFreeShippingCents,
  freeShippingProgress,
  compact = false,
}: FreeShippingBarProps) {
  const unlocked = remainingForFreeShippingCents <= 0;

  return (
    <div
      className={
        compact
          ? "px-5 sm:px-6 py-3.5 bg-silk-50/80 border-b border-silk-200/80"
          : "bg-white p-4 sm:p-5 rounded-2xl border border-silk-200 shadow-xs"
      }
    >
      <div className="flex items-center justify-between gap-3 text-xs sm:text-[13px] mb-2">
        {unlocked ? (
          <span className="text-emerald-800 flex items-center gap-1.5 font-semibold [word-spacing:0.04em]">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>Você ganhou frete grátis 🎉</span>
          </span>
        ) : (
          <span className="text-onyx-800 flex items-center gap-1.5 [word-spacing:0.04em]">
            <Truck className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
            <span>
              Faltam{" "}
              <strong className="text-marina-700 font-bold tabular-nums">
                {formatBRL(toReais(remainingForFreeShippingCents))}
              </strong>{" "}
              para frete grátis
            </span>
          </span>
        )}
        <span className="text-onyx-700 text-xs font-semibold tabular-nums shrink-0">
          {freeShippingProgress}%
        </span>
      </div>

      <div
        className="w-full h-2 bg-silk-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={freeShippingProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso para frete grátis"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${
            unlocked ? "bg-emerald-600" : "bg-marina-600"
          }`}
          style={{ width: `${freeShippingProgress}%` }}
        />
      </div>
    </div>
  );
}
