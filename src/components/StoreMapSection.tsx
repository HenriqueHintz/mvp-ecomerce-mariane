"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

const STORE_ADDRESS_FULL = "Rua Blumenau, Nº 623, Lages - SC, CEP 88505-300";

function isStoreOpenInSaoPaulo(now: Date): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    const totalMinutes = hour * 60 + minute;

    if (["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday)) {
      return totalMinutes >= 9 * 60 && totalMinutes < 18 * 60 + 30;
    }
    if (weekday === "Sat") {
      return totalMinutes >= 9 * 60 && totalMinutes < 13 * 60;
    }
    return false;
  } catch {
    return false;
  }
}

export default function StoreMapSection() {
  const [isOpenNow, setIsOpenNow] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsOpenNow(isStoreOpenInSaoPaulo(new Date()));
    const interval = window.setInterval(() => {
      setIsOpenNow(isStoreOpenInSaoPaulo(new Date()));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(STORE_ADDRESS_FULL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const addressQuery = encodeURIComponent(
    "Rua Blumenau, 623, Lages - SC, 88505-300"
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
  const wazeUrl = `https://waze.com/ul?q=${addressQuery}`;
  const whatsappUrl =
    "https://wa.me/5549991251617?text=Ol%C3%A1%2C%20Mariane%20Cosm%C3%A9ticos!%20Gostaria%20de%20saber%20mais%20sobre%20a%20loja%20em%20Lages.";

  return (
    <section
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12"
      id="loja-fisica"
      aria-labelledby="loja-fisica-titulo"
    >
      <div className="bg-white rounded-3xl border border-silk-200 shadow-luxury-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Coluna 1: Informações e Ações */}
          <div className="order-1 lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 bg-gradient-to-b from-white via-silk-50/40 to-marina-50/25">
            <div>
              <h2
                id="loja-fisica-titulo"
                className="font-serif text-2xl sm:text-3xl font-bold text-onyx-950 tracking-tight leading-snug [word-spacing:0.04em]"
              >
                Venha nos visitar em Lages
              </h2>
            </div>

            {/* Dados Práticos de Localização com divisórias sutis */}
            <div className="divide-y divide-silk-200/80 border-t border-b border-silk-200/80">
              {/* Endereço */}
              <div className="grid grid-cols-[40px_1fr] items-start gap-3.5 py-4">
                <div className="w-10 h-10 bg-marina-100 text-marina-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-[13px] font-bold tracking-[0.03em] text-onyx-700 [word-spacing:0.06em]">
                    Endereço
                  </h3>
                  <p className="text-[15px] sm:text-base font-semibold text-onyx-950 mt-1 leading-snug [word-spacing:0.05em]">
                    Rua Blumenau, Nº 623
                  </p>
                  <p className="text-sm text-onyx-700 mt-0.5 leading-snug [word-spacing:0.06em]">
                    Lages – SC &bull; CEP 88505-300
                  </p>
                </div>
              </div>

              {/* Horário */}
              <div className="grid grid-cols-[40px_1fr] items-start gap-3.5 py-4">
                <div className="w-10 h-10 bg-silk-100 text-onyx-800 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-[13px] font-bold tracking-[0.03em] text-onyx-700 [word-spacing:0.06em]">
                      Horário de atendimento
                    </h3>
                    {isOpenNow !== null && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border [word-spacing:0.05em] ${
                          isOpenNow
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-silk-100 text-onyx-700 border-silk-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOpenNow ? "bg-emerald-600" : "bg-onyx-500"
                          }`}
                          aria-hidden="true"
                        />
                        {isOpenNow ? "Aberto agora" : "Fechado agora"}
                      </span>
                    )}
                  </div>

                  <dl className="mt-2 space-y-1.5 text-[15px] text-onyx-900">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-medium text-onyx-800 [word-spacing:0.05em]">
                        Segunda a Sexta
                      </dt>
                      <dd className="font-semibold text-onyx-950 tabular-nums whitespace-nowrap [word-spacing:0.05em]">
                        09h às 18h30
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-medium text-onyx-800 [word-spacing:0.05em]">
                        Sábado
                      </dt>
                      <dd className="font-semibold text-onyx-950 tabular-nums whitespace-nowrap [word-spacing:0.05em]">
                        09h às 13h
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* WhatsApp & Pedidos */}
              <div className="grid grid-cols-[40px_1fr] items-start gap-3.5 py-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-[13px] font-bold tracking-[0.03em] text-onyx-700 [word-spacing:0.06em]">
                    WhatsApp &amp; Pedidos
                  </h3>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] sm:text-base font-bold text-emerald-800 hover:text-emerald-900 hover:underline inline-block mt-1 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded"
                  >
                    (49) 99125-1617
                  </a>
                  <p className="text-xs sm:text-[13px] text-onyx-700 mt-0.5 leading-snug [word-spacing:0.06em]">
                    Resposta rápida para dúvidas e compras
                  </p>
                </div>
              </div>
            </div>

            {/* Ações de Rota Direta */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-1">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 min-h-[44px] bg-marina-600 hover:bg-marina-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm tracking-normal [word-spacing:0.06em] transition-colors shadow-marina-sm flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
              >
                <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Como chegar</span>
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto sm:min-w-[124px] min-h-[44px] bg-white hover:bg-marina-50 text-onyx-950 font-semibold py-2.5 px-4 rounded-xl text-sm tracking-normal [word-spacing:0.06em] transition-colors flex items-center justify-center gap-2 border border-onyx-300 hover:border-marina-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
              >
                <span>Waze</span>
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={handleCopyAddress}
                aria-label="Copiar endereço da loja"
                className="w-full sm:w-auto min-h-[44px] bg-silk-50 hover:bg-silk-100 text-onyx-800 font-medium py-2.5 px-3.5 rounded-xl text-xs sm:text-[13px] tracking-normal [word-spacing:0.06em] transition-colors flex items-center justify-center gap-1.5 border border-silk-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span className="text-emerald-800 font-semibold">Copiado ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Copiar endereço</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Coluna 2: Google Maps Embed Interativo */}
          <div className="order-2 lg:col-span-6 relative h-[260px] sm:h-[340px] lg:h-full lg:min-h-[420px] bg-silk-100 border-t lg:border-t-0 lg:border-l border-silk-200">
            <iframe
              title="Localização Mariane Cosméticos - Rua Blumenau, 623, Lages - SC"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                "Rua Blumenau, 623, Lages, SC, 88505-300"
              )}&t=&z=17&ie=UTF8&iwloc=near&output=embed`}
              width="100%"
              height="100%"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
