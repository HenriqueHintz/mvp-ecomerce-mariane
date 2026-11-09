import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const brands = sqliteTable("brands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  description: text("description"),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  displayOrder: integer("display_order").default(0),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku"),
  brandId: text("brand_id").references(() => brands.id),
  categoryId: text("category_id").references(() => categories.id),
  price: real("price").notNull(),
  promoPrice: real("promo_price"),
  // Fase 1: Centavos inteiros preservando retrocompatibilidade com legado
  priceCents: integer("price_cents"),
  promoPriceCents: integer("promo_price_cents"),
  installmentCount: integer("installment_count").default(10),
  installmentValue: real("installment_value"),
  pixDiscountPercent: real("pix_discount_percent").default(5),
  stock: integer("stock").default(15),
  description: text("description"),
  howToUse: text("how_to_use"),
  volume: text("volume"),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  isFeatured: integer("is_featured").default(0),
  isBestSeller: integer("is_best_seller").default(0),
  createdAt: text("created_at"),
});

export const productImages = sqliteTable("product_images", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  url: text("url").notNull(),
  isPrimary: integer("is_primary").default(0),
  displayOrder: integer("display_order").default(0),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(), // Código humano curto: MC-AAAAMMDD-XXXXXX
    // Token público de 128 bits para consulta pública (/pedido/[token])
    publicToken: text("public_token"),
    idempotencyKey: text("idempotency_key").unique(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    channel: text("channel").default("whatsapp"), // 'whatsapp' | 'online'
    status: text("status").default("aguardando_confirmacao"),
    // Valores legados (real)
    total: real("total").notNull(),
    // Novos campos em centavos inteiros (Fase 1 - Expand)
    subtotalCents: integer("subtotal_cents"),
    shippingCents: integer("shipping_cents"),
    discountCents: integer("discount_cents"),
    totalCents: integer("total_cents"),
    deliveryMode: text("delivery_mode").default("entrega"), // 'entrega' | 'retirada'
    paymentMethod: text("payment_method"),
    shippingAddress: text("shipping_address"),
    notes: text("notes"),
    marketingConsent: integer("marketing_consent").default(0), // 0: não, 1: sim
    expiresAt: text("expires_at"),
    createdAt: text("created_at"),
  },
  (table) => ({
    publicTokenIdx: uniqueIndex("idx_orders_public_token").on(table.publicToken),
    statusCreatedIdx: index("idx_orders_status_created").on(table.status, table.createdAt),
  })
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    unitPriceCents: integer("unit_price_cents"),
    lineTotalCents: integer("line_total_cents"),
  },
  (table) => ({
    orderIdIdx: index("idx_order_items_order_id").on(table.orderId),
  })
);

export const orderStatusHistory = sqliteTable(
  "order_status_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actor: text("actor").notNull(), // 'customer' | 'admin' | 'webhook_asaas' | 'system_expiration'
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    orderIdIdx: index("idx_order_status_history_order_id").on(table.orderId),
    orderCreatedAtIdx: index("idx_order_status_history_order_created").on(
      table.orderId,
      table.createdAt
    ),
  })
);

export const paymentWebhooks = sqliteTable("payment_webhooks", {
  eventId: text("event_id").primaryKey(),
  orderId: text("order_id").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  payload: text("payload"),
  processedAt: text("processed_at").notNull(),
});

export type Brand = typeof brands.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;
