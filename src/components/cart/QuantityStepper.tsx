"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

export interface QuantityStepperProps {
  quantity: number;
  productName: string;
  onDecrease: () => void;
  onIncrease: () => void;
  maxQuantity?: number;
}

export default function QuantityStepper({
  quantity,
  productName,
  onDecrease,
  onIncrease,
  maxQuantity = 50,
}: QuantityStepperProps) {
  const isMin = quantity <= 1;
  const isMax = quantity >= maxQuantity;

  return (
    <div
      className="inline-flex items-center rounded-xl border border-silk-200 bg-silk-50/80"
      role="group"
      aria-label={`Quantidade de ${productName}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={isMin}
        aria-label={`Diminuir quantidade de ${productName}`}
        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-onyx-700 hover:text-onyx-950 hover:bg-white rounded-l-xl transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
      >
        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <span
        aria-live="polite"
        className="min-w-[32px] text-center text-sm font-semibold text-onyx-950 tabular-nums select-none px-1"
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={isMax}
        aria-label={`Aumentar quantidade de ${productName}`}
        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-onyx-700 hover:text-onyx-950 hover:bg-white rounded-r-xl transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
