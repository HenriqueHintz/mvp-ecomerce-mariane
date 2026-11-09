export type OrderStatus =
  | "aguardando_confirmacao"
  | "aguardando_pagamento"
  | "pago"
  | "em_separacao"
  | "enviado"
  | "pronto_para_retirada"
  | "entregue"
  | "cancelado"
  | "expirado";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  aguardando_confirmacao: "Aguardando Confirmação (WhatsApp)",
  aguardando_pagamento: "Aguardando Pagamento",
  pago: "Pagamento Confirmado",
  em_separacao: "Em Separação",
  enviado: "Enviado / A Caminho",
  pronto_para_retirada: "Pronto para Retirada",
  entregue: "Entregue / Concluído",
  cancelado: "Cancelado",
  expirado: "Expirado por Falta de Pagamento",
};

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  aguardando_confirmacao: ["pago", "cancelado", "expirado"],
  aguardando_pagamento: ["pago", "cancelado", "expirado"],
  pago: ["em_separacao", "cancelado"],
  em_separacao: ["enviado", "pronto_para_retirada", "cancelado"],
  enviado: ["entregue", "cancelado"],
  pronto_para_retirada: ["entregue", "cancelado"],
  entregue: [], // Estado Terminal
  cancelado: [], // Estado Terminal
  expirado: [], // Estado Terminal
};

export class InvalidStatusTransitionError extends Error {
  constructor(public fromStatus: OrderStatus, public toStatus: OrderStatus) {
    super(
      `Transição de status inválida: não é permitido alterar de '${ORDER_STATUS_LABELS[fromStatus] || fromStatus}' para '${ORDER_STATUS_LABELS[toStatus] || toStatus}'.`
    );
    this.name = "InvalidStatusTransitionError";
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

export function validateTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidStatusTransitionError(from, to);
  }
}

export function isRestockStatus(status: OrderStatus): boolean {
  return status === "cancelado" || status === "expirado";
}
