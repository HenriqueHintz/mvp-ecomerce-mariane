"use client";

import React, { useEffect, useState } from "react";
import { SvgIcon } from "@/components/ui/SvgIcon";

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
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12"
      id="loja-fisica"
      aria-labelledby="loja-fisica-titulo"
    >
      <div className="bg-white rounded-3xl border border-silk-200 shadow-luxury-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Coluna 1: Informações e Ações */}
          <div className="order-1 lg:col-span-6 p-4 sm:p-8 lg:p-10 flex flex-col justify-between gap-4 sm:gap-6 bg-gradient-to-b from-white via-silk-50/40 to-marina-50/25">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="loja-fisica-titulo"
                  className="font-serif text-2xl font-normal sm:text-3xl sm:font-bold text-onyx-950 tracking-tight leading-snug [word-spacing:0.04em]"
                >
                  Venha nos visitar em Lages
                </h2>
                <p className="sec-sub">
                  Conheça pessoalmente nossa perfumaria de ambiente Madressenza e linhas profissionais de salão na Rua Blumenau, 623 (São Cristóvão, Lages – SC). Atendimento consultivo presencial ou via WhatsApp, com procedência garantida e retirada gratuita na loja.
                </p>
              </div>
              {isOpenNow !== null && (
                <span
                  className={`md:hidden inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
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

            {/* Dados Práticos de Localização com divisórias sutis */}
            <div className="divide-y divide-silk-200/80 border-t border-b border-silk-200/80">
              {/* Endereço (com ação de cópia acessível e sem elementos de bloco/heading dentro de button) */}
              <div className="sm-row">
                <div className="sm-icon-box bg-marina-100 text-marina-700">
                  <SvgIcon name="map-pin" className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="sm-h3">
                      Endereço
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      aria-label="Copiar endereço: Rua Blumenau, Nº 623, Lages – SC, CEP 88505-300"
                      className="md:hidden text-xs font-medium text-marina-700 cursor-pointer focus-visible:outline-none focus-visible:underline rounded"
                    >
                      {copied ? "Copiado ✓" : "Toque p/ copiar"}
                    </button>
                  </div>
                  <p className="sm-val">
                    Rua Blumenau, Nº 623
                  </p>
                  <p className="sm-sub">
                    Lages – SC &bull; <span className="whitespace-nowrap">CEP 88505-300</span>
                  </p>
                </div>
              </div>

              {/* Horário */}
              <div className="sm-row">
                <div className="sm-icon-box bg-silk-100 text-onyx-800">
                  <SvgIcon name="clock" className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="sm-h3 [word-spacing:0.06em]">
                      Horário de atendimento
                    </h3>
                    {isOpenNow !== null && (
                      <span
                        className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border [word-spacing:0.05em] ${
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
                      <dt className="font-medium text-onyx-800 whitespace-nowrap">
                        <span className="md:hidden">Seg–Sex</span>
                        <span className="hidden md:inline">Segunda a Sexta</span>
                      </dt>
                      <dd className="font-semibold text-onyx-950 tabular-nums whitespace-nowrap">
                        09h às 18h30
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="font-medium text-onyx-800 whitespace-nowrap">
                        <span className="md:hidden">Sáb</span>
                        <span className="hidden md:inline">Sábado</span>
                      </dt>
                      <dd className="font-semibold text-onyx-950 tabular-nums whitespace-nowrap">
                        09h às 13h
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* WhatsApp & Pedidos */}
              <div className="sm-row">
                <div className="sm-icon-box bg-emerald-50 text-emerald-700">
                  <SvgIcon name="phone" className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="sm-h3 [word-spacing:0.06em]">
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
            <div className="flex flex-row flex-wrap gap-2.5 pt-1">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sm-route-btn"
              >
                <SvgIcon name="navigation" className="w-4 h-4 shrink-0" />
                <span>Como chegar</span>
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sm-waze-btn"
              >
                <span>Waze</span>
                <SvgIcon name="external-link" className="w-4 h-4 shrink-0" />
              </a>

              <button
                type="button"
                onClick={handleCopyAddress}
                aria-label="Copiar endereço da loja"
                className="sm-copy-btn"
              >
                {copied ? (
                  <>
                    <SvgIcon name="check" className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-emerald-800 font-semibold">Copiado ✓</span>
                  </>
                ) : (
                  <>
                    <SvgIcon name="copy" className="w-3.5 h-3.5 shrink-0" />
                    <span>Copiar endereço</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Coluna 2: Google Maps Embed Interativo */}
          <div className="order-2 lg:col-span-6 relative h-[220px] sm:h-[340px] lg:h-full lg:min-h-[420px] bg-silk-100 border-t lg:border-t-0 lg:border-l border-silk-200 rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl overflow-hidden">
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
