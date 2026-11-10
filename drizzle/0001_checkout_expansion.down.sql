-- ============================================================================
-- Migration 0001 (DOWN / Rollback): Reversão segura da fase Expand
-- Preserva todas as tabelas e colunas legadas (products, orders, order_items)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_products_stock_non_negative_update;
DROP TRIGGER IF EXISTS trg_products_stock_non_negative_insert;

DROP INDEX IF EXISTS idx_order_status_history_order_created;
DROP INDEX IF EXISTS idx_order_status_history_order_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_orders_status_created;
DROP INDEX IF EXISTS idx_orders_idempotency_key;
DROP INDEX IF EXISTS idx_orders_public_token;

DROP TABLE IF EXISTS order_status_history;
