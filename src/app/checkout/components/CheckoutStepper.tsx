"use client";

import React from "react";
import { Check, Lock } from "lucide-react";
import {
  CHECKOUT_STEPS,
  STEP_META,
  type CheckoutStepId,
} from "../checkout-machine";

interface CheckoutStepperProps {
  currentStep: CheckoutStepId;
  completedSteps: CheckoutStepId[];
  canAccess: (step: CheckoutStepId) => boolean;
  onSelectStep: (step: CheckoutStepId) => void;
}

export function CheckoutStepper({
  currentStep,
  completedSteps,
  canAccess,
  onSelectStep,
}: CheckoutStepperProps) {
  const currentMeta = STEP_META[currentStep];
  const progressPercent = Math.round(
    (currentMeta.number / CHECKOUT_STEPS.length) * 100
  );

  return (
    <div className="space-y-3">
      {/* Mobile (< 768px): barra compacta */}
      <div className="md:hidden bg-white rounded-2xl border border-silk-200 px-4 py-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-marina-800 tabular-nums">
            Etapa {currentMeta.number} de {CHECKOUT_STEPS.length} —{" "}
            <span className="text-onyx-950">{currentMeta.shortLabel}</span>
          </span>
          <span className="text-[11px] font-medium text-onyx-600 tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso do checkout"
          aria-valuenow={currentMeta.number}
          aria-valuemin={1}
          aria-valuemax={CHECKOUT_STEPS.length}
          className="h-2 w-full rounded-full bg-silk-200 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-marina-600 transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop / Tablet (>= 768px): passos numerados com rótulos */}
      <nav
        aria-label="Etapas do checkout"
        className="hidden md:flex items-center justify-between bg-white rounded-2xl border border-silk-200 px-5 py-4 shadow-sm"
      >
        <ol className="w-full flex items-center justify-between gap-2">
          {CHECKOUT_STEPS.map((stepId, index) => {
            const meta = STEP_META[stepId];
            const isCurrent = stepId === currentStep;
            const isCompleted = completedSteps.includes(stepId);
            const isAccessible = canAccess(stepId);

            return (
              <React.Fragment key={stepId}>
                <li className="flex items-center min-w-0">
                  <button
                    type="button"
                    disabled={!isAccessible}
                    aria-disabled={!isAccessible}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => {
                      if (isAccessible) onSelectStep(stepId);
                    }}
                    className={`group min-h-[44px] px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
                      isAccessible
                        ? "cursor-pointer hover:bg-marina-50/70"
                        : "cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums shrink-0 transition-colors motion-reduce:transition-none ${
                        isCurrent
                          ? "bg-marina-700 text-white ring-4 ring-marina-100"
                          : isCompleted
                          ? "bg-marina-100 text-marina-800 border border-marina-300"
                          : "bg-silk-100 text-onyx-600 border border-silk-300"
                      }`}
                    >
                      {isCompleted && !isCurrent ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : !isAccessible ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        meta.number
                      )}
                    </span>
                    <span
                      className={`text-xs font-semibold truncate ${
                        isCurrent
                          ? "text-marina-800"
                          : isCompleted
                          ? "text-onyx-900"
                          : "text-onyx-600"
                      }`}
                    >
                      {meta.shortLabel}
                    </span>
                  </button>
                </li>
                {index < CHECKOUT_STEPS.length - 1 && (
                  <li
                    aria-hidden="true"
                    className={`hidden lg:block flex-1 h-px min-w-[12px] ${
                      isCompleted ? "bg-marina-400" : "bg-silk-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
