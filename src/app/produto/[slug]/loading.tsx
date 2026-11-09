import React from "react";

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-pulseSlow">
      <div className="h-4 w-56 bg-silk-200 rounded" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-6 aspect-square rounded-3xl bg-silk-200" />
        <div className="lg:col-span-6 space-y-5">
          <div className="h-5 w-32 bg-marina-50 rounded-full" />
          <div className="h-10 w-3/4 bg-silk-200 rounded-xl" />
          <div className="h-28 w-full bg-silk-100 rounded-2xl border border-silk-200" />
          <div className="h-14 w-full bg-silk-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
