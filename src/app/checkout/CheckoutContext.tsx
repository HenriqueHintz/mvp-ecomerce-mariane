"use client";

import React, { createContext, use } from "react";
import { OrderPricingSummary } from "@/lib/pricing";

/**
 * Interface canônica { state, actions, meta } seguindo a skill `composition-patterns`
 * (`state-context-interface` e `react19-no-forwardref` usando `use()`).
 */
export interface CheckoutState {
  name: string;
  phone: string;
  email: string;
  marketingConsent: boolean;
  deliveryMode: "entrega" | "retirada";
  cep: string;
  address: string;
  city: string;
  notes: string;
  paymentMethod: "whatsapp" | "pix" | "cartao";
  errors: Record<string, string>;
}

export interface CheckoutActions {
  setName: (v: string) => void;
  setPhone: (v: string) => void;
  setEmail: (v: string) => void;
  setMarketingConsent: (v: boolean) => void;
  setDeliveryMode: (m: "entrega" | "retirada") => void;
  setCep: (v: string) => void;
  setAddress: (v: string) => void;
  setCity: (v: string) => void;
  setNotes: (v: string) => void;
  setPaymentMethod: (m: "whatsapp" | "pix" | "cartao") => void;
  refreshQuote: () => void;
  submitOrder: (e: React.FormEvent) => void;
}

export interface CheckoutMeta {
  quote: OrderPricingSummary | null;
  loadingQuote: boolean;
  submitting: boolean;
  idempotencyKey: string;
}

export interface CheckoutContextValue {
  state: CheckoutState;
  actions: CheckoutActions;
  meta: CheckoutMeta;
}

export const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function useCheckoutContext(): CheckoutContextValue | null {
  return use(CheckoutContext);
}
