import React from "react";
import { formatBrl, toCents } from "@/lib/pricing";
import { ShoppingBag, MapPin, CreditCard, User } from "lucide-react";

interface OrderSummaryItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitPriceCents?: number | null;
  lineTotalCents?: number | null;
}

interface OrderSummaryCardProps {
  humanCode: string;
  customerName: string;
  customerPhone: string;
  deliveryMode: string;
  shippingAddress: string;
  paymentMethod: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items: OrderSummaryItem[];
}

export function OrderSummaryCard({
  humanCode,
  customerName,
  customerPhone,
  deliveryMode,
  shippingAddress,
  paymentMethod,
  subtotalCents,
  discountCents,
  shippingCents,
  totalCents,
  items,
}: OrderSummaryCardProps) {
  const paymentLabels: Record<string, string> = {
    whatsapp: "Atendimento & Pagamento via WhatsApp",
    pix: "PIX (com 5% OFF)",
    cartao: "Cartão de Crédito",
    card: "Cartão de Crédito",
  };

  return (
    <div className="bg-white rounded-3xl border border-silk-200 p-6 shadow-luxury-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-silk-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-marina-600">
            Resumo Oficial do Pedido
          </span>
          <h2 className="font-serif text-xl font-bold text-onyx-950 mt-0.5">
            {humanCode}
          </h2>
        </div>
        <div className="text-xs text-onyx-600">
          Dados pessoais protegidos (LGPD Art. 6º, III)
        </div>
      </div>

      {/* Dados Protegidos da Titular & Entrega */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3.5 rounded-2xl bg-luxury-offwhite border border-silk-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-onyx-900">
            <User className="w-4 h-4 text-brand" />
            <span>Titular</span>
          </div>
          <p className="text-onyx-800 font-semibold">{customerName}</p>
          <p className="text-onyx-600">{customerPhone}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-luxury-offwhite border border-silk-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-onyx-900">
            <MapPin className="w-4 h-4 text-brand" />
            <span>
              {deliveryMode === "retirada"
                ? "Retirada na Loja Física"
                : "Entrega em Domicílio"}
            </span>
          </div>
          <p className="text-onyx-700 leading-relaxed">{shippingAddress}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-luxury-offwhite border border-silk-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-onyx-900">
            <CreditCard className="w-4 h-4 text-brand" />
            <span>Meio de Pagamento</span>
          </div>
          <p className="text-onyx-800 font-semibold">
            {paymentLabels[paymentMethod] || paymentMethod}
          </p>
        </div>
      </div>

      {/* Lista de Itens Congelados */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-onyx-700 flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-brand" />
          <span>Itens Reservados ({items.length})</span>
        </h3>
        <div className="divide-y divide-silk-200 border border-silk-200 rounded-2xl overflow-hidden">
          {items.map((item) => {
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
                className="p-3.5 flex items-center justify-between gap-4 bg-white text-xs sm:text-sm"
              >
                <div>
                  <p className="font-semibold text-onyx-950">{item.productName}</p>
                  <p className="text-xs text-onyx-600">
                    {item.quantity}x de {formatBrl(unitCents)}
                  </p>
                </div>
                <div className="font-bold text-onyx-950">
                  {formatBrl(lineCents)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totais em Centavos Inteiros */}
      <div className="border-t border-silk-200 pt-4 space-y-2 text-sm tabular-nums">
        <div className="flex justify-between text-onyx-700">
          <span>Subtotal dos Itens</span>
          <span>{formatBrl(subtotalCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Desconto PIX</span>
            <span>- {formatBrl(discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-onyx-700">
          <span>Frete ({deliveryMode === "retirada" ? "Retirada na Loja" : "Entrega"})</span>
          <span className={shippingCents === 0 ? "text-emerald-700 font-bold" : ""}>
            {shippingCents === 0 ? "GRÁTIS" : formatBrl(shippingCents)}
          </span>
        </div>
        <div className="flex justify-between text-base font-serif font-bold text-onyx-950 pt-2 border-t border-silk-200">
          <span>Total do Pedido</span>
          <span className="text-brand">{formatBrl(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
