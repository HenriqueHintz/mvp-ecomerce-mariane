"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { useCartState, useCartUI } from "@/context/CartContext";

const WHATSAPP_URL =
  "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento%20personalizado.";

export default function MobileFloatingActions() {
  const pathname = usePathname();
  const { totalItems } = useCartState();
  const { isCartOpen, openCart } = useCartUI();

  const isHome = pathname === "/";
  const [pastHero, setPastHero] = useState(!isHome);
  const [scrollingDown, setScrollingDown] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [stickyOffset, setStickyOffset] = useState(0);

  const lastScrollY = useRef(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detecta rolagem (visibilidade após ~60% do hero + recuo ao rolar para baixo)
  useEffect(() => {
    const updateScrollState = () => {
      const y = window.scrollY;
      const threshold = isHome ? window.innerHeight * 0.55 : 0;
      setPastHero(y >= threshold);

      if (y > lastScrollY.current + 6) {
        setScrollingDown(true);
      } else if (y < lastScrollY.current - 4) {
        setScrollingDown(false);
      }
      lastScrollY.current = y;

      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        setScrollingDown(false);
      }, 220);
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollState);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [isHome]);

  // Detecta menu/gaveta/bottom-sheet abertos e altura de barras fixas inferiores
  useEffect(() => {
    const checkEnvironment = () => {
      const hasDialog = Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
      const bodyLocked = document.body.style.overflow === "hidden";
      setOverlayOpen(hasDialog || bodyLocked);

      const stickyBar = document.querySelector<HTMLElement>('[data-mobile-sticky-bar="true"]');
      if (stickyBar && window.innerWidth < 768) {
        setStickyOffset(stickyBar.offsetHeight + 12);
      } else {
        setStickyOffset(0);
      }
    };

    checkEnvironment();
    const observer = new MutationObserver(checkEnvironment);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
    window.addEventListener("resize", checkEnvironment, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkEnvironment);
    };
  }, [pathname]);

  const hidden = !pastHero || isCartOpen || overlayOpen;

  return (
    <div
      aria-hidden={hidden}
      style={{
        bottom: `calc(${16 + stickyOffset}px + env(safe-area-inset-bottom))`,
      }}
      className={`md:hidden fixed right-4 z-30 flex flex-col items-end gap-2.5 transition-all duration-300 motion-reduce:transition-none ${
        hidden
          ? "opacity-0 translate-y-3 pointer-events-none"
          : scrollingDown
          ? "opacity-45 translate-y-1 pointer-events-auto"
          : "opacity-100 translate-y-0 pointer-events-auto"
      }`}
    >
      {/* Botão flutuante da Sacola (48px) */}
      <button
        type="button"
        onClick={openCart}
        tabIndex={hidden ? -1 : 0}
        aria-label={
          totalItems > 0
            ? `Abrir sacola com ${totalItems} ${totalItems === 1 ? "item" : "itens"}`
            : "Abrir sacola de compras"
        }
        className="relative w-12 h-12 rounded-full bg-white text-onyx-950 border border-silk-200 shadow-[0_6px_20px_rgba(26,9,24,0.14)] hover:border-marina-400 hover:text-marina-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
      >
        <ShoppingBag className="w-5 h-5" aria-hidden="true" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-marina-700 text-white text-xs font-bold flex items-center justify-center tabular-nums border-2 border-white shadow-xs leading-none">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {/* Botão flutuante do WhatsApp (52px) */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={hidden ? -1 : 0}
        aria-label="Falar no WhatsApp (49) 99125-1617"
        className="w-[52px] h-[52px] rounded-full bg-emerald-whatsapp hover:bg-emerald-dark text-onyx-950 hover:text-white shadow-[0_8px_24px_rgba(18,140,126,0.28)] flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        <MessageCircle className="w-6 h-6" aria-hidden="true" />
      </a>
    </div>
  );
}
