import React from "react";
import { formatBRL } from "@/lib/pricing";

export interface PriceProps {
  price: number;
  promoPrice?: number | null;
  pixDiscountPercent?: number;
  installmentCount?: number | null;
  installmentValue?: number | null;
  size?: "sm" | "md" | "lg";
  showPix?: boolean;
  showInstallments?: boolean;
  className?: string;
}

export function Price({
  price,
  promoPrice,
  pixDiscountPercent = 5,
  installmentCount = 10,
  installmentValue,
  size = "md",
  showPix = true,
  showInstallments = true,
  className = "",
}: PriceProps) {
  const hasRealPromo =
    typeof promoPrice === "number" && promoPrice > 0 && promoPrice < price;
  const currentPrice = hasRealPromo ? promoPrice : price;
  const installments = installmentCount && installmentCount > 0 ? installmentCount : 10;
  const instVal =
    installmentValue && installmentValue > 0
      ? installmentValue
      : Math.round((currentPrice / installments) * 100) / 100;
  const pixMultiplier = (100 - pixDiscountPercent) / 100;
  const pixValue = currentPrice * pixMultiplier;

  const mainPriceClass =
    size === "lg"
      ? "text-2xl sm:text-3xl font-bold text-onyx-950 tabular-nums tracking-tight"
      : size === "sm"
      ? "text-lg font-bold text-onyx-950 tabular-nums tracking-tight"
      : "text-lg sm:text-[1.3125rem] font-bold text-onyx-950 tabular-nums tracking-tight";

  return (
    <div className={`font-sans tabular-nums space-y-1 ${className}`.trim()}>
      {/* Nível 1: Preço riscado + Preço final em destaque */}
      <div className="flex items-baseline gap-2 flex-wrap">
        {hasRealPromo && (
          <span className="text-xs text-onyx-500 line-through font-normal">
            {formatBRL(price)}
          </span>
        )}
        <span className={mainPriceClass}>{formatBRL(currentPrice)}</span>
      </div>

      {/* Nível 2: PIX em verde-esmeralda */}
      {showPix && (
        <p className="text-[13px] leading-snug text-emerald-800 font-semibold">
          {formatBRL(pixValue)} no PIX ({pixDiscountPercent}% OFF)
        </p>
      )}

      {/* Nível 3: Parcelamento discreto */}
      {showInstallments && (
        <p className="text-xs leading-snug text-onyx-600 font-normal">
          ou {installments}x de {formatBRL(instVal)} sem juros
        </p>
      )}
    </div>
  );
}

export default Price;
