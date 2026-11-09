import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface SectionHeaderProps {
  badge?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  badge,
  eyebrow,
  title,
  subtitle,
  actionLabel,
  actionHref,
  action,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const badgeText = badge ?? eyebrow;

  if (align === "center") {
    return (
      <div className={`text-center max-w-2xl mx-auto mb-10 ${className}`.trim()}>
        {badgeText && (
          <span className="inline-flex items-center gap-1.5 text-marina-600 text-xs font-bold tracking-widest uppercase mb-2 bg-marina-50 px-3 py-1 rounded-full border border-marina-100">
            {badgeText}
          </span>
        )}
        <h2 className="font-serif text-2xl sm:text-3xl text-onyx-950 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-onyx-700 mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 ${className}`.trim()}
    >
      <div>
        {badgeText && (
          <span className="text-xs font-bold tracking-widest uppercase text-marina-600 block mb-1">
            {badgeText}
          </span>
        )}
        <h2 className="font-serif text-2xl sm:text-3xl text-onyx-950 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-onyx-700 mt-1.5 max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action ? (
        <div>{action}</div>
      ) : (
        actionLabel &&
        actionHref && (
          <Link
            href={actionHref}
            className="text-xs font-semibold uppercase tracking-wider text-onyx-900 hover:text-marina-600 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-500 rounded-lg py-1"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )
      )}
    </div>
  );
}

export default SectionHeader;
