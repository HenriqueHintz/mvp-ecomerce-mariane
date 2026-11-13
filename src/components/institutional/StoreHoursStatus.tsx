"use client";

import React, { useEffect, useState } from "react";

function isStoreOpenInSaoPaulo(now: Date): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    const totalMinutes = hour * 60 + minute;

    if (["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday)) {
      return totalMinutes >= 9 * 60 && totalMinutes < 18 * 60 + 30;
    }
    if (weekday === "Sat") {
      return totalMinutes >= 9 * 60 && totalMinutes < 13 * 60;
    }
    return false;
  } catch {
    return false;
  }
}

export default function StoreHoursStatus() {
  const [isOpenNow, setIsOpenNow] = useState<boolean | null>(null);

  useEffect(() => {
    setIsOpenNow(isStoreOpenInSaoPaulo(new Date()));
    const interval = window.setInterval(() => {
      setIsOpenNow(isStoreOpenInSaoPaulo(new Date()));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  if (isOpenNow === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-silk-100 px-2.5 py-0.5 text-xs font-medium text-onyx-700">
        Horário comercial
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isOpenNow
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-silk-100 text-onyx-700 border border-silk-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          isOpenNow ? "bg-emerald-600" : "bg-onyx-500"
        }`}
      />
      {isOpenNow ? "Aberto agora" : "Fechado"}
    </span>
  );
}
