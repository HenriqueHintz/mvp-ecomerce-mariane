import React from "react";
import type { Metadata } from "next";
import { MapPin, Phone, Clock, MessageCircle, Instagram } from "lucide-react";

export const metadata: Metadata = {
  title: "Central de Atendimento",
  description:
    "Fale com a Mariane Cosméticos em Lages – SC. Atendimento via WhatsApp (49) 99125-1617 e loja física na Rua Blumenau, Nº 623.",
};

export default function AtendimentoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3 border-b border-silk-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-marina-600 block">
          Canais Oficiais
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl text-onyx-950">
          Central de Atendimento — Mariane Cosméticos
        </h1>
        <p className="text-sm text-onyx-700 leading-relaxed">
          Precisa de ajuda com seu pedido, dúvidas sobre cronograma capilar ou
          perfumaria Madressenza? Nossa equipe em Lages – SC atende você
          diretamente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-silk-200 shadow-luxury-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-whatsapp flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-xl text-onyx-900">
            WhatsApp Oficial & Consultoria
          </h2>
          <p className="text-xs text-onyx-700 leading-relaxed">
            Atendimento rápido para pedidos, consulta de estoque, cálculo de
            entrega e recomendações de tratamento capilar.
          </p>
          <p className="text-sm font-bold text-onyx-950">
            +55 (49) 99125-1617
          </p>
          <a
            href="https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20atendimento."
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
          href="https://www.instagram.com/mariane_cosmeticos_01/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-marina-600 hover:bg-marina-700 text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-full transition-colors shrink-0"
        >
          <Instagram className="w-4 h-4" />
          <span>@mariane_cosmeticos_01</span>
        </a>
      </div>
    </div>
  );
}
