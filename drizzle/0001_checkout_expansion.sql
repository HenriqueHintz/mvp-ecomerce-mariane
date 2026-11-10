-- ============================================================================
-- Migration 0001 (UP): Checkout Expansion (Expand -> Migrate -> Contract)
-- Zero-downtime additive schema changes, indexes, backfill and stock guard
-- ============================================================================

-- 1. Expansão aditiva de colunas em centavos inteiros em products
ALTER TABLE products ADD COLUMN price_cents INTEGER;
ALTER TABLE products ADD COLUMN promo_price_cents INTEGER;

-- 2. Expansão aditiva em orders
ALTER TABLE orders ADD COLUMN public_token TEXT;
ALTER TABLE orders ADD COLUMN idempotency_key TEXT;
ALTER TABLE orders ADD COLUMN subtotal_cents INTEGER;
ALTER TABLE orders ADD COLUMN shipping_cents INTEGER;
ALTER TABLE orders ADD COLUMN discount_cents INTEGER;
ALTER TABLE orders ADD COLUMN total_cents INTEGER;
ALTER TABLE orders ADD COLUMN delivery_mode TEXT DEFAULT 'entrega';
ALTER TABLE orders ADD COLUMN marketing_consent INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN expires_at TEXT;

-- 3. Expansão aditiva em order_items
ALTER TABLE order_items ADD COLUMN unit_price_cents INTEGER;
ALTER TABLE order_items ADD COLUMN line_total_cents INTEGER;

-- 4. Nova tabela de trilha de auditoria de status (order_status_history)
CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

-- 5. Índices de performance B-Tree (compostos e únicos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_token ON orders(public_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created ON order_status_history(order_id, created_at);

-- 6. Guard de integridade de estoque não-negativo no engine SQLite (equivalente a CHECK (stock >= 0))
CREATE TRIGGER IF NOT EXISTS trg_products_stock_non_negative_insert
BEFORE INSERT ON products
FOR EACH ROW
WHEN NEW.stock < 0
BEGIN
  SELECT RAISE(ABORT, 'CHECK constraint failed: products.stock >= 0');
END;

CREATE TRIGGER IF NOT EXISTS trg_products_stock_non_negative_update
BEFORE UPDATE OF stock ON products
FOR EACH ROW
WHEN NEW.stock < 0
BEGIN
  SELECT RAISE(ABORT, 'CHECK constraint failed: products.stock >= 0');
END;

-- 7. Backfill idempotente de registros legados
UPDATE products
SET price_cents = CAST(ROUND(price * 100) AS INTEGER),
    promo_price_cents = CASE WHEN promo_price IS NOT NULL AND promo_price > 0 THEN CAST(ROUND(promo_price * 100) AS INTEGER) ELSE NULL END
WHERE price_cents IS NULL;

UPDATE orders
SET public_token = lower(hex(randomblob(16)))
WHERE public_token IS NULL;

UPDATE orders
SET total_cents = CAST(ROUND(total * 100) AS INTEGER),
    subtotal_cents = CAST(ROUND(total * 100) AS INTEGER),
    shipping_cents = 0,
    discount_cents = 0
WHERE total_cents IS NULL;

UPDATE order_items
SET unit_price_cents = CAST(ROUND(unit_price * 100) AS INTEGER),
    line_total_cents = CAST(ROUND(unit_price * quantity * 100) AS INTEGER)
WHERE unit_price_cents IS NULL;
