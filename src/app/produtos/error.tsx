"use client";

import React from "react";
import Link from "next/link";

export default function ProductsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="bg-white p-8 rounded-3xl border border-silk-200 shadow-luxury-card space-y-4">
        <span className="text-xs font-bold uppercase tracking-widest text-marina-600 block">
          Mariane Cosméticos
        </span>
        <h2 className="font-serif text-2xl text-onyx-900">
          Não foi possível carregar os produtos no momento
        </h2>
        <p className="text-xs sm:text-sm text-onyx-700 leading-relaxed">
          Tente recarregar a vitrine ou fale diretamente com nossa equipe pelo WhatsApp oficial em Lages – SC.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-marina-600 hover:bg-marina-700 text-white px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="bg-onyx-900 hover:bg-onyx-800 text-silk-50 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
