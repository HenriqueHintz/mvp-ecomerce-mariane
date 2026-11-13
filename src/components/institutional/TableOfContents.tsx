"use client";

import React, { useState } from "react";
import { ChevronDown, List } from "lucide-react";

export interface TocItem {
  id: string;
  label: string;
}

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <nav
      aria-label="Índice da página"
      className="rounded-2xl border border-silk-200 bg-white p-4 shadow-xs"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full min-h-[44px] flex items-center justify-between gap-2 text-left font-sans text-sm font-semibold text-onyx-950 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
      >
        <span className="inline-flex items-center gap-2">
          <List className="w-4 h-4 text-marina-700 shrink-0" aria-hidden="true" />
          <span>Nesta página</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-onyx-600 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul className="mt-2 pt-2 border-t border-silk-100 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleNavigate(e, item.id)}
                className="min-h-[44px] flex items-center px-2 py-2 rounded-xl text-sm font-medium text-marina-800 hover:bg-marina-50 hover:text-marina-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
