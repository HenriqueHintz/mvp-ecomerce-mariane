"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatBrl } from "@/lib/pricing";
import { validateAsaasCheckoutUrl, validateReturnUrl } from "@/lib/payment-urls";
import { CheckoutContext, CheckoutContextValue } from "./CheckoutContext";
import { useCheckoutQuote } from "./hooks/useCheckoutQuote";
import { CheckoutContact } from "./components/CheckoutContact";
import { CheckoutDelivery } from "./components/CheckoutDelivery";
import { CheckoutPayment } from "./components/CheckoutPayment";
import { CheckoutSummary } from "./components/CheckoutSummary";
import { CheckoutTrustSignals } from "./components/CheckoutTrustSignals";
import {
  ArrowLeft,
  ShoppingBag,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false); // LGPD: desmarcado por default

  const [deliveryMode, setDeliveryMode] = useState<"entrega" | "retirada">("entrega");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Lages - SC");
  const [notes, setNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"whatsapp" | "pix" | "cartao">("whatsapp");
  const [honeypot, setHoneypot] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  // Status & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Inicializar Chave de Idempotência Única por Sessão de Checkout
  useEffect(() => {
    if (!idempotencyKey) {
      if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        setIdempotencyKey(window.crypto.randomUUID());
      } else {
        setIdempotencyKey(
          `idem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        );
      }
    }
  }, [idempotencyKey]);

  // Cotação Autoritativa via Servidor (useCheckoutQuote com AbortController)
  const { quote, loadingQuote, quoteError, refreshQuote } = useCheckoutQuote({
    items,
    deliveryMode,
    paymentMethod,
  });

  // Submissão do Pedido
  const handleFinishOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFormErrors({});

    // Validações básicas de UI
    const errors: Record<string, string> = {};
    if (name.trim().length < 3) {
      errors.customerName = "Informe seu nome completo (mínimo 3 letras).";
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      errors.customerPhone =
        "Informe um WhatsApp/telefone válido com DDD (10 ou 11 dígitos).";
    }

    if (deliveryMode === "entrega") {
      const cleanCep = cep.replace(/\D/g, "");
      if (cleanCep.length !== 8) {
        errors.cep = "Informe um CEP válido de 8 dígitos.";
      }
      if (address.trim().length < 4) {
        errors.address = "Informe o endereço completo (rua, número e bairro).";
      }
      if (city.trim().length < 2) {
        errors.city = "Informe a cidade e estado.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setGlobalError(
        "Por favor, preencha todos os campos obrigatórios destacados."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          deliveryMode,
          cep: deliveryMode === "entrega" ? cep : undefined,
          address: deliveryMode === "entrega" ? address : undefined,
          city: deliveryMode === "entrega" ? city : undefined,
          paymentMethod,
          notes: notes || undefined,
          marketingConsent,
          idempotencyKey,
          honeypot,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const msg =
          data.detail ||
          (Array.isArray(data.errors) ? data.errors.join(" ") : null) ||
          "Não foi possível registrar seu pedido. Verifique os dados.";
        setGlobalError(msg);
        setSubmitting(false);
        return;
      }

      const order = data.order;
      const publicToken = order.publicToken;
      const whatsappUrl = order.whatsappUrl;

      // Limpar o carrinho APENAS após confirmação 201/200 da API com publicToken
      clearCart();

      const safeTrackingPath = `/pedido/${publicToken}`;
      const validatedReturn = validateReturnUrl(safeTrackingPath);

      // Se for Cartão (quando ativo), criar cobrança hospedada no Asaas com returnUrl validada (sem open redirect)
      if (paymentMethod === "cartao" && validatedReturn) {
        try {
          const payRes = await fetch("/api/pagamentos/criar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              paymentMethod: "card",
              returnUrl: safeTrackingPath,
            }),
          });
          const payData = await payRes.json();
          const safeHostedCheckout =
            payRes.ok && payData.checkoutUrl
              ? validateAsaasCheckoutUrl(payData.checkoutUrl)
              : null;
          if (safeHostedCheckout) {
            window.location.assign(safeHostedCheckout);
            return;
          }
        } catch {
          // Fallback seguro para /pedido/[token] onde o botão do checkout hospedado também está disponível
        }
      }

      // Se for atendimento WhatsApp, abrir janela do WhatsApp e redirecionar para a página do pedido
      if (paymentMethod === "whatsapp" && whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      // Redirecionar para a página segura de acompanhamento
      router.push(safeTrackingPath);
    } catch {
      setGlobalError(
        "Falha de conexão ao enviar o pedido. Por favor, tente novamente."
      );
      setSubmitting(false);
    }
  };

  const contextValue = useMemo<CheckoutContextValue>(
    () => ({
      state: {
        name,
        phone,
        email,
        marketingConsent,
        deliveryMode,
        cep,
        address,
        city,
        notes,
        paymentMethod,
        errors: formErrors,
      },
      actions: {
        setName,
        setPhone,
        setEmail,
        setMarketingConsent,
        setDeliveryMode,
        setCep,
        setAddress,
        setCity,
        setNotes,
        setPaymentMethod,
        refreshQuote,
        submitOrder: handleFinishOrder,
      },
      meta: {
        quote,
        loadingQuote,
        submitting,
        idempotencyKey,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      name,
      phone,
      email,
      marketingConsent,
      deliveryMode,
      cep,
      address,
      city,
      notes,
      paymentMethod,
      formErrors,
      quote,
      loadingQuote,
      submitting,
      idempotencyKey,
      refreshQuote,
    ]
  );

  // Sacola Vazia
  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-luxury-offwhite">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-silk-200 text-center shadow-luxury-card space-y-5 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-light flex items-center justify-center text-brand">
            <ShoppingBag aria-hidden="true" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-onyx-950">
              Sua sacola está vazia
            </h1>
            <p className="text-sm text-onyx-600 mt-2">
              Explore nosso catálogo e adicione os melhores cosméticos e produtos profissionais para seu cabelo.
            </p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm tracking-wide shadow-luxury transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Explorar Vitrine de Produtos
          </Link>
        </div>
      </main>
    );
  }

  const activeError = globalError || quoteError;

  return (
    <CheckoutContext.Provider value={contextValue}>
      <main className="min-h-screen bg-luxury-offwhite py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        {/* Honeypot Invisível para Bots */}
        <input
          type="text"
          name="website_url"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Cabeçalho do Checkout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-silk-200 gap-4">
            <div>
              <Link
                href="/carrinho"
                className="inline-flex items-center text-xs font-semibold text-onyx-600 hover:text-brand transition-colors mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
              >
                <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1.5" />
                Voltar para a Sacola
              </Link>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-onyx-950">
                Finalização de Pedido
              </h1>
            </div>
            <div className="text-xs text-onyx-600 flex items-center space-x-2">
              <span>Ambiente Criptografado & Seguro</span>
            </div>
          </div>

          {/* Alerta de Erro Global */}
          {activeError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5 animate-fadeIn"
            >
              <AlertCircle
                aria-hidden="true"
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="font-semibold">Atenção:</p>
                <p>{activeError}</p>
              </div>
            </div>
          )}

          {/* Acordeão Mobile do Resumo */}
          <div className="lg:hidden bg-white rounded-2xl border border-silk-200 p-4 shadow-sm">
            <button
              type="button"
              aria-expanded={mobileSummaryOpen}
              onClick={() => setMobileSummaryOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left font-semibold text-sm text-onyx-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-lg"
            >
              <span className="flex items-center">
                <ShoppingBag aria-hidden="true" className="w-4 h-4 mr-2 text-brand" />
                Ver Resumo do Pedido (
                {items.reduce((acc, i) => acc + i.quantity, 0)} itens)
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-brand font-bold tabular-nums">
                  {quote ? formatBrl(quote.totalCents) : "..."}
                </span>
                {mobileSummaryOpen ? (
                  <ChevronUp aria-hidden="true" className="w-4 h-4" />
                ) : (
                  <ChevronDown aria-hidden="true" className="w-4 h-4" />
                )}
              </div>
            </button>
            {mobileSummaryOpen && (
              <div className="mt-4 pt-4 border-t border-silk-100">
                <CheckoutSummary
                  quote={quote}
                  loadingQuote={loadingQuote}
                  submitting={submitting}
                  onSubmit={handleFinishOrder}
                  deliveryMode={deliveryMode}
                  paymentMethod={paymentMethod}
                  cartItems={items}
                />
              </div>
            )}
          </div>

          {/* Layout Principal: 2 Colunas no Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Coluna Esquerda: Blocos de Formulário (7 colunas) */}
            <div className="lg:col-span-7 space-y-6">
              <CheckoutContact />
              <CheckoutDelivery />
              <CheckoutPayment />
            </div>

            {/* Coluna Direita: Resumo Fixo Lateral no Desktop (5 colunas) */}
            <div className="hidden lg:block lg:col-span-5 sticky top-8 space-y-4">
              <CheckoutSummary
                quote={quote}
                loadingQuote={loadingQuote}
                submitting={submitting}
                onSubmit={handleFinishOrder}
                deliveryMode={deliveryMode}
                paymentMethod={paymentMethod}
                cartItems={items}
              />
            </div>
          </div>

          {/* Sinais de Confiança Reais */}
          <CheckoutTrustSignals />
        </div>
      </main>
    </CheckoutContext.Provider>
  );
}
