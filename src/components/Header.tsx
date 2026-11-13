"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCartState, useCartUI } from "@/context/CartContext";
import Logo from "@/components/Logo";
import {
  ShoppingBag,
  MessageCircle,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Truck,
  Search,
  Instagram,
  PackageSearch,
  Sparkles,
  Tag,
} from "lucide-react";

const CartDrawer = dynamic(() => import("./CartDrawer"), { ssr: false });

const MOBILE_ANNOUNCEMENTS = [
  "Frete grátis acima de R$ 199",
  "Até 10x sem juros no cartão",
  "5% OFF no pagamento via PIX",
];

const CATEGORY_LINKS = [
  { label: "Tratamento & Máscaras", href: "/categoria/tratamento-mascaras" },
  { label: "Cronograma Capilar", href: "/categoria/cronograma-capilar" },
  { label: "Shampoos & Condicionadores", href: "/categoria/shampoos-condicionadores" },
  { label: "Óleos & Séruns", href: "/categoria/oleos-seruns" },
  { label: "Finalizadores & Protetor Térmico", href: "/categoria/finalizadores-protetor-termico" },
  { label: "Perfumaria & Casa", href: "/categoria/perfumaria-casa" },
  { label: "Kits Promocionais", href: "/categoria/kits-promocionais" },
];

export default function Header() {
  const router = useRouter();
  const { totalItems } = useCartState();
  const { isCartOpen, openCart, badgePulseKey } = useCartUI();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasMountedDrawer, setHasMountedDrawer] = useState(false);
  const [badgePulsing, setBadgePulsing] = useState(false);

  // Barra de avisos mobile rotativa
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [announcementPaused, setAnnouncementPaused] = useState(false);

  // Header hide-on-scroll-down / show-on-scroll-up apenas no mobile (< 768px)
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const lastScrollY = useRef(0);

  // Busca no drawer mobile
  const [searchQuery, setSearchQuery] = useState("");

  // Refs para acessibilidade do drawer mobile
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

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

  // Rotação automática da barra de avisos mobile (pausa com prefers-reduced-motion ou toque)
  useEffect(() => {
    if (announcementPaused) return;
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const timer = window.setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % MOBILE_ANNOUNCEMENTS.length);
    }, 3400);
    return () => window.clearInterval(timer);
  }, [announcementPaused]);

  // Hide-on-scroll-down no mobile
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth >= 768) {
        setHideOnScroll(false);
        return;
      }
      const currentY = window.scrollY;
      if (currentY <= 56) {
        setHideOnScroll(false);
      } else if (currentY > lastScrollY.current + 8 && currentY > 96) {
        setHideOnScroll(true);
      } else if (currentY < lastScrollY.current - 6) {
        setHideOnScroll(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => {
      menuTriggerRef.current?.focus();
    });
  }, []);

  // Trava scroll do body, fecha com Esc e prende foco no drawer mobile
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = drawerPanelRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
    const focusables = panel ? Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)) : [];
    focusables[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobileMenu();
        return;
      }
      if (e.key === "Tab" && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen, closeMobileMenu]);

  const prefetchCartDrawer = () => {
    void import("./CartDrawer");
  };

  const handleOpenCart = () => {
    setHasMountedDrawer(true);
    openCart();
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    closeMobileMenu();
    router.push(q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos");
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

  const brandLinks = navLinks.filter((l) => !l.isHighlight);

  return (
    <>
      {/* Barra de avisos MOBILE: 1 linha de 32px com rotação automática + pausa ao tocar */}
      <div
        className="md:hidden h-8 bg-[#FAF5FB] text-onyx-900 border-b border-silk-200 px-4 flex items-center justify-center"
        onTouchStart={() => setAnnouncementPaused((p) => !p)}
        onClick={() => setAnnouncementIdx((prev) => (prev + 1) % MOBILE_ANNOUNCEMENTS.length)}
        role="region"
        aria-label="Avisos promocionais"
      >
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-onyx-900 truncate">
          <Truck className="w-3.5 h-3.5 text-marina-600 shrink-0" aria-hidden="true" />
          <span
            key={announcementIdx}
            className="animate-fadeIn motion-reduce:animate-none [word-spacing:0.05em]"
          >
            {MOBILE_ANNOUNCEMENTS[announcementIdx]}
          </span>
        </div>
      </div>

      {/* Top Luxury Announcement Banner DESKTOP (inalterado em md+) */}
      <div className="hidden md:block bg-[#F8F9FA] text-onyx-900 border-b border-silk-200/90 py-2 sm:py-2.5 px-4 text-center transition-colors shadow-2xs">
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

      {/* Main Header — Mobile: 56px branco com logo colorido (alto contraste); Desktop (md+): Roxo #7b2cbf intacto */}
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md text-onyx-950 border-b border-silk-200 shadow-xs md:backdrop-blur-none md:bg-[#7b2cbf] md:text-white md:border-[#6a1fad] md:shadow-md transition-transform duration-300 motion-reduce:transition-none ${
          hideOnScroll && !mobileMenuOpen ? "-translate-y-full md:translate-y-0" : "translate-y-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[44px_1fr_auto] md:flex md:items-center md:justify-between h-14 md:h-28 gap-2 md:gap-6">
            {/* Mobile Menu Toggle (44x44) */}
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-onyx-900 md:text-white hover:bg-silk-100 md:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 md:focus-visible:ring-white/40 rounded-lg transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo Integration — Mobile centralizado escuro sobre branco; Desktop grande branco sobre roxo */}
            <Link
              href="/"
              className="inline-flex items-center justify-self-center md:justify-self-start group transition-transform duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 md:focus-visible:ring-white/50 rounded-lg py-1 shrink-0"
              aria-label="Mariane Cosméticos - Página Inicial"
            >
              <Logo
                variant="horizontal"
                size="sm"
                tone="dark"
                className="md:hidden !h-9 w-auto"
                alt="Mariane Cosméticos"
              />
              <Logo
                variant="horizontal"
                size="lg"
                tone="light"
                className="hidden md:inline-flex transform group-hover:scale-[1.03] transition-transform duration-200"
                alt="Mariane Cosméticos"
              />
            </Link>

            {/* Desktop Brand Credentials & Benefits (inalterado) */}
            <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 xl:gap-12 text-white">
              <div className="leading-tight text-center lg:text-left text-white" title="Revendedora Oficial Madressenza">
                <span className="block font-extrabold text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  Revendedora Oficial
                </span>
                <span className="block font-black text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  Madressenza
                </span>
                <span className="sr-only">Revendedora Oficial Madressenza</span>
              </div>

              <div className="leading-tight text-center lg:text-left text-white">
                <span className="block font-black text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  Frete Grátis
                </span>
                <span className="block font-bold text-xs sm:text-[13px] xl:text-sm text-white tracking-tight">
                  Acima de R$ 199
                </span>
              </div>

              <div className="leading-tight text-center lg:text-left text-white">
                <span className="block font-black text-sm sm:text-[15px] xl:text-base text-white tracking-tight">
                  5% OFF no PIX
                </span>
                <span className="block font-bold text-xs sm:text-[13px] xl:text-sm text-white tracking-tight">
                  Ou até 10x sem juros
                </span>
              </div>
            </div>

            {/* Actions: Mobile [busca] [sacola]; Desktop [WhatsApp] [sacola] */}
            <div className="flex items-center justify-end gap-1 md:gap-3">
              {/* Mobile Busca Rápida (44x44) */}
              <Link
                href="/produtos#busca-catalogo"
                aria-label="Buscar produtos"
                className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-onyx-900 hover:bg-silk-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Link>

              {/* WhatsApp direct customer support link (Desktop) */}
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
                className="relative min-w-[44px] min-h-[44px] -mr-1 md:mr-0 md:p-2.5 flex items-center justify-center text-onyx-900 md:text-white hover:bg-silk-100 md:hover:text-white/80 rounded-full md:hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 md:focus-visible:ring-white/40 cursor-pointer"
                aria-label="Abrir sacola de compras"
              >
                <ShoppingBag className="w-6 h-6" aria-hidden="true" />
                {totalItems > 0 && (
                  <span
                    className={`absolute top-1 right-1 bg-marina-600 text-white md:bg-white md:text-[#7b2cbf] text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white md:border-[#7b2cbf] shadow-sm tabular-nums transition-transform duration-200 motion-reduce:transition-none ${
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
      </header>

      {/* Mobile Navigation Drawer (overlay separado, foco preso, sem logo duplicado) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-onyx-950/50 backdrop-blur-[2px]"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            ref={drawerPanelRef}
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
              if (touchStartX.current - endX > 60) {
                closeMobileMenu();
              }
              touchStartX.current = null;
            }}
            className="relative z-10 w-[86vw] max-w-sm h-full bg-white text-onyx-950 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Topo do Drawer: Título simples + botão X 44px sem moldura */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-silk-200 shrink-0">
              <span className="font-serif text-lg font-medium text-onyx-950">Menu</span>
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Fechar menu"
                className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center text-onyx-700 hover:text-onyx-950 rounded-full hover:bg-silk-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Corpo rolável do drawer */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Campo de busca no topo */}
              <form onSubmit={handleMobileSearchSubmit} role="search" className="relative">
                <label htmlFor="mobile-drawer-search" className="sr-only">
                  Buscar cosméticos no catálogo
                </label>
                <Search
                  className="w-4 h-4 text-onyx-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="mobile-drawer-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar shampoo, máscara, perfume..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-silk-50 border border-silk-200 text-sm text-onyx-950 placeholder:text-onyx-500 focus:outline-none focus:ring-2 focus:ring-marina-600 focus:bg-white"
                />
              </form>

              {/* Links rápidos */}
              <ul className="divide-y divide-silk-200/70 border border-silk-200 rounded-2xl overflow-hidden bg-white">
                <li>
                  <Link
                    href="/produtos"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between min-h-[46px] px-4 text-sm font-semibold text-marina-700 hover:bg-marina-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Todos os produtos</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-marina-600" aria-hidden="true" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/produtos?ordem=promocoes"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between min-h-[46px] px-4 text-sm font-medium text-onyx-900 hover:bg-silk-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-brand-accent" aria-hidden="true" />
                      <span>Promoções</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-onyx-500" aria-hidden="true" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/atendimento"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between min-h-[46px] px-4 text-sm font-medium text-onyx-900 hover:bg-silk-50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <PackageSearch className="w-4 h-4 text-marina-600" aria-hidden="true" />
                      <span>Rastrear pedido &amp; Atendimento</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-onyx-500" aria-hidden="true" />
                  </Link>
                </li>
              </ul>

              {/* Acordeão: Categorias */}
              <details className="group rounded-2xl border border-silk-200 bg-white overflow-hidden" open>
                <summary className="flex items-center justify-between min-h-[48px] px-4 text-sm font-semibold text-onyx-950 cursor-pointer list-none select-none hover:bg-silk-50">
                  <span>Categorias</span>
                  <ChevronDown
                    className="w-4 h-4 text-onyx-600 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="border-t border-silk-100 divide-y divide-silk-100">
                  {CATEGORY_LINKS.map((cat) => (
                    <li key={cat.href}>
                      <Link
                        href={cat.href}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between min-h-[44px] px-4 text-sm text-onyx-800 hover:bg-marina-50 hover:text-marina-700 transition-colors"
                      >
                        <span>{cat.label}</span>
                        <ChevronRight className="w-4 h-4 text-onyx-400" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Acordeão: Marcas */}
              <details className="group rounded-2xl border border-silk-200 bg-white overflow-hidden">
                <summary className="flex items-center justify-between min-h-[48px] px-4 text-sm font-semibold text-onyx-950 cursor-pointer list-none select-none hover:bg-silk-50">
                  <span>Marcas Oficiais</span>
                  <ChevronDown
                    className="w-4 h-4 text-onyx-600 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="border-t border-silk-100 divide-y divide-silk-100">
                  {brandLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className="flex items-center justify-between min-h-[44px] px-4 text-sm text-onyx-800 hover:bg-marina-50 hover:text-marina-700 transition-colors"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4 text-onyx-400" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>

              {/* Linha discreta única de credenciais */}
              <p className="text-xs text-onyx-600 text-center pt-1">
                Revendedora Oficial Madressenza &bull; Lages – SC
              </p>
            </div>

            {/* Rodapé do Menu: WhatsApp oficial + Instagram */}
            <div className="p-4 border-t border-silk-200 bg-silk-50/70 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2.5 shrink-0">
              <a
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento%20personalizado."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white shrink-0" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
              <a
                href="https://www.instagram.com/mariane_cosmeticos_01/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @mariane_cosmeticos_01"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full bg-white border border-silk-200 text-onyx-900 hover:border-marina-300 hover:text-marina-700 transition-colors"
              >
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer (carregado sob demanda no primeiro clique) */}
      {hasMountedDrawer && <CartDrawer />}
    </>
  );
}
