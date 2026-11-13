"use client";

import React from "react";
import Image from "next/image";

export type LogoVariant = "badge" | "horizontal" | "icon";
export type LogoSize = "sm" | "md" | "lg" | "xl";
export type LogoTone = "dark" | "light";

export interface LogoProps {
  /**
   * Formato do logo:
   * - 'horizontal': Logo panorâmico idêntico à arte oficial (mulher à esquerda + Mariane Cosméticos à direita)
   * - 'badge': Logo com o banner oficial completo em degradê roxo
   * - 'icon': Ícone compacto (silhueta)
   * @default "horizontal"
   */
  variant?: LogoVariant;

  /**
   * Predefinição de tamanho:
   * - 'sm': Compacto (mobile)
   * - 'md': Padrão (desktop navbar)
   * - 'lg': Destaque (footer, hero)
   * - 'xl': Banner
   * @default "md"
   */
  size?: LogoSize;

  /**
   * Tom do logo (automático para contraste):
   * - 'dark': Texto roxo escuro (para fundos claros/brancos)
   * - 'light': Texto branco (para fundos escuros/footer)
   * @default "dark"
   */
  tone?: LogoTone;

  /**
   * Classes extras do Tailwind CSS
   */
  className?: string;

  /**
   * Rótulo de acessibilidade
   * @default "Mariane Cosméticos"
   */
  alt?: string;
}

const SIZE_CLASSES: Record<LogoSize, { h: number; w: number; className: string }> = {
  sm: { h: 44, w: 111, className: "h-11 w-auto" },
  md: { h: 64, w: 162, className: "h-16 w-auto" },
  lg: { h: 84, w: 213, className: "h-20 sm:h-24 w-auto" },
  xl: { h: 120, w: 304, className: "h-28 sm:h-32 w-auto" },
};

export function Logo({
  variant = "horizontal",
  size = "md",
  tone = "dark",
  className = "",
  alt = "Mariane Cosméticos - Revendedora oficial Madressenza",
}: LogoProps) {
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const isLight = tone === "light";

  // Se variant for 'badge', usa o banner original completo com o degradê roxo da foto
  if (variant === "badge") {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow ${sizeConfig.className} ${className}`}>
        <Image
          src="/logo-mariane-banner.png"
          alt={alt}
          width={sizeConfig.w * 2}
          height={sizeConfig.h * 2}
          sizes="(max-width: 767px) 170px, 240px"
          priority
          className="h-full w-auto object-contain select-none"
        />
      </div>
    );
  }

  // Se variant for 'icon', usa o ícone vetorial compacto da silhueta oficial
  if (variant === "icon") {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeConfig.className} ${className}`}>
        <Image
          src="/icon.svg"
          alt={alt}
          width={sizeConfig.h * 2}
          height={sizeConfig.h * 2}
          priority
          className="h-full w-auto object-contain select-none"
        />
      </div>
    );
  }

  // Variant horizontal (padrão): arte isolada transparente (texto branco ou escuro dependendo do tom)
  const logoSrc = isLight ? "/logo-white.png" : "/logo-nav.png";

  return (
    <div className={`relative inline-flex items-center shrink-0 ${sizeConfig.className} ${className}`}>
      <Image
        src={logoSrc}
        alt={alt}
        width={sizeConfig.w * 2}
        height={sizeConfig.h * 2}
        sizes="(max-width: 767px) 170px, 240px"
        priority
        className="h-full w-auto object-contain select-none transform hover:scale-[1.02] transition-transform duration-200"
      />
    </div>
  );
}

export default Logo;
