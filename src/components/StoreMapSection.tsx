"use client";

import React from "react";
import { MapPin, Clock, Phone, Navigation, ExternalLink, ShieldCheck } from "lucide-react";

export default function StoreMapSection() {
  const addressQuery = encodeURIComponent("Rua Blumenau, 623, Lages - SC, 88505-300");
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
  const wazeUrl = `https://waze.com/ul?q=${addressQuery}`;
  const whatsappUrl = "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20saber%20mais%20sobre%20a%20loja%20em%20Lages.";

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16"
      id="loja-fisica"
    >
      <div className="bg-white rounded-3xl border border-silk-200 shadow-luxury-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Coluna 1: Informações e Ações Humanas */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-gradient-to-b from-white via-silk-50/50 to-marina-50/30">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl text-onyx-950 tracking-tight leading-snug">
                Venha nos visitar em Lages
              </h3>
            </div>

            {/* Dados Práticos de Localização */}
            <div className="space-y-4 pt-2 border-t border-silk-200">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-marina-100 text-marina-700 rounded-xl shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-onyx-900">Endereço</h4>
                  <p className="text-sm font-medium text-onyx-950 mt-0.5">
                    Rua Blumenau, Nº 623
                  </p>
                  <p className="text-xs text-onyx-700/80">
                    Lages – SC &bull; CEP 88505-300
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-silk-100 text-onyx-800 rounded-xl shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-onyx-900">Horário</h4>
                  <p className="text-xs text-onyx-800 mt-0.5">
                    Segunda a Sexta: <strong>09h às 18h30</strong>
                  </p>
                  <p className="text-xs text-onyx-800">
                    Sábado: <strong>09h às 13h</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-whatsapp rounded-xl shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-onyx-900">WhatsApp & Pedidos</h4>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-emerald-dark hover:underline inline-block mt-0.5"
                  >
                    (49) 99125-1617
                  </a>
                  <p className="text-[11px] text-onyx-700/70">Resposta rápida para dúvidas e compras</p>
                </div>
              </div>
            </div>

            {/* Ações de Rota Direta */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-marina-600 hover:bg-marina-700 text-white font-semibold py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition-all shadow-marina-sm hover:shadow-marina-md flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Como Chegar</span>
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-silk-100 hover:bg-silk-200 text-onyx-900 font-semibold py-3 px-4 rounded-xl text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 border border-silk-300/80"
              >
                <span>Waze</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Coluna 2: Google Maps Embed Interativo */}
          <div className="lg:col-span-7 relative min-h-[360px] lg:min-h-full bg-silk-100 border-t lg:border-t-0 lg:border-l border-silk-200">
            <iframe
              title="Localização Mariane Cosméticos - Rua Blumenau, 623, Lages - SC"
              src={`https://maps.google.com/maps?q=${encodeURIComponent("Rua Blumenau, 623, Lages, SC, 88505-300")}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              className="w-full h-full min-h-[380px] lg:min-h-[460px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

