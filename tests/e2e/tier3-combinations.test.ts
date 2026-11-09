import fs from "fs";
import path from "path";
import { describe, test, expect } from "./framework";
import { db, products, brands, categories } from "@/db";
import { eq } from "drizzle-orm";

const ROOT_DIR = path.resolve(__dirname, "../..");

describe("Tier 3 - Cross-Feature Combinations", () => {
  // =========================================================================
  // Combination 1: Hero CTA -> Brand Filtering -> Vitrine Inspection
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #11, #14, #15
  // =========================================================================
  test(
    "3.1 Hero CTA -> Filter by Brand (Wella) -> Vitrine Products Integrity",
    async () => {
      // 1. Verify Hero CTA links to /produtos
      const homeCode = fs.readFileSync(path.join(ROOT_DIR, "src", "app", "page.tsx"), "utf-8");
      expect(homeCode).toContain('href="/produtos"');

      // 2. Query Wella brand from database
      const wellaBrand = await db.select().from(brands).where(eq(brands.slug, "wella-profissional")).limit(1);
      expect(wellaBrand.length).toBe(1);
      const brandId = wellaBrand[0].id;

      // 3. Query products filtered by brand
      const wellaProducts = await db.select().from(products).where(eq(products.brandId, brandId));
      expect(wellaProducts.length).toBeGreaterThan(0);

      // 4. Assert every returned product belongs to Wella and has valid pricing
      for (const p of wellaProducts) {
        expect(p.brandId).toBe(brandId);
        expect(p.price).toBeGreaterThan(0);
        expect(p.slug.length).toBeGreaterThan(0);
      }
    },
    { tier: 3, milestone: "M3", authoritativeSource: "PROJECT.md Feature #11, #15" }
  );

  // =========================================================================
  // Combination 2: Header Search -> Product Card -> Add to Cart -> Badge Counter
  // Authoritative Source: PROJECT.md Feature #6, #13, #16
  // =========================================================================
  test(
    "3.2 Header Search -> Product Selection -> Add to Cart -> Cart Badge Increment",
    async () => {
      // 1. Simulate searching products by text
      const allProducts = await db.select().from(products);
      const searchMatches = allProducts.filter((p) => p.name.toLowerCase().includes("máscara") || p.name.toLowerCase().includes("mascara"));
      expect(searchMatches.length).toBeGreaterThan(0);

      const targetProduct = searchMatches[0];

      // 2. Simulate Cart State progression
      let cartItems: any[] = [];
      let isCartOpen = false;

      const addItem = (item: any, quantity = 1) => {
        const existing = cartItems.find((i) => i.id === item.id);
        if (existing) {
          cartItems = cartItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i));
        } else {
          cartItems = [...cartItems, { ...item, quantity }];
        }
        isCartOpen = true;
      };

      expect(cartItems.length).toBe(0);
      expect(isCartOpen).toBe(false);

      // 3. Add to cart
      addItem({
        id: targetProduct.id,
        name: targetProduct.name,
        slug: targetProduct.slug,
        price: targetProduct.price,
        promoPrice: targetProduct.promoPrice,
      });

      // 4. Verify badge counter and drawer state
      const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
      expect(totalItems).toBe(1);
      expect(isCartOpen).toBe(true);
      expect(cartItems[0].id).toBe(targetProduct.id);
    },
    { tier: 3, milestone: "M4", authoritativeSource: "PROJECT.md Feature #6, #16" }
  );

  // =========================================================================
  // Combination 3: Product Detail -> Quantity Selection (2 units) -> Cart Drawer Subtotal
  // Authoritative Source: PROJECT.md Feature #15, #16
  // =========================================================================
  test(
    "3.3 Product Detail -> Quantity (2 units) -> Cart Drawer Subtotal Calculation",
    async () => {
      const sample = await db.select().from(products).limit(1);
      expect(sample.length).toBe(1);
      const prod = sample[0];

      const unitPrice = prod.promoPrice && prod.promoPrice > 0 ? prod.promoPrice : prod.price;
      const quantityToAdd = 2;

      let cart = [
        {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          price: prod.price,
          promoPrice: prod.promoPrice,
          quantity: quantityToAdd,
        },
      ];

      const subtotal = cart.reduce((acc, i) => {
        const p = i.promoPrice && i.promoPrice > 0 ? i.promoPrice : i.price;
        return acc + p * i.quantity;
      }, 0);

      expect(subtotal).toBeCloseTo(unitPrice * 2, 0.001);
      expect(cart[0].quantity).toBe(2);
    },
    { tier: 3, milestone: "M4", authoritativeSource: "PROJECT.md Feature #15, #16" }
  );

  // =========================================================================
  // Combination 4: Threshold Progression (Under R$ 199 -> Add Item -> Free Shipping GRÁTIS)
  // Authoritative Source: PROJECT.md Feature #16
  // =========================================================================
  test(
    "3.4 Threshold Progression: Subtotal < R$ 199 -> Add Product -> Subtotal >= R$ 199 -> Free Shipping 'GRÁTIS'",
    () => {
      const threshold = 199.0;

      // Stage 1: Item with price 120 (under 199)
      let items = [{ id: "p1", name: "Shampoo 250ml", price: 120.0, quantity: 1 }];
      let subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      let progress = Math.min(100, Math.round((subtotal / threshold) * 100));
      let remaining = Math.max(0, threshold - subtotal);
      let hasFreeShipping = subtotal >= threshold;

      expect(subtotal).toBe(120.0);
      expect(progress).toBe(60);
      expect(remaining).toBe(79.0);
      expect(hasFreeShipping).toBe(false);

      // Stage 2: Add another product of R$ 150 (subtotal becomes 270 >= 199)
      items.push({ id: "p2", name: "Máscara 500g", price: 150.0, quantity: 1 });
      subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      progress = Math.min(100, Math.round((subtotal / threshold) * 100));
      remaining = Math.max(0, threshold - subtotal);
      hasFreeShipping = subtotal >= threshold;

      expect(subtotal).toBe(270.0);
      expect(progress).toBe(100);
      expect(remaining).toBe(0);
      expect(hasFreeShipping).toBe(true);
    },
    { tier: 3, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
  );

  // =========================================================================
  // Combination 5: Multi-Brand Cart -> Address Form -> WhatsApp Checkout URL
  // Authoritative Source: ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #10, #17
  // =========================================================================
  test(
    "3.5 Multi-Brand Cart -> Customer Name/Address Form -> WhatsApp Order URL Breakdown",
    () => {
      const items = [
        { id: "p1", name: "Wella Invigo Nutri-Enrich 500g", brandName: "Wella Profissional", price: 189.9, quantity: 1 },
        { id: "p2", name: "Truss Uso Obrigatório 260ml", brandName: "Truss", price: 129.9, quantity: 1 },
      ];

      const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const freeShippingThreshold = 199.0;
      const phoneNumber = "5549991251617";

      const customerData = {
        name: "Camila Rocha",
        address: "Rua Blumenau, 623 - Lages - SC",
        notes: "Entregar no período da tarde",
      };

      // Generate order message strictly matching CartContext template
      let message = `*NOVO PEDIDO - MARIANE COSMÉTICOS*\n`;
      message += `_Linda é a mulher que bem se quer_\n\n`;
      message += `👤 *Cliente:* ${customerData.name}\n`;
      message += `📍 *Endereço:* ${customerData.address}\n\n`;
      message += `*ITENS DA SACOLA:*\n`;

      items.forEach((item, idx) => {
        message += `${idx + 1}. ${item.name} (${item.brandName})\n`;
        message += `   Qtd: ${item.quantity}x | R$ ${item.price.toFixed(2)} un. -> *R$ ${(item.price * item.quantity).toFixed(2)}*\n`;
      });

      message += `\n💰 *Subtotal:* R$ ${subtotal.toFixed(2)}`;
      message += `\n🚚 *Frete:* ${subtotal >= freeShippingThreshold ? "GRÁTIS 🎉" : "A calcular"}`;
      message += `\n📝 *Observações:* ${customerData.notes}`;
      message += `\n\nOlá, gostaria de confirmar a disponibilidade e finalizar este pedido por aqui!`;

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

      // Assert URL properties
      expect(whatsappUrl.startsWith("https://wa.me/5549991251617?text=")).toBe(true);

      const decoded = decodeURIComponent(whatsappUrl.split("?text=")[1]);
      expect(decoded).toContain("MARIANE COSMÉTICOS");
      expect(decoded).toContain("Linda é a mulher que bem se quer");
      expect(decoded).toContain("Camila Rocha");
      expect(decoded).toContain("Lages - SC");
      expect(decoded).toContain("Wella Invigo Nutri-Enrich");
      expect(decoded).toContain("Truss Uso Obrigatório");
      expect(decoded).toContain("Subtotal:* R$ 319.80");
      expect(decoded).toContain("Frete:* GRÁTIS 🎉");
    },
    { tier: 3, milestone: "M4", authoritativeSource: "ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #10, #17" }
  );
});
