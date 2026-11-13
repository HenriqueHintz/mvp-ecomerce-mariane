"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  return (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full border border-silk-300 bg-white text-sm font-medium text-onyx-800 hover:bg-silk-50 hover:text-marina-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
      >
        <ArrowUp className="w-4 h-4" aria-hidden="true" />
        <span>Voltar ao topo</span>
      </button>
    </div>
  );
}
