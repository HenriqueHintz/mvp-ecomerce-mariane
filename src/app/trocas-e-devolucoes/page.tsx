import React from "react";
import type { Metadata } from "next";
import { ShieldCheck, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Trocas e Devoluções",
  description:
    "Política de Trocas e Devoluções da Mariane Cosméticos conforme o Código de Defesa do Consumidor (CDC). Atendimento em Lages – SC.",
};

export default function TrocasEDevolucoesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="space-y-3 border-b border-silk-200 pb-6">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-marina-600">
          <ShieldCheck className="w-4 h-4" />
          <span>Garantia Oficial & Código de Defesa do Consumidor</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-onyx-950">
          Trocas & Devoluções
        </h1>
        <p className="text-xs sm:text-sm text-onyx-700 leading-relaxed">
          Todos os produtos comercializados pela{" "}
          <strong>Mariane Cosméticos</strong> são 100% originais, adquiridos de
          distribuidores oficiais e enviados com lacre de fábrica.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-silk-200 shadow-luxury-card space-y-6 text-xs sm:text-sm text-onyx-800 leading-relaxed">
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
              href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20solicitar%20aux%C3%ADlio%20sobre%20troca%20ou%20devolu%C3%A7%C3%A3o."
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
