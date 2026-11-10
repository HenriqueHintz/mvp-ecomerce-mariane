"use client";

import React from "react";
import Link from "next/link";
import { User, Phone, Mail } from "lucide-react";
import { useCheckoutContext } from "../CheckoutContext";

interface CheckoutContactProps {
  name?: string;
  setName?: (v: string) => void;
  phone?: string;
  setPhone?: (v: string) => void;
  email?: string;
  setEmail?: (v: string) => void;
  marketingConsent?: boolean;
  setMarketingConsent?: (v: boolean) => void;
  errors?: Record<string, string>;
}

export function CheckoutContact(props: CheckoutContactProps) {
  const ctx = useCheckoutContext();

  const name = props.name ?? ctx?.state.name ?? "";
  const setName = props.setName ?? ctx?.actions.setName ?? (() => {});
  const phone = props.phone ?? ctx?.state.phone ?? "";
  const setPhone = props.setPhone ?? ctx?.actions.setPhone ?? (() => {});
  const email = props.email ?? ctx?.state.email ?? "";
  const setEmail = props.setEmail ?? ctx?.actions.setEmail ?? (() => {});
  const marketingConsent =
    props.marketingConsent ?? ctx?.state.marketingConsent ?? false;
  const setMarketingConsent =
    props.setMarketingConsent ?? ctx?.actions.setMarketingConsent ?? (() => {});
  const errors = props.errors ?? ctx?.state.errors ?? {};

  const handlePhoneChange = (val: string) => {
    const rawDigits = val.replace(/\D/g, "").slice(0, 11);
    let formatted = rawDigits;
    if (rawDigits.length > 2) {
      formatted = `(${rawDigits.slice(0, 2)}) ${rawDigits.slice(2)}`;
    }
    if (rawDigits.length > 7) {
      formatted = `(${rawDigits.slice(0, 2)}) ${rawDigits.slice(2, 7)}-${rawDigits.slice(7)}`;
    } else if (rawDigits.length > 6 && rawDigits.length <= 10) {
      formatted = `(${rawDigits.slice(0, 2)}) ${rawDigits.slice(2, 6)}-${rawDigits.slice(6)}`;
    }
    setPhone(formatted);
  };

  return (
    <section
      aria-labelledby="checkout-step-contact"
      className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-5"
    >
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm tabular-nums"
        >
          1
        </div>
        <div>
          <h2
            id="checkout-step-contact"
            className="text-lg font-serif font-bold text-onyx-950"
          >
            Identificação & Contato
          </h2>
          <p className="text-xs text-onyx-600">
            Seus dados para emissão do pedido e contato via WhatsApp.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Nome Completo */}
        <div>
          <label
            htmlFor="checkout-customer-name"
            className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
          >
            Nome Completo <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <User
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-400"
            />
            <input
              id="checkout-customer-name"
              name="customerName"
              type="text"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.customerName)}
              aria-describedby={
                errors.customerName ? "checkout-customer-name-error" : undefined
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Luiza Silva"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                errors.customerName
                  ? "border-red-400 bg-red-50/20 focus-visible:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus-visible:border-brand"
              }`}
            />
          </div>
          {errors.customerName && (
            <p
              id="checkout-customer-name-error"
              role="alert"
              className="mt-1 text-xs text-red-600 font-medium"
            >
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Telefone / WhatsApp */}
        <div>
          <label
            htmlFor="checkout-customer-phone"
            className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
          >
            WhatsApp / Celular com DDD{" "}
            <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Phone
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-400"
            />
            <input
              id="checkout-customer-phone"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.customerPhone)}
              aria-describedby={
                errors.customerPhone
                  ? "checkout-customer-phone-error"
                  : "checkout-customer-phone-hint"
              }
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(49) 99125-1617"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                errors.customerPhone
                  ? "border-red-400 bg-red-50/20 focus-visible:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus-visible:border-brand"
              }`}
            />
          </div>
          {errors.customerPhone && (
            <p
              id="checkout-customer-phone-error"
              role="alert"
              className="mt-1 text-xs text-red-600 font-medium"
            >
              {errors.customerPhone}
            </p>
          )}
          <p
            id="checkout-customer-phone-hint"
            className="mt-1 text-[11px] text-onyx-500"
          >
            Você receberá o status do pedido e comprovante diretamente no seu WhatsApp.
          </p>
        </div>

        {/* E-mail (Opcional) */}
        <div>
          <label
            htmlFor="checkout-customer-email"
            className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
          >
            E-mail <span className="text-onyx-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-400"
            />
            <input
              id="checkout-customer-email"
              name="customerEmail"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.customerEmail)}
              aria-describedby={
                errors.customerEmail ? "checkout-customer-email-error" : undefined
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com.br"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-silk-200 hover:border-silk-300 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm transition-all"
            />
          </div>
          {errors.customerEmail && (
            <p
              id="checkout-customer-email-error"
              role="alert"
              className="mt-1 text-xs text-red-600 font-medium"
            >
              {errors.customerEmail}
            </p>
          )}
        </div>

        {/* Consentimento LGPD - Marketing Opcional e Desmarcado */}
        <div className="pt-2">
          <label
            htmlFor="checkout-marketing-consent"
            className="flex items-start space-x-3 cursor-pointer group select-none"
          >
            <input
              id="checkout-marketing-consent"
              name="marketingConsent"
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-silk-300 text-brand focus-visible:ring-2 focus-visible:ring-brand accent-brand"
            />
            <span className="text-xs text-onyx-700 leading-relaxed group-hover:text-onyx-900">
              Desejo receber novidades, cupons de desconto e dicas de cuidados capilares da Mariane Cosméticos pelo WhatsApp ou e-mail.
            </span>
          </label>
        </div>

        {/* Informação sobre Privacidade e Proteção de Dados */}
        <p className="text-[11px] text-onyx-500 leading-relaxed border-t border-silk-100 pt-3">
          Seus dados pessoais são processados estritamente para emissão e entrega do seu pedido (Art. 7º, V da LGPD). Conheça nossa{" "}
          <Link
            href="/politica-de-privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
