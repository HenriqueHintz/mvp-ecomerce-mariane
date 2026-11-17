"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Pencil,
  User,
  Truck,
  CreditCard,
  ShieldCheck,
  Loader2,
  Lock,
} from "lucide-react";
import { formatBrl, OrderPricingSummary } from "@/lib/pricing";
import { STORE_CONFIG } from "@/config/store";
import Button from "@/components/ui/Button";
import {
  composeFullDeliveryAddress,
  type CheckoutStepId,
} from "../checkout-machine";

interface CheckoutReviewProps {
  name: string;
  phone: string;
  email: string;
  deliveryMode: "entrega" | "retirada";
  cep: string;
  address: string;
  addressNumber?: string;
  addressComplement?: string;
  city: string;
  notes: string;
  paymentMethod: "whatsapp" | "pix" | "cartao";
  acceptedTerms: boolean;
  onToggleTerms: (checked: boolean) => void;
  termsError?: string | null;
  quote: OrderPricingSummary | null;
  cartItems: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  submitting: boolean;
  onEditStep: (step: CheckoutStepId) => void;
  onConfirmOrder: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

const PAYMENT_LABELS: Record<"whatsapp" | "pix" | "cartao", string> = {
  whatsapp: "Atendimento e Pagamento via WhatsApp",
  pix: "PIX Instantâneo (5% OFF)",
  cartao: "Cartão de Crédito (até 10x sem juros)",
};

export function CheckoutReview({
  name,
  phone,
  email,
  deliveryMode,
  cep,
  address,
  addressNumber,
  addressComplement,
  city,
  notes,
  paymentMethod,
  acceptedTerms,
  onToggleTerms,
  termsError,
  quote,
  cartItems,
  submitting,
  onEditStep,
  onConfirmOrder,
  headingRef,
}: CheckoutReviewProps) {
  const fullAddress = composeFullDeliveryAddress(
    address,
    addressNumber,
    addressComplement
  );

  return (
    <section
      aria-labelledby="checkout-step-review"
      className="bg-white rounded-2xl border border-silk-200 p-5 sm:p-6 shadow-luxury-card space-y-5 motion-safe:transition-opacity motion-reduce:transition-none"
    >
      <div className="flex items-center space-x-3 pb-3 border-b border-silk-100">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-brand-light text-marina-700 flex items-center justify-center font-bold text-sm tabular-nums shrink-0"
        >
          5
        </div>
        <div>
          <h2
            id="checkout-step-review"
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-serif font-bold text-onyx-950 focus:outline-none"
          >
            Revisão e Confirmação
          </h2>
          <p className="text-xs text-onyx-600">
            Confira cada etapa antes de registrar seu pedido.
          </p>
        </div>
      </div>

      {/* Blocos revisáveis com link Editar */}
      <div className="space-y-3">
        {/* 1. Identificação */}
        <div className="rounded-xl border border-silk-200 p-4 flex items-start justify-between gap-3 bg-silk-50/40">
          <div className="space-y-1 text-xs sm:text-sm min-w-0">
            <p className="font-semibold text-onyx-950 flex items-center gap-1.5">
              <User className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
              <span>Identificação</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                E-mail confirmado
              </span>
            </p>
            <p className="text-onyx-800 font-medium">{name}</p>
            <p className="text-onyx-600 tabular-nums">{phone}</p>
            <p className="text-onyx-600 truncate">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => onEditStep("identificacao")}
            aria-label="Editar identificação"
            className="min-h-[44px] px-2.5 text-xs font-semibold text-marina-700 hover:text-marina-900 inline-flex items-center gap-1 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Editar</span>
          </button>
        </div>

        {/* 2. Entrega */}
        <div className="rounded-xl border border-silk-200 p-4 flex items-start justify-between gap-3 bg-silk-50/40">
          <div className="space-y-1 text-xs sm:text-sm min-w-0">
            <p className="font-semibold text-onyx-950 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
              <span>
                {deliveryMode === "retirada"
                  ? "Retirada na Loja Física"
                  : "Entrega em Domicílio"}
              </span>
            </p>
            {deliveryMode === "retirada" ? (
              <p className="text-onyx-700">
                {STORE_CONFIG.physicalStore.formattedAddress}
              </p>
            ) : (
              <>
                <p className="text-onyx-800 font-medium">{fullAddress}</p>
                <p className="text-onyx-600 tabular-nums">
                  {city} · CEP {cep}
                </p>
              </>
            )}
            {notes.trim() && (
              <p className="text-onyx-600 italic">Obs.: {notes.trim()}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onEditStep("entrega")}
            aria-label="Editar entrega"
            className="min-h-[44px] px-2.5 text-xs font-semibold text-marina-700 hover:text-marina-900 inline-flex items-center gap-1 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Editar</span>
          </button>
        </div>

        {/* 3. Pagamento */}
        <div className="rounded-xl border border-silk-200 p-4 flex items-start justify-between gap-3 bg-silk-50/40">
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-semibold text-onyx-950 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
              <span>Pagamento</span>
            </p>
            <p className="text-onyx-800 font-medium">
              {PAYMENT_LABELS[paymentMethod]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEditStep("pagamento")}
            aria-label="Editar pagamento"
            className="min-h-[44px] px-2.5 text-xs font-semibold text-marina-700 hover:text-marina-900 inline-flex items-center gap-1 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Itens & Totais no bloco de revisão (complementa o resumo lateral) */}
      <div className="rounded-xl border border-silk-200 p-4 space-y-2.5 text-xs tabular-nums">
        <p className="font-semibold text-onyx-950 text-sm font-serif">
          Itens e Valores
        </p>
        <ul className="divide-y divide-silk-100">
          {cartItems.map((item) => (
            <li
              key={item.id}
              className="py-1.5 flex items-center justify-between gap-2 text-onyx-800"
            >
              <span className="truncate">
                {item.quantity}x {item.name}
              </span>
            </li>
          ))}
        </ul>
        {quote && (
          <div className="border-t border-silk-100 pt-2.5 space-y-1.5">
            <div className="flex justify-between text-onyx-700">
              <span>Subtotal</span>
              <span>{formatBrl(quote.subtotalCents)}</span>
            </div>
            {quote.discountCents > 0 && (
              <div className="flex justify-between text-emerald-800 font-semibold">
                <span>Desconto PIX (5% OFF)</span>
                <span>- {formatBrl(quote.discountCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-onyx-700">
              <span>Frete</span>
              <span className="font-semibold">
                {quote.shippingCents === 0
                  ? deliveryMode === "retirada"
                    ? "Grátis (Retirada)"
                    : "Grátis"
                  : formatBrl(quote.shippingCents)}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-silk-100 text-sm font-bold text-onyx-950">
              <span>Total</span>
              <span className="text-lg text-marina-700">
                {formatBrl(quote.totalCents)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Aceite dos termos e política */}
      <div className="space-y-1.5">
        <label
          htmlFor="checkout-accept-terms"
          className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl border border-silk-200 bg-white hover:border-marina-300"
        >
          <input
            id="checkout-accept-terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => onToggleTerms(e.target.checked)}
            aria-invalid={Boolean(termsError)}
            aria-describedby={termsError ? "checkout-terms-error" : undefined}
            className="mt-0.5 h-4 w-4 rounded border-silk-300 text-marina-700 focus-visible:ring-2 focus-visible:ring-marina-600 accent-brand"
          />
          <span className="text-xs text-onyx-800 leading-relaxed">
            Li e concordo com a{" "}
            <Link
              href="/politica-de-privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-marina-700 font-semibold underline"
            >
              Política de Privacidade
            </Link>{" "}
            e com as regras de{" "}
            <Link
              href="/trocas-e-devolucoes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-marina-700 font-semibold underline"
            >
              Trocas e Devoluções
            </Link>
            .
          </span>
        </label>
        {termsError && (
          <p
            id="checkout-terms-error"
            role="alert"
            className="text-xs text-red-700 font-medium"
          >
            {termsError}
          </p>
        )}
      </div>

      {/* CTA Desktop na etapa de Revisão */}
      <div className="hidden lg:flex items-center justify-between pt-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-onyx-600">
          <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          Preços e estoque revalidados no servidor
        </span>
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={submitting || !acceptedTerms}
          onClick={onConfirmOrder}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Processando Pedido...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Confirmar pedido</span>
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
