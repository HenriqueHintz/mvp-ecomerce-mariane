import React from "react";
import { ChevronDown } from "lucide-react";

export interface LegalAccordionProps {
  id?: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function LegalAccordion({
  id,
  title,
  defaultOpen = false,
  children,
}: LegalAccordionProps) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className="group scroll-mt-20 rounded-2xl border border-silk-200 bg-white shadow-xs overflow-hidden"
    >
      <summary className="list-none [&::-webkit-details-marker]:hidden min-h-[48px] px-4 py-3.5 flex items-center justify-between gap-3 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marina-600">
        <h2 className="font-serif text-[17px] leading-snug text-onyx-950 font-normal">
          {title}
        </h2>
        <ChevronDown
          className="w-5 h-5 text-marina-700 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="px-4 pb-4 pt-1 border-t border-silk-100 text-[15px] leading-[1.6] text-onyx-800 space-y-2.5">
        {children}
      </div>
    </details>
  );
}
