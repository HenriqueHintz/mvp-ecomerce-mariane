import React from "react";
import { OrderStatus, ORDER_STATUS_LABELS } from "@/lib/order-state-machine";
import { CheckCircle2, Clock, Package, Truck, Store, XCircle, AlertTriangle } from "lucide-react";

interface OrderStatusTimelineProps {
  currentStatus: string;
  deliveryMode: string;
}

export function OrderStatusTimeline({
  currentStatus,
  deliveryMode,
}: OrderStatusTimelineProps) {
  const normalizedStatus: OrderStatus =
    currentStatus === "aguardando pagamento"
      ? "aguardando_pagamento"
      : (currentStatus as OrderStatus);

  if (normalizedStatus === "cancelado" || normalizedStatus === "expirado") {
    return (
      <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
        {normalizedStatus === "cancelado" ? (
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <h3 className="font-serif font-bold text-red-900 text-base">
            {ORDER_STATUS_LABELS[normalizedStatus] || normalizedStatus}
          </h3>
          <p className="text-xs text-red-700 mt-1">
            {normalizedStatus === "expirado"
              ? "O prazo limite de 24 horas para pagamento expirou e os itens retornaram ao estoque. Você pode refazer seu pedido na vitrine ou falar conosco pelo WhatsApp."
              : "Este pedido foi cancelado. Caso precise de suporte, fale com nossa equipe pelo WhatsApp oficial."}
          </p>
        </div>
      </div>
    );
  }

  const steps: Array<{
    key: OrderStatus;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key:
        normalizedStatus === "aguardando_confirmacao"
          ? "aguardando_confirmacao"
          : "aguardando_pagamento",
      label:
        normalizedStatus === "aguardando_confirmacao"
          ? "Aguardando Confirmação"
          : "Aguardando Pagamento",
      icon: Clock,
    },
    {
      key: "pago",
      label: "Pago",
      icon: CheckCircle2,
    },
    {
      key: "em_separacao",
      label: "Em Separação",
      icon: Package,
    },
    {
      key: deliveryMode === "retirada" ? "pronto_para_retirada" : "enviado",
      label: deliveryMode === "retirada" ? "Pronto p/ Retirada" : "Enviado",
      icon: deliveryMode === "retirada" ? Store : Truck,
    },
    {
      key: "entregue",
      label: "Entregue",
      icon: CheckCircle2,
    },
  ];

  const orderRank: Record<string, number> = {
    aguardando_confirmacao: 0,
    aguardando_pagamento: 0,
    pago: 1,
    em_separacao: 2,
    pronto_para_retirada: 3,
    enviado: 3,
    entregue: 4,
  };

  const currentRank = orderRank[normalizedStatus] ?? 0;

  return (
    <div className="bg-white rounded-3xl border border-silk-200 p-6 shadow-luxury-card">
      <h2 className="font-serif text-lg font-bold text-onyx-950 mb-6">
        Andamento do Pedido
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentRank;
          const isCurrent = index === currentRank;

          return (
            <div
              key={step.key}
              className={`flex sm:flex-col items-center sm:text-center gap-3 p-3 rounded-2xl border transition-all ${
                isCurrent
                  ? "bg-brand-light/40 border-brand text-brand font-bold"
                  : isCompleted
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                  : "bg-silk-50 border-silk-200 text-onyx-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCurrent
                    ? "bg-brand text-white"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-silk-200 text-onyx-500"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs leading-tight">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
