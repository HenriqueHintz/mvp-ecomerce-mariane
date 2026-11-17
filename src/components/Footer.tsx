"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { SvgIcon } from "./ui/SvgIcon";

function FooterNavGroup({
  title,
  children,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/15 md:border-b-0 py-1 md:py-0 md:space-y-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="md:hidden w-full flex items-center justify-between min-h-[44px] text-sm font-semibold text-white cursor-pointer select-none"
      >
        <span>{title}</span>
        <SvgIcon
          name="chevron-down"
          className={`w-4 h-4 text-white/80 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <h3 className="hidden md:block font-bold tracking-wider uppercase text-white text-xs">
        {title}
      </h3>
      <ul className={`${open ? "block" : "hidden md:block"} ft-ul`}>
        {children}
      </ul>
      {badge && <div className="hidden md:block pt-2">{badge}</div>}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#5a189a] text-white border-t border-[#48137a] pt-6 sm:pt-10 pb-8 md:pb-6 mt-2 sm:mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        {/* Benefit Highlights - Apenas Desktop (no mobile já está na barra de avisos) */}
        <div className="hidden md:grid md:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="ft-perk">
            <div className="ft-perk-box text-white">
              <SvgIcon name="truck" className="w-4 h-4" />
            </div>
            <div className="ft-perk-txt">
              <span className="block font-bold text-white">Frete Grátis</span>
              <span className="ft-perk-sub">A partir de R$ 199 para todo o Brasil</span>
            </div>
          </div>

          <div className="ft-perk md:border-x md:border-white/10">
            <div className="ft-perk-box text-white">
              <SvgIcon name="credit-card" className="w-4 h-4" />
            </div>
            <div className="ft-perk-txt">
              <span className="block font-bold text-white">Até 10x Sem Juros</span>
              <span className="ft-perk-sub">Ou 5% de desconto à vista no PIX</span>
            </div>
          </div>

          <div className="ft-perk">
            <div className="ft-perk-box text-emerald-300">
              <SvgIcon name="message-circle" className="w-4 h-4" />
            </div>
            <div className="ft-perk-txt">
              <span className="block font-bold text-white">Atendimento Humanizado</span>
              <span className="ft-perk-sub">Dúvidas e pedidos no WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-xs">
          {/* Coluna 1: Marca & Contato */}
          <div className="space-y-3">
            <Link href="/" className="inline-block group" aria-label="Mariane Cosméticos - Início">
              <Logo variant="horizontal" tone="light" size="md" className="hover:opacity-95 transition-opacity" />
            </Link>
            <p className="text-xs text-white/85 italic font-sans">
              &ldquo;Linda é a mulher que bem se quer&rdquo;
            </p>
            <p className="text-xs text-white/80 leading-relaxed">
              Revendedora oficial Madressenza e distribuidora de linhas capilares profissionais originais em Lages – SC, com entrega para todo o Brasil.
            </p>

            <div className="space-y-1.5 text-white/85 text-xs pt-1">
              <div className="flex items-start gap-1.5">
                <SvgIcon name="map-pin" className="w-4 h-4 text-pink-200 shrink-0 mt-0.5" />
                <span>Rua Blumenau, Nº 623 — Lages - SC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <SvgIcon name="phone" className="w-4 h-4 text-emerald-300 shrink-0" />
                <a
                  href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white font-semibold transition-colors"
                >
                  (49) 99125-1617
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://www.instagram.com/mariane_cosmeticos_01/"
                target="_blank"
                rel="noopener noreferrer"
                className="ft-social text-white"
                aria-label="Instagram da Mariane Cosméticos (@mariane_cosmeticos_01)"
              >
                <SvgIcon name="instagram" className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </a>
              <a
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!"
                target="_blank"
                rel="noopener noreferrer"
                className="ft-social text-emerald-300"
                aria-label="WhatsApp da Mariane Cosméticos: (49) 99125-1617"
              >
                <SvgIcon name="message-circle" className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </a>
            </div>
          </div>

          <FooterNavGroup title="Categorias">
            <li><Link href="/categoria/tratamento-mascaras" className="ft-link">Tratamento &amp; Máscaras</Link></li>
            <li><Link href="/categoria/cronograma-capilar" className="ft-link">Cronograma Capilar</Link></li>
            <li><Link href="/categoria/shampoos-condicionadores" className="ft-link">Shampoos &amp; Condicionadores</Link></li>
            <li><Link href="/categoria/oleos-seruns" className="ft-link">Óleos &amp; Séruns</Link></li>
            <li><Link href="/categoria/perfumaria-casa" className="ft-link">Perfumaria &amp; Casa</Link></li>
            <li><Link href="/categoria/kits-promocionais" className="ft-link">Kits Promocionais</Link></li>
          </FooterNavGroup>

          <FooterNavGroup title="Marcas Oficiais">
            <li><Link href="/produtos?marca=madressenza" className="ft-link font-semibold text-white">Madressenza (Revendedora Oficial)</Link></li>
            <li><Link href="/produtos?marca=wella-profissional" className="ft-link">Wella Profissional</Link></li>
            <li><Link href="/produtos?marca=loreal-professionnel" className="ft-link">L&apos;Oréal Professionnel</Link></li>
            <li><Link href="/produtos?marca=truss" className="ft-link">Truss</Link></li>
            <li><Link href="/produtos?marca=brae" className="ft-link">Braé</Link></li>
            <li><Link href="/produtos?marca=lola-cosmetics" className="ft-link">Lola Cosmetics</Link></li>
            <li><Link href="/produtos?marca=amend" className="ft-link">Amend</Link></li>
          </FooterNavGroup>

          <FooterNavGroup
            title="Ajuda & Segurança"
            badge={
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white">
                <SvgIcon name="shield-check" className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Site Seguro &amp; Criptografado</span>
              </div>
            }
          >
            <li><Link href="/sobre" className="ft-link">Sobre a Loja</Link></li>
            <li><Link href="/atendimento" className="ft-link">Central de Atendimento</Link></li>
            <li><Link href="/carrinho" className="ft-link">Minha Sacola</Link></li>
            <li><Link href="/politica-de-privacidade" className="ft-link">Política de Privacidade</Link></li>
            <li><Link href="/trocas-e-devolucoes" className="ft-link">Trocas &amp; Devoluções</Link></li>
          </FooterNavGroup>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-white/15 text-center text-xs text-white/75 md:text-white/60">
          <p>© 2026 Mariane Cosméticos. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
