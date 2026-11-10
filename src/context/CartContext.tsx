"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { COMMERCE_CONFIG } from "@/config/commerce";
import { STORE_CONFIG, buildWhatsAppLink } from "@/config/store";
import {
  toCents,
  toReais,
  calculateItemPriceCents,
  calculatePixDiscountCents,
} from "@/lib/pricing";

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

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  subtotalCents: number;
  totalItems: number;
  freeShippingThreshold: number;
  freeShippingProgress: number;
  remainingForFreeShipping: number;
  generateWhatsAppLink: (customerData?: WhatsAppOrderCustomerData) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Limite oficial de frete grátis: R$ 199 (19900 centavos via COMMERCE_CONFIG)
  const freeShippingThresholdCents = COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS;
  const freeShippingThreshold = toReais(freeShippingThresholdCents);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mariane_cart");
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem("mariane_cart", JSON.stringify(items));
      } catch {}
    }
  }, [items, mounted]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQ = i.quantity + delta;
            return newQ > 0 ? { ...i, quantity: newQ } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setItems([]);

  // Cálculo puramente em centavos inteiros via pricing.ts
  const subtotalCents = items.reduce((acc, item) => {
    const unitPriceCents = calculateItemPriceCents({
      priceCents: toCents(item.price),
      promoPriceCents: item.promoPrice != null ? toCents(item.promoPrice) : null,
    });
    return acc + unitPriceCents * item.quantity;
  }, 0);

  const subtotal = toReais(subtotalCents);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotalCents / freeShippingThresholdCents) * 100)
  );
  const remainingForFreeShipping = toReais(
    Math.max(0, freeShippingThresholdCents - subtotalCents)
  );

  // Template oficial WhatsApp: MARIANE COSMÉTICOS — "Linda é a mulher que bem se quer" — 5549991251617
  const generateWhatsAppLink = (customerData?: WhatsAppOrderCustomerData) => {
    if (items.length === 0) {
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

    const pixItems = items.map((item, idx) => {
      const unitPriceCents = calculateItemPriceCents({
        priceCents: toCents(item.price),
        promoPriceCents: item.promoPrice != null ? toCents(item.promoPrice) : null,
      });
      const lineTotalCents = unitPriceCents * item.quantity;
      message += `${idx + 1}. ${item.name} (${item.brandName || "Cosméticos"})\n`;
      message += `   Qtd: ${item.quantity}x | R$ ${toReais(unitPriceCents).toFixed(
        2
      )} un. -> *R$ ${toReais(lineTotalCents).toFixed(2)}*\n`;

      return {
        unitPriceCents,
        quantity: item.quantity,
        pixDiscountPercent: item.pixDiscountPercent,
      };
    });

    const pixDiscountCents = calculatePixDiscountCents(pixItems);
    const pixTotalCents = Math.max(0, subtotalCents - pixDiscountCents);

    message += `\n💰 *Subtotal:* R$ ${toReais(subtotalCents).toFixed(2)}`;
    message += `\n💎 *No PIX (${COMMERCE_CONFIG.DEFAULT_PIX_DISCOUNT_PERCENT}% OFF):* R$ ${toReais(
      pixTotalCents
    ).toFixed(2)}`;
    if (subtotalCents >= freeShippingThresholdCents) {
      message += `\n🚚 *Frete:* GRÁTIS 🎉`;
    } else {
      message += `\n🚚 *Frete:* A calcular`;
    }

    if (customerData?.notes) {
      message += `\n📝 *Observações:* ${customerData.notes}`;
    }

    message += `\n\nOlá, gostaria de confirmar a disponibilidade e finalizar este pedido por aqui!`;

    return buildWhatsAppLink(message);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        subtotalCents,
        totalItems,
        freeShippingThreshold,
        freeShippingProgress,
        remainingForFreeShipping,
        generateWhatsAppLink,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
