"use client";

import React, { useCallback } from "react";
import { STORE_CONFIG } from "@/config/store";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { formatBrl, OrderPricingSummary } from "@/lib/pricing";
import { getShippingZone, normalizeCep } from "@/lib/shipping";
import Button from "@/components/ui/Button";
import {
  MapPin,
  Truck,
  Store,
  Loader2,
  AlertCircle,
  Check,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useCheckoutContext } from "../CheckoutContext";
import { useCepLookup } from "../hooks/useCepLookup";

interface CheckoutDeliveryProps {
  deliveryMode?: "entrega" | "retirada";
  setDeliveryMode?: (mode: "entrega" | "retirada") => void;
  cep?: string;
  setCep?: (v: string) => void;
  address?: string;
  setAddress?: (v: string) => void;
  addressNumber?: string;
  setAddressNumber?: (v: string) => void;
  addressComplement?: string;
  setAddressComplement?: (v: string) => void;
  city?: string;
  setCity?: (v: string) => void;
  notes?: string;
  setNotes?: (v: string) => void;
  errors?: Record<string, string>;
  onDeliveryChange?: () => void;
  onBlurField?: (field: "cep" | "address" | "city") => void;
  quote?: OrderPricingSummary | null;
  loadingQuote?: boolean;
  debouncingCep?: boolean;
  quoteError?: string | null;
  onRetryQuote?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export function CheckoutDelivery(props: CheckoutDeliveryProps) {
  const ctx = useCheckoutContext();

  const deliveryMode =
    props.deliveryMode ?? ctx?.state.deliveryMode ?? "entrega";
  const setDeliveryMode =
    props.setDeliveryMode ?? ctx?.actions.setDeliveryMode ?? (() => {});
  const cep = props.cep ?? ctx?.state.cep ?? "";
  const setCep = props.setCep ?? ctx?.actions.setCep ?? (() => {});
  const address = props.address ?? ctx?.state.address ?? "";
  const setAddress = props.setAddress ?? ctx?.actions.setAddress ?? (() => {});
  const addressNumber = props.addressNumber ?? ctx?.state.addressNumber ?? "";
  const setAddressNumber =
    props.setAddressNumber ?? ctx?.actions.setAddressNumber ?? (() => {});
  const addressComplement =
    props.addressComplement ?? ctx?.state.addressComplement ?? "";
  const setAddressComplement =
    props.setAddressComplement ??
    ctx?.actions.setAddressComplement ??
    (() => {});
  const city = props.city ?? ctx?.state.city ?? "Lages - SC";
  const setCity = props.setCity ?? ctx?.actions.setCity ?? (() => {});
  const notes = props.notes ?? ctx?.state.notes ?? "";
  const setNotes = props.setNotes ?? ctx?.actions.setNotes ?? (() => {});
  const errors = props.errors ?? ctx?.state.errors ?? {};
  const onDeliveryChange = props.onDeliveryChange;
  const quote = props.quote ?? ctx?.meta.quote ?? null;
  const loadingQuote = props.loadingQuote ?? ctx?.meta.loadingQuote ?? false;
  const debouncingCep = props.debouncingCep ?? false;

  const handleAddressResolved = useCallback(
    (resolved: { address: string; city: string }) => {
      if (resolved.address) setAddress(resolved.address);
      if (resolved.city) setCity(resolved.city);
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

  const subtotalCents = quote?.subtotalCents ?? 0;
  const thresholdCents = COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS;
  const freeProgress = Math.min(
    100,
    thresholdCents > 0 ? Math.round((subtotalCents / thresholdCents) * 100) : 0
  );
  const remainingCents = Math.max(0, thresholdCents - subtotalCents);

  const normalizedCep = normalizeCep(cep);
  const shippingZone = normalizedCep ? getShippingZone(normalizedCep) : null;
  const isCalculatingShipping = Boolean(
    normalizedCep && (loadingQuote || debouncingCep)
  );
  const isInvalidShippingCep = Boolean(
    (normalizedCep && !shippingZone) || errors.cep
  );

  const isContinueDisabled =
    deliveryMode === "entrega" &&
    (loadingQuote ||
      debouncingCep ||
      !normalizedCep ||
      !shippingZone ||
      quote?.shippingCents === null ||
      quote?.shippingCents === undefined);

  return (
    <section
      aria-labelledby="checkout-step-delivery"
      className="bg-white rounded-2xl border border-silk-200 p-5 sm:p-6 shadow-luxury-card space-y-5 motion-safe:transition-opacity motion-reduce:transition-none"
    >
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-brand-light text-marina-700 flex items-center justify-center font-bold text-sm tabular-nums shrink-0"
        >
          3
        </div>
        <div>
          <h2
            id="checkout-step-delivery"
            ref={props.headingRef}
            tabIndex={-1}
            className="text-lg font-serif font-bold text-onyx-950 focus:outline-none"
          >
            Forma de Entrega
          </h2>
          <p className="text-xs text-onyx-600">
            Escolha entre retirar na loja física em Lages ou receber no seu endereço.
          </p>
        </div>
      </div>

      {/* Barra de progresso de Frete Grátis acima de R$ 199 */}
      {quote && (
        <div className="rounded-xl border border-marina-200/80 bg-marina-50/50 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 tabular-nums">
            <span className="font-semibold text-onyx-900">
              {deliveryMode === "retirada"
                ? "Retirada na loja: frete grátis garantido"
                : remainingCents === 0
                ? "Frete grátis liberado para todo o Brasil!"
                : `Faltam ${formatBrl(remainingCents)} para ganhar frete grátis (acima de R$ 199)`}
            </span>
            <span className="font-bold text-marina-800 shrink-0">
              {loadingQuote || debouncingCep
                ? "Calculando..."
                : quote.shippingCents === null
                ? "Calcular pelo CEP"
                : quote.shippingCents === 0
                ? "Grátis"
                : formatBrl(quote.shippingCents)}
            </span>
          </div>
          {deliveryMode === "entrega" && (
            <div className="h-2 w-full rounded-full bg-silk-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 motion-reduce:transition-none ${
                  remainingCents === 0 ? "bg-emerald-whatsapp" : "bg-marina-600"
                }`}
                style={{ width: `${freeProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {props.quoteError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-silk-50 border border-brand-accent/40 text-xs text-onyx-900 flex items-center justify-between gap-3"
        >
          <span>{props.quoteError}</span>
          {props.onRetryQuote && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={props.onRetryQuote}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tentar novamente</span>
            </Button>
          )}
        </div>
      )}

      {/* Seletor de Modalidade (Radiogroup Acessível) */}
      <div
        role="radiogroup"
        aria-label="Modalidade de entrega"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <button
          type="button"
          role="radio"
          aria-checked={deliveryMode === "entrega"}
          onClick={() => {
            setDeliveryMode("entrega");
            onDeliveryChange?.();
          }}
          className={`p-4 min-h-[44px] rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 ${
            deliveryMode === "entrega"
              ? "border-marina-600 bg-brand-light/40 ring-2 ring-marina-600/15"
              : "border-silk-200 hover:border-silk-300 bg-white"
          }`}
        >
          <div
            aria-hidden="true"
            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
              deliveryMode === "entrega"
                ? "border-marina-700 bg-marina-700 text-white"
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
                <Truck aria-hidden="true" className="w-4 h-4 mr-1.5 text-marina-700" />
                Entrega em Domicílio
              </span>
            </div>
            <p className="text-xs text-onyx-600 mt-0.5">
              Envio para Lages e todo o Brasil.
            </p>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={deliveryMode === "retirada"}
          onClick={() => {
            setDeliveryMode("retirada");
            onDeliveryChange?.();
          }}
          className={`p-4 min-h-[44px] rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 ${
            deliveryMode === "retirada"
              ? "border-marina-600 bg-brand-light/40 ring-2 ring-marina-600/15"
              : "border-silk-200 hover:border-silk-300 bg-white"
          }`}
        >
          <div
            aria-hidden="true"
            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
              deliveryMode === "retirada"
                ? "border-marina-700 bg-marina-700 text-white"
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
                <Store aria-hidden="true" className="w-4 h-4 mr-1.5 text-marina-700" />
                Retirada na Loja Física
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-marina-50 text-emerald-whatsapp">
                Grátis
              </span>
            </div>
            <p className="text-xs text-onyx-600 mt-0.5">
              Rua Blumenau, 623 — Lages / SC
            </p>
          </div>
        </button>
      </div>

      {/* Detalhes de Retirada ou Formulário de Entrega */}
      {deliveryMode === "retirada" ? (
        <div className="p-4 rounded-xl bg-silk-50 border border-silk-200 space-y-2 text-xs text-onyx-700">
          <div className="flex items-center font-semibold text-onyx-900">
            <MapPin
              aria-hidden="true"
              className="w-4 h-4 mr-1.5 text-marina-700 flex-shrink-0"
            />
            Endereço e Horários para Retirada:
          </div>
          <p className="pl-5 text-onyx-900 font-medium">
            {STORE_CONFIG.physicalStore.formattedAddress}
          </p>
          <p className="pl-5 text-onyx-600">
            {STORE_CONFIG.physicalStore.pickupInstructions}
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* CEP */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="checkout-cep"
                className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider"
              >
                CEP de Entrega{" "}
                <span className="text-brand-accent" aria-hidden="true">
                  *
                </span>
              </label>
              <a
                href="https://buscacepinter.correios.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-marina-700 hover:text-marina-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded"
              >
                Não sei meu CEP
              </a>
            </div>
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
                onBlur={() => props.onBlurField?.("cep")}
                placeholder="88505-300"
                maxLength={9}
                className={`w-full px-4 py-2.5 min-h-[44px] rounded-xl border text-sm tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 ${
                  errors.cep
                    ? "border-brand-accent bg-silk-50 focus-visible:border-brand-accent"
                    : "border-silk-200 hover:border-silk-300 focus-visible:border-marina-600"
                }`}
              />
              {cepLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-xs text-marina-700 space-x-1.5"
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
                className="mt-1 text-xs text-brand-accent font-medium"
              >
                {errors.cep}
              </p>
            )}

            {/* Cartão de Frete por CEP */}
            <div aria-live="polite" className="mt-2">
              {isCalculatingShipping ? (
                <div
                  aria-busy="true"
                  className="h-14 w-full rounded-xl bg-silk-100 border border-silk-200 px-4 flex items-center animate-pulse"
                >
                  <div className="h-4 w-2/3 rounded bg-silk-200" />
                </div>
              ) : isInvalidShippingCep ? (
                <div className="min-h-[56px] rounded-xl bg-silk-50 border border-silk-200 px-4 py-3 flex items-center gap-2.5 text-xs text-onyx-700">
                  <AlertCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-brand-accent shrink-0"
                  />
                  <span>CEP não encontrado. Confira os números.</span>
                </div>
              ) : quote &&
                quote.shippingCents !== null &&
                (normalizedCep || quote.shippingCents === 0) ? (
                <div className="min-h-[56px] rounded-xl bg-marina-50/60 border border-marina-200 px-4 py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Truck
                      aria-hidden="true"
                      className="w-4 h-4 text-marina-700 shrink-0"
                    />
                    <div className="min-w-0">
                      {quote.shippingZoneLabel && (
                        <p className="font-semibold text-onyx-900 truncate">
                          {quote.shippingZoneLabel}
                        </p>
                      )}
                      <p className="text-onyx-700 tabular-nums">
                        {quote.shippingCents === 0 ? (
                          <>
                            <span className="font-bold text-emerald-whatsapp">
                              Grátis
                            </span>
                            {quote.shippingEtaDays
                              ? ` · chega em ${quote.shippingEtaDays.min} a ${quote.shippingEtaDays.max} dias úteis`
                              : ""}
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-onyx-900">
                              {formatBrl(quote.shippingCents)}
                            </span>
                            {quote.shippingEtaDays
                              ? ` · chega em ${quote.shippingEtaDays.min} a ${quote.shippingEtaDays.max} dias úteis`
                              : ""}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {cepFeedback && (
              <div
                role={cepFeedback.type === "warn" ? "alert" : "status"}
                aria-live="polite"
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
                  cepFeedback.type === "success"
                    ? "bg-marina-50 text-onyx-900 border border-marina-200"
                    : "bg-silk-100 text-onyx-800 border border-silk-300"
                }`}
              >
                {cepFeedback.type === "success" ? (
                  <Check
                    aria-hidden="true"
                    className="w-4 h-4 text-emerald-whatsapp flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <AlertCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5"
                  />
                )}
                <span>{cepFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Endereço (Rua e Bairro) — Nunca desabilitado durante busca ViaCEP */}
          <div>
            <label
              htmlFor="checkout-address"
              className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
            >
              Endereço (Rua e Bairro){" "}
              <span className="text-brand-accent" aria-hidden="true">
                *
              </span>
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
              onBlur={() => props.onBlurField?.("address")}
              placeholder="Ex: Rua Blumenau, Bairro São Cristóvão"
              className={`w-full px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 ${
                errors.address
                  ? "border-brand-accent bg-silk-50 focus-visible:border-brand-accent"
                  : "border-silk-200 hover:border-silk-300 focus-visible:border-marina-600"
              }`}
            />
            {errors.address && (
              <p
                id="checkout-address-error"
                role="alert"
                className="mt-1 text-xs text-brand-accent font-medium"
              >
                {errors.address}
              </p>
            )}
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="checkout-address-number"
                className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
              >
                Número
              </label>
              <input
                id="checkout-address-number"
                name="addressNumber"
                type="text"
                inputMode="text"
                autoComplete="address-line2"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                placeholder="Ex: 623 ou S/N"
                className="w-full px-4 py-2.5 min-h-[44px] rounded-xl border border-silk-200 hover:border-silk-300 focus-visible:border-marina-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 text-sm transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="checkout-address-complement"
                className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
              >
                Complemento{" "}
                <span className="text-onyx-600 font-normal">(Opcional)</span>
              </label>
              <input
                id="checkout-address-complement"
                name="addressComplement"
                type="text"
                value={addressComplement}
                onChange={(e) => setAddressComplement(e.target.value)}
                placeholder="Ex: Apto 102, Casa, Sala"
                className="w-full px-4 py-2.5 min-h-[44px] rounded-xl border border-silk-200 hover:border-silk-300 focus-visible:border-marina-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 text-sm transition-all"
              />
            </div>
          </div>

          {/* Cidade e Estado */}
          <div>
            <label
              htmlFor="checkout-city"
              className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
            >
              Cidade / Estado{" "}
              <span className="text-brand-accent" aria-hidden="true">
                *
              </span>
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
              onBlur={() => props.onBlurField?.("city")}
              placeholder="Lages - SC"
              className={`w-full px-4 py-2.5 min-h-[44px] rounded-xl border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 ${
                errors.city
                  ? "border-brand-accent bg-silk-50 focus-visible:border-brand-accent"
                  : "border-silk-200 hover:border-silk-300 focus-visible:border-marina-600"
              }`}
            />
            {errors.city && (
              <p
                id="checkout-city-error"
                role="alert"
                className="mt-1 text-xs text-brand-accent font-medium"
              >
                {errors.city}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Observações / Ponto de Referência */}
      <div className="pt-1">
        <label
          htmlFor="checkout-notes"
          className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-1.5"
        >
          Observações para Entrega / Retirada{" "}
          <span className="text-onyx-600 font-normal">(Opcional)</span>
        </label>
        <textarea
          id="checkout-notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Deixar com a portaria, tocar interfone 102, ou horário de preferência."
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-silk-200 hover:border-silk-300 focus-visible:border-marina-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 text-sm transition-all resize-none"
        />
      </div>

      {(props.onBack || props.onNext) && (
        <div className="hidden lg:flex items-center justify-between pt-2 border-t border-silk-100">
          {props.onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={props.onBack}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Voltar</span>
            </Button>
          ) : (
            <span />
          )}
          {props.onNext && (
            <Button
              type="button"
              variant="primary"
              size="lg"
              disabled={isContinueDisabled}
              onClick={props.onNext}
            >
              <span>Continuar para pagamento</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
