"use client";

import React, { useCallback } from "react";
import { STORE_CONFIG } from "@/config/store";
import { MapPin, Truck, Store, Loader2, AlertCircle, Check } from "lucide-react";
import { useCepLookup } from "../hooks/useCepLookup";
import { useCheckoutContext } from "../CheckoutContext";

interface CheckoutDeliveryProps {
  deliveryMode?: "entrega" | "retirada";
  setDeliveryMode?: (mode: "entrega" | "retirada") => void;
  cep?: string;
  setCep?: (v: string) => void;
  address?: string;
  setAddress?: (v: string) => void;
  city?: string;
  setCity?: (v: string) => void;
  notes?: string;
  setNotes?: (v: string) => void;
  errors?: Record<string, string>;
  onDeliveryChange?: () => void;
}

export function CheckoutDelivery(props: CheckoutDeliveryProps) {
  const ctx = useCheckoutContext();

  const deliveryMode = props.deliveryMode ?? ctx?.state.deliveryMode ?? "entrega";
  const setDeliveryMode =
    props.setDeliveryMode ?? ctx?.actions.setDeliveryMode ?? (() => {});
  const cep = props.cep ?? ctx?.state.cep ?? "";
  const setCep = props.setCep ?? ctx?.actions.setCep ?? (() => {});
  const address = props.address ?? ctx?.state.address ?? "";
  const setAddress = props.setAddress ?? ctx?.actions.setAddress ?? (() => {});
  const city = props.city ?? ctx?.state.city ?? "Lages - SC";
  const setCity = props.setCity ?? ctx?.actions.setCity ?? (() => {});
  const notes = props.notes ?? ctx?.state.notes ?? "";
  const setNotes = props.setNotes ?? ctx?.actions.setNotes ?? (() => {});
  const errors = props.errors ?? ctx?.state.errors ?? {};
  const onDeliveryChange = props.onDeliveryChange;

  const handleAddressResolved = useCallback(
    (resolved: { address: string; city: string }) => {
      if (resolved.address) {
        setAddress(resolved.address);
      }
      if (resolved.city) {
        setCity(resolved.city);
      }
    },
    [setAddress, setCity]
  );

  const { cepLoading, cepFeedback, lookupCep } = useCepLookup({
    timeoutMs: 4000,
    onAddressResolved: handleAddressResolved,
    onSettled: onDeliveryChange,
  });

  const handleCepChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 8);
    const formatted =
      raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setCep(formatted);
    void lookupCep(raw);
  };

  return (
    <section
      aria-labelledby="checkout-step-delivery"
      className="bg-white rounded-2xl border border-silk-200 p-6 shadow-luxury-card space-y-5"
    >
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm tabular-nums"
        >
          2
        </div>
        <div>
          <h2
            id="checkout-step-delivery"
            className="text-lg font-serif font-bold text-onyx-950"
          >
            Forma de Entrega
          </h2>
          <p className="text-xs text-onyx-600">
            Escolha entre retirar na loja física em Lages ou receber no seu endereço.
          </p>
        </div>
      </div>

      {/* Seletor de Modalidade (Radiogroup Acessível) */}
      <div
        role="radiogroup"
        aria-label="Modalidade de entrega"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {/* Opção Entrega */}
        <button
          type="button"
          role="radio"
          aria-checked={deliveryMode === "entrega"}
          onClick={() => {
            setDeliveryMode("entrega");
            onDeliveryChange?.();
          }}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
            deliveryMode === "entrega"
              ? "border-brand bg-brand-light/40 ring-2 ring-brand/10"
              : "border-silk-200 hover:border-silk-300 bg-white"
          }`}
        >
          <div
            aria-hidden="true"
            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
              deliveryMode === "entrega"
                ? "border-brand bg-brand text-white"
                : "border-silk-300 bg-white"
            }`}
          >
            {deliveryMode === "entrega" && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-onyx-900 flex items-center">
                <Truck aria-hidden="true" className="w-4 h-4 mr-1.5 text-brand" />
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
          role="radio"
          aria-checked={deliveryMode === "retirada"}
          onClick={() => {
            setDeliveryMode("retirada");
            onDeliveryChange?.();
          }}
          className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
            deliveryMode === "retirada"
              ? "border-brand bg-brand-light/40 ring-2 ring-brand/10"
              : "border-silk-200 hover:border-silk-300 bg-white"
          }`}
        >
          <div
            aria-hidden="true"
            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 ${
              deliveryMode === "retirada"
                ? "border-brand bg-brand text-white"
                : "border-silk-300 bg-white"
            }`}
          >
            {deliveryMode === "retirada" && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-onyx-900 flex items-center">
                <Store aria-hidden="true" className="w-4 h-4 mr-1.5 text-brand" />
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
            <MapPin
              aria-hidden="true"
              className="w-4 h-4 mr-1.5 text-brand flex-shrink-0"
            />
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
        /* Formulário de Entrega — Sempre editável mesmo se o ViaCEP falhar/demorar > 4s */
        <div className="space-y-4 pt-1">
          {/* CEP */}
          <div>
            <label
              htmlFor="checkout-cep"
              className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
            >
              CEP de Entrega <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <input
                id="checkout-cep"
                name="cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.cep)}
                aria-describedby={errors.cep ? "checkout-cep-error" : undefined}
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="88505-300"
                maxLength={9}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  errors.cep
                    ? "border-red-400 bg-red-50/20 focus-visible:border-red-500"
                    : "border-silk-200 hover:border-silk-300 focus-visible:border-brand"
                }`}
              />
              {cepLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-xs text-brand space-x-1.5"
                >
                  <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                  <span>Buscando endereço...</span>
                </div>
              )}
            </div>
            {errors.cep && (
              <p
                id="checkout-cep-error"
                role="alert"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {errors.cep}
              </p>
            )}
            {cepFeedback && (
              <div
                role={cepFeedback.type === "warn" ? "alert" : "status"}
                aria-live="polite"
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
                  cepFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {cepFeedback.type === "success" ? (
                  <Check
                    aria-hidden="true"
                    className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <AlertCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
                  />
                )}
                <span>{cepFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Endereço Completo (Nunca desabilitado mesmo durante consulta ViaCEP) */}
          <div>
            <label
              htmlFor="checkout-address"
              className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
            >
              Endereço Completo (Rua, Número, Bairro e Complemento){" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-address"
              name="address"
              type="text"
              autoComplete="street-address"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.address)}
              aria-describedby={
                errors.address ? "checkout-address-error" : undefined
              }
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Rua Blumenau, 623, Bairro São Cristóvão - Apto 102"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                errors.address
                  ? "border-red-400 bg-red-50/20 focus-visible:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus-visible:border-brand"
              }`}
            />
            {errors.address && (
              <p
                id="checkout-address-error"
                role="alert"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {errors.address}
              </p>
            )}
          </div>

          {/* Cidade e Estado */}
          <div>
            <label
              htmlFor="checkout-city"
              className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
            >
              Cidade / Estado{" "}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-city"
              name="city"
              type="text"
              autoComplete="address-level2"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? "checkout-city-error" : undefined}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lages - SC"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                errors.city
                  ? "border-red-400 bg-red-50/20 focus-visible:border-red-500"
                  : "border-silk-200 hover:border-silk-300 focus-visible:border-brand"
              }`}
            />
            {errors.city && (
              <p
                id="checkout-city-error"
                role="alert"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {errors.city}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Observações / Ponto de Referência */}
      <div className="pt-2">
        <label
          htmlFor="checkout-notes"
          className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
        >
          Observações para Entrega / Retirada{" "}
          <span className="text-onyx-400 font-normal">(Opcional)</span>
        </label>
        <textarea
          id="checkout-notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Deixar com a portaria, tocar interfone 102, ou horário de preferência."
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-silk-200 hover:border-silk-300 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand text-sm transition-all resize-none"
        />
      </div>
    </section>
  );
}
