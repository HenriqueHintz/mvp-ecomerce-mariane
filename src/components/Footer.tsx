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
} from "lucide-react";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-[#5a189a] text-white border-t border-[#48137a] pt-8 sm:pt-10 pb-6 mt-4 sm:mt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Benefit Highlights - Faixa Linear Compacta e Refinada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-1.5">
            <div className="p-2 bg-white/10 text-white rounded-lg shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="block font-bold text-white">Frete Grátis</span>
              <span className="text-white/75 text-[11px]">A partir de R$ 199 para todo o Brasil</span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-1.5 md:border-x md:border-white/10">
            <div className="p-2 bg-white/10 text-white rounded-lg shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="block font-bold text-white">Até 10x Sem Juros</span>
              <span className="text-white/75 text-[11px]">Ou 5% de desconto à vista no PIX</span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 px-3 py-1.5">
            <div className="p-2 bg-white/10 text-emerald-300 rounded-lg shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="block font-bold text-white">Atendimento Humanizado</span>
              <span className="text-white/75 text-[11px]">Dúvidas e pedidos no WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Main Footer Links - 4 Colunas Organizadas e Otimizadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Coluna 1: Marca & Contato */}
          <div className="space-y-3">
            <Link href="/" className="inline-block group" aria-label="Mariane Cosméticos - Início">
              <Logo variant="horizontal" tone="light" size="md" className="hover:opacity-95 transition-opacity" />
            </Link>
            <p className="text-[11px] text-white/85 italic font-sans">
              &ldquo;Linda é a mulher que bem se quer&rdquo;
            </p>

            <div className="space-y-1.5 text-white/80 text-[11px] pt-1">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-pink-200 shrink-0 mt-0.5" />
                <span>Rua Blumenau, Nº 623 — Lages - SC</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
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

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://www.instagram.com/mariane_cosmeticos_01/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 text-white hover:text-white rounded-lg transition-colors hover:bg-white/20 border border-white/15"
                aria-label="Instagram da Mariane Cosméticos (@mariane_cosmeticos_01)"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 text-emerald-300 hover:text-white rounded-lg transition-colors hover:bg-white/20 border border-white/15"
                aria-label="WhatsApp da Mariane Cosméticos: (49) 99125-1617"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Categorias */}
          <div className="space-y-2.5">
            <h4 className="font-bold tracking-wider uppercase text-white text-[11px]">Categorias</h4>
            <ul className="space-y-1.5 text-white/75">
              <li><Link href="/categoria/tratamento-mascaras" className="hover:text-white transition-colors">Tratamento & Máscaras</Link></li>
              <li><Link href="/categoria/cronograma-capilar" className="hover:text-white transition-colors">Cronograma Capilar</Link></li>
              <li><Link href="/categoria/shampoos-condicionadores" className="hover:text-white transition-colors">Shampoos & Condicionadores</Link></li>
              <li><Link href="/categoria/oleos-seruns" className="hover:text-white transition-colors">Óleos & Séruns</Link></li>
              <li><Link href="/categoria/perfumaria-casa" className="hover:text-white transition-colors">Perfumaria & Casa</Link></li>
              <li><Link href="/categoria/kits-promocionais" className="hover:text-white transition-colors">Kits Promocionais</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Marcas Oficiais */}
          <div className="space-y-2.5">
            <h4 className="font-bold tracking-wider uppercase text-white text-[11px]">Marcas Oficiais</h4>
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

          {/* Coluna 4: Ajuda & Segurança */}
          <div className="space-y-2.5">
            <h4 className="font-bold tracking-wider uppercase text-white text-[11px]">Ajuda & Segurança</h4>
            <ul className="space-y-1.5 text-white/75">
              <li><Link href="/carrinho" className="hover:text-white transition-colors">Minha Sacola</Link></li>
              <li><Link href="/atendimento" className="hover:text-white transition-colors">Fale Conosco</Link></li>
              <li><Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/trocas-e-devolucoes" className="hover:text-white transition-colors">Trocas & Devoluções</Link></li>
            </ul>
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[11px] text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Site Seguro &amp; Criptografado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-4 border-t border-white/15 text-center text-[11px] text-white/60">
          <p>© 2026 Mariane Cosméticos. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
