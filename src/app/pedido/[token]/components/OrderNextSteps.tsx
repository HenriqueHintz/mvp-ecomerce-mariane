import React from "react";
import { getNextStepsForStatus } from "@/lib/payment-urls";
import { Compass, CheckCircle2 } from "lucide-react";

interface OrderNextStepsProps {
  status: string;
  deliveryMode: "entrega" | "retirada";
  paymentMethod: "whatsapp" | "pix" | "cartao";
}

export function OrderNextSteps({
  status,
  deliveryMode,
  paymentMethod,
}: OrderNextStepsProps) {
  const { title, steps } = getNextStepsForStatus(
    status,
    deliveryMode,
    paymentMethod
  );

  return (
    <section
      aria-labelledby="order-next-steps-heading"
      className="bg-white rounded-3xl border border-silk-200 p-6 shadow-luxury-card space-y-4"
    >
      <div className="flex items-center gap-2.5 border-b border-silk-100 pb-3">
        <div
          aria-hidden="true"
          className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0"
        >
          <Compass className="w-5 h-5" />
        </div>
        <h2
          id="order-next-steps-heading"
          className="font-serif text-base sm:text-lg font-bold text-onyx-950"
        >
          {title}
        </h2>
      </div>

      <ul className="space-y-2.5 text-xs sm:text-sm text-onyx-700">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <CheckCircle2
              aria-hidden="true"
              className="w-4 h-4 text-brand flex-shrink-0 mt-0.5"
            />
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
