# Centavos Inteiros e Migração Expand-Migrate-Contract para Valores Monetários

Status: accepted

Operar preços, descontos, fretes e totais de pedidos em ponto flutuante (`REAL` / IEEE 754) causava dízimas binárias e divergências de centavos entre a Sacola de Compras, a Cotação do Pedido e a validação de Webhooks do gateway Asaas. Decidimos representar e calcular todo valor monetário exclusivamente em centavos inteiros (`integer` no SQLite e inteiros seguros em TypeScript via módulo puro `src/lib/pricing.ts`), adotando o padrão *Expand → Migrate → Contract* no banco (`price_cents`, `promo_price_cents`, `subtotal_cents`, `shipping_cents`, `discount_cents`, `total_cents`, `unit_price_cents`, `line_total_cents` coexistindo temporariamente com as colunas `REAL` legadas) para não quebrar os 57 testes E2E legados durante a transição.
