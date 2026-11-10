import crypto from "crypto";
import { db, orders, orderItems, orderStatusHistory, products } from "@/db";
import { desc, eq, inArray, and, lt, or, sql } from "drizzle-orm";
import { withSqliteWriteLock } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/order-state-machine";

export interface QueryAdminOrdersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function escapeLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, "\\$&");
}

let lastSweepMs = 0;

export async function sweepExpiredPendingOrders(force = false): Promise<number> {
  const nowMs = Date.now();
  if (!force && nowMs - lastSweepMs < 15_000) {
    return 0;
  }
  lastSweepMs = nowMs;

  const nowIso = new Date(nowMs).toISOString();
  const expiredCandidates = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(
      and(
        inArray(orders.status, [
          "aguardando_confirmacao",
          "aguardando_pagamento",
          "aguardando pagamento",
        ]),
        lt(orders.expiresAt, nowIso)
      )
    )
    .limit(50);

  if (expiredCandidates.length === 0) {
    return 0;
  }

  return await withSqliteWriteLock(() =>
    db.transaction(async (tx) => {
      let expiredCount = 0;
      for (const candidate of expiredCandidates) {
        const rawStatus = candidate.status || "aguardando_pagamento";
        const normalizedFrom =
          rawStatus === "aguardando pagamento"
            ? "aguardando_pagamento"
            : rawStatus;

        const updateRes = await tx
          .update(orders)
          .set({ status: "expirado" })
          .where(and(eq(orders.id, candidate.id), eq(orders.status, rawStatus)));

        if (updateRes.rowsAffected === 0) continue;

        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, candidate.id));

        for (const item of items) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }

        await tx.insert(orderStatusHistory).values({
          id: `hist_${candidate.id}_${crypto.randomUUID()}`,
          orderId: candidate.id,
          fromStatus: normalizedFrom,
          toStatus: "expirado",
          actor: "system_expiration",
          notes: "Expiração automática ao carregar o painel da loja",
          createdAt: nowIso,
        });
        expiredCount++;
      }
      return expiredCount;
    })
  );
}

export async function queryAdminOrders(params: QueryAdminOrdersParams = {}) {
  // 1. Limpeza preguiçosa em lote único (Lazy Expiration) de pedidos pendentes vencidos (Especificação Seção H.2)
  const isInitialList = !params.search || params.search.trim() === "";
  await sweepExpiredPendingOrders(isInitialList);

  // 2. Sanitização de paginação e filtros (limit <= 100 conforme regra de arquitetura)
  const statusFilter = (params.status || "").trim();
  const search = (params.search || "").trim().slice(0, 120);
  const rawLimit = Number(params.limit ?? 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 20));
  const rawPage = Number(params.page ?? 1);
  const page = Math.max(1, Number.isFinite(rawPage) ? Math.floor(rawPage) : 1);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (statusFilter && statusFilter !== "todos") {
    if (statusFilter === "aguardando_pagamento") {
      conditions.push(
        inArray(orders.status, ["aguardando_pagamento", "aguardando pagamento"])
      );
    } else if (statusFilter in ORDER_STATUS_LABELS) {
      conditions.push(eq(orders.status, statusFilter));
    }
  }

  if (search) {
    const escaped = `%${escapeLikePattern(search)}%`;
    const searchDigits = search.replace(/\D/g, "");
    const searchClauses = [
      sql`${orders.id} LIKE ${escaped} ESCAPE '\\'`,
      sql`${orders.customerPhone} LIKE ${escaped} ESCAPE '\\'`,
      sql`${orders.customerName} LIKE ${escaped} ESCAPE '\\'`,
    ];

    if (searchDigits.length >= 4) {
      const escapedDigits = `%${escapeLikePattern(searchDigits)}%`;
      searchClauses.push(
        sql`REPLACE(REPLACE(REPLACE(REPLACE(${orders.customerPhone}, '(', ''), ')', ''), '-', ''), ' ', '') LIKE ${escapedDigits} ESCAPE '\\'`
      );
    }

    conditions.push(or(...searchClauses));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countRows = whereClause
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause)
    : await db.select({ count: sql<number>`count(*)` }).from(orders);

  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const orderRows = whereClause
    ? await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset)
    : await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

  const orderIds = orderRows.map((o) => o.id);
  const itemsRows =
    orderIds.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];
  const historyRows =
    orderIds.length > 0
      ? await db
          .select()
          .from(orderStatusHistory)
          .where(inArray(orderStatusHistory.orderId, orderIds))
          .orderBy(desc(orderStatusHistory.createdAt))
      : [];

  const itemsByOrderId = new Map<string, typeof itemsRows>();
  for (const item of itemsRows) {
    const bucket = itemsByOrderId.get(item.orderId);
    if (bucket) {
      bucket.push(item);
    } else {
      itemsByOrderId.set(item.orderId, [item]);
    }
  }

  const historyByOrderId = new Map<string, typeof historyRows>();
  for (const hist of historyRows) {
    const bucket = historyByOrderId.get(hist.orderId);
    if (bucket) {
      bucket.push(hist);
    } else {
      historyByOrderId.set(hist.orderId, [hist]);
    }
  }

  const enriched = orderRows.map((o) => ({
    ...o,
    items: itemsByOrderId.get(o.id) || [],
    history: historyByOrderId.get(o.id) || [],
  }));

  return {
    orders: enriched,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
