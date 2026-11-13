"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCartState, useCartUI } from "@/context/CartContext";
import Logo from "@/components/Logo";
import { ShoppingBag, MessageCircle, Menu, X, ChevronRight, MapPin, Truck } from "lucide-react";

const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

export default function Header() {
  const { totalItems } = useCartState();
  const { isCartOpen, openCart, badgePulseKey } = useCartUI();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasMountedDrawer, setHasMountedDrawer] = useState(false);
  const [badgePulsing, setBadgePulsing] = useState(false);

  useEffect(() => {
    if (isCartOpen && !hasMountedDrawer) {
      setHasMountedDrawer(true);
    }
  }, [isCartOpen, hasMountedDrawer]);

  useEffect(() => {
    if (badgePulseKey === 0) return;
    setBadgePulsing(true);
    const t = window.setTimeout(() => setBadgePulsing(false), 300);
    return () => window.clearTimeout(t);
  }, [badgePulseKey]);

  const prefetchCartDrawer = () => {
    void import("./CartDrawer");
  };

  const handleOpenCart = () => {
    setHasMountedDrawer(true);
    openCart();
  };

  const navLinks = [
    { label: "Todos os Produtos", href: "/produtos", isHighlight: true },
    { label: "Madressenza", href: "/produtos?marca=madressenza" },
    { label: "Wella Profissional", href: "/produtos?marca=wella-profissional" },
    { label: "L'Oréal Professionnel", href: "/produtos?marca=loreal-professionnel" },
    { label: "Truss", href: "/produtos?marca=truss" },
    { label: "Braé", href: "/produtos?marca=brae" },
    { label: "Lola Cosmetics", href: "/produtos?marca=lola-cosmetics" },
    { label: "Amend", href: "/produtos?marca=amend" },
  ];

  return (
    <>
      {/* Top Luxury Announcement Banner - Branco Gelo Refinado */}
      <div className="bg-[#F8F9FA] text-onyx-900 border-b border-silk-200/90 py-2 sm:py-2.5 px-4 text-center transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-[12.5px] tracking-wide font-medium">
          <Truck className="w-3.5 h-3.5 text-[#7b2cbf] shrink-0" />
          <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-center">
            <span className="inline-flex items-center gap-1.5">
              <strong className="font-bold text-onyx-950 uppercase tracking-wider">FRETE GRÁTIS</strong>
              <span className="text-onyx-700">a partir de R$ 199</span>
            </span>
            <span className="text-[#7b2cbf] font-bold select-none opacity-80">&bull;</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="font-bold text-onyx-950">Até 10x Sem Juros</strong>
              <span className="text-onyx-700">no Cartão</span>
            </span>
            <span className="text-[#7b2cbf] font-bold select-none opacity-80">&bull;</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="font-bold text-onyx-950">5% OFF</strong>
              <span className="text-onyx-700">no PIX</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header - Roxo #7b2cbf */}
      <header className="sticky top-0 z-40 bg-[#7b2cbf] text-white border-b border-[#6a1fad] shadow-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 sm:h-28 gap-4 sm:gap-6">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/40 rounded-lg transition-colors cursor-pointer"
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo Integration - MÁXIMA PRESENÇA E DESTAQUE */}
            <Link
              href="/"
              className="inline-flex items-center group transition-transform duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-lg py-1 shrink-0"
              aria-label="Mariane Cosméticos - Página Inicial"
            >
              {/* Mobile Viewport: Logo Nítido e Ampliado em Branco */}
              <Logo variant="horizontal" size="sm" tone="light" className="sm:hidden" alt="Mariane Cosméticos" />
              {/* Desktop Viewport: Logo Imponente e Destacado em Branco */}
              <Logo variant="horizontal" size="lg" tone="light" className="hidden sm:inline-flex transform group-hover:scale-[1.03] transition-transform duration-200" alt="Mariane Cosméticos" />
            </Link>

            {/* Desktop Brand Credentials & Benefits (Texto Puro em Branco, Fonte Maior e Mais Grossa com Quebras de Linha) */}
            <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 xl:gap-12 text-white">
              {/* Item 1: Revendedora Oficial Madressenza */}
              <div className="leading-tight text-center lg:text-left text-white" title="Revendedora Oficial Madressenza">
                <span className="block font-extrabold text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  Revendedora Oficial
                </span>
                <span className="block font-black text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  Madressenza
                </span>
                <span className="sr-only">Revendedora Oficial Madressenza</span>
              </div>

              {/* Item 2: Frete Grátis Acima de R$ 199 */}
              <div className="leading-tight text-center lg:text-left text-white">
                <span className="block font-black text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  Frete Grátis
                </span>
                <span className="block font-bold text-xs sm:text-[13px] xl:text-sm text-white tracking-tight">
                  Acima de R$ 199
                </span>
              </div>

              {/* Item 3: 5% OFF no PIX Ou até 10x sem juros */}
              <div className="leading-tight text-center lg:text-left text-white">
                <span className="block font-black text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  5% OFF no PIX
                </span>
                <span className="block font-bold text-xs sm:text-[13px] xl:text-sm text-white tracking-tight">
                  Ou até 10x sem juros
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* WhatsApp direct customer support link */}
              <a
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento%20personalizado."
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 shadow-xs backdrop-blur-xs"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>Atendimento WhatsApp</span>
              </a>

              {/* Cart Drawer Trigger & Dynamic Counter Badge */}
              <button
                type="button"
                data-cart-trigger="true"
                onClick={handleOpenCart}
                onMouseEnter={prefetchCartDrawer}
                onFocus={prefetchCartDrawer}
                className="relative p-2.5 text-white hover:text-white/80 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                aria-label="Abrir sacola de compras"
              >
                <ShoppingBag className="w-6 h-6 text-white" />
                {totalItems > 0 && (
                  <span
                    className={`absolute top-1 right-1 bg-white text-[#7b2cbf] text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-[#7b2cbf] shadow-sm tabular-nums transition-transform duration-200 motion-reduce:transition-none ${
                      badgePulsing ? "scale-125" : "scale-100"
                    }`}
                  >
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Category Navigation (Desktop) */}
        <nav className="hidden lg:block border-t border-white/15 bg-[#6a1fad]/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center justify-center flex-wrap gap-x-5 xl:gap-x-7 gap-y-1.5 py-2.5 text-xs font-semibold tracking-wide text-white/90">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`py-1 block relative group transition-colors uppercase tracking-wider ${
                      link.isHighlight
                        ? "text-[#7b2cbf] font-bold bg-white px-3.5 py-1 rounded-full shadow-xs hover:bg-white/90"
                        : "hover:text-white"
                    }`}
                  >
                    {link.label}
                    {!link.isHighlight && (
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/20 bg-[#6a1fad] p-4 space-y-4 shadow-xl animate-fadeIn text-white">
            {/* Drawer Brand Lockup */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <Logo variant="horizontal" size="sm" tone="light" alt="Mariane Cosméticos" />
              <span className="text-[10px] text-white/80 font-medium italic">
                Linda é a mulher que bem se quer
              </span>
            </div>

            {/* Mobile Navigation Links */}
            <ul className="space-y-1 text-sm font-medium">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-white hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Mobile Brand Credentials & Benefits (Texto Puro em Branco, Fonte Maior e Mais Grossa com Quebras de Linha) */}
            <div className="space-y-3.5 pt-3 border-t border-white/15 text-white">
              <div className="leading-tight text-left">
                <span className="block font-extrabold text-sm sm:text-base text-white">
                  Revendedora Oficial
                </span>
                <span className="block font-black text-sm sm:text-base text-white">
                  Madressenza
                </span>
                <span className="sr-only">Revendedora Oficial Madressenza</span>
              </div>

              <div className="leading-tight text-left">
                <span className="block font-black text-sm sm:text-base text-white">
                  Frete Grátis
                </span>
                <span className="block font-bold text-xs sm:text-sm text-white">
                  Acima de R$ 199
                </span>
              </div>

              <div className="leading-tight text-left">
                <span className="block font-black text-sm sm:text-base text-white">
                  5% OFF no PIX
                </span>
                <span className="block font-bold text-xs sm:text-sm text-white">
                  Ou até 10x sem juros
                </span>
              </div>
            </div>

            {/* Mobile Customer Support Action */}
            <div className="pt-2 border-t border-white/15">
              <a
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento%20personalizado."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-400/40 rounded-xl py-2.5 text-xs font-semibold transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-300" />
                <span>Atendimento WhatsApp (49) 99125-1617</span>
              </a>
            </div>

            {/* Location & Slogan Tag */}
            <div className="text-center pt-1 text-[11px] text-white/70 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-white/80" />
              <span>Rua Blumenau, Nº 623, Lages - SC</span>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer (carregado sob demanda no primeiro clique) */}
      {hasMountedDrawer && <CartDrawer />}
    </>
  );
}
