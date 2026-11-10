"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
  ALLOWED_STATUS_TRANSITIONS,
} from "@/lib/order-state-machine";
import { formatBrl, toCents } from "@/lib/pricing";
import { STORE_CONFIG } from "@/config/store";
import {
  Search,
  Download,
  MessageCircle,
  RefreshCw,
  LogOut,
  AlertTriangle,
  Link2,
  Check,
  Clock,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";

interface AdminOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitPriceCents?: number | null;
  lineTotalCents?: number | null;
}

interface AdminOrderHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  actor: string;
  notes: string | null;
  createdAt: string;
}

interface AdminOrder {
  id: string;
  publicToken?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  status: string;
  total: number;
  totalCents?: number | null;
  deliveryMode?: string | null;
  paymentMethod?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  items: AdminOrderItem[];
  history: AdminOrderHistory[];
}

interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Hoisted static filter tabs (`rendering-hoist-jsx` from `react-best-practices`).
 */
const STATUS_FILTER_TABS = [
  { id: "todos", label: "Todos" },
  { id: "aguardando_confirmacao", label: "Aguard. WhatsApp" },
  { id: "aguardando_pagamento", label: "Aguard. Pagamento" },
  { id: "pago", label: "Pagos" },
  { id: "em_separacao", label: "Em Separação" },
  { id: "pronto_para_retirada", label: "Pronto p/ Retirada" },
  { id: "enviado", label: "Enviados" },
  { id: "entregue", label: "Concluídos" },
  { id: "expirado", label: "Expirados" },
  { id: "cancelado", label: "Cancelados" },
] as const;

const ACTOR_LABELS: Record<string, string> = {
  customer: "Cliente",
  admin: "Loja (Admin)",
  webhook_asaas: "Pagamento Online (Asaas)",
  asaas_sync_on_read: "Sincronização Asaas",
  system_expiration: "Expiração Automática",
};

function formatDateTimePtBr(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPaymentMethodLabel(method?: string | null): string {
  if (method === "pix") return "PIX";
  if (method === "cartao") return "Cartão";
  return "WhatsApp";
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadOrders = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      if (statusFilter !== "todos") params.set("status", statusFilter);
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await fetch(`/api/admin/pedidos?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (!controller.signal.aborted && res.ok && data.success) {
        setOrders(data.orders || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadOrders();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadOrders]);

  const handleStatusFilterChange = (nextFilter: string) => {
    setStatusFilter(nextFilter);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/pedidos/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (res.ok) {
        await loadOrders();
      } else {
        const errData = await res.json().catch(() => ({}));
        setActionError(errData.detail || "Não foi possível atualizar o status do pedido.");
      }
    } catch {
      setActionError("Erro de conexão ao atualizar status do pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  };

  const getOrderTrackingUrl = (order: AdminOrder) =>
    order.publicToken
      ? `${STORE_CONFIG.domain}/pedido/${order.publicToken}`
      : STORE_CONFIG.domain;

  const buildCustomerWhatsAppUrl = (order: AdminOrder) => {
    const cleanPhone = order.customerPhone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55")
      ? cleanPhone
      : `55${cleanPhone}`;
    const statusLabel =
      ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status;
    const trackingLink = getOrderTrackingUrl(order);
    const text = `Olá, ${order.customerName}! Aqui é da *${STORE_CONFIG.name}*.\nSeu pedido *${order.id}* está com status: *${statusLabel}*.\nAcompanhe em: ${trackingLink}`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
  };

  const handleCopyTrackingLink = async (order: AdminOrder) => {
    try {
      await navigator.clipboard.writeText(getOrderTrackingUrl(order));
      setCopiedId(order.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-luxury-offwhite py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabeçalho Mobile-First */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-silk-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-marina-600">
              Gestão Operacional
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-onyx-950">
              Pedidos da Loja
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/api/admin/pedidos/export-csv"
              className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-silk-300 text-xs font-bold text-onyx-800 hover:border-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Download aria-hidden="true" className="w-4 h-4 text-brand" />
              <span>Exportar CSV</span>
            </a>
            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-silk-300 text-xs font-bold text-onyx-800 hover:border-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <RefreshCw aria-hidden="true" className="w-4 h-4 text-brand" />
              <span>Atualizar</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-xl bg-silk-100 text-xs font-bold text-onyx-700 hover:bg-red-50 hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <LogOut aria-hidden="true" className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Busca e Filtros Rápidos */}
        <div className="bg-white rounded-2xl border border-silk-200 p-4 shadow-sm space-y-4">
          <div className="relative">
            <label htmlFor="admin-order-search" className="sr-only">
              Buscar pedidos por código, nome ou telefone
            </label>
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-onyx-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              id="admin-order-search"
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por código (MC-...), nome ou WhatsApp da cliente..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-silk-300 text-xs sm:text-sm text-onyx-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filtrar pedidos por status"
            className="flex flex-wrap gap-2"
          >
            {STATUS_FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => handleStatusFilterChange(tab.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                  statusFilter === tab.id
                    ? "bg-brand text-white shadow-sm"
                    : "bg-silk-100 text-onyx-700 hover:bg-silk-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2"
          >
            <AlertTriangle aria-hidden="true" className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Lista de Pedidos */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="p-12 text-center text-sm text-onyx-600 bg-white rounded-3xl border border-silk-200"
          >
            Carregando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-onyx-600 bg-white rounded-3xl border border-silk-200">
            Nenhum pedido encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const normalizedStatus: OrderStatus =
                order.status === "aguardando pagamento"
                  ? "aguardando_pagamento"
                  : (order.status as OrderStatus);
              const allowedNext =
                ALLOWED_STATUS_TRANSITIONS[normalizedStatus] || [];
              const totalCents =
                order.totalCents != null
                  ? order.totalCents
                  : toCents(order.total);
              const hasLatePaymentAlert = order.history?.some((h) =>
                h.notes?.includes("ALERTA: Pagamento confirmado após expiração")
              );

              return (
                <article
                  key={order.id}
                  aria-label={`Pedido ${order.id}`}
                  className="bg-white rounded-3xl border border-silk-200 p-4 sm:p-6 shadow-luxury-card space-y-4"
                >
                  {hasLatePaymentAlert && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 font-semibold"
                    >
                      <AlertTriangle
                        aria-hidden="true"
                        className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
                      />
                      <span>
                        ALERTA: Pagamento confirmado após expiração. Verifique
                        o estoque para reativar ou estornar manualmente.
                      </span>
                    </div>
                  )}

                  {/* Cabeçalho do Pedido */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-silk-100 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm sm:text-base text-onyx-950 tabular-nums">
                          {order.id}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-light text-brand">
                          {ORDER_STATUS_LABELS[normalizedStatus] || order.status}
                        </span>
                        {order.createdAt && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-onyx-600 tabular-nums">
                            <Clock aria-hidden="true" className="w-3 h-3" />
                            <span>{formatDateTimePtBr(order.createdAt)}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-onyx-700 tabular-nums">
                        <strong>{order.customerName}</strong> &bull;{" "}
                        {order.customerPhone}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-onyx-600">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-silk-100 font-semibold">
                          <MapPin aria-hidden="true" className="w-3 h-3 text-brand" />
                          <span>
                            {order.deliveryMode === "retirada"
                              ? "Retirada na Loja"
                              : "Entrega em Domicílio"}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-silk-100 font-semibold">
                          <CreditCard
                            aria-hidden="true"
                            className="w-3 h-3 text-brand"
                          />
                          <span>
                            Pagamento: {formatPaymentMethodLabel(order.paymentMethod)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2.5">
                      <span className="font-serif font-bold text-xl text-brand tabular-nums">
                        {formatBrl(totalCents)}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {order.publicToken && (
                          <button
                            type="button"
                            onClick={() => handleCopyTrackingLink(order)}
                            className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-3.5 py-2 rounded-xl border border-silk-300 bg-white text-onyx-800 hover:border-brand text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            {copiedId === order.id ? (
                              <>
                                <Check
                                  aria-hidden="true"
                                  className="w-3.5 h-3.5 text-emerald-600"
                                />
                                <span>Link Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Link2
                                  aria-hidden="true"
                                  className="w-3.5 h-3.5 text-brand"
                                />
                                <span>Copiar Link do Pedido</span>
                              </>
                            )}
                          </button>
                        )}
                        <a
                          href={buildCustomerWhatsAppUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center min-h-[44px] gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-whatsapp hover:opacity-95 text-white text-xs font-bold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-dark"
                        >
                          <MessageCircle
                            aria-hidden="true"
                            className="w-4 h-4"
                          />
                          <span>Reenviar Link no WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Itens, Endereço/Notas e Seletor de Transição de Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2 bg-silk-50/70 rounded-2xl p-3.5 border border-silk-100">
                      <div className="flex items-center gap-1.5 font-bold text-onyx-900 uppercase tracking-wider text-[11px]">
                        <Package aria-hidden="true" className="w-3.5 h-3.5 text-brand" />
                        <span>Itens do Pedido</span>
                      </div>
                      <div className="text-onyx-700 space-y-1.5 tabular-nums">
                        {order.items.map((item) => {
                          const unitCents =
                            item.unitPriceCents != null
                              ? item.unitPriceCents
                              : toCents(item.unitPrice);
                          const lineCents =
                            item.lineTotalCents != null
                              ? item.lineTotalCents
                              : unitCents * item.quantity;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span>
                                <strong>{item.quantity}x</strong> {item.productName}
                              </span>
                              <span className="font-semibold text-onyx-900 shrink-0">
                                {formatBrl(lineCents)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {order.shippingAddress && (
                        <p className="text-[11px] text-onyx-600 pt-1 border-t border-silk-200">
                          <strong>Endereço / Local:</strong> {order.shippingAddress}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-[11px] text-onyx-600">
                          <strong>Observações:</strong> {order.notes}
                        </p>
                      )}
                    </div>

                    {/* Histórico de Status */}
                    <div className="space-y-2 bg-silk-50/70 rounded-2xl p-3.5 border border-silk-100">
                      <div className="flex items-center gap-1.5 font-bold text-onyx-900 uppercase tracking-wider text-[11px]">
                        <Clock aria-hidden="true" className="w-3.5 h-3.5 text-brand" />
                        <span>Histórico do Pedido</span>
                      </div>
                      {order.history && order.history.length > 0 ? (
                        <ul className="space-y-2 text-[11px] text-onyx-700 tabular-nums">
                          {order.history.map((h) => (
                            <li
                              key={h.id}
                              className="border-l-2 border-brand/40 pl-2.5 py-0.5 space-y-0.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <span className="font-bold text-onyx-950">
                                  {ORDER_STATUS_LABELS[h.toStatus as OrderStatus] ||
                                    h.toStatus}
                                </span>
                                <span className="text-onyx-600">
                                  {formatDateTimePtBr(h.createdAt)}
                                </span>
                              </div>
                              <p className="text-onyx-600">
                                Por:{" "}
                                <strong>
                                  {ACTOR_LABELS[h.actor] || h.actor}
                                </strong>
                                {h.notes ? ` — ${h.notes}` : ""}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-onyx-600">
                          Nenhum evento registrado no histórico.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações de Transição Permitidas pela Máquina de Estados */}
                  {allowedNext.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-silk-100">
                      <span className="text-xs text-onyx-600 font-semibold">
                        Avançar status:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {allowedNext.map((nextSt) => (
                          <button
                            key={nextSt}
                            type="button"
                            disabled={updatingId === order.id}
                            onClick={() => handleStatusChange(order.id, nextSt)}
                            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-brand text-brand hover:bg-brand hover:text-white text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                          >
                            {ORDER_STATUS_LABELS[nextSt]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Controles de Paginação */}
        <nav
          aria-label="Paginação de pedidos"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl border border-silk-200 p-4 text-xs text-onyx-700 tabular-nums"
        >
          <div>
            Total de <strong>{pagination.total}</strong> pedido(s) &bull; Página{" "}
            <strong>{pagination.page}</strong> de{" "}
            <strong>{pagination.totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center justify-center min-h-[44px] gap-1 px-4 py-2 rounded-xl border border-silk-300 bg-white text-onyx-800 hover:border-brand font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <ChevronLeft aria-hidden="true" className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage || loading}
              onClick={() =>
                setPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
              className="inline-flex items-center justify-center min-h-[44px] gap-1 px-4 py-2 rounded-xl border border-silk-300 bg-white text-onyx-800 hover:border-brand font-bold disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span>Próxima</span>
              <ChevronRight aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    </main>
  );
}
