import React from "react";

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
  const pixPrice = (currentPrice * pixMultiplier).toFixed(2);

  const mainPriceClass =
    size === "lg"
      ? "text-2xl sm:text-3xl font-bold text-onyx-950 tabular-nums tracking-tight"
      : size === "sm"
      ? "text-base font-bold text-onyx-950 tabular-nums tracking-tight"
      : "text-lg sm:text-[1.1875rem] font-bold text-onyx-950 tabular-nums tracking-tight";

  return (
    <div className={`font-sans tabular-nums space-y-0.5 ${className}`.trim()}>
      <div className="flex items-baseline gap-2 flex-wrap">
        {hasRealPromo && (
          <span className="text-xs text-onyx-400 line-through font-normal">
            R$ {price.toFixed(2)}
          </span>
        )}
        <span className={mainPriceClass}>R$ {currentPrice.toFixed(2)}</span>
      </div>

      {showPix && (
        <p className="text-xs text-emerald-700 font-medium">
          R$ {pixPrice} à vista no PIX ({pixDiscountPercent}% OFF)
        </p>
      )}

      {showInstallments && (
        <p className="text-[11px] text-onyx-500 font-normal">
          ou {installments}x de R$ {instVal.toFixed(2)} sem juros
        </p>
      )}
    </div>
  );
}

export default Price;
