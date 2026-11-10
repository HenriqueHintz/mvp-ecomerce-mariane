# Checkout Deep Modules, Integridade Financeira & Conformidade LGPD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar os vazamentos remanescentes dos 9 problemas arquiteturais, financeiros, concorrenciais e regulatórios (LGPD) do checkout da Mariane Cosméticos por meio de módulos profundos (*deep modules*), aritmética estrita em centavos inteiros, transações serializadas sem `SQLITE_BUSY`, acompanhamento seguro `/pedido/[token]` e painel administrativo `/admin/pedidos`.

**Architecture:** A arquitetura substitui módulos rasos (*shallow pass-throughs*) e constantes espalhadas por 6 **Modules** profundos posicionados em **Seams** explícitos: (1) `pricing` + `config` (autoridade única de centavos inteiros e identidade cadastral), (2) `orders` + `order-state-machine` (transação atômica de reserva de estoque, idempotência, token público de 128 bits, expiração preguiçosa e mascaramento de PII), (3) `payments` (validação HMAC em tempo constante, igualdade estrita de centavos no webhook e conciliação com a máquina de estados), (4) `rate-limit` (janela deslizante por IP com respostas RFC 9457), (5) `/pedido/[token]` (acompanhamento público com PII minimizada) e (6) `admin-auth` + `/admin/pedidos` (sessão HMAC-SHA256 e exportação CSV blindada contra injeção de fórmulas).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5 (strict), Tailwind CSS 3.4, Drizzle ORM + `@libsql/client` (SQLite WAL), Zod.

**Spec:** `docs/checkout/ESPECIFICACAO.md`, `GLOSSARY.md`, `docs/adr/0001..0004` e `.lgpd/gaps.md`

## Global Constraints

- **Identidade Imutável (`docs/DESIGN.md` & `src/config/store.ts`):** Marca `Mariane Cosméticos`, slogan `"Linda é a mulher que bem se quer"`, WhatsApp `5549991251617` (`+55 (49) 99125-1617`), Instagram `@mariane_cosmeticos_01`, endereço `Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)`. Proibido qualquer resquício de `"Marina Cosméticos"`, `5537998373933` ou `"Martinho Campos"`.
- **Aritmética Monetária (`ADR-0001`):** Todos os cálculos de preço unitário, subtotal, desconto PIX (`pixDiscountPercent` por produto ou fallback `5%`), frete (`2290` centavos, grátis `>= 19900` centavos ou `0` em `retirada`) e total operam exclusivamente em centavos inteiros (`integer`).
- **Retrocompatibilidade Expand-Migrate (`AGENTS.md` DoD):** As funções adaptadoras legadas (`validateOrderInput`, `createOrderInDb`) e colunas `REAL` legadas devem continuar passando os 57 testes de `npx tsx tests/e2e/runner.ts` sem regressão.
- **Erros HTTP Padronizados:** Toda resposta de erro em rotas `/api/**` deve utilizar `createProblemDetailsResponse` (`application/problem+json` — RFC 9457).
- **Tipagem Estrita:** Proibido usar `any` ou `@ts-ignore`.

## Review Focus

1. **Webhook `PAYMENT_CONFIRMED` sem campo `payment.value` (`undefined`) ou com diferença de R$ 0,01 (`total - 0.01`):** No código legado (`src/lib/payments.ts:219-234`), omitir `payment.value` pulava a validação e pagar R$ 0,04 a menos aprovava o pedido; o webhook deve rejeitar com HTTP 400 qualquer evento de confirmação cujo `payment.value` não seja numérico positivo ou cujo valor em centavos (`toCents(payment.value)`) difira de `totalCents` (testado na **Task 2**).
2. **Webhook `PAYMENT_CONFIRMED` tardio após pedido `expirado`:** Se o cliente pagar o QR Code PIX após a Expiração Preguiçosa de 24h já ter devolvido o estoque, o webhook não pode rebaixar/quebrar com erro 500 nem aprovar silenciosamente sem estoque; deve retornar HTTP 200 ao Asaas e gravar alerta crítico em `order_status_history` (`actor: "webhook_asaas"`, `notes` contendo `"ALERTA: Pagamento confirmado após expiração"`) (testado na **Task 2**).
3. **Corrida concorrente no último item gerando `SQLITE_BUSY` em vez de HTTP 409:** No SQLite/LibSQL, duas transações concorrentes que iniciam com `SELECT` e tentam promover o lock para `UPDATE` falham imediatamente com `SQLITE_BUSY`; `createOrderTransaction` deve serializar escritas concorrentes ou realizar retry com backoff em `SQLITE_BUSY` para que a segunda compradora receba deterministicamente HTTP 409 (`OutOfStockError`) e nunca HTTP 500 (testado na **Task 1**).
4. **Vazamento de endereço completo e sobrenome na rota pública `GET /api/pedidos/[token]` (`LGPD Gap #1`):** Consultar o token público para exibir o status do pedido não deve expor o endereço residencial completo nem o sobrenome completo em texto aberto no JSON público; `getOrderByPublicToken` deve mascarar `customerName` (`maskPiiName`) e `shippingAddress` (`maskPiiAddress`) (testado na **Task 1**).
5. **CSV Formula Injection no painel administrativo (`=cmd|'/C calc'!A0`):** Um pedido criado com nome ou observação iniciando por `=`, `+`, `-`, `@`, `\t` ou `\r` deve ser prefixado com aspa simples (`'`) na exportação `/api/admin/pedidos/export-csv` para impedir execução de fórmulas no Excel/LibreOffice da lojista (testado na **Task 5**).

---

### Task 1: Deepening `CartContext`, Mascaramento LGPD Público & Prevenção de `SQLITE_BUSY` em `orders.ts`

**Files:**
- Modify: `src/context/CartContext.tsx:1-200`
- Modify: `src/lib/orders.ts:24-435`
- Modify: `tests/integration/order-creation.test.ts:1-180`

**Interfaces:**
- Consumes: `COMMERCE_CONFIG` (`src/config/commerce.ts`), `STORE_CONFIG`, `buildWhatsAppLink` (`src/config/store.ts`), `toCents`, `toReais`, `formatBrl`, `calculateItemPriceCents`, `calculatePixDiscountCents` (`src/lib/pricing.ts`).
- Produces:
  - `maskPiiName(fullName: string): string` em `src/lib/orders.ts` (ex.: `"Maria Silva Souza"` -> `"Maria S***"`).
  - `maskPiiAddress(address: string | null): string` em `src/lib/orders.ts` (preserva endereço da loja em retirada; em entrega, mascara número/complemento exibindo apenas bairro/cidade/CEP parcial).
  - `CartContext` refatorado sem constantes mágicas (`199.0`, `"5549991251617"`, `0.95`) e operando internamente em centavos inteiros.

- [ ] **Step 1: Write the failing test in `tests/integration/order-creation.test.ts`**

Adicionar asserções em `tests/integration/order-creation.test.ts` verificando:
1. Em 5 disparos concorrentes (`Promise.all`) disputando estoque = 1, exatamente 1 retorna `statusHttp: 201` e os outros 4 retornam `statusHttp: 409` (nenhum retorna `statusHttp: 500` por `SQLITE_BUSY`).
2. `getOrderByPublicToken(token)` retorna `customerName` mascarado (`maskPiiName`, sem expor o último sobrenome inteiro) e `shippingAddress` mascarado (`maskPiiAddress`, sem expor número da residência em entregas domiciliares).
3. `CartContext.tsx` não contém literais `"5549991251617"`, `199.0` ou `* 0.95`, importando `STORE_CONFIG`, `COMMERCE_CONFIG` e funções de `src/lib/pricing.ts`.

```typescript
// Em tests/integration/order-creation.test.ts:
const concurrentResults = await Promise.all(
  Array.from({ length: 5 }, (_, idx) =>
    createOrderTransaction({
      customerName: `Cliente Concorrente ${idx}`,
      customerPhone: "49991251617",
      deliveryMode: "retirada",
      paymentMethod: "whatsapp",
      idempotencyKey: crypto.randomUUID(),
      items: [{ productId: testProductId, quantity: 1 }],
    })
  )
);
const successes = concurrentResults.filter((r) => r.success && r.statusHttp === 201);
const outOfStock = concurrentResults.filter((r) => !r.success && r.statusHttp === 409);
assert.strictEqual(successes.length, 1, "Exatamente 1 pedido deve vencer a corrida");
assert.strictEqual(outOfStock.length, 4, "Todos os demais devem receber 409 (zero 500 SQLITE_BUSY)");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/integration/order-creation.test.ts`
Expected: FAIL (corrida de 5 transações simultâneas gera `SQLITE_BUSY` retornando 500, e `getOrderByPublicToken` retorna `customerName` e `shippingAddress` sem máscara).

- [ ] **Step 3: Implement `maskPiiName`, `maskPiiAddress`, serialização/retry contra `SQLITE_BUSY` em `src/lib/orders.ts` e aprofundamento de `src/context/CartContext.tsx`**

1. Em `src/lib/orders.ts`:
   - Implementar `export function maskPiiName(name: string): string` e `export function maskPiiAddress(address?: string | null): string` e aplicá-las no retorno de `getOrderByPublicToken`.
   - Envolver a seção crítica de `db.transaction` em `createOrderTransaction` com uma fila de exclusão mútua em processo (`withSqliteWriteLock`) combinada com retry curto (até 3 tentativas com jitter de 25–75ms se `error.message.includes("SQLITE_BUSY")`), eliminando o deadlock de upgrade `SHARED -> RESERVED` do SQLite em chamadas paralelas.
2. Em `src/context/CartContext.tsx`:
   - Importar `COMMERCE_CONFIG` de `@/config/commerce`, `STORE_CONFIG` e `buildWhatsAppLink` de `@/config/store`, e `toCents`, `toReais`, `formatBrl`, `calculateItemPriceCents`, `calculatePixDiscountCents` de `@/lib/pricing`.
   - Calcular `subtotalCents` em centavos inteiros e derivar `subtotal = toReais(subtotalCents)`, `freeShippingThreshold = toReais(COMMERCE_CONFIG.FREE_SHIPPING_THRESHOLD_CENTS)` e `generateWhatsAppLink` usando `STORE_CONFIG` e `calculatePixDiscountCents`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/integration/order-creation.test.ts`
Expected: PASS (zero erros `SQLITE_BUSY`, 1 HTTP 201 + 4 HTTP 409, PII mascarada no token público).

- [ ] **Step 5: Commit**

```bash
git add src/context/CartContext.tsx src/lib/orders.ts tests/integration/order-creation.test.ts
git commit -m "fix(orders,cart): unify integer-cents pricing in CartContext, mask public PII and prevent SQLITE_BUSY on concurrent orders"
```

---

### Task 2: Strict Integer-Cents Payment Webhook & State Machine Integration (`src/lib/payments.ts`)

**Files:**
- Modify: `src/lib/payments.ts:1-329`
- Modify: `src/app/api/webhooks/pagamento/route.ts`
- Create: `tests/integration/webhook-payment.test.ts`

**Interfaces:**
- Consumes: `toCents`, `toReais` (`src/lib/pricing.ts`), `OrderStatus`, `canTransition` (`src/lib/order-state-machine.ts`), `changeOrderStatus` (`src/lib/orders.ts`), `orderStatusHistory` (`src/db/schema.ts`).
- Produces:
  - `handlePaymentWebhook(params)` validando estritamente `paidCents === expectedTotalCents` (rejeitando `value` ausente, `NaN` ou divergente em 1 centavo com HTTP 400), registrando transições em `order_status_history` e gravando alerta crítico quando `currentOrder.status === "expirado"` recebe confirmação de pagamento.

- [ ] **Step 1: Write the failing test in `tests/integration/webhook-payment.test.ts`**

```typescript
// Cenários obrigatórios em tests/integration/webhook-payment.test.ts:
// 1. Assinatura inválida retorna 401.
// 2. PAYMENT_CONFIRMED sem campo payment.value (undefined) retorna 400.
// 3. PAYMENT_CONFIRMED com subpagamento de R$ 0,01 (ex: totalCents=17490, value=174.89) retorna 400.
// 4. PAYMENT_CONFIRMED com valor exato (value=174.90) retorna 200, atualiza status para "pago" e grava em order_status_history.
// 5. Replay do mesmo eventId retorna 200 { idempotentReplay: true } sem duplicar histórico.
// 6. PAYMENT_CONFIRMED em pedido já "expirado" retorna 200, mantém status "expirado" e grava alerta "ALERTA: Pagamento confirmado após expiração" em order_status_history.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/integration/webhook-payment.test.ts`
Expected: FAIL (`payment.value: undefined` e subpagamento de `0.01` passam indevidamente no código legado; `order_status_history` não recebe alerta em pedido expirado).

- [ ] **Step 3: Implement strict integer-cents validation and state machine history in `src/lib/payments.ts`**

1. Em `createSandboxPayment` (`src/lib/payments.ts:120-141`): usar `totalCents = order.totalCents ?? toCents(order.total)` e `(totalCents / 100).toFixed(2)` para gerar o payload PIX sem flutuação binária.
2. Em `handlePaymentWebhook` (`src/lib/payments.ts:217-328`):
   - Para `eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED"`: exigir `typeof parsed.payment?.value === "number" && Number.isFinite(parsed.payment.value) && parsed.payment.value > 0`. Converter `paidCents = toCents(parsed.payment.value)` e `expectedCents = currentOrder.totalCents ?? toCents(currentOrder.total)`. Se `paidCents !== expectedCents`, retornar `statusHttp: 400` com mensagem `"Valor do pagamento divergente do total do pedido."`.
   - Se `currentOrder.status === "expirado"` e o evento for `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED`, gravar o webhook em `paymentWebhooks`, inserir registro em `orderStatusHistory` com `fromStatus: "expirado"`, `toStatus: "expirado"`, `actor: "webhook_asaas"` e `notes: "ALERTA: Pagamento confirmado após expiração. Necessária ação manual da lojista para reativar ou estornar"`, e retornar HTTP 200 `{ success: true, expiredOrderAlert: true }`.
   - Para demais transições válidas, gravar registro correspondente em `orderStatusHistory` (`actor: "webhook_asaas"`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/integration/webhook-payment.test.ts`
Expected: PASS (todos os 6 cenários de webhook passando, mais a suíte `npx tsx tests/e2e/runner.ts`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/payments.ts src/app/api/webhooks/pagamento/route.ts tests/integration/webhook-payment.test.ts
git commit -m "fix(payments): enforce exact integer-cents webhook validation and audit history transitions"
```

---

### Task 3: Rate Limiting Deep Module (`src/lib/rate-limit.ts`) & API Protection

**Files:**
- Create: `src/lib/rate-limit.ts`
- Modify: `src/app/api/pedidos/route.ts`
- Modify: `src/app/api/checkout/cotacao/route.ts`
- Create: `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Consumes: `createProblemDetailsResponse` (`src/lib/api-errors.ts`).
- Produces:
  - `checkRateLimit(bucket: string, key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSeconds: number }`
  - `extractClientIp(request: Request): string`
  - `resetRateLimitStore(): void` (para isolamento determinístico em testes).

- [ ] **Step 1: Write the failing test in `tests/unit/rate-limit.test.ts`**

```typescript
import assert from "assert";
import { checkRateLimit, resetRateLimitStore } from "@/lib/rate-limit";

resetRateLimitStore();
for (let i = 1; i <= 5; i++) {
  const res = checkRateLimit("orders", "203.0.113.10", 5, 10 * 60 * 1000);
  assert.strictEqual(res.allowed, true);
}
const sixth = checkRateLimit("orders", "203.0.113.10", 5, 10 * 60 * 1000);
assert.strictEqual(sixth.allowed, false);
assert.ok(sixth.retryAfterSeconds > 0);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/unit/rate-limit.test.ts`
Expected: FAIL with Cannot find module `@/lib/rate-limit`.

- [ ] **Step 3: Implement `src/lib/rate-limit.ts` and wire into `/api/pedidos` and `/api/checkout/cotacao`**

1. Implementar `src/lib/rate-limit.ts` com limpeza preguiçosa de janelas expiradas.
2. Em `src/app/api/pedidos/route.ts` (`POST`): aplicar `checkRateLimit("create_order", ip, 5, 10 * 60 * 1000)` quando o header `x-Forwarded-For` ou `x-real-ip` estiver presente (ou `127.0.0.1` com limite alto em ambiente de teste local sem IP explícito, ou via chave de bucket dedicada quando `x-rate-limit-test` / IP explícito for enviado), retornando HTTP 429 via `createProblemDetailsResponse` quando excedido.
3. Em `src/app/api/checkout/cotacao/route.ts` (`POST`): aplicar `checkRateLimit("checkout_quote", ip, 30, 60 * 1000)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/unit/rate-limit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rate-limit.ts src/app/api/pedidos/route.ts src/app/api/checkout/cotacao/route.ts tests/unit/rate-limit.test.ts
git commit -m "feat(security): add sliding-window IP rate limiter to order and quote endpoints"
```

---

### Task 4: Public Order Tracking Page (`/pedido/[token]`) & Complete LGPD Art. 9º Privacy Policy

**Files:**
- Create: `src/app/pedido/[token]/page.tsx`
- Create: `src/app/pedido/[token]/components/OrderStatusTimeline.tsx`
- Create: `src/app/pedido/[token]/components/PixPaymentAction.tsx`
- Create: `src/app/pedido/[token]/components/OrderSummaryCard.tsx`
- Modify: `src/app/politica-de-privacidade/page.tsx`
- Create: `tests/integration/order-tracking-page.test.ts`

**Interfaces:**
- Consumes: `getOrderByPublicToken` (`src/lib/orders.ts`), `ORDER_STATUS_LABELS`, `OrderStatus` (`src/lib/order-state-machine.ts`), `formatBrl` (`src/lib/pricing.ts`), `STORE_CONFIG`, `buildOrderWhatsAppMessage`, `buildWhatsAppLink` (`src/config/store.ts`).
- Produces:
  - Página Server Component `/pedido/[token]` com linha do tempo visual, resumo financeiro em centavos, botão WhatsApp parametrizado e instrução PIX com botão copiar.
  - Página `/politica-de-privacidade` atualizada com todos os 7 incisos do Art. 9º da LGPD, tabela de bases legais (Art. 7º, I, II, V e IX), operadores (WhatsApp/Meta, Asaas, ViaCEP), prazos de retenção (5 anos CDC/CTN; 90 dias anonimização de expirados) e canal do Encarregado (Res. CD/ANPD nº 18/2024).

- [ ] **Step 1: Write the failing test in `tests/integration/order-tracking-page.test.ts`**

Verificar que:
1. O arquivo `src/app/pedido/[token]/page.tsx` existe e renderiza/resolve os dados de um pedido real via `getOrderByPublicToken`.
2. Quando o pedido está com `expiresAt` no passado e status `aguardando_confirmacao`, a consulta dispara a Expiração Preguiçosa mudando o status para `expirado` e devolvendo o estoque ao produto.
3. `src/app/politica-de-privacidade/page.tsx` contém explicitamente as referências normativas (`Art. 7º, V`, `Art. 7º, I`, `Art. 9º`, `Art. 18`, `5 anos`, `Asaas`, `ViaCEP`, `WhatsApp`, `5549991251617`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/integration/order-tracking-page.test.ts`
Expected: FAIL (`src/app/pedido/[token]/page.tsx` não existe e `politica-de-privacidade/page.tsx` não lista operadores nem prazos de 5 anos).

- [ ] **Step 3: Implement `/pedido/[token]` components and update `/politica-de-privacidade/page.tsx`**

1. Criar `OrderStatusTimeline.tsx`, `PixPaymentAction.tsx`, `OrderSummaryCard.tsx` e `src/app/pedido/[token]/page.tsx` (usando `params: Promise<{ token: string }>` compatível com Next.js 15 App Router e tokens visuais de `docs/DESIGN.md`: `bg-luxury-offwhite`, `text-onyx-950`, `bg-brand`, `emerald-whatsapp`).
2. Atualizar `src/app/politica-de-privacidade/page.tsx` espelhando `.lgpd/legal-basis.md` e `.lgpd/data-map.md`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/integration/order-tracking-page.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/pedido src/app/politica-de-privacidade/page.tsx tests/integration/order-tracking-page.test.ts
git commit -m "feat(orders,lgpd): add /pedido/[token] tracking page and complete Art. 9 LGPD privacy policy"
```

---

### Task 5: Store Admin Module (`/admin/login`, `/admin/pedidos`, HMAC Auth & Safe CSV Export)

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/middleware.ts`
- Create: `src/app/api/admin/auth/route.ts`
- Create: `src/app/api/admin/pedidos/route.ts`
- Create: `src/app/api/admin/pedidos/[id]/status/route.ts`
- Create: `src/app/api/admin/pedidos/export-csv/route.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/pedidos/page.tsx`
- Create: `tests/unit/admin-and-csv.test.ts`

**Interfaces:**
- Consumes: `changeOrderStatus`, `getOrderById` (`src/lib/orders.ts`), `ALLOWED_STATUS_TRANSITIONS`, `ORDER_STATUS_LABELS`, `OrderStatus` (`src/lib/order-state-machine.ts`), `checkRateLimit` (`src/lib/rate-limit.ts`).
- Produces:
  - `verifyAdminPassword(input: string, expectedSecret?: string): boolean`
  - `createAdminSessionToken(secret?: string, nowMs?: number): string`
  - `verifyAdminSessionToken(token: string | undefined | null, secret?: string, nowMs?: number): boolean`
  - `sanitizeCsvCell(value: unknown): string` (prefixa `'` se iniciar com `=`, `+`, `-`, `@`, `\t`, `\r` e escapa aspas duplas).
  - `generateOrdersCsv(rows: Array<Record<string, unknown>>): string`

- [ ] **Step 1: Write the failing test in `tests/unit/admin-and-csv.test.ts`**

```typescript
import assert from "assert";
import {
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
  sanitizeCsvCell,
  generateOrdersCsv,
} from "@/lib/admin-auth";

// 1. Senha correta vs incorreta com timingSafeEqual
assert.strictEqual(verifyAdminPassword("segredo123", "segredo123"), true);
assert.strictEqual(verifyAdminPassword("errada", "segredo123"), false);

// 2. Token de sessão HMAC válido, adulterado e expirado
const token = createAdminSessionToken("segredo123", 1000);
assert.strictEqual(verifyAdminSessionToken(token, "segredo123", 2000), true);
assert.strictEqual(verifyAdminSessionToken(token + "x", "segredo123", 2000), false);

// 3. Proteção contra CSV Formula Injection
assert.strictEqual(sanitizeCsvCell("=cmd|'/C calc'!A0"), "\"'=cmd|'/C calc'!A0\"");
assert.strictEqual(sanitizeCsvCell("+5549991251617"), "\"'+5549991251617\"");
assert.strictEqual(sanitizeCsvCell("@malicious"), "\"'@malicious\"");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/unit/admin-and-csv.test.ts`
Expected: FAIL with Cannot find module `@/lib/admin-auth`.

- [ ] **Step 3: Implement `src/lib/admin-auth.ts`, `src/middleware.ts`, Admin APIs and Mobile-First Admin Pages**

1. Implementar `src/lib/admin-auth.ts` com assinatura HMAC-SHA256 e `sanitizeCsvCell`.
2. Implementar `src/middleware.ts` protegendo `/admin/pedidos` e `/api/admin/pedidos/**` (redirecionando páginas para `/admin/login` e retornando 401 RFC 9457 nas APIs quando o cookie `admin_session` estiver ausente ou inválido).
3. Implementar `POST /api/admin/auth` (login com rate limit de 5 tentativas / 15 min e logout via `DELETE`), `GET /api/admin/pedidos` (executa limpeza lazy de pedidos expirados, filtra por `status` e `q` código/telefone, pagina com `limit <= 100`), `PATCH /api/admin/pedidos/[id]/status` (chama `changeOrderStatus` com `actor: "admin"`) e `GET /api/admin/pedidos/export-csv` (retorna `text/csv; charset=utf-8` com `generateOrdersCsv`).
4. Implementar `/admin/login/page.tsx` e `/admin/pedidos/page.tsx` mobile-first com seletor restrito a `ALLOWED_STATUS_TRANSITIONS[order.status]` e botão de 1 toque para WhatsApp da cliente.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/unit/admin-and-csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin-auth.ts src/middleware.ts src/app/api/admin src/app/admin tests/unit/admin-and-csv.test.ts
git commit -m "feat(admin): add HMAC-authenticated store panel, status transition controls and safe CSV export"
```

---

### Task 6: Adversarial Security Suite & Full DoD Verification

**Files:**
- Create: `tests/security/adversarial-checkout.test.ts`

**Interfaces:**
- Consumes: Todos os módulos das Tasks 1 a 5.
- Produces: Evidência executável automatizada de todos os 9 problemas resolvidos e dos 5 itens do Review Focus.

- [ ] **Step 1: Write the adversarial test suite in `tests/security/adversarial-checkout.test.ts`**

Cobrir em um único script executável:
1. **Business Logic / Price Tampering:** enviar `price: 0.01`, `total: 0.01`, `discountCents: 99999` no payload de `createOrderTransaction` — provar que o servidor ignora tudo e cobra o valor integral em centavos do banco.
2. **Mass Assignment:** enviar `status: "pago"` na criação — provar que nasce como `aguardando_confirmacao` ou `aguardando_pagamento`.
3. **Honeypot Anti-Bot:** enviar `honeypot: "http://spam.bot"` — provar rejeição HTTP 400.
4. **Concurrency & Stock Exhaustion:** 5 compras simultâneas para estoque = 1 — provar 1 sucesso (201) e 4 rejeições (409), estoque final = 0, zero erros 500.
5. **Webhook Subpayment & Late Payment on Expired Order:** provar rejeição 400 para `value: undefined` ou `total - 0.01`, e provar gravação de alerta em `order_status_history` quando pago após expiração.
6. **CSV Injection & Rate Limiting:** provar sanitização de `=cmd|'/C calc'!A0` e bloqueio na 6ª requisição de rate limit.

- [ ] **Step 2: Run the adversarial test suite**

Run: `npx tsx tests/security/adversarial-checkout.test.ts`
Expected: PASS.

- [ ] **Step 3: Run full Definition of Done (`AGENTS.md` Section 5)**

Run:
```bash
npm run build
npx tsx tests/e2e/runner.ts
npx tsx tests/stress-m1-adversarial.ts
python tests/stress-m1-binary.py
python tests/stress-m1-tokens-css.py
```
Expected: Exit code `0` em todos os 5 comandos obrigatórios do projeto.

- [ ] **Step 4: Commit**

```bash
git add tests/security/adversarial-checkout.test.ts
git commit -m "test(security): add adversarial checkout suite and verify full DoD compliance"
```
