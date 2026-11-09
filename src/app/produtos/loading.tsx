import React from "react";

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulseSlow">
      <div className="border-b border-silk-200 pb-6 space-y-4">
        <div className="h-4 w-40 bg-silk-200 rounded-full" />
        <div className="h-9 w-72 bg-silk-200 rounded-xl" />
        <div className="h-28 w-full bg-white border border-silk-200 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-silk-200 overflow-hidden p-4 space-y-4"
          >
            <div className="aspect-[4/5] bg-silk-100 rounded-xl" />
            <div className="h-3 w-20 bg-marina-50 rounded" />
            <div className="h-4 w-full bg-silk-200 rounded" />
            <div className="h-6 w-28 bg-silk-200 rounded" />
            <div className="h-10 w-full bg-silk-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
