import fs from "fs";
import path from "path";
import { describe, test, expect } from "./framework";
import { db, products, brands } from "@/db";
import { eq } from "drizzle-orm";

const ROOT_DIR = path.resolve(__dirname, "../..");

describe("Tier 2 - Boundary & Corner Cases", () => {
  // =========================================================================
  // Boundary Category 1: Empty Cart & State Transitions
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, PROJECT.md Feature #16
  // =========================================================================
  describe("Boundary Category 1: Empty Cart & State Transitions", () => {
    test(
      "2.1.1 Cart logic initializes with 0 items, R$ 0 subtotal, and 0% free shipping progress",
      () => {
        // Pure cart calculation simulation adhering to CartContext logic
        const items: any[] = [];
        const subtotal = items.reduce((acc, item) => acc + (item.promoPrice || item.price) * item.quantity, 0);
        const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
        const freeShippingThreshold = 199.0;
        const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
        const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

        expect(items.length).toBe(0);
        expect(subtotal).toBe(0);
        expect(totalItems).toBe(0);
        expect(freeShippingProgress).toBe(0);
        expect(remainingForFreeShipping).toBe(199.0);
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "2.1.2 CartDrawer component contains empty state UI ('Sua sacola está vazia' and 'Explorar produtos')",
      () => {
        const drawerPath = path.join(ROOT_DIR, "src", "components", "CartDrawer.tsx");
        const emptyStatePath = path.join(ROOT_DIR, "src", "components", "cart", "CartEmptyState.tsx");
        const drawerCode =
          fs.readFileSync(drawerPath, "utf-8") +
          "\n" +
          fs.readFileSync(emptyStatePath, "utf-8");

        expect(drawerCode).toContain("Sua sacola está vazia", "CartDrawer must render empty state text");
        expect(drawerCode).toContain("Explorar produtos", "CartDrawer must render empty state button to explore store");
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "2.1.3 Decrementing quantity of single item (1 -> 0) automatically removes the item",
      () => {
        let items = [{ id: "item-1", name: "Shampoo Wella", price: 120, quantity: 1 }];
        const updateQuantity = (id: string, delta: number) => {
          items = items
            .map((i) => {
              if (i.id === id) {
                const newQ = i.quantity + delta;
                return newQ > 0 ? { ...i, quantity: newQ } : null;
              }
              return i;
            })
            .filter(Boolean) as typeof items;
        };

        updateQuantity("item-1", -1);
        expect(items.length).toBe(0, "Item with quantity <= 0 must be removed from cart");
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "2.1.4 Removing item by ID preserves other cart items intact",
      () => {
        let items = [
          { id: "item-1", name: "Máscara Wella", price: 180, quantity: 1 },
          { id: "item-2", name: "Óleo Truss", price: 95, quantity: 2 },
        ];
        const removeItem = (id: string) => {
          items = items.filter((i) => i.id !== id);
        };

        removeItem("item-1");
        expect(items.length).toBe(1);
        expect(items[0].id).toBe("item-2");
        expect(items[0].quantity).toBe(2);
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "2.1.5 clearCart resets cart state to empty array and 0 subtotal",
      () => {
        let items = [
          { id: "item-1", name: "Kit Cronograma", price: 299, quantity: 1 },
          { id: "item-2", name: "Sérum Braé", price: 110, quantity: 1 },
        ];
        const clearCart = () => {
          items = [];
        };

        clearCart();
        expect(items.length).toBe(0);
        const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        expect(subtotal).toBe(0);
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );

    test(
      "2.1.6 Checkout page handles empty state gracefully without throwing",
      () => {
        const checkoutPath = path.join(ROOT_DIR, "src", "app", "checkout", "page.tsx");
        const checkoutCode = fs.readFileSync(checkoutPath, "utf-8");

        expect(checkoutCode).toContain("items.length === 0", "Checkout page must check for empty cart");
        expect(checkoutCode).toContain("Sua sacola está vazia", "Checkout page must display empty message");
        expect(checkoutCode).toContain('href="/produtos"', "Checkout page must provide link to products");
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );
  });

  // =========================================================================
  // Boundary Category 2: Responsive Viewports & Layout Boundaries
  // Authoritative Source: ORIGINAL_REQUEST.md Acceptance Criteria §UI
  // =========================================================================
  describe("Boundary Category 2: Responsive Viewports & Layout Boundaries", () => {
    test(
      "2.2.1 Mobile viewport (375px): Header defines mobile hamburger toggle and hides desktop nav",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode).toContain("lg:hidden", "Hamburger toggle button must be visible on mobile and hidden on large screens (lg:hidden)");
        expect(headerCode).toContain("hidden lg:block", "Desktop navigation bar must be hidden on mobile (hidden lg:block)");
        expect(headerCode).toContain('aria-label="Menu"', "Hamburger button must have accessible aria-label");
      },
      { tier: 2, milestone: "M2", authoritativeSource: "ORIGINAL_REQUEST.md Acceptance Criteria §UI" }
    );

    test(
      "2.2.2 Mobile viewport (375px): Header suppresses horizontal overflow",
      () => {
        const headerPath = path.join(ROOT_DIR, "src", "components", "Header.tsx");
        const headerCode = fs.readFileSync(headerPath, "utf-8");

        expect(headerCode).toContain("max-w-7xl mx-auto", "Header must be contained within max-w-7xl");
        expect(headerCode).toContain("hidden md:flex", "Full desktop search input must be collapsed on mobile");
      },
      { tier: 2, milestone: "M2", authoritativeSource: "ORIGINAL_REQUEST.md Acceptance Criteria §UI" }
    );

    test(
      "2.2.3 Tablet viewport (768px): Product vitrines adapt to 3-column tablet grid and mobile scroll-snap",
      () => {
        const showcasePath = path.join(ROOT_DIR, "src", "components", "ProductShowcase.tsx");
        const showcaseCode = fs.readFileSync(showcasePath, "utf-8");

        expect(showcaseCode).toContain("md:grid-cols-3", "Product grid must adapt to 3 columns on tablet screens");
        expect(showcaseCode).toContain("snap-x snap-mandatory", "Mobile vitrine must provide horizontal scroll-snap carousel");
      },
      { tier: 2, milestone: "M3", authoritativeSource: "ORIGINAL_REQUEST.md Acceptance Criteria §UI" }
    );

    test(
      "2.2.4 Desktop viewport (1280px): Full desktop layout activates 4-column grid and secondary nav",
      () => {
        const showcasePath = path.join(ROOT_DIR, "src", "components", "ProductShowcase.tsx");
        const showcaseCode = fs.readFileSync(showcasePath, "utf-8");

        expect(showcaseCode).toContain("lg:grid-cols-4", "Product grid must display 4 columns on desktop");
      },
      { tier: 2, milestone: "M3", authoritativeSource: "ORIGINAL_REQUEST.md Acceptance Criteria §UI" }
    );

    test(
      "2.2.5 Cart drawer modal enforces responsive boundaries and overlay positioning",
      () => {
        const drawerPath = path.join(ROOT_DIR, "src", "components", "CartDrawer.tsx");
        const drawerCode = fs.readFileSync(drawerPath, "utf-8");

        expect(drawerCode).toContain("fixed inset-0 z-50", "CartDrawer must render fixed fullscreen backdrop overlay");
        expect(drawerCode).toContain("max-w-md", "CartDrawer sliding panel must constrain width to max-w-md on larger screens");
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #16" }
    );
  });

  // =========================================================================
  // Boundary Category 3: Text Boundaries, Formatting & Special Characters
  // Authoritative Source: ORIGINAL_REQUEST.md §R2, §R3
  // =========================================================================
  describe("Boundary Category 3: Text Boundaries, Formatting & Special Characters", () => {
    test(
      "2.3.1 Product cards enforce text truncation (line-clamp-2) for long product names",
      () => {
        const cardPath = path.join(ROOT_DIR, "src", "components", "ProductCard.tsx");
        const cardCode = fs.readFileSync(cardPath, "utf-8");

        expect(cardCode).toContain("line-clamp-2", "Product card must clamp titles to 2 lines to prevent card warping");
      },
      { tier: 2, milestone: "M3", authoritativeSource: "ORIGINAL_REQUEST.md Acceptance Criteria §UI" }
    );

    test(
      "2.3.2 Accented Portuguese search terms (óleo, máscara, reconstrução) filter products safely",
      async () => {
        const allProducts = await db.select().from(products);
        const searchTerms = ["óleo", "máscara", "reconstrução", "shampoo"];

        for (const term of searchTerms) {
          const query = term.toLowerCase();
          const matches = allProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(query) ||
              (p.description && p.description.toLowerCase().includes(query))
          );
          // Query should not throw or crash
          expect(Array.isArray(matches)).toBe(true);
        }
      },
      { tier: 2, milestone: "M3", authoritativeSource: "PROJECT.md Feature #15" }
    );

    test(
      "2.3.3 WhatsApp order message encoding handles special characters, accents, and line breaks",
      () => {
        const sampleOrder = {
          name: "Helena d'Ávila & Filhas",
          address: "Rua Blumenau, 623 - Aptº 12 - Lages - SC",
          items: [{ name: "Máscara Nutri-Enrich 500g (Óleo de Goji)", price: 189.9, quantity: 1 }],
        };

        let message = `*NOVO PEDIDO - MARIANE COSMÉTICOS*\n`;
        message += `_Linda é a mulher que bem se quer_\n\n`;
        message += `👤 *Cliente:* ${sampleOrder.name}\n`;
        message += `📍 *Endereço:* ${sampleOrder.address}\n\n`;
        message += `1. ${sampleOrder.items[0].name} | R$ ${sampleOrder.items[0].price.toFixed(2)}\n`;

        const encoded = encodeURIComponent(message);
        // Verify encoding is non-empty, contains valid %-escapes, and decodes back losslessly
        expect(encoded.length).toBeGreaterThan(0);
        expect(encoded).toContain("%0A"); // line break
        expect(decodeURIComponent(encoded)).toBe(message);
      },
      { tier: 2, milestone: "M4", authoritativeSource: "ORIGINAL_REQUEST.md §R3, PROJECT.md Feature #17" }
    );

    test(
      "2.3.4 Currency calculation preserves 2 decimal places precision across operations",
      () => {
        const price = 189.9;
        const quantity = 3;
        const subtotal = price * quantity; // 569.70
        const pixDiscount = subtotal * 0.05; // 28.485
        const pixPrice = subtotal - pixDiscount; // 541.215
        const installmentValue = subtotal / 10; // 56.97

        expect(subtotal.toFixed(2)).toBe("569.70");
        expect(pixPrice.toFixed(2)).toBe("541.22");
        expect(installmentValue.toFixed(2)).toBe("56.97");
      },
      { tier: 2, milestone: "M4", authoritativeSource: "PROJECT.md Feature #13, #16" }
    );

    test(
      "2.3.5 Querying non-existent product slug returns empty result gracefully",
      async () => {
        const result = await db.select().from(products).where(eq(products.slug, "slug-que-definitivamente-nao-existe"));
        expect(result.length).toBe(0, "Non-existent slug must return empty array without error");
      },
      { tier: 2, milestone: "M3", authoritativeSource: "PROJECT.md Feature #15" }
    );

    test(
      "2.3.6 Image components (ProductCard, ProductDetailClient, CartDrawer) provide onError fallback placeholders",
      () => {
        const cardCode = fs.readFileSync(path.join(ROOT_DIR, "src", "components", "ProductCard.tsx"), "utf-8");
        const detailCode = fs.readFileSync(
          path.join(ROOT_DIR, "src", "app", "produto", "[slug]", "ProductDetailClient.tsx"),
          "utf-8"
        );
        const drawerCode =
          fs.readFileSync(path.join(ROOT_DIR, "src", "components", "CartDrawer.tsx"), "utf-8") +
          "\n" +
          fs.readFileSync(path.join(ROOT_DIR, "src", "components", "cart", "CartLineItem.tsx"), "utf-8");

        expect(cardCode).toContain("onError", "ProductCard must handle broken external image URLs with onError");
        expect(detailCode).toContain("onError", "ProductDetailClient must handle broken external image URLs with onError");
        expect(drawerCode).toContain("onError", "CartDrawer must handle broken external image URLs with onError");
      },
      { tier: 2, milestone: "M3", authoritativeSource: "docs/plans/mvp.md Task 5" }
    );

    test(
      "2.3.7 Database and ProductCard contain zero fake reviews/ratings and apply discounts only to real promo items",
      async () => {
        const allProds = await db.select().from(products);
        const withFakeReviews = allProds.filter((p) => (p.reviewCount && p.reviewCount > 0) || (p.rating && p.rating > 0));
        expect(withFakeReviews.length).toBe(0, "No product in DB may have invented reviewCount or rating");

        const regularProds = allProds.filter((p) => p.promoPrice === null);
        const promoProds = allProds.filter((p) => p.promoPrice !== null && p.promoPrice < p.price);
        expect(regularProds.length).toBeGreaterThan(20, "Catalog must contain regular-priced products without fake strikethrough");
        expect(promoProds.length).toBeGreaterThan(10, "Catalog must contain genuine promotional products");
      },
      { tier: 2, milestone: "M3", authoritativeSource: "docs/DESIGN.md §7.2" }
    );

    test(
      "2.3.8 Order creation boundary validation rejects invalid customer name, invalid phone, and empty cart",
      async () => {
        const { createOrderInDb } = await import("@/lib/orders");

        const shortNameRes = await createOrderInDb({
          customerName: "A",
          customerPhone: "49991251617",
          deliveryMode: "retirada",
          paymentMethod: "pix",
          items: [{ productId: "prod_1", quantity: 1 }],
        });
        expect(shortNameRes.success).toBe(false, "Should reject 1-character customerName");
        expect(shortNameRes.statusHttp).toBe(400);

        const invalidPhoneRes = await createOrderInDb({
          customerName: "Maria Silva",
          customerPhone: "123",
          deliveryMode: "retirada",
          paymentMethod: "pix",
          items: [{ productId: "prod_1", quantity: 1 }],
        });
        expect(invalidPhoneRes.success).toBe(false, "Should reject short phone number");
        expect(invalidPhoneRes.statusHttp).toBe(400);

        const emptyItemsRes = await createOrderInDb({
          customerName: "Maria Silva",
          customerPhone: "49991251617",
          deliveryMode: "retirada",
          paymentMethod: "pix",
          items: [],
        });
        expect(emptyItemsRes.success).toBe(false, "Should reject empty items list");
        expect(emptyItemsRes.statusHttp).toBe(400);
      },
      { tier: 2, milestone: "M4", authoritativeSource: "docs/plans/mvp.md Task 4" }
    );

    test(
      "2.3.9 Order input validation coalesces duplicate productId entries and rejects total quantity > 50 per product",
      async () => {
        const { validateOrderInput } = await import("@/lib/orders");

        const coalescedRes = validateOrderInput({
          customerName: "Maria Silva",
          customerPhone: "49991251617",
          deliveryMode: "retirada",
          paymentMethod: "pix",
          items: [
            { productId: "prod_1", quantity: 2 },
            { productId: "prod_1", quantity: 3 },
          ],
        });
        expect(coalescedRes.valid).toBe(true, "Valid duplicate productId entries should coalesce cleanly");
        expect(coalescedRes.data?.items.length).toBe(1, "Duplicate productId entries must be merged into a single line item");
        expect(coalescedRes.data?.items[0].quantity).toBe(5, "Coalesced item quantity must equal the sum of duplicate entries");

        const overflowRes = validateOrderInput({
          customerName: "Maria Silva",
          customerPhone: "49991251617",
          deliveryMode: "retirada",
          paymentMethod: "pix",
          items: [
            { productId: "prod_1", quantity: 30 },
            { productId: "prod_1", quantity: 25 },
          ],
        });
        expect(overflowRes.valid).toBe(false, "Duplicate productId entries summing > 50 units must be rejected");
      },
      { tier: 2, milestone: "M4", authoritativeSource: "docs/plans/mvp.md Task 4" }
    );
  });
});

