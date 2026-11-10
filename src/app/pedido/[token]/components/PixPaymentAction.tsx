"use client";

import React, { useState } from "react";
import { Copy, Check, QrCode, Clock } from "lucide-react";

interface PixPaymentActionProps {
  orderId: string;
  totalFormatted: string;
  pixCopyPaste: string;
  expiresAt?: string | null;
}

export function PixPaymentAction({
  orderId,
  totalFormatted,
  pixCopyPaste,
  expiresAt,
}: PixPaymentActionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCopyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  return (
    <div className="bg-white rounded-3xl border border-silk-200 p-6 shadow-luxury-card space-y-5">
      <div className="flex items-center justify-between border-b border-silk-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-onyx-950 text-base">
              Pagamento via PIX (5% OFF Aplicado)
            </h3>
            <p className="text-xs text-onyx-600">
              Pedido <span className="font-mono font-semibold">{orderId}</span> &bull; Valor:{" "}
              <strong className="text-brand">{totalFormatted}</strong>
            </p>
          </div>
        </div>
        {expiresAt && (
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>Reserva válida por 24h</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Representação SVG determinística do QR Code PIX */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-luxury-offwhite border border-silk-200">
          <svg
            viewBox="0 0 120 120"
            className="w-36 h-36 text-onyx-950"
            role="img"
            aria-label={`QR Code PIX do pedido ${orderId}`}
          >
            <rect width="120" height="120" fill="#FFFFFF" rx="8" />
            <rect x="10" y="10" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="19" y="19" width="12" height="12" fill="currentColor" />
            <rect x="80" y="10" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="89" y="19" width="12" height="12" fill="currentColor" />
            <rect x="10" y="80" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" />
            <rect x="19" y="89" width="12" height="12" fill="currentColor" />
            <rect x="50" y="20" width="8" height="8" fill="currentColor" />
            <rect x="62" y="28" width="8" height="8" fill="currentColor" />
            <rect x="48" y="48" width="24" height="24" fill="#75066A" rx="4" />
            <rect x="56" y="56" width="8" height="8" fill="#FFFFFF" />
            <rect x="20" y="52" width="16" height="8" fill="currentColor" />
            <rect x="82" y="54" width="18" height="8" fill="currentColor" />
            <rect x="52" y="84" width="12" height="16" fill="currentColor" />
            <rect x="78" y="82" width="22" height="22" fill="currentColor" />
            <rect x="84" y="88" width="10" height="10" fill="#FFFFFF" />
          </svg>
          <span className="text-[11px] text-onyx-600 mt-2 text-center">
            Escaneie no aplicativo do seu banco
          </span>
        </div>

        {/* Chave Copia e Cola */}
        <div className="md:col-span-8 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-onyx-700">
            Código PIX Copia e Cola
          </label>
          <div className="p-3 rounded-xl bg-silk-50 border border-silk-200 font-mono text-xs text-onyx-800 break-all select-all">
            {pixCopyPaste}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs tracking-wide transition-all shadow-luxury"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Chave PIX Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Chave PIX</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
