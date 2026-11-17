"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatBrl } from "@/lib/pricing";
import {
  validateAsaasCheckoutUrl,
  validateReturnUrl,
} from "@/lib/payment-urls";
import Button from "@/components/ui/Button";
import { CheckoutContext, CheckoutContextValue } from "./CheckoutContext";
import { useCheckoutQuote } from "./hooks/useCheckoutQuote";
import { CheckoutStepper } from "./components/CheckoutStepper";
import { CheckoutContact } from "./components/CheckoutContact";
import { CheckoutEmailVerify } from "./components/CheckoutEmailVerify";
import { CheckoutDelivery } from "./components/CheckoutDelivery";
import { CheckoutPayment } from "./components/CheckoutPayment";
import { CheckoutReview } from "./components/CheckoutReview";
import { CheckoutSummary } from "./components/CheckoutSummary";
import { CheckoutTrustSignals } from "./components/CheckoutTrustSignals";
import {
  CHECKOUT_STEPS,
  CHECKOUT_STORAGE_KEY,
  INITIAL_WIZARD_STATE,
  STEP_META,
  canAccessStep,
  checkoutWizardReducer,
  clearCheckoutSessionStorage,
  composeFullDeliveryAddress,
  getFirstPendingStep,
  hydrateProgressFromSessionStorage,
  resolveAccessibleStep,
  serializeProgressForSessionStorage,
  validateDelivery,
  validateIdentification,
  type CheckoutStepId,
} from "./checkout-machine";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";

function generateIdempotencyKey(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function CheckoutFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, isHydrated, clearCart } = useCart();

  const [wizard, dispatch] = useReducer(
    checkoutWizardReducer,
    INITIAL_WIZARD_STATE
  );
  const [progressRestored, setProgressRestored] = useState(false);

  // Estado transiente de envio, verificação e submissão
  const [honeypot, setHoneypot] = useState("");
  const [idempotencyKey] = useState<string>(generateIdempotencyKey);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [networkRetryAction, setNetworkRetryAction] = useState<
    (() => void) | null
  >(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // OTP state
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpNetworkFailed, setOtpNetworkFailed] = useState(false);
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState<
    number | null
  >(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  // Submissão final & aceite
  const [submitting, setSubmitting] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Monitoramento de alteração na sacola durante checkout
  const initialCartSignatureRef = useRef<string | null>(null);
  const [cartChangedBanner, setCartChangedBanner] = useState(false);

  // Foco automático no título da etapa ao mudar de etapa
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const prevStepRef = useRef<CheckoutStepId>(wizard.currentStep);
  const wizardRef = useRef(wizard);
  wizardRef.current = wizard;
  const pendingNavStepRef = useRef<CheckoutStepId | null>(null);
  const orderCompletedRef = useRef(false);
  const [stepAnnouncement, setStepAnnouncement] = useState("");

  const pushStepUrl = useCallback(
    (step: CheckoutStepId, replace = false) => {
      pendingNavStepRef.current = step;
      if (replace) {
        router.replace(`/checkout?etapa=${step}`, { scroll: false });
      } else {
        router.push(`/checkout?etapa=${step}`, { scroll: true });
      }
    },
    [router]
  );

  // 1. Restaurar progresso de sessionStorage uma única vez na montagem
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
      const restored = hydrateProgressFromSessionStorage(raw);
      if (restored) {
        dispatch({ type: "HYDRATE_PROGRESS", saved: restored });
      }
    } catch {
      // Ignora indisponibilidade de sessionStorage
    }
    setProgressRestored(true);
  }, []);

  // 2. Redirecionar para /carrinho se a sacola estiver vazia (exceto após conclusão de pedido)
  useEffect(() => {
    if (isHydrated && items.length === 0 && !orderCompletedRef.current) {
      router.replace("/carrinho");
    }
  }, [isHydrated, items.length, router]);

  // 3. Salvar progresso não-sensível em sessionStorage sempre que mudar
  useEffect(() => {
    if (!progressRestored || orderCompletedRef.current) return;
    try {
      window.sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        serializeProgressForSessionStorage(wizard)
      );
    } catch {
      // Ignora quota/privacidade
    }
  }, [wizard, progressRestored]);

  // 4. Sincronizar ?etapa= da URL (entrada direta, refresh, voltar/avançar do navegador)
  const requestedStepParam = searchParams.get("etapa");
  useEffect(() => {
    if (!progressRestored) return;

    if (
      pendingNavStepRef.current !== null &&
      requestedStepParam === pendingNavStepRef.current
    ) {
      pendingNavStepRef.current = null;
      return;
    }

    const currentWizard = wizardRef.current;

    if (!requestedStepParam) {
      if (currentWizard.currentStep !== "identificacao") {
        pendingNavStepRef.current = currentWizard.currentStep;
        router.replace(`/checkout?etapa=${currentWizard.currentStep}`, {
          scroll: false,
        });
      }
      return;
    }

    const allowed = resolveAccessibleStep(currentWizard, requestedStepParam);
    if (allowed !== requestedStepParam) {
      pendingNavStepRef.current = allowed;
      router.replace(`/checkout?etapa=${allowed}`, { scroll: false });
      if (currentWizard.currentStep !== allowed) {
        dispatch({ type: "GO_TO_STEP", step: allowed });
      }
      return;
    }

    if (currentWizard.currentStep !== allowed) {
      dispatch({ type: "GO_TO_STEP", step: allowed });
    }
  }, [progressRestored, requestedStepParam, router]);

  // 5. Detectar mudança de itens no carrinho durante o checkout
  const cartSignature = useMemo(
    () =>
      items
        .map((i) => `${i.id}:${i.quantity}`)
        .sort()
        .join("|"),
    [items]
  );

  // Cotação Autoritativa via Servidor
  const { quote, loadingQuote, quoteError, refreshQuote } = useCheckoutQuote({
    items,
    deliveryMode: wizard.deliveryMode,
    paymentMethod: wizard.paymentMethod,
  });

  useEffect(() => {
    if (!isHydrated || items.length === 0) return;
    if (initialCartSignatureRef.current === null) {
      initialCartSignatureRef.current = cartSignature;
      return;
    }
    if (initialCartSignatureRef.current !== cartSignature) {
      initialCartSignatureRef.current = cartSignature;
      dispatch({ type: "INVALIDATE_FROM_CART_CHANGE" });
      setCartChangedBanner(true);
      refreshQuote();
    }
  }, [cartSignature, isHydrated, items.length, refreshQuote]);

  // 6. Contador regressivo de 60s para reenvio do OTP
  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setResendSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendSecondsLeft]);

  // 7. Mover foco e anunciar em aria-live ao mudar de etapa
  useEffect(() => {
    if (prevStepRef.current !== wizard.currentStep) {
      prevStepRef.current = wizard.currentStep;
      const meta = STEP_META[wizard.currentStep];
      setStepAnnouncement(
        `Etapa ${meta.number} de ${CHECKOUT_STEPS.length}: ${meta.title}`
      );
      window.requestAnimationFrame(() => {
        stepHeadingRef.current?.focus();
      });
    }
  }, [wizard.currentStep]);

  const navigateToStep = useCallback(
    (step: CheckoutStepId) => {
      setGlobalError(null);
      setNetworkRetryAction(null);
      setFormErrors({});
      dispatch({ type: "GO_TO_STEP", step });
      pushStepUrl(step);
    },
    [pushStepUrl]
  );

  const handleFieldBlurIdentification = useCallback(
    (field: "name" | "phone" | "email") => {
      const errs = validateIdentification(wizard);
      const mapKey =
        field === "name"
          ? "customerName"
          : field === "phone"
          ? "customerPhone"
          : "customerEmail";
      setFormErrors((prev) => {
        const next = { ...prev };
        if (errs[mapKey]) {
          next[mapKey] = errs[mapKey];
        } else {
          delete next[mapKey];
        }
        return next;
      });
    },
    [wizard]
  );

  const handleFieldBlurDelivery = useCallback(
    (field: "cep" | "address" | "city") => {
      const errs = validateDelivery(wizard);
      setFormErrors((prev) => {
        const next = { ...prev };
        if (errs[field]) {
          next[field] = errs[field];
        } else {
          delete next[field];
        }
        return next;
      });
    },
    [wizard]
  );

  // Etapa 1 -> Enviar código OTP (ou pular para etapa 3 se o mesmo e-mail já foi verificado)
  const sendOtpRequest = useCallback(async () => {
    setGlobalError(null);
    setNetworkRetryAction(null);
    setOtpError(null);
    setOtpNetworkFailed(false);

    const errs = validateIdentification(wizard);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setGlobalError("Por favor, preencha corretamente os dados obrigatórios.");
      return;
    }

    const normalizedEmail = wizard.email.trim().toLowerCase();
    if (wizard.verifiedEmail && wizard.verifiedEmail === normalizedEmail) {
      const nextCompleted = wizard.completedSteps.includes("identificacao")
        ? wizard.completedSteps
        : (["identificacao", ...wizard.completedSteps] as CheckoutStepId[]);
      dispatch({ type: "COMPLETE_IDENTIFICATION" });
      const nextStep = getFirstPendingStep({
        ...wizard,
        completedSteps: nextCompleted,
      });
      pushStepUrl(nextStep);
      return;
    }

    setSendingCode(true);
    try {
      const res = await fetch("/api/checkout/email/enviar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        detail?: string;
        retryAfterSeconds?: number;
      };

      if (!res.ok) {
        const waitSec =
          typeof data.retryAfterSeconds === "number"
            ? data.retryAfterSeconds
            : Number(res.headers.get("retry-after") || 0);
        if (waitSec > 0) {
          setResendSecondsLeft(waitSec);
        }
        const msg =
          data.detail || "Não foi possível enviar o código de verificação.";
        if (wizard.currentStep === "verificacao") {
          setOtpError(msg);
        } else {
          setGlobalError(msg);
        }
        return;
      }

      setResendSecondsLeft(60);
      dispatch({ type: "COMPLETE_IDENTIFICATION" });
      pushStepUrl("verificacao");
    } catch {
      const errMsg = "Falha de conexão ao enviar o código de verificação.";
      if (wizard.currentStep === "verificacao") {
        setOtpError(errMsg);
        setOtpNetworkFailed(true);
      } else {
        setGlobalError(errMsg);
        setNetworkRetryAction(() => () => void sendOtpRequest());
      }
    } finally {
      setSendingCode(false);
    }
  }, [wizard, honeypot, router]);

  // Etapa 2 -> Verificar código OTP
  const handleVerifyCode = useCallback(
    async (code: string) => {
      setOtpError(null);
      setOtpNetworkFailed(false);
      setOtpAttemptsRemaining(null);
      setVerifyingCode(true);

      const normalizedEmail = wizard.email.trim().toLowerCase();
      try {
        const res = await fetch("/api/checkout/email/verificar-codigo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, code }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          detail?: string;
          attemptsRemaining?: number;
        };

        if (!res.ok || !data.success) {
          setOtpError(data.detail || "Código incorreto ou expirado.");
          setOtpAttemptsRemaining(
            typeof data.attemptsRemaining === "number"
              ? data.attemptsRemaining
              : null
          );
          return;
        }

        dispatch({
          type: "COMPLETE_VERIFICATION",
          verifiedEmail: normalizedEmail,
        });
        pushStepUrl("entrega");
      } catch {
        setOtpError("Falha de conexão ao validar o código.");
        setOtpNetworkFailed(true);
      } finally {
        setVerifyingCode(false);
      }
    },
    [wizard.email, router]
  );

  // Etapa 3 -> Avançar Entrega
  const handleContinueFromDelivery = useCallback(() => {
    setGlobalError(null);
    const errs = validateDelivery(wizard);
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setGlobalError("Preencha os campos obrigatórios de entrega para avançar.");
      return;
    }
    setFormErrors({});
    dispatch({ type: "COMPLETE_DELIVERY" });
    pushStepUrl("pagamento");
  }, [wizard, pushStepUrl]);

  // Etapa 4 -> Avançar Pagamento
  const handleContinueFromPayment = useCallback(() => {
    setGlobalError(null);
    dispatch({ type: "COMPLETE_PAYMENT" });
    pushStepUrl("revisao");
  }, [pushStepUrl]);

  // Etapa 5 -> Submissão do Pedido no Servidor
  const handleFinishOrder = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setGlobalError(null);
      setNetworkRetryAction(null);
      setTermsError(null);

      if (!wizard.acceptedTerms) {
        setTermsError(
          "Confirme que leu a Política de Privacidade e as regras de Trocas e Devoluções."
        );
        return;
      }

      const fullAddress = composeFullDeliveryAddress(
        wizard.address,
        wizard.addressNumber,
        wizard.addressComplement
      );

      setSubmitting(true);
      try {
        const response = await fetch("/api/pedidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName: wizard.name,
            customerPhone: wizard.phone,
            customerEmail: wizard.email.trim().toLowerCase(),
            deliveryMode: wizard.deliveryMode,
            cep: wizard.deliveryMode === "entrega" ? wizard.cep : undefined,
            address:
              wizard.deliveryMode === "entrega" ? fullAddress : undefined,
            city: wizard.deliveryMode === "entrega" ? wizard.city : undefined,
            paymentMethod: wizard.paymentMethod,
            notes: wizard.notes || undefined,
            marketingConsent: wizard.marketingConsent,
            idempotencyKey,
            honeypot,
            items: items.map((i) => ({
              productId: i.id,
              quantity: i.quantity,
            })),
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          detail?: string;
          errors?: string[];
          order?: {
            id: string;
            publicToken: string;
            whatsappUrl?: string;
          };
        };

        if (response.status === 403) {
          // Token expirado ou não verificado -> invalida verificação e exige novo código OTP
          const msg =
            data.detail || "Confirme seu e-mail para finalizar o pedido.";
          setOtpError(msg);
          dispatch({ type: "INVALIDATE_EMAIL_VERIFICATION" });
          pushStepUrl("identificacao", true);
          setGlobalError(msg);
          setSubmitting(false);
          return;
        }

        if (!response.ok || !data.success) {
          const msg =
            data.detail ||
            (Array.isArray(data.errors) ? data.errors.join(" ") : null) ||
            "Não foi possível registrar seu pedido. Verifique os dados.";
          setGlobalError(msg);
          setSubmitting(false);
          return;
        }

        if (!data.order) {
          setGlobalError("Resposta inesperada ao registrar pedido.");
          setSubmitting(false);
          return;
        }

        const order = data.order;
        const publicToken = order.publicToken;
        const whatsappUrl = order.whatsappUrl;

        // Marca conclusão antes de limpar sacola para evitar corrida com redirect para /carrinho
        orderCompletedRef.current = true;
        clearCheckoutSessionStorage();
        clearCart();

        const safeTrackingPath = `/pedido/${publicToken}`;
        const validatedReturn = validateReturnUrl(safeTrackingPath);

        if (wizard.paymentMethod === "cartao" && validatedReturn) {
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
            const payData = (await payRes.json().catch(() => ({}))) as {
              checkoutUrl?: string;
            };
            const safeHostedCheckout =
              payRes.ok && payData.checkoutUrl
                ? validateAsaasCheckoutUrl(payData.checkoutUrl)
                : null;
            if (safeHostedCheckout) {
              window.location.assign(safeHostedCheckout);
              return;
            }
          } catch {
            // Fallback seguro para /pedido/[token]
          }
        }

        if (wizard.paymentMethod === "whatsapp" && whatsappUrl) {
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }

        router.push(safeTrackingPath);
      } catch {
        setGlobalError(
          "Falha de conexão ao enviar o pedido. Verifique sua internet e tente novamente."
        );
        setNetworkRetryAction(() => () => void handleFinishOrder());
        setSubmitting(false);
      }
    },
    [wizard, idempotencyKey, honeypot, items, clearCart, router]
  );

  // Ações expostas pelo CheckoutContext (mantendo contrato existente)
  const setName = useCallback(
    (v: string) => dispatch({ type: "SET_FIELD", field: "name", value: v }),
    []
  );
  const setPhone = useCallback(
    (v: string) => dispatch({ type: "SET_FIELD", field: "phone", value: v }),
    []
  );
  const setEmail = useCallback(
    (v: string) => dispatch({ type: "SET_EMAIL", email: v }),
    []
  );
  const setMarketingConsent = useCallback(
    (v: boolean) => dispatch({ type: "SET_MARKETING", value: v }),
    []
  );
  const setDeliveryMode = useCallback(
    (m: "entrega" | "retirada") =>
      dispatch({ type: "SET_DELIVERY_MODE", mode: m }),
    []
  );
  const setCep = useCallback(
    (v: string) => dispatch({ type: "SET_CEP", cep: v }),
    []
  );
  const setAddress = useCallback(
    (v: string) => dispatch({ type: "SET_FIELD", field: "address", value: v }),
    []
  );
  const setAddressNumber = useCallback(
    (v: string) =>
      dispatch({ type: "SET_FIELD", field: "addressNumber", value: v }),
    []
  );
  const setAddressComplement = useCallback(
    (v: string) =>
      dispatch({ type: "SET_FIELD", field: "addressComplement", value: v }),
    []
  );
  const setCity = useCallback(
    (v: string) => dispatch({ type: "SET_FIELD", field: "city", value: v }),
    []
  );
  const setNotes = useCallback(
    (v: string) => dispatch({ type: "SET_FIELD", field: "notes", value: v }),
    []
  );
  const setPaymentMethod = useCallback(
    (m: "whatsapp" | "pix" | "cartao") =>
      dispatch({ type: "SET_PAYMENT_METHOD", method: m }),
    []
  );

  const contextValue = useMemo<CheckoutContextValue>(
    () => ({
      state: {
        name: wizard.name,
        phone: wizard.phone,
        email: wizard.email,
        marketingConsent: wizard.marketingConsent,
        deliveryMode: wizard.deliveryMode,
        cep: wizard.cep,
        address: wizard.address,
        addressNumber: wizard.addressNumber,
        addressComplement: wizard.addressComplement,
        city: wizard.city,
        notes: wizard.notes,
        paymentMethod: wizard.paymentMethod,
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
        setAddressNumber,
        setAddressComplement,
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
    [
      wizard,
      formErrors,
      quote,
      loadingQuote,
      submitting,
      idempotencyKey,
      setName,
      setPhone,
      setEmail,
      setMarketingConsent,
      setDeliveryMode,
      setCep,
      setAddress,
      setAddressNumber,
      setAddressComplement,
      setCity,
      setNotes,
      setPaymentMethod,
      refreshQuote,
      handleFinishOrder,
    ]
  );

  // Sacola Vazia — redireciona para /carrinho após hidratação mantendo fallback acessível
  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-luxury-offwhite">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-silk-200 text-center shadow-luxury-card space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-brand-light flex items-center justify-center text-marina-700">
            <ShoppingBag aria-hidden="true" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-onyx-950">
              {orderCompletedRef.current
                ? "Pedido confirmado!"
                : "Sua sacola está vazia"}
            </h1>
            <p className="text-sm text-onyx-600 mt-2">
              {orderCompletedRef.current
                ? "Redirecionando para o acompanhamento do seu pedido..."
                : isHydrated
                ? "Redirecionando você para a sacola..."
                : "Explore nosso catálogo e adicione os melhores cosméticos e produtos profissionais para seu cabelo."}
            </p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-xl bg-marina-600 hover:bg-marina-700 text-white font-bold text-sm tracking-wide shadow-luxury transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2"
          >
            Explorar Vitrine de Produtos
          </Link>
        </div>
      </main>
    );
  }

  const activeError = globalError || quoteError;
  const totalUnitCount = items.reduce((acc, i) => acc + i.quantity, 0);

  // Configura botão primário da barra fixa mobile por etapa
  const getMobileAction = (): {
    label: string;
    disabled: boolean;
    loading: boolean;
    onClick: () => void;
    onBack?: () => void;
  } => {
    switch (wizard.currentStep) {
      case "identificacao":
        return {
          label:
            wizard.verifiedEmail === wizard.email.trim().toLowerCase()
              ? "Continuar"
              : "Enviar código",
          disabled: sendingCode,
          loading: sendingCode,
          onClick: () => void sendOtpRequest(),
        };
      case "verificacao":
        return {
          label: verifyingCode ? "Verificando..." : "Verificar código",
          disabled: verifyingCode,
          loading: verifyingCode,
          onBack: () => navigateToStep("identificacao"),
          onClick: () => {
            const formBtn = document.querySelector<HTMLButtonElement>(
              'section[aria-labelledby="checkout-step-verify"] button[type="submit"]'
            );
            formBtn?.click();
          },
        };
      case "entrega":
        return {
          label: "Continuar",
          disabled: loadingQuote,
          loading: false,
          onBack: () =>
            navigateToStep(
              wizard.verifiedEmail ? "identificacao" : "verificacao"
            ),
          onClick: handleContinueFromDelivery,
        };
      case "pagamento":
        return {
          label: "Continuar",
          disabled: loadingQuote,
          loading: false,
          onBack: () => navigateToStep("entrega"),
          onClick: handleContinueFromPayment,
        };
      case "revisao":
        return {
          label: submitting ? "Processando..." : "Confirmar pedido",
          disabled: submitting || !wizard.acceptedTerms,
          loading: submitting,
          onBack: () => navigateToStep("pagamento"),
          onClick: () => void handleFinishOrder(),
        };
    }
  };

  const mobileAction = getMobileAction();

  return (
    <CheckoutContext.Provider value={contextValue}>
      <main className="min-h-screen bg-luxury-offwhite py-5 sm:py-10 pb-32 lg:pb-12 px-4 sm:px-6 lg:px-8">
        {/* Região de anúncio acessível ao mudar etapa */}
        <div aria-live="polite" className="sr-only">
          {stepAnnouncement}
        </div>

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

        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          {/* Cabeçalho do Checkout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-silk-200 gap-3">
            <div>
              <Link
                href="/carrinho"
                onClick={() => clearCheckoutSessionStorage()}
                className="min-h-[44px] inline-flex items-center text-xs font-semibold text-onyx-600 hover:text-marina-700 transition-colors mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded"
              >
                <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1.5" />
                Voltar para a Sacola
              </Link>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-onyx-950">
                Finalização de Pedido
              </h1>
            </div>
            <div className="text-xs text-onyx-600 flex items-center space-x-2">
              <span>Ambiente Criptografado e Seguro</span>
            </div>
          </div>

          {/* Indicador de Progresso */}
          <CheckoutStepper
            currentStep={wizard.currentStep}
            completedSteps={wizard.completedSteps}
            canAccess={(step) => canAccessStep(wizard, step)}
            onSelectStep={navigateToStep}
          />

          {/* Aviso de alteração nos itens da sacola durante checkout */}
          {cartChangedBanner && (
            <div
              role="status"
              className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Os itens da sua sacola foram atualizados e os valores foram recalculados.
              </span>
            </div>
          )}

          {/* Alerta de Erro Global */}
          {activeError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start justify-between gap-3"
            >
              <div className="flex items-start space-x-2.5">
                <AlertCircle
                  aria-hidden="true"
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className="font-semibold">Atenção:</p>
                  <p>{activeError}</p>
                </div>
              </div>
              {networkRetryAction && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={networkRetryAction}
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Tentar novamente</span>
                </Button>
              )}
            </div>
          )}

          {/* Acordeão Mobile do Resumo */}
          <div className="lg:hidden bg-white rounded-2xl border border-silk-200 p-4 shadow-sm">
            <button
              type="button"
              aria-expanded={mobileSummaryOpen}
              onClick={() => setMobileSummaryOpen((prev) => !prev)}
              className="w-full min-h-[44px] flex items-center justify-between text-left font-semibold text-sm text-onyx-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg cursor-pointer"
            >
              <span className="flex items-center">
                <ShoppingBag
                  aria-hidden="true"
                  className="w-4 h-4 mr-2 text-marina-700"
                />
                Ver Resumo do Pedido ({totalUnitCount}{" "}
                {totalUnitCount === 1 ? "item" : "itens"})
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-marina-700 font-bold tabular-nums">
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
                  deliveryMode={wizard.deliveryMode}
                  paymentMethod={wizard.paymentMethod}
                  cartItems={items}
                  showSubmitButton={false}
                />
              </div>
            )}
          </div>

          {/* Grid 2 Colunas: Etapa Ativa | Resumo Sticky Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {wizard.currentStep === "identificacao" && (
                <CheckoutContact
                  verifiedEmail={wizard.verifiedEmail}
                  sendingCode={sendingCode}
                  onBlurField={handleFieldBlurIdentification}
                  onSendCode={() => void sendOtpRequest()}
                  headingRef={stepHeadingRef}
                />
              )}

              {wizard.currentStep === "verificacao" && (
                <CheckoutEmailVerify
                  email={wizard.email}
                  resendSecondsLeft={resendSecondsLeft}
                  sendingCode={sendingCode}
                  verifyingCode={verifyingCode}
                  errorMessage={otpError}
                  networkFailed={otpNetworkFailed}
                  attemptsRemaining={otpAttemptsRemaining}
                  onVerifyCode={handleVerifyCode}
                  onResendCode={() => void sendOtpRequest()}
                  onChangeEmail={() => navigateToStep("identificacao")}
                  headingRef={stepHeadingRef}
                />
              )}

              {wizard.currentStep === "entrega" && (
                <CheckoutDelivery
                  onDeliveryChange={() => setFormErrors({})}
                  onBlurField={handleFieldBlurDelivery}
                  quote={quote}
                  loadingQuote={loadingQuote}
                  quoteError={quoteError}
                  onRetryQuote={refreshQuote}
                  onBack={() => navigateToStep("identificacao")}
                  onNext={handleContinueFromDelivery}
                  headingRef={stepHeadingRef}
                />
              )}

              {wizard.currentStep === "pagamento" && (
                <CheckoutPayment
                  quote={quote}
                  loadingQuote={loadingQuote}
                  onBack={() => navigateToStep("entrega")}
                  onNext={handleContinueFromPayment}
                  headingRef={stepHeadingRef}
                />
              )}

              {wizard.currentStep === "revisao" && (
                <CheckoutReview
                  name={wizard.name}
                  phone={wizard.phone}
                  email={wizard.email}
                  deliveryMode={wizard.deliveryMode}
                  cep={wizard.cep}
                  address={wizard.address}
                  addressNumber={wizard.addressNumber}
                  addressComplement={wizard.addressComplement}
                  city={wizard.city}
                  notes={wizard.notes}
                  paymentMethod={wizard.paymentMethod}
                  acceptedTerms={wizard.acceptedTerms}
                  onToggleTerms={(checked) => {
                    dispatch({ type: "SET_ACCEPTED_TERMS", value: checked });
                    if (checked) setTermsError(null);
                  }}
                  termsError={termsError}
                  quote={quote}
                  cartItems={items}
                  submitting={submitting}
                  onEditStep={navigateToStep}
                  onConfirmOrder={() => void handleFinishOrder()}
                  headingRef={stepHeadingRef}
                />
              )}

              <CheckoutTrustSignals />
            </div>

            {/* Coluna Direita Desktop: Resumo Financeiro Sticky */}
            <div className="hidden lg:block lg:col-span-5 sticky top-8">
              <CheckoutSummary
                quote={quote}
                loadingQuote={loadingQuote}
                submitting={submitting}
                onSubmit={handleFinishOrder}
                deliveryMode={wizard.deliveryMode}
                paymentMethod={wizard.paymentMethod}
                cartItems={items}
                showSubmitButton={false}
                canSubmit={wizard.acceptedTerms}
              />
            </div>
          </div>
        </div>

        {/* Barra Fixa Mobile no Rodapé com Safe-Area */}
        <div
          data-mobile-sticky-bar="true"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-silk-200 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(26,9,24,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            {mobileAction.onBack ? (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={mobileAction.onBack}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Voltar</span>
              </Button>
            ) : (
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-onyx-600 font-semibold">
                  Total
                </p>
                <p className="text-base font-bold text-marina-700 tabular-nums leading-tight">
                  {quote ? formatBrl(quote.totalCents) : "..."}
                </p>
              </div>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={mobileAction.disabled}
              onClick={mobileAction.onClick}
            >
              {mobileAction.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{mobileAction.label}</span>
                </>
              ) : (
                <>
                  <span>{mobileAction.label}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </CheckoutContext.Provider>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center bg-luxury-offwhite">
          <div className="flex items-center gap-2 text-sm text-onyx-700">
            <Loader2 className="w-5 h-5 animate-spin text-marina-700" />
            <span>Carregando checkout...</span>
          </div>
        </main>
      }
    >
      <CheckoutFlowContent />
    </Suspense>
  );
}
