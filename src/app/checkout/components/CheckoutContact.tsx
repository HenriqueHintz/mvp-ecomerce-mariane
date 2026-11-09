"use client";

import React from "react";
import Link from "next/link";
import { User, Phone, Mail, CheckCircle2 } from "lucide-react";

interface CheckoutContactProps {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  marketingConsent: boolean;
  setMarketingConsent: (v: boolean) => void;
  errors: Record<string, string>;
}

export function CheckoutContact({
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  marketingConsent,
  setMarketingConsent,
  errors,
}: CheckoutContactProps) {
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
    <div className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-5">
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm">
          1
        </div>
        <div>
          <h2 className="text-lg font-serif font-bold text-onyx-950">
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
          <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Luiza Silva"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                errors.customerName
                  ? "border-red-400 bg-red-50/20 focus:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus:border-brand"
              }`}
            />
          </div>
          {errors.customerName && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.customerName}
            </p>
          )}
        </div>

        {/* Telefone / WhatsApp */}
        <div>
          <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
            WhatsApp / Celular com DDD <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(49) 99125-1617"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                errors.customerPhone
                  ? "border-red-400 bg-red-50/20 focus:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus:border-brand"
              }`}
            />
          </div>
          {errors.customerPhone && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.customerPhone}
            </p>
          )}
          <p className="mt-1 text-[11px] text-onyx-500">
            Você receberá o status do pedido e comprovante diretamente no seu WhatsApp.
          </p>
        </div>

        {/* E-mail (Opcional) */}
        <div>
          <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
            E-mail <span className="text-onyx-400 font-normal">(Opcional)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com.br"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-silk-200 hover:border-silk-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm transition-all"
            />
          </div>
          {errors.customerEmail && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.customerEmail}
            </p>
          )}
        </div>

        {/* Consentimento LGPD - Marketing Opcional e Desmarcado */}
        <div className="pt-2">
          <label className="flex items-start space-x-3 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-silk-300 text-brand focus:ring-brand accent-brand"
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
            className="text-brand font-semibold hover:underline"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
