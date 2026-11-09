"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  brandName?: string | null;
  price: number;
  promoPrice?: number | null;
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

  const freeShippingThreshold = 199.0;

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

  const subtotal = items.reduce((acc, item) => {
    const price =
      item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
        ? item.promoPrice
        : item.price;
    return acc + price * item.quantity;
  }, 0);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const generateWhatsAppLink = (customerData?: WhatsAppOrderCustomerData) => {
    const phoneNumber = "5549991251617"; // Número oficial Mariane Cosméticos (Lages - SC)
    if (items.length === 0) {
      return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        "Olá, Mariane Cosméticos! Gostaria de tirar uma dúvida sobre os produtos."
      )}`;
    }

    let message = `*NOVO PEDIDO - MARIANE COSMÉTICOS*\n`;
    message += `_Linda é a mulher que bem se quer_\n`;
    message += `📍 _Rua Blumenau, Nº 623, Lages - SC (CEP: 88505-300)_\n\n`;

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

    items.forEach((item, idx) => {
      const price =
        item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
          ? item.promoPrice
          : item.price;
      message += `${idx + 1}. ${item.name} (${item.brandName || "Cosméticos"})\n`;
      message += `   Qtd: ${item.quantity}x | R$ ${price.toFixed(2)} un. -> *R$ ${(
        price * item.quantity
      ).toFixed(2)}*\n`;
    });

    message += `\n💰 *Subtotal:* R$ ${subtotal.toFixed(2)}`;
    message += `\n💎 *No PIX (5% OFF):* R$ ${(subtotal * 0.95).toFixed(2)}`;
    if (subtotal >= freeShippingThreshold) {
      message += `\n🚚 *Frete:* GRÁTIS 🎉`;
    } else {
      message += `\n🚚 *Frete:* A calcular`;
    }

    if (customerData?.notes) {
      message += `\n📝 *Observações:* ${customerData.notes}`;
    }

    message += `\n\nOlá, gostaria de confirmar a disponibilidade e finalizar este pedido por aqui!`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
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
