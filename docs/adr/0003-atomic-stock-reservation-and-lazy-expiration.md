# Reserva Atômica de Estoque Ordenada e Expiração Preguiçosa (Lazy Expiration)

Status: accepted

A criação de pedidos fora de transação e sem dedução de estoque permitia sobrevenda (*overselling*) do último item e pedidos órfãos em falhas parciais. Decidimos executar toda a criação de pedido dentro de uma única transação SQLite/LibSQL (`WAL` + `busy_timeout = 5000`), ordenando os itens alfabeticamente por `productId` e aplicando `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty` (falhando com HTTP 409 se `rowsAffected === 0`). Para liberar o estoque de pedidos abandonados sem introduzir infraestrutura externa de filas ou cron (Redis/BullMQ) no MVP serverless, adotamos **Lazy Expiration** (24h) disparada na leitura do pedido e na abertura do painel administrativo, registrando alerta em `order_status_history` caso um pagamento tardio chegue via webhook após a expiração.
