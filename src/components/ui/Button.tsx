import React from "react";
import Link from "next/link";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "whatsapp"
  | "whatsappSecondary"
  | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  external?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-marina-600 hover:bg-marina-700 text-white border border-transparent shadow-marina-sm hover:shadow-marina-md",
  secondary:
    "bg-onyx-950 hover:bg-marina-700 text-silk-50 hover:text-white border border-transparent shadow-xs",
  outline:
    "bg-white/95 hover:bg-marina-50 text-marina-700 border border-marina-300 hover:border-marina-600 shadow-sm",
  whatsapp:
    "bg-emerald-whatsapp hover:bg-emerald-dark text-white border border-transparent shadow-sm hover:shadow-md",
  whatsappSecondary:
    "bg-emerald-50 hover:bg-emerald-100 text-emerald-whatsapp border border-emerald-whatsapp/60 hover:border-emerald-whatsapp shadow-xs",
  ghost:
    "bg-transparent hover:bg-marina-50 text-onyx-800 hover:text-marina-700 border border-transparent",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "relative h-10 sm:h-[42px] px-5 sm:px-6 text-sm rounded-full gap-2 after:content-[''] after:absolute after:-inset-y-1 after:inset-x-0",
  md: "min-h-[44px] h-11 px-5 text-[15px] rounded-xl gap-2",
  lg: "min-h-[48px] px-7 py-3.5 text-sm rounded-full gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  href,
  external = false,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-sans font-semibold transition-all duration-200 cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

  const combinedClasses = [
    baseClasses,
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] || SIZE_CLASSES.md,
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href && !disabled) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={props["aria-label"]}
          className={combinedClasses}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        aria-label={props["aria-label"]}
        onClick={props.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
        className={combinedClasses}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
