import React from "react";
import type { Metadata } from "next";
import { ShieldCheck, MessageCircle, RotateCcw, PackageCheck } from "lucide-react";
import LegalAccordion from "@/components/institutional/LegalAccordion";

export const metadata: Metadata = {
  title: "Política de Trocas e Devoluções",
  description:
    "Política de Trocas e Devoluções da Mariane Cosméticos conforme o Código de Defesa do Consumidor (CDC). Atendimento em Lages – SC.",
};

const WHATSAPP_TROCAS_URL =
  "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20solicitar%20aux%C3%ADlio%20sobre%20troca%20ou%20devolu%C3%A7%C3%A3o.";

export default function TrocasEDevolucoesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:py-12 space-y-6 md:space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-2.5 md:space-y-3 border-b border-silk-200 pb-5 md:pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold md:font-bold uppercase tracking-wider md:tracking-widest text-marina-700 md:text-marina-600">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="md:hidden">Garantia oficial · CDC</span>
          <span className="hidden md:inline">
            Garantia Oficial e Código de Defesa do Consumidor
          </span>
        </div>
        <h1 className="font-serif text-[26px] leading-tight md:text-4xl text-onyx-950">
          Trocas e Devoluções
        </h1>
        <p className="text-[15px] md:text-sm text-onyx-700 leading-relaxed">
          Todos os produtos comercializados pela{" "}
          <strong>Mariane Cosméticos</strong> são 100% originais, adquiridos de
          distribuidores oficiais e enviados com lacre de fábrica.
        </p>
      </div>

      {/* MOBILE (< 768px) */}
      <div className="md:hidden space-y-4">
        {/* 3 destaques visuais */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl border border-silk-200 bg-white p-3 text-center space-y-1.5 shadow-xs">
            <ShieldCheck
              className="w-5 h-5 text-marina-700 mx-auto"
              aria-hidden="true"
            />
            <span className="block text-xs font-semibold text-onyx-900 leading-tight">
              100% originais
            </span>
          </div>
          <div className="rounded-2xl border border-silk-200 bg-white p-3 text-center space-y-1.5 shadow-xs">
            <RotateCcw
              className="w-5 h-5 text-marina-700 mx-auto"
              aria-hidden="true"
            />
            <span className="block text-xs font-semibold text-onyx-900 leading-tight">
              7 dias para desistir
            </span>
          </div>
          <div className="rounded-2xl border border-silk-200 bg-white p-3 text-center space-y-1.5 shadow-xs">
            <PackageCheck
              className="w-5 h-5 text-marina-700 mx-auto"
              aria-hidden="true"
            />
            <span className="block text-xs font-semibold text-onyx-900 leading-tight">
              Troca por avaria
            </span>
          </div>
        </div>

        {/* Acordeões numerados (1º aberto por padrão) */}
        <div className="space-y-3">
          <LegalAccordion
            id="arrependimento"
            title="1. Direito de Arrependimento (Art. 49 do CDC)"
            defaultOpen
          >
            <p>
              Para compras realizadas fora do estabelecimento físico (pelo site ou
              WhatsApp), o cliente possui até{" "}
              <strong className="font-semibold">7 (sete) dias corridos</strong>{" "}
              a contar do recebimento para solicitar a devolução, desde que o
              cosmético ou perfume atenda às condições:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Embalagem original;</li>
              <li>
                <strong className="font-semibold">Com lacre intacto</strong>;
              </li>
              <li>Sem indícios de uso.</li>
            </ul>
          </LegalAccordion>

          <LegalAccordion
            id="avaria"
            title="2. Produtos com Avaria no Transporte ou Defeito"
          >
            <p>
              Caso perceba embalagem violada ou avaria no ato da entrega, entre
              em contato imediatamente com nosso atendimento. Substituímos o item
              sem custo adicional ou realizamos o estorno integral do valor pago.
            </p>
          </LegalAccordion>

          <LegalAccordion
            id="solicitar"
            title="3. Como Solicitar Troca em Lages – SC ou pelos Correios"
          >
            <p>
              Envie uma mensagem com o número do seu pedido para nosso WhatsApp
              oficial{" "}
              <strong className="font-semibold">+55 (49) 99125-1617</strong> ou
              compareça à nossa loja física na{" "}
              <strong className="font-semibold">
                Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)
              </strong>
              .
            </p>
          </LegalAccordion>
        </div>

        {/* Card final de ajuda */}
        <section
          data-whatsapp-card="true"
          className="bg-white p-5 rounded-2xl border border-silk-200 shadow-xs space-y-3"
        >
          <h2 className="font-serif text-[19px] leading-snug text-onyx-950">
            Precisa trocar um produto?
          </h2>
          <p className="text-[15px] text-onyx-700 leading-relaxed">
            Tenha o número do pedido em mãos para agilizar o atendimento pelo
            WhatsApp oficial.
          </p>
          <a
            href={WHATSAPP_TROCAS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-emerald-whatsapp hover:bg-emerald-dark text-onyx-950 hover:text-white text-[15px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-dark focus-visible:ring-offset-2"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Falar no WhatsApp</span>
          </a>
        </section>
      </div>

      {/* DESKTOP (>= 768px) — Layout intacto */}
      <div className="hidden md:block bg-white p-6 sm:p-8 rounded-3xl border border-silk-200 shadow-luxury-card space-y-6 text-xs sm:text-sm text-onyx-800 leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            1. Direito de Arrependimento (Art. 49 do CDC)
          </h2>
          <p>
            Para compras realizadas fora do estabelecimento físico (pelo site ou
            WhatsApp), o cliente possui até{" "}
            <strong>7 (sete) dias corridos</strong> a contar do recebimento para
            solicitar a devolução, desde que o cosmético ou perfume esteja em
            sua embalagem original, <strong>com lacre intacto</strong> e sem
            indícios de uso.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            2. Produtos com Avaria no Transporte ou Defeito
          </h2>
          <p>
            Caso perceba embalagem violada ou avaria no ato da entrega, entre em
            contato imediatamente com nosso atendimento. Substituímos o item sem
            custo adicional ou realizamos o estorno integral do valor pago.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg text-onyx-950">
            3. Como Solicitar Troca em Lages – SC ou pelos Correios
          </h2>
          <p>
            Basta enviar uma mensagem com o número do seu pedido para nosso
            WhatsApp oficial <strong>+55 (49) 99125-1617</strong> ou comparecer
            à nossa loja física na{" "}
            <strong>Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)</strong>.
          </p>
          <div className="pt-2">
            <a
              href={WHATSAPP_TROCAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-whatsapp hover:bg-emerald-dark text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-full transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Solicitar Atendimento no WhatsApp</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
