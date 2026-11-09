"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { OrderPricingSummary } from "@/lib/pricing";
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
  const [quote, setQuote] = useState<OrderPricingSummary | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
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
        setIdempotencyKey(`idem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
      }
    }
  }, [idempotencyKey]);

  // Recalcular Cotação Oficial via Servidor (POST /api/checkout/cotacao)
  const fetchQuote = useCallback(async () => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }

    setLoadingQuote(true);
    setGlobalError(null);

    try {
      const res = await fetch("/api/checkout/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMode,
          paymentMethod,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.quote) {
        setQuote(data.quote);
      } else {
        setGlobalError(data.detail || "Não foi possível calcular a cotação no momento.");
      }
    } catch {
      setGlobalError("Erro de comunicação ao calcular frete e descontos.");
    } finally {
      setLoadingQuote(false);
    }
  }, [items, deliveryMode, paymentMethod]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

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
      errors.customerPhone = "Informe um WhatsApp/telefone válido com DDD (10 ou 11 dígitos).";
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
      setGlobalError("Por favor, preencha todos os campos obrigatórios destacados.");
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

      // Se for atendimento WhatsApp, abrir janela do WhatsApp e redirecionar para a página do pedido
      if (paymentMethod === "whatsapp" && whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      // Redirecionar para a página segura de acompanhamento
      router.push(`/pedido/${publicToken}`);
    } catch {
      setGlobalError("Falha de conexão ao enviar o pedido. Por favor, tente novamente.");
      setSubmitting(false);
    }
  };

  // Sacola Vazia
  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-luxury-offwhite">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-silk-200 text-center shadow-luxury-card space-y-5 animate-fadeIn">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-light flex items-center justify-center text-brand">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-onyx-950">
              Sua sacola de compras está vazia
            </h1>
            <p className="text-sm text-onyx-600 mt-2">
              Explore nosso catálogo e adicione os melhores cosméticos e produtos profissionais para seu cabelo.
            </p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm tracking-wide shadow-luxury transition-all"
          >
            Explorar Vitrine de Produtos
          </Link>
        </div>
      </main>
    );
  }

  return (
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
              className="inline-flex items-center text-xs font-semibold text-onyx-600 hover:text-brand transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
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
        {globalError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Atenção:</p>
              <p>{globalError}</p>
            </div>
          </div>
        )}

        {/* Acordeão Mobile do Resumo */}
        <div className="lg:hidden bg-white rounded-2xl border border-silk-200 p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full flex items-center justify-between text-left font-semibold text-sm text-onyx-900"
          >
            <span className="flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2 text-brand" />
              Ver Resumo do Pedido ({items.reduce((acc, i) => acc + i.quantity, 0)} itens)
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-brand font-bold">
                {quote ? (quote.totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "..."}
              </span>
              {mobileSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
            <CheckoutContact
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              marketingConsent={marketingConsent}
              setMarketingConsent={setMarketingConsent}
              errors={formErrors}
            />

            <CheckoutDelivery
              deliveryMode={deliveryMode}
              setDeliveryMode={setDeliveryMode}
              cep={cep}
              setCep={setCep}
              address={address}
              setAddress={setAddress}
              city={city}
              setCity={setCity}
              notes={notes}
              setNotes={setNotes}
              errors={formErrors}
              onDeliveryChange={fetchQuote}
            />

            <CheckoutPayment
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onPaymentChange={fetchQuote}
            />
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
  );
}
