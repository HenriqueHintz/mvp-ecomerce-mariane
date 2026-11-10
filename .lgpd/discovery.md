# Discovery Técnico de Privacidade e Proteção de Dados (LGPD)

**Data**: 2026-11-09
**Escopo analisado**: Código-fonte completo (`src/db/schema.ts`, `src/lib/orders.ts`, `src/lib/payments.ts`, `src/context/CartContext.tsx`, `src/app/checkout/**`, `src/app/api/**`, `src/app/politica-de-privacidade/page.tsx`).

## 1. Schema do Banco de Dados (`src/db/schema.ts`)
- **`orders`**:
  - `id` (`MC-AAAAMMDD-XXXXXX` — código humano do pedido)
  - `public_token` (UUID v4 128 bits para consulta pública `/pedido/[token]`)
  - `idempotency_key` (chave única anti-duplicidade)
  - `customer_name` (PII — Nome completo da titular)
  - `customer_phone` (PII — Telefone/WhatsApp da titular)
  - `customer_email` (PII opcional — E-mail da titular)
  - `shipping_address` (PII — Endereço completo + CEP em modalidade `entrega`, ou endereço da loja física em `retirada`)
  - `notes` (Observações livres do pedido — potencial inserção de PII pela titular)
  - `marketing_consent` (`integer`, default `0` — registro booleano de opt-in para marketing)
- **`order_items`**: itens vinculados a `orders.id` com `ON DELETE CASCADE`.
- **`order_status_history`**: trilha de auditoria (`from_status`, `to_status`, `actor`, `notes`, `created_at`) com `ON DELETE CASCADE`.
- **`payment_webhooks`**: eventos de pagamento (`event_id`, `order_id`, `provider`, `status`, `payload`, `processed_at`).

## 2. Rotas de API e Superfície de Exposição de PII
- **`POST /api/pedidos`**: recebe dados cadastrais e cria o pedido; retorna `customerPhone` mascarado via `maskPiiPhone` (`(***) *****-1617`).
- **`GET /api/pedidos`**: rota legada por código curto (`?id=MC-...`) **descontinuada** (retorna HTTP 400 RFC 9457), eliminando vulnerabilidade de enumeração IDOR.
- **`GET /api/pedidos/[token]`**: consulta por `publicToken` de 128 bits; retorna `customerPhone` mascarado (`maskPiiPhone`) e `customerEmail` mascarado (`maskPiiEmail`), porém **ainda retorna `customerName` completo e `shippingAddress` completo** no payload JSON público.
- **`POST /api/checkout/cotacao`**: recebe apenas `items`, `deliveryMode` e `paymentMethod` (zero PII).
- **`POST /api/webhooks/pagamento`**: recebe notificações do Asaas autenticadas via HMAC-SHA256 / `asaas-access-token` com `crypto.timingSafeEqual`.

## 3. Armazenamento no Navegador (`localStorage`)
- **`mariane_cart`** (`src/context/CartContext.tsx`): armazena exclusivamente itens da sacola (`id`, `name`, `slug`, `price`, `promoPrice`, `image`, `quantity`). Não armazena PII da titular no `localStorage`.

## 4. Operadores e Integrações Externas (Terceiros)
1. **WhatsApp / Meta Platforms Inc.**: redirecionamento client-side (`https://wa.me/5549991251617?text=...`) contendo resumo do pedido, nome, telefone e endereço para conclusão do atendimento.
2. **Asaas Gestão Financeira Instituição de Pagamento S.A.**: processamento de PIX e Cartão de Crédito (quando habilitado via feature flag).
3. **ViaCEP (`viacep.com.br`)**: consulta client-side do CEP digitado (`CheckoutDelivery.tsx`) para autopreenchimento de logradouro/bairro/cidade.

## 5. Situação do Consentimento no Checkout (`Problema #7`)
- **Estado legado diagnosticado**: `useState(true)` pré-marcado e bloqueante para finalizar a compra (violação direta do Art. 8º e erro de enquadramento da base legal do Art. 7º, V).
- **Estado atual no repositório (`src/app/checkout/page.tsx:29` e `CheckoutContact.tsx`)**: corrigido para `useState(false)` (desmarcado por padrão) e opcional (`marketingConsent`), desacoplado da Execução de Contrato. Falta registrar timestamp/versão da política ou trilha de revogação para auditoria completa do Art. 8º, § 2º.
