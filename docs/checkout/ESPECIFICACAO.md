# Especificação Técnica: Redesenho do Checkout e Finalização de Pedido (MVP)
**Projeto:** Mariane Cosméticos  
**Versão:** 1.0.0  
**Data:** 09/11/2026  
**Status:** Aguardando Aprovação (Revisão Arquitetural e Banco de Dados)

---

## 1. Diagnóstico e Evidências dos Problemas Atuais (arquivo:linha)

A análise do código-fonte legado revelou 9 problemas críticos de arquitetura, integridade financeira, concorrência e conformidade regulatória:

| # | Problema | Arquivo e Linhas | Evidência e Impacto |
|---|---|---|---|
| **1** | **Dinheiro em ponto flutuante e arredondamentos espalhados** | `src/db/schema.ts:26,27,29,30,59,76`<br>`src/context/CartContext.tsx:106,149,150,154,155`<br>`src/app/checkout/page.tsx:60-62`<br>`src/lib/orders.ts:213,224,227,230-232,288-290,293-304`<br>`src/lib/payments.ts:124,125,224` | Tabelas usam `real("price")`, `real("total")` e `real("unit_price")`. O código aplica `Math.round(... * 100) / 100` e `.toFixed(2)` arbitrariamente. Operações de ponto flutuante (`IEEE 754`) causam dízimas binárias e divergência de centavos entre cliente, servidor e gateway de pagamento. |
| **2** | **Frete, desconto PIX e dados da loja duplicados; `pixDiscountPercent` ignorado** | `src/context/CartContext.tsx:48,118,126,127,155,156`<br>`src/app/checkout/page.tsx:60,61,81,226,243`<br>`src/lib/orders.ts:81,227,230,274,276,277`<br>`src/db/schema.ts:30` | Valores fixos (frete R$ 22,90, frete grátis >= R$ 199, desconto PIX de 5%, telefone `5549991251617`, endereço e slogan) estão hardcoded simultaneamente no carrinho, checkout e rotinas de pedido. O servidor ignora `products.pixDiscountPercent` do banco de dados e aplica 5% fixo sobre o subtotal. |
| **3** | **Pedido e itens gravados fora de transação** | `src/lib/orders.ts:245-271` | `await db.insert(orders).values(...)` ocorre na linha 245, e os itens são inseridos em um laço `for` separado na linha 261, sem encapsulamento em `db.transaction(async (tx) => { ... })`. Se o banco oscilar no segundo item, o pedido fica órfão e com total inconsistente. |
| **4** | **Sem controle de estoque e sem chave de idempotência (clique duplo duplica pedidos)** | `src/lib/orders.ts:176-271`<br>`src/app/checkout/page.tsx:161-254` | A criação do pedido não consulta nem subtrai `products.stock`. Não existe parâmetro `idempotencyKey`; um clique duplo no botão "Finalizar Pedido" dispara duas requisições POST com novo ID (`generateOrderCode()`), gerando dois pedidos duplicados e cobrando em dobro. |
| **5** | **Código com 2 bytes aleatórios e consulta pública aberta por código** | `src/lib/orders.ts:172`<br>`src/app/api/pedidos/route.ts:42-72` | O sufixo do pedido usa apenas 2 bytes aleatórios (`crypto.randomBytes(2).toString("hex")`), gerando meras $16^4 = 65.536$ combinações diárias (alto risco de colisão). A rota `GET /api/pedidos?id=MC-...` permite varredura e enumeração pública de pedidos por força bruta. |
| **6** | **Status em texto livre, sem máquina de estados nem histórico** | `src/db/schema.ts:58`<br>`src/lib/orders.ts:236`<br>`src/lib/payments.ts:257-277` | Campo `status` é string solta (`text("status").default("aguardando pagamento")`). Não há validação de transições válidas, permitindo transições ilegais (ex.: de "cancelado" para "pago"), nem tabela de trilha de auditoria para saber quem alterou o status e quando. |
| **7** | **Consentimento LGPD pré-marcado** | `src/app/checkout/page.tsx:47` | O estado é inicializado com `useState(true)`. Na linha 177, obriga o consentimento para finalizar compra, violando o Art. 8º da LGPD (o consentimento deve ser livre, inequívoco e nunca pré-assinalado). A execução da compra deve se basear na base legal de *Execução de Contrato* (Art. 7º, V). |
| **8** | **Checkout com 1.270 linhas em componente único monólito** | `src/app/checkout/page.tsx:1-1270` | Um único arquivo cliente controla wizard, validação de campos, chamada ao ViaCEP, cálculos financeiros, chamadas de API, tela de sucesso com WhatsApp e simulação de modal Asaas, impossibilitando testes unitários e manutenibilidade. |
| **9** | **Webhook não valida estritamente igualdade de valor pago** | `src/lib/payments.ts:219-234` | A verificação aceita pagamento se `parsed.payment.value < currentOrder.total - 0.05`. Se o campo `value` for omitido ou `undefined`, a validação não é disparada. A tolerância de R$ 0,05 abre brecha para subpagamento fraudulento e problemas de arredondamento flutuante. |

---

## 2. Especificação Arquitetural dos Módulos (A até K)

### A. Configuração Única Compartilhada (`src/config/`)

Centraliza todas as regras de negócio cadastrais e financeiras, importadas de forma isomórfica por cliente e servidor.

#### 1. `src/config/store.ts`
```typescript
export const STORE_CONFIG = {
  name: "Mariane Cosméticos",
  legalName: "Mariane Cosméticos e Perfumaria Ltda",
  slogan: "Linda é a mulher que bem se quer",
  credential: "Revendedora Oficial Madressenza",
  domain: "https://marianecosmeticos.com.br",
  instagram: {
    handle: "@mariane_cosmeticos_01",
    url: "https://www.instagram.com/mariane_cosmeticos_01/",
  },
  phone: {
    raw: "5549991251617",
    display: "(49) 99125-1617",
    international: "+55 (49) 99125-1617",
  },
  physicalStore: {
    street: "Rua Blumenau",
    number: "623",
    complement: "",
    neighborhood: "São Cristóvão",
    city: "Lages",
    state: "SC",
    cep: "88505-300",
    formattedAddress: "Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)",
    pickupInstructions: "Retirada de segunda a sexta das 09h às 18h e sábado das 09h às 13h.",
  },
} as const;

export function buildOrderWhatsAppMessage(order: {
  humanCode: string;
  customerName: string;
  customerPhone: string;
  deliveryMode: "entrega" | "retirada";
  shippingAddress: string;
  paymentMethod: "whatsapp" | "pix" | "cartao";
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{ name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }>;
  notes?: string | null;
  publicToken: string;
}): string {
  const formatBrl = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const paymentLabels = {
    whatsapp: "Atendimento & Pagamento via WhatsApp",
    pix: "PIX (com 5% OFF)",
    cartao: "Cartão de Crédito",
  };

  let msg = `*NOVO PEDIDO - ${STORE_CONFIG.name.toUpperCase()}*\n`;
  msg += `_${STORE_CONFIG.slogan}_\n`;
  msg += `📍 _${STORE_CONFIG.physicalStore.formattedAddress}_\n\n`;
  msg += `🧾 *Pedido:* ${order.humanCode}\n`;
  msg += `👤 *Cliente:* ${order.customerName}\n`;
  msg += `📱 *Telefone:* ${order.customerPhone}\n`;
  msg += `🚚 *Modalidade:* ${order.deliveryMode === "retirada" ? "Retirada na Loja Física" : "Entrega em Domicílio"}\n`;
  msg += `📍 *Endereço:* ${order.shippingAddress}\n`;
  msg += `💳 *Pagamento:* ${paymentLabels[order.paymentMethod]}\n\n`;
  msg += `*ITENS DO PEDIDO:*\n`;

  order.items.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.name}\n`;
    msg += `   ${item.quantity}x de ${formatBrl(item.unitPriceCents)} = *${formatBrl(item.lineTotalCents)}*\n`;
  });

  msg += `\n💰 *Subtotal:* ${formatBrl(order.subtotalCents)}`;
  if (order.discountCents > 0) {
    msg += `\n💎 *Desconto PIX:* - ${formatBrl(order.discountCents)}`;
  }
  msg += `\n🚚 *Frete:* ${order.shippingCents === 0 ? "GRÁTIS 🎉" : formatBrl(order.shippingCents)}`;
  msg += `\n✨ *Total a Pagar:* ${formatBrl(order.totalCents)}`;

  if (order.notes) {
    msg += `\n📝 *Observações:* ${order.notes}`;
  }

  msg += `\n\n🔗 *Acompanhar Pedido:* ${STORE_CONFIG.domain}/pedido/${order.publicToken}`;
  msg += `\n\nOlá! Acabei de registrar o pedido *${order.humanCode}* no site e gostaria de confirmar o atendimento.`;

  return msg;
}
```

#### 2. `src/config/commerce.ts`
```typescript
export const COMMERCE_CONFIG = {
  // Valores monetários rigorosamente em centavos inteiros
  SHIPPING_FIXED_CENTS: 2290, // R$ 22,90
  FREE_SHIPPING_THRESHOLD_CENTS: 19900, // R$ 199,00
  DEFAULT_PIX_DISCOUNT_PERCENT: 5, // 5%
  MAX_INSTALLMENTS: 10,
  MIN_INSTALLMENT_VALUE_CENTS: 2000, // R$ 20,00 por parcela mínima
  ORDER_EXPIRATION_HOURS: 24, // 24 horas para expiração de pedidos pendentes
  MAX_ITEMS_PER_ORDER: 50,
  MAX_QUANTITY_PER_ITEM: 20,

  // Feature Flags de Gateway
  PAYMENT_FEATURES: {
    whatsapp: true, // Sempre ativo no MVP
    pixAsaas: Boolean(
      process.env.NEXT_PUBLIC_ENABLE_PIX === "true" &&
      process.env.ASAAS_API_KEY
    ),
    cardAsaas: Boolean(
      process.env.NEXT_PUBLIC_ENABLE_CARD === "true" &&
      process.env.ASAAS_API_KEY
    ),
  },
} as const;
```

---

### B. Módulo de Preços Puro (`src/lib/pricing.ts`) e Cotação Segura

O servidor detém autoridade total sobre cálculos financeiros. Toda a matemática opera com inteiros de 64 bits (`cents`).

#### 1. Funções Puras de Centavos
- `toCents(reais: number): number`: converte moeda legado para centavos (`Math.round(reais * 100)`).
- `toReais(cents: number): number`: converte para exibição flutuante quando necessário (`cents / 100`).
- `formatBrl(cents: number): string`: formatação padrão pt-BR com símbolo R$.
- `calculateItemPrice(prod: { priceCents: number; promoPriceCents?: number | null }): number`:
  `promoPriceCents > 0 && promoPriceCents < priceCents ? promoPriceCents : priceCents`.
- `calculateShipping(subtotalCents: number, deliveryMode: "entrega" | "retirada"): number`:
  `deliveryMode === "retirada" || subtotalCents >= COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS ? 0 : COMMERCE_CONFIG.SHIPPING_FIXED_CENTS`.
- `calculatePixDiscount(items: Array<{ unitPriceCents: number; quantity: number; pixDiscountPercent?: number | null }>): number`:
  Calculado item a item com arredondamento `Math.round((unitPriceCents * quantity * discountPercent) / 100)` e somatório seguro.
- `calculateOrderPricing(params: PricingInput): PricingSummary`:
  Retorna `{ subtotalCents, shippingCents, discountCents, totalCents, items: [...] }`.

#### 2. Endpoint de Cotação (`POST /api/checkout/cotacao`)
O frontend envia apenas:
```json
{
  "items": [{ "productId": "prod_1", "quantity": 2 }],
  "deliveryMode": "entrega",
  "paymentMethod": "pix"
}
```
O servidor busca os produtos atuais no banco pelo ID, calcula o frete e os descontos e retorna a cotação oficial assinada:
```json
{
  "subtotalCents": 16000,
  "shippingCents": 2290,
  "discountCents": 800,
  "totalCents": 17490,
  "freeShippingThresholdCents": 19900,
  "freeShippingRemainingCents": 3900,
  "items": [
    {
      "productId": "prod_1",
      "name": "Shampoo Truss Equilibrium 300ml",
      "quantity": 2,
      "unitPriceCents": 8000,
      "lineTotalCents": 16000,
      "pixDiscountCents": 800
    }
  ]
}
```

---

### C. Contrato Único de Entrada Compartilhado (`src/lib/validations/checkout.ts`)

Esquema TypeScript/Zod compartilhado entre frontend e backend (dependência `zod`). Nenhum dado financeiro ou de status é aceito vindo da requisição do cliente.

Respostas de erro da API seguem estritamente a especificação **RFC 9457** (`application/problem+json`), padronizadas via utilitário centralizado `src/lib/api-errors.ts` (`createProblemDetailsResponse`).

```typescript
import { z } from "zod";
import { COMMERCE_CONFIG } from "@/config/commerce";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "ID do produto inválido").max(80),
  quantity: z
    .number()
    .int("Quantidade deve ser inteira")
    .min(1, "Quantidade mínima é 1")
    .max(COMMERCE_CONFIG.MAX_QUANTITY_PER_ITEM, `Quantidade máxima é ${COMMERCE_CONFIG.MAX_QUANTITY_PER_ITEM}`),
});

export const createOrderSchema = z.object({
  // Identificação e Contato
  customerName: z
    .string()
    .trim()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .max(120, "Nome muito longo")
    .transform((val) => val.replace(/[<>]/g, "")),
  customerPhone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => val.length === 10 || val.length === 11, {
      message: "Informe um telefone/WhatsApp válido com DDD (10 ou 11 dígitos)",
    }),
  customerEmail: z
    .string()
    .trim()
    .email("E-mail com formato inválido")
    .max(160)
    .optional()
    .or(z.literal("")),

  // Consentimento LGPD opcional (Marketing)
  marketingConsent: z.boolean().default(false),

  // Modalidade de Entrega
  deliveryMode: z.enum(["entrega", "retirada"]),
  cep: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .optional(),
  address: z
    .string()
    .trim()
    .max(200)
    .transform((val) => val.replace(/[<>]/g, ""))
    .optional(),
  city: z
    .string()
    .trim()
    .max(100)
    .transform((val) => val.replace(/[<>]/g, ""))
    .optional(),

  // Método de Pagamento
  paymentMethod: z.enum(["whatsapp", "pix", "cartao"]),
  notes: z
    .string()
    .trim()
    .max(300)
    .transform((val) => val.replace(/[<>]/g, ""))
    .optional()
    .nullable(),

  // Itens
  items: z
    .array(checkoutItemSchema)
    .min(1, "A sacola está vazia")
    .max(COMMERCE_CONFIG.MAX_ITEMS_PER_ORDER, "Limite de itens excedido"),

  // Anti-fraude & Concorrência
  idempotencyKey: z
    .string()
    .uuid("Chave de idempotência inválida")
    .or(z.string().min(16).max(64)),
  honeypot: z.string().max(0, "Acesso automatizado detectado").optional().default(""),
}).superRefine((data, ctx) => {
  if (data.deliveryMode === "entrega") {
    if (!data.cep || data.cep.length !== 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cep"],
        message: "CEP de 8 dígitos obrigatório para entrega",
      });
    }
    if (!data.address || data.address.trim().length < 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Endereço completo (rua, número e bairro) obrigatório para entrega",
      });
    }
    if (!data.city || data.city.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["city"],
        message: "Cidade e estado obrigatórios para entrega",
      });
    }
  }
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
```

---

### D. Criação do Pedido em Transação Atômica (`src/lib/orders.ts`)

Execução em transação SQLite/LibSQL (`db.transaction(async (tx) => { ... })`) com reserva condicional e idempotência.

```
                  ┌────────────────────────────────────────┐
                  │ POST /api/pedidos com IdempotencyKey  │
                  └───────────────────┬────────────────────┘
                                      │
                         Existe pedido com esta chave?
                                     ╱ ╲
                               SIM ╱     ╲ NÃO
                                 ╱         ╲
           ┌────────────────────────┐    ┌───────────────────────────┐
           │ Retorna Pedido Existente│    │ Inicia Transação (tx)     │
           │ (HTTP 200 - Idempotente)│    └─────────────┬─────────────┘
           └────────────────────────┘                   │
                                          Busca Produtos Ativos no Banco
                                                        │
                                          Estoque Disponível (stock >= qty)?
                                                       ╱ ╲
                                                 NÃO ╱     ╲ SIM
                                                   ╱         ╲
                            ┌────────────────────────┐     ┌─────────────────────────────┐
                            │ Rollback Transação     │     │ UPDATE products             │
                            │ Erro 409 (Esgotado)    │     │ SET stock = stock - qty     │
                            └────────────────────────┘     │ WHERE stock >= qty          │
                                                           └──────────────┬──────────────┘
                                                                          │
                                                           Congela Preços & Grava Pedido:
                                                           - orders (valores em centavos)
                                                           - order_items (preço congelado)
                                                           - order_status_history (inicial)
                                                                          │
                                                           ┌──────────────┴──────────────┐
                                                           │ Commit Transação            │
                                                           │ Retorna HTTP 201 Created    │
                                                           │ (humanCode + publicToken)   │
                                                           └─────────────────────────────┘
```

#### Regras da Transação e Concorrência:
1. **Configuração de Conexão e PRAGMAs Vitais (`src/db/index.ts`)**:
   Para evitar erros `SQLITE_BUSY: database is locked`, leituras bloqueadas e garantir a integridade referencial nativa do SQLite, a conexão com LibSQL deve executar na inicialização:
   ```sql
   PRAGMA journal_mode = WAL;         -- Permite leituras concorrentes sem bloquear escritas
   PRAGMA busy_timeout = 5000;        -- Aguarda até 5s para lock antes de falhar
   PRAGMA foreign_keys = ON;          -- Ativa verificação de integridade referencial
   PRAGMA synchronous = NORMAL;       -- Commit seguro e performático em WAL
   ```

2. **Idempotência e Tratamento de Colisão Concorrente**:
   ```typescript
   const existing = await tx.select().from(orders).where(eq(orders.idempotencyKey, input.idempotencyKey)).limit(1);
   if (existing.length > 0) return { idempotent: true, order: existing[0] };
   ```
   Se duas requisições idênticas atingirem a inserção no mesmo milissegundo, a constraint `UNIQUE(idempotency_key)` lançará `SQLITE_CONSTRAINT_UNIQUE`. O handler captura essa exceção e busca o pedido recém-gravado para retornar HTTP 200 com os dados do pedido em vez de erro 500.

3. **Ordenação Determinística de Itens (Mitigação de Deadlocks)**:
   Para impedir deadlocks entre transações concorrentes disputando os mesmos produtos, a lista de itens agregados é sempre ordenada alfabeticamente por `productId`:
   ```typescript
   aggregatedItems.sort((a, b) => a.productId.localeCompare(b.productId));
   ```

4. **Reserva Condicional de Estoque**:
   ```typescript
   for (const item of aggregatedItems) {
     const updateResult = await tx
       .update(products)
       .set({ stock: sql`${products.stock} - ${item.quantity}` })
       .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)));
     
     if (updateResult.rowsAffected === 0) {
       throw new OutOfStockError(`Produto '${item.name}' não possui estoque suficiente.`);
     }
   }
   ```

5. **Congelamento de Preços**:
   Gravação em centavos inteiros nos `order_items` baseada exclusivamente no catálogo consultado no banco. Se o produto tiver apenas preços flutuantes legados, aplica-se `toCents(product.price)`.

---

### E. Estrutura de Códigos: Humano vs. Token Público de 128 bits

| Atributo | Código Humano (`humanCode`) | Token Público Seguro (`publicToken`) |
|---|---|---|
| **Formato** | `MC-AAAAMMDD-XXXXXX` | UUID v4 (`36` chars) ou Hex 128 bits (`32` chars) |
| **Exemplo** | `MC-20261109-7K9W2B` | `a3e2b9f1-4c6d-4e8a-9b12-8f90c12d4567` |
| **Entropia** | $16^6 = 16.777.216$ por dia | $2^{128} \approx 3.4 \times 10^{38}$ combinações |
| **Uso Autorizado** | Conversas no WhatsApp, recibos impressos, busca no `/admin/pedidos` | URL de acompanhamento: `/pedido/[publicToken]`, API `GET /api/pedidos/[token]` |
| **Acesso a Dados** | **PROIBIDO** para consultas públicas no front | Permite visualização do status, itens e pagamento sem autenticação |

**Regra de Segurança Inegociável:** A rota legada `GET /api/pedidos?id=MC-...` é **removida**. O endpoint público passa a ser `GET /api/pedidos/[publicToken]`.

---

### F. Máquina de Estados e Trilha de Histórico (`order_status_history`)

#### 1. Estados Formais
- `aguardando_confirmacao`: Pedido registrado com opção de atendimento/pagamento WhatsApp.
- `aguardando_pagamento`: Pedido registrado com PIX ou Cartão (aguardando confirmação do gateway).
- `pago`: Pagamento confirmado via webhook do Asaas ou aprovado manualmente pela lojista no painel.
- `em_separacao`: Pedido em processo de embalagem na loja física.
- `enviado`: Pedido despachado para entrega em domicílio (transportadora/correios/motoboy).
- `pronto_para_retirada`: Pedido embalado aguardando o cliente retirar na loja em Lages.
- `entregue`: Pedido recebido pelo cliente ou retirado no balcão (Estado Terminal).
- `cancelado`: Cancelamento por solicitação do cliente ou lojista (Libera estoque).
- `expirado`: Prazo limite de 24h atingido sem pagamento (Libera estoque).

#### 2. Matriz de Transições Permitidas
```typescript
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  aguardando_confirmacao: ["pago", "cancelado", "expirado"],
  aguardando_pagamento: ["pago", "cancelado", "expirado"],
  pago: ["em_separacao", "cancelado"],
  em_separacao: ["enviado", "pronto_para_retirada", "cancelado"],
  enviado: ["entregue", "cancelado"],
  pronto_para_retirada: ["entregue", "cancelado"],
  entregue: [], // Terminal
  cancelado: [], // Terminal
  expirado: [], // Terminal
};
```

#### 3. Estorno de Estoque Seguro nos Estados de Saída
Sempre que o pedido transiciona para `cancelado` ou `expirado`, o estorno de estoque só é executado se a transição de status realmente afetou o pedido, evitando estorno duplo por cliques concorrentes:
```typescript
const updateOrder = await tx
  .update(orders)
  .set({ status: newStatus })
  .where(and(
    eq(orders.id, orderId),
    inArray(orders.status, ["aguardando_pagamento", "aguardando_confirmacao"])
  ));

if (updateOrder.rowsAffected > 0) {
  for (const item of items) {
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} + ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }
}
```

#### 4. Modelagem com Índices e Integridade Referencial
```typescript
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
```

#### 5. Índices de Performance Obrigatórios
- `order_items`: índice `idx_order_items_order_id` na coluna `order_id` para acelerar carregamento do resumo e admin.
- `orders`: índice único `idx_orders_public_token` em `public_token` e índice composto `idx_orders_status_created` em `(status, created_at)` para otimizar filtros do painel e varredura de pedidos expirados.
- `products`: índice e constraint `CHECK (stock >= 0)` garantindo inventário não-negativo a nível de engine.

---

### G. Pagamento: Asaas Sandbox & WhatsApp

1. **Canal Principal MVP (WhatsApp)**:
   - Pagamento via WhatsApp sempre ativo.
   - Gera o link oficial com mensagem pré-montada via `buildOrderWhatsAppMessage`.
   - Pedido inicia como `aguardando_confirmacao`.

2. **Canais Digitais (PIX e Cartão via Asaas)**:
   - Ativados exclusivamente se `COMMERCE_CONFIG.PAYMENT_FEATURES.pixAsaas` ou `cardAsaas` forem verdadeiros.
   - **Cartão**: Redirecionamento obrigatório para o checkout seguro hospedado do Asaas (`checkoutUrl`). A aplicação **não** manipula número de cartão, CVV ou data de validade.
   - **PIX**: Geração de QR Code e chave Copia e Cola via API do Asaas.

3. **Validação Estrita do Webhook (`/api/webhooks/pagamento`)**:
   - Assinatura: Validação com `crypto.timingSafeEqual` via HMAC SHA-256 ou token seguro `asaas-access-token`.
   - Idempotência: Gravação atômica na tabela `payment_webhooks` por `eventId`. Replays retornam `200 OK` imediatamente.
   - **Validação Financeira Estrita**:
     ```typescript
     const paidCents = Math.round(parsed.payment.value * 100);
     if (paidCents !== order.totalCents) {
       // Registra incidente de auditoria e rejeita
       return errorResponse(400, "Valor recebido difere do total do pedido.");
     }
     ```
   - Máquina de Estados e Corrida com Expiração: Se a transição do status atual do pedido para o novo status não estiver na matriz `ALLOWED_STATUS_TRANSITIONS`, o webhook grava o log mas não altera o pedido. Caso específico: se o pedido já estiver marcado como `expirado` e chegar um evento `PAYMENT_CONFIRMED`, o webhook não quebra (retorna 200 ao Asaas), mas registra um alerta crítico na tabela `order_status_history` (`actor: "webhook_asaas"`, `notes: "ALERTA: Pagamento confirmado após expiração. Necessária ação manual da lojista para reativar ou estornar"`) com flag visível no painel da loja.

---

### H. Expiração Lazy de Pedidos Não Pagos (Sem Fila no MVP)

Para evitar servidores adicionais de cron ou filas externas (Redis/BullMQ) no MVP hospedado em edge/serverless, a expiração de pedidos adota a estratégia de **Verificação Preguiçosa (*Lazy Expiration*)**:
1. **Ao consultar o pedido**: Toda vez que `/pedido/[token]` ou `GET /api/pedidos/[token]` for carregada, o sistema checa:
   `status in ('aguardando_pagamento', 'aguardando_confirmacao') && (now - createdAt > 24 horas)`.
   Se expirado, dispara imediatamente a transação de expiração + devolução de estoque.
2. **Ao carregar o painel `/admin/pedidos`**: A listagem de pedidos pendentes executa uma query atômica de limpeza que expira todos os pedidos vencidos e retorna os estoques para o catálogo.

---

### I. Página `/pedido/[token]`

1. **Server Component do Next.js**:
   - Carrega diretamente do SQLite via Drizzle usando `publicToken`.
   - Dados PII sensíveis protegidos (exibição apenas do primeiro nome e últimos 4 dígitos do telefone).
2. **Linha do Tempo Visual**:
   - Marcador dinâmico dos estados: *Aguardando Confirmação/Pagamento* ➔ *Pago* ➔ *Em Separação* ➔ *Pronto/Enviado* ➔ *Entregue*.
3. **Área de Ação Conforme o Meio de Pagamento**:
   - **PIX**: Exibe QR Code SVG renderizado na tela, código copia-e-cola com botão "Copiar Chave PIX" e contador regressivo de expiração.
   - **WhatsApp**: Botão verde destacado `emerald-whatsapp` que abre diretamente o WhatsApp oficial com a mensagem parametrizada.
4. **Política do Carrinho**:
   - O carrinho do cliente no navegador (`localStorage: mariane_cart`) só é esvaziado **após** a resposta positiva de criação do pedido com o `publicToken`.

---

### J. Segurança e LGPD

1. **Rate Limiting por IP**:
   - Limite em `/api/pedidos` (máx 5 pedidos por IP a cada 10 minutos) e em `/api/checkout/cotacao` (máx 30 cotações por minuto) para evitar exaustão de recursos.
2. **Honeypot Invisível**:
   - Campo `<input type="text" name="website_url" className="hidden" tabIndex={-1} autoComplete="off" />`. Bots que preencherem o campo têm a requisição descartada imediatamente.
3. **Prevenção contra XSS e Injeções**:
   - Todos os dados inseridos pelo cliente (nome, endereço, notas) são sanitizados com remoção de tags `<>` e caracteres de controle Unicode.
   - Renderização segura no React e escape apropriado de parâmetros no `encodeURIComponent` para o WhatsApp.
4. **Mascaramento de PII em Logs**:
   - Logs de aplicação utilizam `maskPiiPhone` (`***-1617`) e `maskPiiEmail` (`m***@gmail.com`).
5. **Conformidade LGPD**:
   - Base Legal da Compra: **Execução de Contrato** (Art. 7º, V da Lei 13.709/2018). O consentimento para o processamento do pedido é intrínseco à compra, sem necessidade de checkbox impeditivo.
   - Comunicações de Marketing: Checkbox opcional, **desmarcado por padrão**, com o texto:  
     `[ ] Desejo receber novidades e cupons exclusivos da Mariane Cosméticos via WhatsApp ou e-mail.`
   - Link direto e visível para `/politica-de-privacidade`.

---

### K. Painel Mínimo da Loja (`/admin/pedidos`)

1. **Autenticação**:
   - Protegido por variável de ambiente `ADMIN_PASSWORD`.
   - Rota `/admin/login`: rate limit rigoroso (máx 5 tentativas por 15 minutos).
   - Sessão via cookie `admin_session` assinado com HMAC-SHA256 (`HttpOnly; Secure; SameSite=Lax; Path=/`).
   - `src/middleware.ts` intercepta todas as rotas `/admin/*` e `/api/admin/*`.
2. **Interface Otimizada para Mobile**:
   - Interface limpa, responsiva (foco no uso via celular pela lojista).
   - Filtros rápidos por status (*Todos, Pendentes, Pagos, Em Separação, Concluídos*).
   - Busca por código humano (`MC-...`) ou telefone do cliente.
   - Detalhe do pedido com itens, valores em centavos formatados, dados do cliente e histórico completo de status.
   - Seletor de mudança de status que **só exibe as transições permitidas** para o status atual.
   - Botão de 1 toque para abrir o WhatsApp do cliente para avisar sobre envio ou retirada.
3. **Exportação CSV com Proteção contra CSV Injection**:
   - Sanitização de células: se o valor iniciar com `=`, `+`, `-`, `@`, `\t` ou `\r`, prefixa com aspa simples (`'`).

---

## 3. Riscos Arquiteturais e Mitigações

| Risco | Impacto | Mitigação Arquitetural |
|---|---|---|
| **Concorrência no último item em estoque** | Dois clientes comprarem simultaneamente o mesmo produto com estoque = 1. | `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty` dentro de transação atômica. Se `rowsAffected === 0`, o banco rejeita e desfaz a transação. |
| **Divergência de centavos entre gateway e loja** | Pedido não ser compensado por diferença de R$ 0,01. | Todas as regras operam exclusivamente em centavos inteiros (`cents`). O valor gerado no Asaas e conferido no webhook é `totalCents === paidCents`. |
| **Perda de acesso ao pedido pelo cliente** | Cliente fecha a aba e perde o link do pedido. | O link `/pedido/[publicToken]` é enviado na mensagem formatada do WhatsApp e pode ser reenviado pelo painel da loja. |
| **Enumeração de dados de clientes (IDOR)** | Acesso a dados de pedidos concorrentes via código público. | A rota de consulta aberta por código humano é eliminada. O endpoint público aceita apenas tokens de 128 bits criptograficamente aleatórios. |
| **Bloqueio no checkout por falha do ViaCEP** | Cliente não conseguir finalizar se a API externa do ViaCEP cair. | O campo de endereço permite preenchimento e edição manual caso o ViaCEP demore mais de 4 segundos ou falhe. |

---

## 4. Lista de Decisões que Dependem da Cliente (Mariane)

As seguintes definições de negócio necessitam de validação ou alinhamento com a proprietária:

1. **Prazo de Expiração de Pedidos Pendentes:**
   - *Proposta:* 24 horas para pedidos via WhatsApp e PIX não confirmados antes de devolver os produtos ao estoque.  
   - *Decisão Cliente:* Confirmar se 24h é ideal ou se prefere 48h para compras de final de semana.
2. **Política de Frete Grátis e Frete Fixo:**
   - *Proposta:* Manter o padrão atual: Frete fixo R$ 22,90 para entregas em Lages e Frete Grátis a partir de R$ 199,00.  
   - *Decisão Cliente:* Confirmar se o frete de R$ 22,90 atende todos os bairros de Lages ou se haverá entrega expressa por motoboy com valor diferenciado.
3. **Ativação dos Meios de Pagamento Asaas:**
   - *Proposta:* Lançar o MVP com WhatsApp como padrão, mantendo PIX e Cartão configurados em Sandbox e ativáveis por chave de ambiente assim que a conta Asaas da empresa estiver validada.  
   - *Decisão Cliente:* Definir data para envio das credenciais de produção do Asaas.
4. **Mensagens e Notificações de Status:**
   - *Proposta:* A lojista clica no botão do WhatsApp no painel para enviar a mensagem automática de "Pedido Pronto para Retirada" ou "Pedido Enviado".  
   - *Decisão Cliente:* Aprovar os textos das mensagens pré-definidas.
