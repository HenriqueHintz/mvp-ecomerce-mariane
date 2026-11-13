"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { STORE_CONFIG, buildWhatsAppLink } from "@/config/store";
import {
  toCents,
  toReais,
  formatBRL,
  calculateItemPriceCents,
  calculatePixDiscountCents,
} from "@/lib/pricing";

const CART_STORAGE_KEY = "mariane_cart";

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  brandName?: string | null;
  price: number;
  promoPrice?: number | null;
  pixDiscountPercent?: number | null;
  image: string;
  quantity: number;
}

export interface WhatsAppOrderCustomerData {
  orderId?: string;
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface RemovedItemSnapshot {
  item: CartItem;
  index: number;
}

interface CartReducerState {
  items: CartItem[];
  lastRemoved: RemovedItemSnapshot | null;
}

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity">; quantity: number }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UNDO_REMOVE" }
  | { type: "DISMISS_UNDO" }
  | { type: "UPDATE_QUANTITY"; id: string; delta: number }
  | { type: "CLEAR_CART" };

function isValidCartItem(raw: unknown): raw is CartItem {
  if (!raw || typeof raw !== "object") return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0 &&
    typeof candidate.slug === "string" &&
    typeof candidate.price === "number" &&
    Number.isFinite(candidate.price) &&
    candidate.price >= 0 &&
    typeof candidate.quantity === "number" &&
    Number.isInteger(candidate.quantity) &&
    candidate.quantity > 0 &&
    typeof candidate.image === "string"
  );
}

function parseStoredCart(rawJson: string | null): CartItem[] {
  if (!rawJson) return [];
  try {
    const parsed: unknown = JSON.parse(rawJson);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { items?: unknown }).items)
      ? (parsed as { items: unknown[] }).items
      : [];
    return list.filter(isValidCartItem).map((item) => ({
      ...item,
      quantity: Math.min(50, Math.max(1, item.quantity)),
    }));
  } catch {
    return [];
  }
}

function cartReducer(state: CartReducerState, action: CartAction): CartReducerState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, lastRemoved: null };
    case "ADD_ITEM": {
      const qty = Math.max(1, Math.floor(action.quantity));
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) =>
            i.id === action.item.id
              ? { ...i, quantity: Math.min(50, i.quantity + qty) }
              : i
          )
        : [...state.items, { ...action.item, quantity: Math.min(50, qty) }];
      return { ...state, items };
    }
    case "REMOVE_ITEM": {
      const idx = state.items.findIndex((i) => i.id === action.id);
      if (idx === -1) return state;
      const removed = state.items[idx];
      return {
        items: state.items.filter((i) => i.id !== action.id),
        lastRemoved: { item: removed, index: idx },
      };
    }
    case "UNDO_REMOVE": {
      if (!state.lastRemoved) return state;
      const { item, index } = state.lastRemoved;
      const exists = state.items.some((i) => i.id === item.id);
      if (exists) {
        return {
          items: state.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: Math.min(50, i.quantity + item.quantity) }
              : i
          ),
          lastRemoved: null,
        };
      }
      const next = [...state.items];
      const insertAt = Math.min(Math.max(0, index), next.length);
      next.splice(insertAt, 0, item);
      return { items: next, lastRemoved: null };
    }
    case "DISMISS_UNDO":
      return state.lastRemoved ? { ...state, lastRemoved: null } : state;
    case "UPDATE_QUANTITY": {
      const items = state.items
        .map((i) => {
          if (i.id !== action.id) return i;
          const newQ = Math.min(50, i.quantity + action.delta);
          return newQ > 0 ? { ...i, quantity: newQ } : null;
        })
        .filter((item): item is CartItem => item !== null);
      return { ...state, items };
    }
    case "CLEAR_CART":
      return { items: [], lastRemoved: null };
    default:
      return state;
  }
}

export interface CartStateContextType {
  items: CartItem[];
  subtotal: number;
  subtotalCents: number;
  pixTotalCents: number;
  pixTotal: number;
  totalItems: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  remainingForFreeShipping: number;
  remainingForFreeShippingCents: number;
  lastRemovedItem: CartItem | null;
}

export interface CartUIContextType {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  announcement: string;
  badgePulseKey: number;
}

export interface CartActionsContextType {
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  undoRemove: () => void;
  dismissUndo: () => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  generateWhatsAppLink: (customerData?: WhatsAppOrderCustomerData) => string;
}

const CartStateContext = createContext<CartStateContextType | undefined>(undefined);
const CartUIContext = createContext<CartUIContextType | undefined>(undefined);
const CartActionsContext = createContext<CartActionsContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], lastRemoved: null });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [badgePulseKey, setBadgePulseKey] = useState(0);

  const itemsRef = useRef<CartItem[]>(state.items);
  itemsRef.current = state.items;

  const undoTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pendingSaveRef = useRef(false);
  const hasHydratedRef = useRef(false);

  // Hidratação inicial do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      const valid = parseStoredCart(saved);
      if (valid.length > 0) {
        dispatch({ type: "HYDRATE", items: valid });
      }
    } catch {
      // Ignora erro de acesso ao storage
    }
    setMounted(true);
  }, []);

  // Sincronização entre abas via evento storage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== CART_STORAGE_KEY) return;
      const synced = parseStoredCart(e.newValue);
      dispatch({ type: "HYDRATE", items: synced });
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Persistência no localStorage com debounce de ~300ms
  useEffect(() => {
    if (!mounted) return;
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      return;
    }
    pendingSaveRef.current = true;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      pendingSaveRef.current = false;
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      } catch {
        // Ignora quota exceeded
      }
    }, 300);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [state.items, mounted]);

  // Flush síncrono ao sair apenas se houver gravação pendente
  useEffect(() => {
    if (!mounted) return;
    const flush = () => {
      if (!pendingSaveRef.current) return;
      pendingSaveRef.current = false;
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemsRef.current));
      } catch {
        // Ignora erro de escrita
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [mounted]);

  // Limpa timer de desfazer ao desmontar
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", item, quantity });
    setBadgePulseKey((k) => k + 1);
    setAnnouncement(`Produto adicionado à sacola: ${item.name}`);
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    const target = itemsRef.current.find((i) => i.id === id);
    dispatch({ type: "REMOVE_ITEM", id });
    if (target) {
      setAnnouncement(`${target.name} removido da sacola`);
    }
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      dispatch({ type: "DISMISS_UNDO" });
    }, 5000);
  }, []);

  const undoRemove = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    dispatch({ type: "UNDO_REMOVE" });
    setAnnouncement("Item restaurado na sacola");
  }, []);

  const dismissUndo = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    dispatch({ type: "DISMISS_UNDO" });
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    const target = itemsRef.current.find((i) => i.id === id);
    dispatch({ type: "UPDATE_QUANTITY", id, delta });
    if (target) {
      const nextQ = Math.max(0, Math.min(50, target.quantity + delta));
      setAnnouncement(`Quantidade de ${target.name} atualizada para ${nextQ}`);
    }
  }, []);

  const clearCart = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    dispatch({ type: "CLEAR_CART" });
    setAnnouncement("Sacola esvaziada");
  }, []);

  // Limite oficial de frete grátis: R$ 199 (19900 centavos via COMMERCE_CONFIG)
  const freeShippingThresholdCents = COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS;
  const freeShippingThreshold = toReais(freeShippingThresholdCents);

  const subtotalCents = useMemo(() => {
    return state.items.reduce((acc, item) => {
      const unitPriceCents = calculateItemPriceCents({
        priceCents: toCents(item.price),
        promoPriceCents: item.promoPrice != null ? toCents(item.promoPrice) : null,
      });
      return acc + unitPriceCents * item.quantity;
    }, 0);
  }, [state.items]);

  const pixTotalCents = useMemo(() => {
    const pixItems = state.items.map((item) => ({
      unitPriceCents: calculateItemPriceCents({
        priceCents: toCents(item.price),
        promoPriceCents: item.promoPrice != null ? toCents(item.promoPrice) : null,
      }),
      quantity: item.quantity,
      pixDiscountPercent: item.pixDiscountPercent,
    }));
    const pixDiscountCents = calculatePixDiscountCents(pixItems);
    return Math.max(0, subtotalCents - pixDiscountCents);
  }, [state.items, subtotalCents]);

  const subtotal = toReais(subtotalCents);
  const pixTotal = toReais(pixTotalCents);
  const totalItems = useMemo(
    () => state.items.reduce((acc, item) => acc + item.quantity, 0),
    [state.items]
  );

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalCents / freeShippingThresholdCents) * 100)
  );
  const remainingForFreeShippingCents = Math.max(0, freeShippingThresholdCents - subtotalCents);
  const remainingForFreeShipping = toReais(remainingForFreeShippingCents);

  // Template oficial WhatsApp: MARIANE COSMÉTICOS — "Linda é a mulher que bem se quer" — 5549991251617
  const generateWhatsAppLink = useCallback((customerData?: WhatsAppOrderCustomerData) => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) {
      return buildWhatsAppLink(
        `Olá, ${STORE_CONFIG.name}! Gostaria de tirar uma dúvida sobre os produtos.`
      );
    }

    let message = `*NOVO PEDIDO - ${STORE_CONFIG.name.toUpperCase()}*\n`;
    message += `_${STORE_CONFIG.slogan}_\n`;
    message += `📍 _${STORE_CONFIG.physicalStore.formattedAddress}_\n\n`;

    if (customerData?.orderId) {
      message += `🧾 *Pedido Nº:* ${customerData.orderId}\n`;
    }
    if (customerData?.name) {
      message += `👤 *Cliente:* ${customerData.name}\n`;
    }
    if (customerData?.phone) {
      message += `📱 *Telefone:* ${customerData.phone}\n`;
    }
    if (customerData?.address) {
      message += `📍 *Entrega:* ${customerData.address}\n`;
    }
    message += `\n*ITENS DA SACOLA:*\n`;

    let totalCents = 0;
    const pixItems = currentItems.map((item, idx) => {
      const unitPriceCents = calculateItemPriceCents({
        priceCents: toCents(item.price),
        promoPriceCents: item.promoPrice != null ? toCents(item.promoPrice) : null,
      });
      const lineTotalCents = unitPriceCents * item.quantity;
      totalCents += lineTotalCents;

      message += `${idx + 1}. ${item.name} (${item.brandName || "Cosméticos"})\n`;
      message += `   Qtd: ${item.quantity}x | ${formatBRL(
        toReais(unitPriceCents)
      )} un. -> *${formatBRL(toReais(lineTotalCents))}*\n`;

      return {
        unitPriceCents,
        quantity: item.quantity,
        pixDiscountPercent: item.pixDiscountPercent,
      };
    });

    const pixDiscountCents = calculatePixDiscountCents(pixItems);
    const calculatedPixTotalCents = Math.max(0, totalCents - pixDiscountCents);

    message += `\n💰 *Subtotal:* ${formatBRL(toReais(totalCents))}`;
    message += `\n💎 *No PIX (${COMMERCE_CONFIG.DEFAULT_PIX_DISCOUNT_PERCENT}% OFF):* ${formatBRL(
      toReais(calculatedPixTotalCents)
    )}`;
    if (totalCents >= COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS) {
      message += `\n🚚 *Frete:* GRÁTIS 🎉`;
    } else {
      message += `\n🚚 *Frete:* A calcular`;
    }

    if (customerData?.notes) {
      message += `\n📝 *Observações:* ${customerData.notes}`;
    }

    message += `\n\nOlá, gostaria de confirmar a disponibilidade e finalizar este pedido por aqui!`;

    return buildWhatsAppLink(message);
  }, []);

  const stateValue = useMemo<CartStateContextType>(
    () => ({
      items: state.items,
      subtotal,
      subtotalCents,
      pixTotalCents,
      pixTotal,
      totalItems,
      freeShippingThreshold,
      freeShippingProgress,
      remainingForFreeShipping,
      remainingForFreeShippingCents,
      lastRemovedItem: state.lastRemoved?.item ?? null,
    }),
    [
      state.items,
      state.lastRemoved,
      subtotal,
      subtotalCents,
      pixTotalCents,
      pixTotal,
      totalItems,
      freeShippingThreshold,
      freeShippingProgress,
      remainingForFreeShipping,
      remainingForFreeShippingCents,
    ]
  );

  const uiValue = useMemo<CartUIContextType>(
    () => ({
      isCartOpen,
      setIsCartOpen,
      openCart,
      closeCart,
      announcement,
      badgePulseKey,
    }),
    [isCartOpen, openCart, closeCart, announcement, badgePulseKey]
  );

  const actionsValue = useMemo<CartActionsContextType>(
    () => ({
      addItem,
      removeItem,
      undoRemove,
      dismissUndo,
      updateQuantity,
      clearCart,
      generateWhatsAppLink,
    }),
    [addItem, removeItem, undoRemove, dismissUndo, updateQuantity, clearCart, generateWhatsAppLink]
  );

  return (
    <CartActionsContext.Provider value={actionsValue}>
      <CartStateContext.Provider value={stateValue}>
        <CartUIContext.Provider value={uiValue}>{children}</CartUIContext.Provider>
      </CartStateContext.Provider>
    </CartActionsContext.Provider>
  );
}

export function useCartState(): CartStateContextType {
  const ctx = useContext(CartStateContext);
  if (!ctx) {
    throw new Error("useCartState deve ser usado dentro de um CartProvider");
  }
  return ctx;
}

export function useCartUI(): CartUIContextType {
  const ctx = useContext(CartUIContext);
  if (!ctx) {
    throw new Error("useCartUI deve ser usado dentro de um CartProvider");
  }
  return ctx;
}

export function useCartActions(): CartActionsContextType {
  const ctx = useContext(CartActionsContext);
  if (!ctx) {
    throw new Error("useCartActions deve ser usado dentro de um CartProvider");
  }
  return ctx;
}

export function useCart() {
  const state = useCartState();
  const ui = useCartUI();
  const actions = useCartActions();

  return useMemo(
    () => ({
      ...state,
      ...ui,
      ...actions,
    }),
    [state, ui, actions]
  );
}
