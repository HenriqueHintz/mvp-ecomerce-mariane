import React from "react";

export type BadgeVariant =
  | "brand"
  | "solid"
  | "dark"
  | "accent"
  | "whatsapp"
  | "emerald"
  | "outline"
  | "subtle";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: "bg-marina-50 text-marina-700 border border-marina-200",
  solid: "bg-marina-600 text-white border border-marina-700 shadow-sm",
  dark: "bg-onyx-950 text-silk-50 border border-onyx-800 shadow-sm",
  accent: "bg-marina-600 text-white border border-marina-700 shadow-sm",
  whatsapp: "bg-emerald-50 text-emerald-dark border border-emerald-200",
  emerald: "bg-emerald-50 text-emerald-dark border border-emerald-200",
  outline: "bg-white/90 text-marina-800 border border-marina-200/80 backdrop-blur-sm",
  subtle: "bg-silk-100 text-onyx-800 border border-silk-200",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-3.5 py-1 text-xs",
};

export function Badge({
  variant = "brand",
  size = "sm",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const classes = [
    "inline-flex items-center gap-1.5 rounded-full font-sans font-bold tracking-wider uppercase",
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.brand,
    SIZE_CLASSES[size] || SIZE_CLASSES.sm,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
