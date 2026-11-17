import { z } from "zod";

export const CHECKOUT_STEPS = [
  "identificacao",
  "verificacao",
  "entrega",
  "pagamento",
  "revisao",
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEPS)[number];

export const STEP_META: Record<
  CheckoutStepId,
  { number: number; title: string; shortLabel: string; description: string }
> = {
  identificacao: {
    number: 1,
    title: "Identificação e Contato",
    shortLabel: "Identificação",
    description: "Informe seus dados para confirmação por e-mail e entrega.",
  },
  verificacao: {
    number: 2,
    title: "Verificação de E-mail",
    shortLabel: "Verificação",
    description: "Digite o código de 6 dígitos enviado para o seu e-mail.",
  },
  entrega: {
    number: 3,
    title: "Forma de Entrega",
    shortLabel: "Entrega",
    description: "Escolha entrega no endereço ou retirada gratuita em Lages.",
  },
  pagamento: {
    number: 4,
    title: "Forma de Pagamento",
    shortLabel: "Pagamento",
    description: "Selecione como deseja concluir o pagamento do pedido.",
  },
  revisao: {
    number: 5,
    title: "Revisão do Pedido",
    shortLabel: "Revisão",
    description: "Confira todos os dados antes de confirmar o pedido.",
  },
};

export const CHECKOUT_STORAGE_KEY = "mariane_checkout_progress";

export interface CheckoutWizardState {
  currentStep: CheckoutStepId;
  completedSteps: CheckoutStepId[];
  verifiedEmail: string | null;
  name: string;
  phone: string;
  email: string;
  marketingConsent: boolean;
  deliveryMode: "entrega" | "retirada";
  cep: string;
  address: string;
  addressNumber: string;
  addressComplement: string;
  city: string;
  notes: string;
  paymentMethod: "whatsapp" | "pix" | "cartao";
  acceptedTerms: boolean;
}

export const INITIAL_WIZARD_STATE: CheckoutWizardState = {
  currentStep: "identificacao",
  completedSteps: [],
  verifiedEmail: null,
  name: "",
  phone: "",
  email: "",
  marketingConsent: false,
  deliveryMode: "entrega",
  cep: "",
  address: "",
  addressNumber: "",
  addressComplement: "",
  city: "Lages - SC",
  notes: "",
  paymentMethod: "whatsapp",
  acceptedTerms: false,
};

export const identificationStepSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo (mínimo 3 caracteres).")
    .max(120, "Nome muito longo."),
  customerPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((digits) => digits.length === 10 || digits.length === 11, {
      message: "Informe um WhatsApp/telefone válido com DDD (10 ou 11 dígitos).",
    }),
  customerEmail: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail para receber o código.")
    .email("Informe um endereço de e-mail válido.")
    .max(160, "E-mail muito longo."),
});

export const deliveryStepSchema = z
  .object({
    deliveryMode: z.enum(["entrega", "retirada"]),
    cep: z
      .string()
      .optional()
      .transform((v) => (v ? v.replace(/\D/g, "") : "")),
    address: z.string().trim().optional().default(""),
    city: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMode === "entrega") {
      if (!data.cep || data.cep.length !== 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cep"],
          message: "Informe um CEP válido de 8 dígitos.",
        });
      }
      if (!data.address || data.address.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Informe o endereço completo (rua e bairro).",
        });
      }
      if (!data.city || data.city.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["city"],
          message: "Informe a cidade e estado (ex: Lages - SC).",
        });
      }
    }
  });

export function validateIdentification(state: Pick<CheckoutWizardState, "name" | "phone" | "email">): Record<string, string> {
  const parsed = identificationStepSchema.safeParse({
    customerName: state.name,
    customerPhone: state.phone,
    customerEmail: state.email,
  });
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] || "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validateDelivery(
  state: Pick<CheckoutWizardState, "deliveryMode" | "cep" | "address" | "city">
): Record<string, string> {
  const parsed = deliveryStepSchema.safeParse({
    deliveryMode: state.deliveryMode,
    cep: state.cep,
    address: state.address,
    city: state.city,
  });
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] || "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function composeFullDeliveryAddress(
  address: string,
  number?: string,
  complement?: string
): string {
  const base = address.trim();
  const num = (number || "").trim();
  const comp = (complement || "").trim();
  if (!base) return "";
  const withNum = num ? `${base}, Nº ${num}` : base;
  return comp ? `${withNum} — ${comp}` : withNum;
}

export function isValidStepId(raw: string | null): raw is CheckoutStepId {
  return Boolean(raw && (CHECKOUT_STEPS as readonly string[]).includes(raw));
}

export function getFirstPendingStep(state: CheckoutWizardState): CheckoutStepId {
  for (const step of CHECKOUT_STEPS) {
    if (!state.completedSteps.includes(step)) {
      return step;
    }
  }
  return "revisao";
}

export function canAccessStep(
  state: CheckoutWizardState,
  target: CheckoutStepId
): boolean {
  const idx = CHECKOUT_STEPS.indexOf(target);
  if (idx <= 0) return true;
  return CHECKOUT_STEPS.slice(0, idx).every((prev) =>
    state.completedSteps.includes(prev)
  );
}

export function resolveAccessibleStep(
  state: CheckoutWizardState,
  requested: string | null
): CheckoutStepId {
  if (!isValidStepId(requested)) {
    return getFirstPendingStep(state);
  }
  return canAccessStep(state, requested) ? requested : getFirstPendingStep(state);
}

export type CheckoutWizardAction =
  | { type: "SET_FIELD"; field: "name" | "phone" | "address" | "addressNumber" | "addressComplement" | "city" | "notes"; value: string }
  | { type: "SET_EMAIL"; email: string }
  | { type: "SET_MARKETING"; value: boolean }
  | { type: "SET_ACCEPTED_TERMS"; value: boolean }
  | { type: "SET_DELIVERY_MODE"; mode: "entrega" | "retirada" }
  | { type: "SET_CEP"; cep: string }
  | { type: "SET_PAYMENT_METHOD"; method: "whatsapp" | "pix" | "cartao" }
  | { type: "COMPLETE_IDENTIFICATION" }
  | { type: "COMPLETE_VERIFICATION"; verifiedEmail: string }
  | { type: "COMPLETE_DELIVERY" }
  | { type: "COMPLETE_PAYMENT" }
  | { type: "GO_TO_STEP"; step: CheckoutStepId }
  | { type: "INVALIDATE_EMAIL_VERIFICATION" }
  | { type: "INVALIDATE_FROM_CART_CHANGE" }
  | { type: "HYDRATE_PROGRESS"; saved: CheckoutWizardState }
  | { type: "RESET" };

function addCompleted(
  list: CheckoutStepId[],
  step: CheckoutStepId
): CheckoutStepId[] {
  return list.includes(step) ? list : [...list, step];
}

function dropStepsFrom(
  list: CheckoutStepId[],
  fromStep: CheckoutStepId
): CheckoutStepId[] {
  const cutIdx = CHECKOUT_STEPS.indexOf(fromStep);
  return list.filter((s) => CHECKOUT_STEPS.indexOf(s) < cutIdx);
}

export function checkoutWizardReducer(
  state: CheckoutWizardState,
  action: CheckoutWizardAction
): CheckoutWizardState {
  switch (action.type) {
    case "SET_FIELD": {
      let nextCompleted = state.completedSteps;
      if (
        (action.field === "address" || action.field === "city") &&
        nextCompleted.includes("entrega")
      ) {
        nextCompleted = dropStepsFrom(nextCompleted, "entrega");
      } else if (
        (action.field === "name" || action.field === "phone") &&
        nextCompleted.includes("revisao")
      ) {
        nextCompleted = nextCompleted.filter((s) => s !== "revisao");
      }
      return {
        ...state,
        [action.field]: action.value,
        completedSteps: nextCompleted,
      };
    }

    case "SET_EMAIL": {
      const normalizedNew = action.email.trim().toLowerCase();
      const emailChanged =
        state.verifiedEmail !== null && normalizedNew !== state.verifiedEmail;
      const identChanged =
        normalizedNew !== state.email.trim().toLowerCase() &&
        state.completedSteps.includes("identificacao");

      if (!emailChanged && !identChanged) {
        return { ...state, email: action.email };
      }

      return {
        ...state,
        email: action.email,
        verifiedEmail: emailChanged ? null : state.verifiedEmail,
        completedSteps: dropStepsFrom(state.completedSteps, "identificacao"),
        currentStep:
          CHECKOUT_STEPS.indexOf(state.currentStep) > 0
            ? "identificacao"
            : state.currentStep,
      };
    }

    case "SET_MARKETING":
      return { ...state, marketingConsent: action.value };

    case "SET_ACCEPTED_TERMS":
      return { ...state, acceptedTerms: action.value };

    case "SET_DELIVERY_MODE": {
      if (action.mode === state.deliveryMode) return state;
      return {
        ...state,
        deliveryMode: action.mode,
        completedSteps: dropStepsFrom(state.completedSteps, "entrega"),
      };
    }

    case "SET_CEP": {
      const prevDigits = state.cep.replace(/\D/g, "");
      const nextDigits = action.cep.replace(/\D/g, "");
      const changed =
        prevDigits !== nextDigits && state.completedSteps.includes("entrega");
      return {
        ...state,
        cep: action.cep,
        completedSteps: changed
          ? dropStepsFrom(state.completedSteps, "entrega")
          : state.completedSteps,
      };
    }

    case "SET_PAYMENT_METHOD":
      return { ...state, paymentMethod: action.method };

    case "COMPLETE_IDENTIFICATION": {
      const normalized = state.email.trim().toLowerCase();
      const alreadyVerifiedSameEmail =
        state.verifiedEmail !== null && state.verifiedEmail === normalized;
      const nextCompleted = addCompleted(state.completedSteps, "identificacao");
      return {
        ...state,
        email: state.email.trim(),
        completedSteps: nextCompleted,
        currentStep: alreadyVerifiedSameEmail
          ? state.completedSteps.includes("entrega")
            ? getFirstPendingStep({ ...state, completedSteps: nextCompleted })
            : "entrega"
          : "verificacao",
      };
    }

    case "COMPLETE_VERIFICATION": {
      const normalized = action.verifiedEmail.trim().toLowerCase();
      const withId = addCompleted(state.completedSteps, "identificacao");
      const withVer = addCompleted(withId, "verificacao");
      return {
        ...state,
        email: normalized,
        verifiedEmail: normalized,
        completedSteps: withVer,
        currentStep: "entrega",
      };
    }

    case "COMPLETE_DELIVERY": {
      const nextCompleted = addCompleted(state.completedSteps, "entrega");
      return {
        ...state,
        completedSteps: nextCompleted,
        currentStep: "pagamento",
      };
    }

    case "COMPLETE_PAYMENT": {
      const nextCompleted = addCompleted(state.completedSteps, "pagamento");
      return {
        ...state,
        completedSteps: nextCompleted,
        currentStep: "revisao",
      };
    }

    case "GO_TO_STEP": {
      if (!canAccessStep(state, action.step)) {
        return {
          ...state,
          currentStep: getFirstPendingStep(state),
        };
      }
      return {
        ...state,
        currentStep: action.step,
      };
    }

    case "INVALIDATE_EMAIL_VERIFICATION":
      return {
        ...state,
        verifiedEmail: null,
        completedSteps: dropStepsFrom(state.completedSteps, "verificacao"),
        currentStep: "identificacao",
      };

    case "INVALIDATE_FROM_CART_CHANGE":
      return {
        ...state,
        completedSteps: state.completedSteps.filter((s) => s !== "revisao"),
      };

    case "HYDRATE_PROGRESS":
      return action.saved;

    case "RESET":
      return INITIAL_WIZARD_STATE;

    default:
      return state;
  }
}

export function serializeProgressForSessionStorage(
  state: CheckoutWizardState
): string {
  // Persiste apenas progresso e dados não-sensíveis (nunca dados de cartão)
  const safeSnapshot: CheckoutWizardState = {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    verifiedEmail: state.verifiedEmail,
    name: state.name,
    phone: state.phone,
    email: state.email,
    marketingConsent: state.marketingConsent,
    deliveryMode: state.deliveryMode,
    cep: state.cep,
    address: state.address,
    addressNumber: state.addressNumber,
    addressComplement: state.addressComplement,
    city: state.city,
    notes: state.notes,
    paymentMethod: state.paymentMethod,
    acceptedTerms: state.acceptedTerms,
  };
  return JSON.stringify(safeSnapshot);
}

export function hydrateProgressFromSessionStorage(
  raw: string | null
): CheckoutWizardState | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as Record<string, unknown>;

    const completedRaw = Array.isArray(rec.completedSteps)
      ? rec.completedSteps.filter((s): s is CheckoutStepId =>
          typeof s === "string" && isValidStepId(s)
        )
      : [];

    const hydrated: CheckoutWizardState = {
      currentStep: isValidStepId(
        typeof rec.currentStep === "string" ? rec.currentStep : null
      )
        ? (rec.currentStep as CheckoutStepId)
        : "identificacao",
      completedSteps: completedRaw,
      verifiedEmail:
        typeof rec.verifiedEmail === "string" ? rec.verifiedEmail : null,
      name: typeof rec.name === "string" ? rec.name : "",
      phone: typeof rec.phone === "string" ? rec.phone : "",
      email: typeof rec.email === "string" ? rec.email : "",
      marketingConsent: Boolean(rec.marketingConsent),
      deliveryMode:
        rec.deliveryMode === "retirada" ? "retirada" : "entrega",
      cep: typeof rec.cep === "string" ? rec.cep : "",
      address: typeof rec.address === "string" ? rec.address : "",
      addressNumber:
        typeof rec.addressNumber === "string" ? rec.addressNumber : "",
      addressComplement:
        typeof rec.addressComplement === "string" ? rec.addressComplement : "",
      city: typeof rec.city === "string" ? rec.city : "Lages - SC",
      notes: typeof rec.notes === "string" ? rec.notes : "",
      paymentMethod:
        rec.paymentMethod === "pix" || rec.paymentMethod === "cartao"
          ? rec.paymentMethod
          : "whatsapp",
      acceptedTerms: Boolean(rec.acceptedTerms),
    };

    // Garante que a etapa restaurada respeite invariantes de sequência
    hydrated.currentStep = resolveAccessibleStep(hydrated, hydrated.currentStep);
    return hydrated;
  } catch {
    return null;
  }
}

export function clearCheckoutSessionStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
  } catch {
    // Ignora restrições de ambiente privado
  }
}
