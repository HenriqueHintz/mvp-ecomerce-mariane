import React from "react";
import type { Metadata } from "next";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Instagram,
  Navigation,
  ChevronRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import StoreHoursStatus from "@/components/institutional/StoreHoursStatus";

export const metadata: Metadata = {
  title: "Central de Atendimento",
  description:
    "Fale com a Mariane Cosméticos em Lages – SC. Atendimento via WhatsApp (49) 99125-1617 e loja física na Rua Blumenau, Nº 623.",
};

const WHATSAPP_URL =
  "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento.";
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Blumenau+623+Lages+SC";
const INSTAGRAM_URL = "https://www.instagram.com/mariane_cosmeticos_01/";

const MOBILE_FAQ = [
  {
    q: "Qual é o valor para frete grátis?",
    a: "Compras a partir de R$ 199 contam com frete grátis. Você também pode retirar seu pedido na loja em Lages sem custo de frete.",
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Aceitamos pagamento no cartão em até 10x sem juros ou via PIX com 5% de desconto, além de atendimento direto pelo WhatsApp.",
  },
  {
    q: "Posso retirar meu pedido na loja física?",
    a: "Sim. A retirada sem custo de frete é feita na Rua Blumenau, Nº 623, Lages – SC (Seg–Sex 09h–18h30 e Sáb 09h–13h).",
  },
  {
    q: "Os produtos são originais?",
    a: "Sim. Todos os produtos são 100% originais, adquiridos de distribuidores oficiais e enviados com lacre de fábrica. Somos revendedora oficial Madressenza.",
  },
];

export default function AtendimentoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-12 space-y-6 md:space-y-10">
      {/* Cabeçalho compartilhado com adaptação mobile */}
      <div className="space-y-2.5 md:space-y-3 border-b border-silk-200 pb-5 md:pb-6">
        <span className="text-xs font-semibold md:font-bold uppercase tracking-wider md:tracking-widest text-marina-700 md:text-marina-600 block">
          <span className="md:hidden">Atendimento</span>
          <span className="hidden md:inline">Canais Oficiais</span>
        </span>
        <h1 className="font-serif text-[26px] leading-tight md:text-4xl text-onyx-950">
          <span className="md:hidden">Central de Atendimento</span>
          <span className="hidden md:inline">
            Central de Atendimento — Mariane Cosméticos
          </span>
        </h1>
        <p className="text-[15px] md:text-sm text-onyx-700 leading-relaxed">
          Precisa de ajuda com seu pedido, dúvidas sobre cronograma capilar ou
          perfumaria Madressenza? Nossa equipe em Lages – SC atende você
          diretamente.
        </p>
      </div>

      {/* MOBILE (< 768px) */}
      <div className="md:hidden space-y-4">
        {/* 1. Bloco de ações rápidas no topo */}
        <nav
          aria-label="Atalhos de atendimento"
          className="rounded-2xl border border-silk-200 bg-white divide-y divide-silk-100 shadow-xs overflow-hidden"
        >
          <a
            href="#card-whatsapp"
            className="min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 hover:bg-silk-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-dark flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-onyx-950">
                  WhatsApp
                </span>
                <span className="block text-xs text-onyx-700 truncate">
                  (49) 99125-1617 · resposta rápida
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-onyx-500 shrink-0" aria-hidden="true" />
          </a>

          <a
            href="#card-loja"
            className="min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 hover:bg-silk-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-marina-50 text-marina-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-onyx-950">
                  Loja em Lages
                </span>
                <span className="block text-xs text-onyx-700 truncate">
                  Rua Blumenau, 623
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-onyx-500 shrink-0" aria-hidden="true" />
          </a>

          <a
            href="#card-instagram"
            className="min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 hover:bg-silk-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-marina-50 text-brand-accent flex items-center justify-center shrink-0">
                <Instagram className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-onyx-950">
                  Instagram
                </span>
                <span className="block text-xs text-onyx-700 truncate">
                  @mariane_cosmeticos_01
                </span>
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-onyx-500 shrink-0" aria-hidden="true" />
          </a>
        </nav>

        {/* 2. Card WhatsApp (destaque principal) */}
        <section
          id="card-whatsapp"
          data-whatsapp-card="true"
          className="scroll-mt-20 bg-white p-5 rounded-2xl border border-silk-200 shadow-xs space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-dark flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-[19px] leading-snug text-onyx-950">
              WhatsApp Oficial
            </h2>
          </div>

          <p className="text-[15px] text-onyx-700 leading-relaxed">
            Pedidos, estoque, cálculo de entrega e indicação de tratamento
            capilar.
          </p>

          <p className="text-base font-bold text-onyx-950 tabular-nums">
            +55 (49) 99125-1617
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-emerald-whatsapp hover:bg-emerald-dark text-onyx-950 hover:text-white text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-dark focus-visible:ring-offset-2"
          >
            <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Conversar no WhatsApp</span>
          </a>
        </section>

        {/* 3. Card Loja Física */}
        <section
          id="card-loja"
          className="scroll-mt-20 bg-white p-5 rounded-2xl border border-silk-200 shadow-xs space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-marina-50 text-marina-700 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-[19px] leading-snug text-onyx-950">
                Loja Física em Lages
              </h2>
            </div>
            <StoreHoursStatus />
          </div>

          <div className="text-[15px] text-onyx-900 leading-snug">
            <p className="font-semibold">Rua Blumenau, Nº 623</p>
            <p className="text-onyx-700">Lages – SC · CEP: 88505-300</p>
          </div>

          <dl className="rounded-xl bg-silk-50 border border-silk-200/80 px-3.5 py-2.5 space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-onyx-700 font-medium">Seg–Sex</dt>
              <dd className="text-onyx-950 font-semibold tabular-nums whitespace-nowrap">
                09h–18h30
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-onyx-700 font-medium">Sáb</dt>
              <dd className="text-onyx-950 font-semibold tabular-nums whitespace-nowrap">
                09h–13h
              </dd>
            </div>
          </dl>

          <p className="text-sm font-medium text-marina-800">
            Retire sem custo de frete
          </p>

          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-marina-600 hover:bg-marina-700 text-white text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
          >
            <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Como chegar</span>
          </a>
        </section>

        {/* 4. Card Instagram */}
        <section
          id="card-instagram"
          className="scroll-mt-20 p-5 rounded-2xl border border-brand-accent/25 bg-gradient-to-br from-marina-50 via-white to-pink-50 shadow-xs space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-brand-accent border border-brand-accent/20 flex items-center justify-center shrink-0">
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-serif text-[19px] leading-snug text-onyx-950">
                Instagram Oficial
              </h2>
              <p className="text-sm font-bold text-marina-800">
                @mariane_cosmeticos_01
              </p>
            </div>
          </div>

          <p className="text-[15px] text-onyx-700 leading-relaxed">
            Dicas diárias de beleza, lançamentos e promoções oficiais.
          </p>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-marina-600 hover:bg-marina-700 text-white text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
          >
            <Instagram className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Seguir no Instagram</span>
          </a>
        </section>

        {/* 5. Mini-FAQ em acordeão */}
        <section aria-labelledby="faq-titulo" className="pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
            <h2 id="faq-titulo" className="font-serif text-lg text-onyx-950">
              Dúvidas frequentes
            </h2>
          </div>

          <div className="space-y-2.5">
            {MOBILE_FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-silk-200 bg-white shadow-xs overflow-hidden"
              >
                <summary className="list-none [&::-webkit-details-marker]:hidden min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 cursor-pointer text-[15px] font-semibold text-onyx-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 text-marina-700 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-4 pb-3.5 pt-1 border-t border-silk-100 text-[15px] leading-[1.6] text-onyx-700">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* DESKTOP (>= 768px) — Layout intacto */}
      <div className="hidden md:block space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-silk-200 shadow-luxury-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-whatsapp flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl text-onyx-900">
              WhatsApp Oficial e Consultoria
            </h2>
            <p className="text-xs text-onyx-700 leading-relaxed">
              Atendimento rápido para pedidos, consulta de estoque, cálculo de
              entrega e recomendações de tratamento capilar.
            </p>
            <p className="text-sm font-bold text-onyx-950">
              +55 (49) 99125-1617
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-whatsapp hover:bg-emerald-dark text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-full transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Iniciar Conversa no WhatsApp</span>
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-silk-200 shadow-luxury-card space-y-4">
            <div className="w-10 h-10 rounded-xl bg-marina-50 text-marina-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="font-serif text-xl text-onyx-900">
              Loja Física em Lages – SC
            </h2>
            <p className="text-xs text-onyx-700 leading-relaxed">
              Visite nossa loja para conhecer as fragrâncias Madressenza e retirar
              seus pedidos sem custo de frete.
            </p>
            <div className="text-xs text-onyx-800 space-y-1">
              <p className="font-bold">Rua Blumenau, Nº 623</p>
              <p>Lages – SC &bull; CEP: 88505-300</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-onyx-700 pt-1">
              <Clock className="w-4 h-4 text-marina-600 shrink-0" />
              <span>Seg a Sex: 09h às 18h30 | Sáb: 09h às 13h</span>
            </div>
          </div>
        </div>

        <div className="bg-marina-50/70 p-6 rounded-2xl border border-marina-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-onyx-950">
              Acompanhe novidades no Instagram
            </h3>
            <p className="text-xs text-onyx-700">
              Dicas diárias de beleza, lançamentos e promoções oficiais em{" "}
              <strong>@mariane_cosmeticos_01</strong>.
            </p>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-marina-600 hover:bg-marina-700 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-full transition-colors shrink-0"
          >
            <Instagram className="w-4 h-4" />
            <span>@mariane_cosmeticos_01</span>
          </a>
        </div>
      </div>
    </div>
  );
}
