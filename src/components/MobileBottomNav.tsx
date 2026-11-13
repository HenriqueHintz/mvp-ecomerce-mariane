"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag, MessageCircle } from "lucide-react";
import { useCartState, useCartUI } from "@/context/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCartState();
  const { isCartOpen, openCart } = useCartUI();

  // Páginas com barra de ação própria no rodapé (/produto/[slug] e /checkout) não exibem a nav inferior
  if (pathname?.startsWith("/produto/") || pathname?.startsWith("/checkout") || pathname?.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isCatalog = pathname?.startsWith("/produtos") || pathname?.startsWith("/categoria");
  const isCart = pathname === "/carrinho" || isCartOpen;

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-silk-200 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(26,9,24,0.06)]"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-inset ${
            isHome ? "text-marina-700 font-semibold" : "text-onyx-700 hover:text-marina-600"
          }`}
        >
          <Home className="w-5 h-5" aria-hidden="true" />
          <span>Início</span>
        </Link>

        <Link
          href="/produtos"
          aria-current={isCatalog ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-inset ${
            isCatalog ? "text-marina-700 font-semibold" : "text-onyx-700 hover:text-marina-600"
          }`}
        >
          <LayoutGrid className="w-5 h-5" aria-hidden="true" />
          <span>Categorias</span>
        </Link>

        <Link
          href="/produtos#busca-catalogo"
          className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium text-onyx-700 hover:text-marina-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-inset"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          <span>Busca</span>
        </Link>

        <button
          type="button"
          onClick={openCart}
          aria-label={`Abrir sacola (${totalItems} ${totalItems === 1 ? "item" : "itens"})`}
          className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-inset ${
            isCart ? "text-marina-700 font-semibold" : "text-onyx-700 hover:text-marina-600"
          }`}
        >
          <span className="relative inline-flex">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-marina-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </span>
          <span>Sacola</span>
        </button>

        <a
          href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Preciso%20de%20ajuda."
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp (49) 99125-1617"
          className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-inset"
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <span>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
