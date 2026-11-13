import React from "react";
import Link from "next/link";
import {
  Instagram,
  MessageCircle,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  ChevronDown,
} from "lucide-react";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#5a189a] text-white border-t border-[#48137a] pt-6 sm:pt-10 pb-8 md:pb-6 mt-2 sm:mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        {/* Benefit Highlights - Apenas Desktop (no mobile já está na barra de avisos) */}
        <div className="hidden md:grid md:grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-start gap-3 px-3 py-1.5">
            <div className="p-2 bg-white/10 text-white rounded-lg shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="block font-bold text-white">Frete Grátis</span>
              <span className="text-white/75 text-xs">A partir de R$ 199 para todo o Brasil</span>
            </div>
          </div>

          <div className="flex items-center justify-start gap-3 px-3 py-1.5 md:border-x md:border-white/10">
            <div className="p-2 bg-white/10 text-white rounded-lg shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="block font-bold text-white">Até 10x Sem Juros</span>
              <span className="text-white/75 text-xs">Ou 5% de desconto à vista no PIX</span>
            </div>
          </div>

          <div className="flex items-center justify-start gap-3 px-3 py-1.5">
            <div className="p-2 bg-white/10 text-emerald-300 rounded-lg shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="block font-bold text-white">Atendimento Humanizado</span>
              <span className="text-white/75 text-xs">Dúvidas e pedidos no WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Main Footer Links — Mobile compacto + acordeões; Desktop 4 colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-xs">
          {/* Coluna 1: Marca & Contato */}
          <div className="space-y-3">
            <Link href="/" className="inline-block group" aria-label="Mariane Cosméticos - Início">
              <Logo variant="horizontal" tone="light" size="md" className="hover:opacity-95 transition-opacity" />
            </Link>
            <p className="text-xs text-white/85 italic font-sans">
              &ldquo;Linda é a mulher que bem se quer&rdquo;
            </p>

            <div className="space-y-1.5 text-white/85 text-xs pt-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-pink-200 shrink-0 mt-0.5" aria-hidden="true" />
                <span>Rua Blumenau, Nº 623 — Lages - SC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
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
                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center bg-white/10 text-white hover:text-white rounded-xl md:rounded-lg transition-colors hover:bg-white/20 border border-white/15"
                aria-label="Instagram da Mariane Cosméticos (@mariane_cosmeticos_01)"
              >
                <Instagram className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </a>
              <a
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!"
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 md:p-2 flex items-center justify-center bg-white/10 text-emerald-300 hover:text-white rounded-xl md:rounded-lg transition-colors hover:bg-white/20 border border-white/15"
                aria-label="WhatsApp da Mariane Cosméticos: (49) 99125-1617"
              >
                <MessageCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </a>
            </div>
          </div>

          {/* Mobile Acordeões (< md) */}
          <div className="md:hidden divide-y divide-white/15 border-y border-white/15">
            <details className="group py-1">
              <summary className="flex items-center justify-between min-h-[44px] text-sm font-semibold text-white cursor-pointer list-none select-none">
                <span>Categorias</span>
                <ChevronDown className="w-4 h-4 text-white/80 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="pb-3 space-y-2 text-sm text-white/85">
                <li><Link href="/categoria/tratamento-mascaras" className="block py-1 hover:text-white">Tratamento &amp; Máscaras</Link></li>
                <li><Link href="/categoria/cronograma-capilar" className="block py-1 hover:text-white">Cronograma Capilar</Link></li>
                <li><Link href="/categoria/shampoos-condicionadores" className="block py-1 hover:text-white">Shampoos &amp; Condicionadores</Link></li>
                <li><Link href="/categoria/oleos-seruns" className="block py-1 hover:text-white">Óleos &amp; Séruns</Link></li>
                <li><Link href="/categoria/perfumaria-casa" className="block py-1 hover:text-white">Perfumaria &amp; Casa</Link></li>
                <li><Link href="/categoria/kits-promocionais" className="block py-1 hover:text-white">Kits Promocionais</Link></li>
              </ul>
            </details>

            <details className="group py-1">
              <summary className="flex items-center justify-between min-h-[44px] text-sm font-semibold text-white cursor-pointer list-none select-none">
                <span>Marcas oficiais</span>
                <ChevronDown className="w-4 h-4 text-white/80 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="pb-3 space-y-2 text-sm text-white/85">
                <li><Link href="/produtos?marca=madressenza" className="block py-1 font-semibold text-white">Madressenza (Revendedora Oficial)</Link></li>
                <li><Link href="/produtos?marca=wella-profissional" className="block py-1 hover:text-white">Wella Profissional</Link></li>
                <li><Link href="/produtos?marca=loreal-professionnel" className="block py-1 hover:text-white">L&apos;Oréal Professionnel</Link></li>
                <li><Link href="/produtos?marca=truss" className="block py-1 hover:text-white">Truss</Link></li>
                <li><Link href="/produtos?marca=brae" className="block py-1 hover:text-white">Braé</Link></li>
                <li><Link href="/produtos?marca=lola-cosmetics" className="block py-1 hover:text-white">Lola Cosmetics</Link></li>
                <li><Link href="/produtos?marca=amend" className="block py-1 hover:text-white">Amend</Link></li>
              </ul>
            </details>

            <details className="group py-1">
              <summary className="flex items-center justify-between min-h-[44px] text-sm font-semibold text-white cursor-pointer list-none select-none">
                <span>Ajuda e Políticas</span>
                <ChevronDown className="w-4 h-4 text-white/80 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <ul className="pb-3 space-y-2 text-sm text-white/85">
                <li><Link href="/carrinho" className="block py-1 hover:text-white">Minha Sacola</Link></li>
                <li><Link href="/atendimento" className="block py-1 hover:text-white">Fale Conosco</Link></li>
                <li><Link href="/politica-de-privacidade" className="block py-1 hover:text-white">Política de Privacidade</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="block py-1 hover:text-white">Trocas &amp; Devoluções</Link></li>
              </ul>
            </details>
          </div>

          {/* Desktop Coluna 2: Categorias */}
          <div className="hidden md:block space-y-2.5">
            <h4 className="font-bold tracking-wider uppercase text-white text-xs">Categorias</h4>
            <ul className="space-y-1.5 text-white/75">
              <li><Link href="/categoria/tratamento-mascaras" className="hover:text-white transition-colors">Tratamento & Máscaras</Link></li>
              <li><Link href="/categoria/cronograma-capilar" className="hover:text-white transition-colors">Cronograma Capilar</Link></li>
              <li><Link href="/categoria/shampoos-condicionadores" className="hover:text-white transition-colors">Shampoos & Condicionadores</Link></li>
              <li><Link href="/categoria/oleos-seruns" className="hover:text-white transition-colors">Óleos & Séruns</Link></li>
              <li><Link href="/categoria/perfumaria-casa" className="hover:text-white transition-colors">Perfumaria & Casa</Link></li>
              <li><Link href="/categoria/kits-promocionais" className="hover:text-white transition-colors">Kits Promocionais</Link></li>
            </ul>
          </div>

          {/* Desktop Coluna 3: Marcas Oficiais */}
          <div className="hidden md:block space-y-2.5">
            <h4 className="font-bold tracking-wider uppercase text-white text-xs">Marcas Oficiais</h4>
            <ul className="space-y-1.5 text-white/75">
              <li><Link href="/produtos?marca=madressenza" className="hover:text-white transition-colors font-semibold text-white">Madressenza (Revendedora Oficial)</Link></li>
              <li><Link href="/produtos?marca=wella-profissional" className="hover:text-white transition-colors">Wella Profissional</Link></li>
              <li><Link href="/produtos?marca=loreal-professionnel" className="hover:text-white transition-colors">L&apos;Oréal Professionnel</Link></li>
              <li><Link href="/produtos?marca=truss" className="hover:text-white transition-colors">Truss</Link></li>
              <li><Link href="/produtos?marca=brae" className="hover:text-white transition-colors">Braé</Link></li>
              <li><Link href="/produtos?marca=lola-cosmetics" className="hover:text-white transition-colors">Lola Cosmetics</Link></li>
              <li><Link href="/produtos?marca=amend" className="hover:text-white transition-colors">Amend</Link></li>
            </ul>
          </div>

          {/* Desktop Coluna 4: Ajuda & Segurança */}
          <div className="hidden md:block space-y-2.5">
            <h4 className="font-bold tracking-wider uppercase text-white text-xs">Ajuda & Segurança</h4>
            <ul className="space-y-1.5 text-white/75">
              <li><Link href="/carrinho" className="hover:text-white transition-colors">Minha Sacola</Link></li>
              <li><Link href="/atendimento" className="hover:text-white transition-colors">Fale Conosco</Link></li>
              <li><Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/trocas-e-devolucoes" className="hover:text-white transition-colors">Trocas & Devoluções</Link></li>
            </ul>
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Site Seguro &amp; Criptografado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-white/15 text-center text-xs text-white/75 md:text-white/60">
          <p>© 2026 Mariane Cosméticos. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
