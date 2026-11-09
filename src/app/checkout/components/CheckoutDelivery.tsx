"use client";

import React, { useState } from "react";
import { STORE_CONFIG } from "@/config/store";
import { MapPin, Truck, Store, Loader2, AlertCircle, Check } from "lucide-react";

interface CheckoutDeliveryProps {
  deliveryMode: "entrega" | "retirada";
  setDeliveryMode: (mode: "entrega" | "retirada") => void;
  cep: string;
  setCep: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  errors: Record<string, string>;
  onDeliveryChange?: () => void;
}

export function CheckoutDelivery({
  deliveryMode,
  setDeliveryMode,
  cep,
  setCep,
  address,
  setAddress,
  city,
  setCity,
  notes,
  setNotes,
  errors,
  onDeliveryChange,
}: CheckoutDeliveryProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: "success" | "warn"; text: string } | null>(null);

  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 8);
    const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setCep(formatted);
    setCepFeedback(null);

    if (raw.length === 8) {
      setCepLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // Timeout 4 segundos

      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Erro na busca de CEP");
        const data = await res.json();

        if (data.erro) {
          setCepFeedback({
            type: "warn",
            text: "CEP não localizado. Por favor, preencha o endereço manualmente abaixo.",
          });
        } else {
          const logradouro = data.logradouro || "";
          const bairro = data.bairro || "";
          const localidade = data.localidade || "Lages";
          const uf = data.uf || "SC";

          const street = logradouro ? `${logradouro}${bairro ? `, ${bairro}` : ""}` : "";
          if (street) {
            setAddress(street);
          }
          setCity(`${localidade} - ${uf}`);
          setCepFeedback({
            type: "success",
            text: `${localidade}/${uf} localizado com sucesso. Complete com o número e complemento.`,
          });
        }
      } catch {
        setCepFeedback({
          type: "warn",
          text: "Não foi possível consultar o CEP automaticamente. Preencha seu endereço manualmente.",
        });
      } finally {
        setCepLoading(false);
        if (onDeliveryChange) onDeliveryChange();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-5">
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div>
          <h2 className="text-lg font-serif font-bold text-onyx-950">
            Forma de Entrega
          </h2>
          <p className="text-xs text-onyx-600">
            Escolha entre retirar na loja física em Lages ou receber no seu endereço.
          </p>
        </div>
      </div>

      {/* Seletor de Modalidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opção Entrega */}
        <button
          type="button"
          onClick={() => {
            setDeliveryMode("entrega");
            if (onDeliveryChange) onDeliveryChange();
          }}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
            deliveryMode === "entrega"
              ? "border-brand bg-brand-light/40 ring-2 ring-brand/10"
              : "border-silk-200 hover:border-silk-300 bg-white"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
              deliveryMode === "entrega"
                ? "border-brand bg-brand text-white"
                : "border-silk-300 bg-white"
            }`}
          >
            {deliveryMode === "entrega" && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-onyx-900 flex items-center">
                <Truck className="w-4 h-4 mr-1.5 text-brand" />
                Entrega em Domicílio
              </span>
            </div>
            <p className="text-xs text-onyx-600 mt-0.5">
              Envio rápido para Lages e região.
            </p>
          </div>
        </button>

        {/* Opção Retirada */}
        <button
          type="button"
          onClick={() => {
            setDeliveryMode("retirada");
            if (onDeliveryChange) onDeliveryChange();
          }}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
            deliveryMode === "retirada"
              ? "border-brand bg-brand-light/40 ring-2 ring-brand/10"
              : "border-silk-200 hover:border-silk-300 bg-white"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
              deliveryMode === "retirada"
                ? "border-brand bg-brand text-white"
                : "border-silk-300 bg-white"
            }`}
          >
            {deliveryMode === "retirada" && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-onyx-900 flex items-center">
                <Store className="w-4 h-4 mr-1.5 text-brand" />
                Retirada na Loja Física
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Grátis
              </span>
            </div>
            <p className="text-xs text-onyx-600 mt-0.5">
              Rua Blumenau, 623 — Lages / SC
            </p>
          </div>
        </button>
      </div>

      {/* Detalhes de Retirada */}
      {deliveryMode === "retirada" ? (
        <div className="p-4 rounded-xl bg-silk-50 border border-silk-200 space-y-2 text-xs text-onyx-700">
          <div className="flex items-center font-semibold text-onyx-900">
            <MapPin className="w-4 h-4 mr-1.5 text-brand flex-shrink-0" />
            Endereço para Retirada:
          </div>
          <p className="pl-5 text-onyx-800 font-medium">
            {STORE_CONFIG.physicalStore.formattedAddress}
          </p>
          <p className="pl-5 text-onyx-600">
            {STORE_CONFIG.physicalStore.pickupInstructions}
          </p>
        </div>
      ) : (
        /* Formulário de Entrega */
        <div className="space-y-4 pt-1">
          {/* CEP */}
          <div>
            <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
              CEP de Entrega <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="88505-300"
                maxLength={9}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                  errors.cep
                    ? "border-red-400 bg-red-50/20 focus:border-red-500"
                    : "border-silk-200 hover:border-silk-300 focus:border-brand"
                }`}
              />
              {cepLoading && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-xs text-brand space-x-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando endereço...</span>
                </div>
              )}
            </div>
            {errors.cep && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.cep}</p>
            )}
            {cepFeedback && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
                  cepFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {cepFeedback.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{cepFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Endereço Completo */}
          <div>
            <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
              Endereço Completo (Rua, Número, Bairro e Complemento) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua Blumenau, 623, Bairro Coral - Apto 102"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                errors.address
                  ? "border-red-400 bg-red-50/20 focus:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus:border-brand"
              }`}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.address}</p>
            )}
          </div>

          {/* Cidade e Estado */}
          <div>
            <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
              Cidade / Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lages - SC"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/20 ${
                errors.city
                  ? "border-red-400 bg-red-50/20 focus:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus:border-brand"
              }`}
            />
            {errors.city && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.city}</p>
            )}
          </div>
        </div>
      )}

      {/* Observações / Ponto de Referência */}
      <div className="pt-2">
        <label className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5">
          Observações para Entrega / Retirada{" "}
          <span className="text-onyx-400 font-normal">(Opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Deixar com a portaria, tocar interfone 102, ou horário de preferência."
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-silk-200 hover:border-silk-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm transition-all resize-none"
        />
      </div>
    </div>
  );
}
