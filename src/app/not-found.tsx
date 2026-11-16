import React from "react";
import Link from "next/link";
import { Search, Home, ShoppingBag, MessageCircle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-silk-50/50">
      <div className="max-w-lg w-full text-center space-y-8 bg-white p-6 sm:p-10 rounded-3xl border border-silk-200 shadow-sm">
        {/* Brand Indicator */}
        <div className="flex justify-center">
          <Link href="/" aria-label="Mariane Cosméticos">
            <Logo variant="horizontal" tone="dark" size="md" />
          </Link>
        </div>

        {/* 404 Visual Badge */}
        <div className="space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-marina-50 text-marina-700 border border-marina-200">
            Erro 404 · Página Não Encontrada
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-onyx-950 font-normal">
            Página não encontrada
          </h1>
          <p className="text-sm text-onyx-700 max-w-md mx-auto leading-relaxed">
            O endereço que você tentou acessar não existe, foi alterado ou está temporariamente indisponível. Utilize a busca abaixo ou confira nossos links rápidos:
          </p>
        </div>

        {/* Busca Rápida no Catálogo */}
        <form action="/produtos" method="GET" className="relative max-w-md mx-auto">
          <input
            type="text"
            name="q"
            placeholder="Buscar produtos, marcas ou tratamentos..."
            aria-label="Buscar no catálogo"
            className="w-full pl-10 pr-24 py-3 rounded-2xl border border-silk-300 text-sm focus:outline-none focus:ring-2 focus:ring-marina-600 focus:border-transparent bg-silk-50/60"
          />
          <Search className="w-4 h-4 text-onyx-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-marina-700 text-white text-xs font-semibold hover:bg-marina-800 transition-colors"
          >
            Buscar
          </button>
        </form>

        {/* Ações e Links Principais */}
        <div className="pt-2 border-t border-silk-200/80 space-y-3">
          <p className="text-xs font-semibold text-onyx-500 uppercase tracking-wider">
            Navegue pelas páginas principais
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-semibold">
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-silk-200 bg-silk-50 hover:bg-white text-onyx-900 transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-marina-700" />
              <span>Início</span>
            </Link>
            <Link
              href="/produtos"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-silk-200 bg-silk-50 hover:bg-white text-onyx-900 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-marina-700" />
              <span>Produtos</span>
            </Link>
            <Link
              href="/atendimento"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-silk-200 bg-silk-50 hover:bg-white text-onyx-900 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-dark" />
              <span>Atendimento</span>
            </Link>
          </div>
        </div>

        {/* Ajuda Humana */}
        <p className="text-xs text-onyx-600">
          Precisa de ajuda imediata? Fale conosco no WhatsApp:{" "}
          <a
            href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Encontrei%20um%20link%20quebrado%20no%20site."
            target="_blank"
            rel="noopener noreferrer"
            className="text-marina-700 font-bold hover:underline"
          >
            (49) 99125-1617
          </a>
        </p>
      </div>
    </div>
  );
}
