"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MailCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";

interface CheckoutEmailVerifyProps {
  email: string;
  resendSecondsLeft: number;
  sendingCode: boolean;
  verifyingCode: boolean;
  errorMessage: string | null;
  networkFailed: boolean;
  attemptsRemaining?: number | null;
  onVerifyCode: (code: string) => Promise<void> | void;
  onResendCode: () => Promise<void> | void;
  onChangeEmail: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

const OTP_LENGTH = 6;

export function CheckoutEmailVerify({
  email,
  resendSecondsLeft,
  sendingCode,
  verifyingCode,
  errorMessage,
  networkFailed,
  attemptsRemaining,
  onVerifyCode,
  onResendCode,
  onChangeEmail,
  headingRef,
}: CheckoutEmailVerifyProps) {
  const [digits, setDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill("")
  );
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    // Foca o primeiro campo caso ainda não haja código completo preenchido
    const firstEmpty = digits.findIndex((d) => !d);
    if (firstEmpty === 0) {
      inputRefs.current[0]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCode = digits.join("");

  const submitIfComplete = (nextDigits: string[]) => {
    const joined = nextDigits.join("");
    if (
      joined.length === OTP_LENGTH &&
      /^\d{6}$/.test(joined) &&
      !verifyingCode &&
      lastSubmittedCodeRef.current !== joined
    ) {
      lastSubmittedCodeRef.current = joined;
      void onVerifyCode(joined);
    }
  };

  const applyPastedOrMultiDigits = (startIdx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) return;
    const next = [...digits];
    if (cleaned.length >= OTP_LENGTH) {
      for (let i = 0; i < OTP_LENGTH; i++) {
        next[i] = cleaned[i] || "";
      }
      setDigits(next);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      submitIfComplete(next);
      return;
    }

    let cursor = startIdx;
    for (const ch of cleaned) {
      if (cursor >= OTP_LENGTH) break;
      next[cursor] = ch;
      cursor++;
    }
    setDigits(next);
    const focusIdx = Math.min(cursor, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    submitIfComplete(next);
  };

  const handleDigitChange = (idx: number, rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, "");
    lastSubmittedCodeRef.current = null;
    if (cleaned.length > 1) {
      applyPastedOrMultiDigits(idx, cleaned);
      return;
    }
    const char = cleaned.slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);

    if (char && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    submitIfComplete(next);
  };

  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      lastSubmittedCodeRef.current = null;
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        const next = [...digits];
        next[idx - 1] = "";
        setDigits(next);
        inputRefs.current[idx - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
      e.preventDefault();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(currentCode) && !verifyingCode) {
      lastSubmittedCodeRef.current = currentCode;
      void onVerifyCode(currentCode);
    }
  };

  return (
    <section
      aria-labelledby="checkout-step-verify"
      className="bg-white rounded-2xl border border-silk-200 p-5 sm:p-6 shadow-luxury-card space-y-5 motion-safe:transition-opacity motion-reduce:transition-none"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-silk-100">
        <div className="flex items-start space-x-3">
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-brand-light text-marina-700 flex items-center justify-center font-bold text-sm tabular-nums shrink-0 mt-0.5"
          >
            2
          </div>
          <div className="min-w-0">
            <h2
              id="checkout-step-verify"
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-serif font-bold text-onyx-950 focus:outline-none"
            >
              Verificação de E-mail
            </h2>
            <p className="text-xs text-onyx-600 mt-0.5 leading-relaxed">
              Digite o código de 6 dígitos enviado para{" "}
              <strong className="text-onyx-950 break-words">{email}</strong>.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeEmail}
          className="self-start min-h-[44px] px-2 -ml-2 sm:ml-0 sm:px-2.5 text-xs font-semibold text-marina-700 hover:text-marina-900 underline underline-offset-4 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg inline-flex items-center gap-1 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Trocar e-mail
        </button>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="checkout-otp-0"
            className="block text-xs font-semibold text-onyx-800 uppercase tracking-wider mb-3"
          >
            Código de 6 dígitos <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div
            className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3"
            role="group"
            aria-label="Código de verificação de 6 dígitos"
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                id={`checkout-otp-${idx}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={idx === 0 ? "one-time-code" : "off"}
                maxLength={idx === 0 ? 6 : 1}
                aria-label={`Dígito ${idx + 1} de ${OTP_LENGTH}`}
                aria-invalid={Boolean(errorMessage)}
                disabled={verifyingCode}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  lastSubmittedCodeRef.current = null;
                  applyPastedOrMultiDigits(idx, pasted);
                }}
                className={`h-12 w-11 sm:w-12 rounded-xl border text-center font-sans text-lg font-bold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 ${
                  errorMessage
                    ? "border-red-400 bg-red-50/30 text-onyx-950"
                    : digit
                    ? "border-marina-500 bg-marina-50/30 text-onyx-950"
                    : "border-silk-300 bg-white text-onyx-950 hover:border-marina-400"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-onyx-600">
            Validade de 10 minutos. Você pode colar o código completo em qualquer campo.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm space-y-2"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                {typeof attemptsRemaining === "number" && attemptsRemaining > 0 && (
                  <p className="text-xs text-red-700 tabular-nums">
                    Tentativas restantes para este código: {attemptsRemaining}
                  </p>
                )}
              </div>
            </div>
            {networkFailed && /^\d{6}$/.test(currentCode) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  lastSubmittedCodeRef.current = null;
                  void onVerifyCode(currentCode);
                }}
              >
                Tentar novamente
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-xs text-onyx-700 tabular-nums">
            {resendSecondsLeft > 0 ? (
              <span>
                Reenviar código em <strong>{resendSecondsLeft}s</strong>
              </span>
            ) : (
              <button
                type="button"
                disabled={sendingCode}
                onClick={() => {
                  lastSubmittedCodeRef.current = null;
                  setDigits(Array(OTP_LENGTH).fill(""));
                  void onResendCode();
                }}
                className="min-h-[44px] inline-flex items-center gap-1.5 font-semibold text-marina-700 hover:text-marina-900 underline underline-offset-4 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marina-600 rounded-lg"
              >
                {sendingCode ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{sendingCode ? "Reenviando..." : "Reenviar código"}</span>
              </button>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={verifyingCode || currentCode.length !== OTP_LENGTH}
            className="hidden lg:inline-flex"
          >
            {verifyingCode ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <MailCheck className="w-4 h-4" aria-hidden="true" />
                <span>Verificar e continuar</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
