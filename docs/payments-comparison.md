# Comparativo de Gateways de Pagamento Online (PIX e Cartão) — Mariane Cosméticos

> **Objetivo:** Avaliar tecnicamente e comercialmente **Mercado Pago**, **Pagar.me (Stone Co.)** e **Asaas** com base na documentação oficial de cada provedor, recomendando a melhor opção para o e-commerce da **Mariane Cosméticos** (Next.js 15 App Router + Drizzle ORM + Cloudflare Pages/Workers + D1) e documentando a arquitetura de Sandbox implementada.

---

## 1. Matriz Comparativa Oficial (Mercado Pago vs. Pagar.me vs. Asaas)

| Critério Técnico / Comercial | **Asaas** *(Recomendado)* | **Mercado Pago** | **Pagar.me (v5 / Stone)** |
| :--- | :--- | :--- | :--- |
| **Taxas PIX (Padrão Pública)** | **R$ 0,99 a R$ 1,99 fixo** por PIX recebido (ou isenção nos primeiros meses / pacotes promocionais). Em compras de ticket médio R$ 180–R$ 350 (kits Wella/Truss/Madressenza), representa **~0,5% a 1,1%**, muito abaixo de taxas percentuais. | **0,99%** por transação PIX no Checkout Transparente / API de Pagamentos (aprovação instantânea). | **1,19%** por transação PIX na tabela balcão padrão (negociável conforme volume mensal). |
| **Taxas Cartão de Crédito** | **2,99% + R$ 0,49** à vista; parcelado de 2x a 6x ~3,49% + R$ 0,49 e 7x a 12x ~3,99% + R$ 0,49 (antecipação flexível). | **4,98%** (recebimento na hora) no Checkout Transparente/Pro, mais acréscimo por parcela caso assuma o parcelamento sem juros. | **3,79% a 4,39%** + taxa de antecipação por parcela (foco em operações de maior volume ou integração ERP). |
| **PIX (QR Code & Copia-e-Cola)** | **REST pura (`POST /v3/payments` + `GET /v3/payments/{id}/pixQrCode`)**: retorna `encodedImage` (Base64 PNG) e `payload` (EMV Copia-e-Cola) com expiração configurável. | `POST /v1/payments` (`payment_method_id: "pix"`): retorna `qr_code` e `qr_code_base64` dentro de `point_of_interaction.transaction_data`. | `POST /core/v5/orders` (`payment_method: "pix"`): retorna `qr_code` e `qr_code_url`. |
| **Checkout Transparente vs. Redirecionamento** | **Suporta ambos nativamente:** Checkout Transparente via API REST direta (PIX QR Code em tela + tokenização de cartão) **e** Link/Fatura Hospedada (`invoiceUrl`) pronta para envio automático também pelo WhatsApp. | **Checkout Transparente** (Payment Brick / CardForm JS) e **Checkout Pro** (redirecionamento). O SDK frontend (`@mercadopago/sdk-js`) adiciona peso considerável ao bundle mobile. | **Checkout Transparente** (`tokenizecard` + `/core/v5/orders`) e **Checkout Pagar.me** (link). Exige configuração mais verbosa de `customer`, `billing_address` e `items` obrigatórios em centavos. |
| **Webhooks & Segurança** | **Simples e determinístico:** Envia cabeçalho `asaas-access-token` e permite validação por **HMAC-SHA256** (`x-webhook-signature`) sobre o corpo bruto da requisição. Possui fila automática de retentativas, pausa inteligente e log de eventos (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`). | Envia cabeçalho `x-signature` (`ts=...,v1=...`) + `x-request-id`. O hash é calculado apenas sobre um template parcial (`id:[data.id];request-id:[x-request-id];ts:[ts];`), exigindo uma chamada extra `GET /v1/payments/{id}` para descobrir o status real do pagamento. | Autenticação Basic Auth no webhook ou verificação de assinatura + eventos `order.paid` / `charge.paid`. |
| **Ambiente de Sandbox** | **Excelente (`https://sandbox.asaas.com/api/v3`):** Painel sandbox dedicado com botão de **1 clique para simular confirmação de PIX** (`Confirmar recebimento`) e cartões de teste, disparando o webhook real imediatamente. | Possui credenciais de teste (`TEST-...`), mas exige criação de contas de usuários de teste separadas (comprador vs. vendedor) no painel Developers, o que frequentemente gera erros de *"mesmo usuário"* ou bloqueio antifraude em homologação. | Sandbox funcional (`sdx-api.pagar.me`), porém criação de conta sandbox e chave `sk_test_` exige fluxo cadastral Stone/Pagar.me mais burocrático. |
| **Compatibilidade com Cloudflare Workers / Edge** | **100% compatível (`fetch` puro + JSON):** Não depende de SDK Node.js pesado nem de bibliotecas nativas C++. Funciona diretamente no runtime Edge / `nodejs_compat` do Cloudflare Workers. | O SDK oficial Node (`mercadopago`) possui dependências que podem exigir polyfills no Edge; recomenda-se chamadas `fetch` manuais. | Compatível via `fetch` REST Basic Auth (`Authorization: Basic base64(sk_test:)`). |

---

## 2. Recomendação Oficial: **Asaas**

Para a **Mariane Cosméticos** (loja física consolidada em Lages – SC que opera fortemente com atendimento consultivo no WhatsApp e está iniciando sua operação de e-commerce próprio em Cloudflare), recomendamos o **Asaas** pelos 4 motivos abaixo:

1. **Economia Direta no PIX para Ticket Médio de Cosméticos Profissionais (`R$ 150` a `R$ 450`):**
   Enquanto gateways percentuais cobram ~1% a 1,19% por PIX (R$ 3,00 a R$ 4,50 em uma compra de R$ 350,00), a tarifa fixa do Asaas preserva a margem da loja mesmo oferecendo **5% OFF no PIX** para a cliente.
2. **Sinergia Nativa com o Fluxo de WhatsApp da Loja:**
   Toda cobrança criada no Asaas gera simultaneamente o **QR Code / Copia-e-Cola transparente** (para exibir direto na tela do site) **e** uma `invoiceUrl` segura que pode ser enviada no WhatsApp caso a cliente feche a aba do navegador antes de pagar.
3. **Webhook Auto-Contido com Idempotência Limpa:**
   Diferente do Mercado Pago (que envia apenas o ID na notificação e obriga o servidor a fazer um `GET` adicional para saber se o pagamento foi aprovado), o webhook do Asaas entrega o evento tipado (`PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED`) e o identificador único do evento (`id: "evt_..."`), permitindo validação criptográfica + gravação atômica na tabela `payment_webhooks` do SQLite/D1.
4. **Zero Bloat no Bundle Mobile (LCP ≤ 2,5s):**
   Toda a comunicação ocorre via Route Handlers server-side (`POST /api/pagamentos/criar` e `POST /api/webhooks/pagamento`), mantendo o bundle cliente leve em celulares 4G.

---

## 3. Arquitetura Implementada no Projeto (Modo Sandbox + Fallback Seguro)

Seguindo a diretriz de **proibição absoluta de tela falsa de "pagamento aprovado"** sem confirmação real de pagamento:

### 3.1 Fluxo de Dados e Estados do Pedido (`orders`)
```
[Cliente em /checkout]
        │
        ├──► 1. POST /api/pedidos
        │       Valida nome, WhatsApp e endereço/retirada em Lages - SC.
        │       Grava em `orders` + `order_items` com status = "aguardando pagamento".
        │       Gera código único (ex.: MC-20261107-AB12) e link wa.me/5549991251617.
        │
        ├──► 2. (Opcional / Sandbox Ativo) POST /api/pagamentos/criar
        │       Gera cobrança Sandbox (PIX QR Code Copia-e-Cola ou Link de Cartão)
        │       vinculada ao `orderId` com status inicial "aguardando pagamento".
        │
        └──► 3. POST /api/webhooks/pagamento
                ├── Verifica assinatura HMAC-SHA256 (`x-webhook-signature`) ou token (`asaas-access-token` / `x-asaas-access-token`)
                │   usando `crypto.timingSafeEqual` (rejeita com HTTP 401 se inválido).
                ├── Valida o valor pago (`payment.value >= order.total - 0.05`) nos eventos de confirmação.
                ├── Verifica idempotência atômica na tabela `payment_webhooks` (`event_id` PRIMARY KEY):
                │   se o evento já foi processado (inclusive em entregas concorrentes), retorna HTTP 200 `{ idempotentReplay: true }`
                │   sem duplicar atualização.
                └── Atualiza `orders.status` respeitando máquina de estados monotônica:
                    • `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` ──► status = `"pago"`
                    • `PAYMENT_OVERDUE` / `PAYMENT_FAILED`     ──► status = `"falhou"` (somente se ainda não `"pago"`/`"estornado"`)
                    • `PAYMENT_REFUNDED`                       ──► status = `"estornado"`
```

### 3.2 Variáveis de Ambiente (`.env.example`)
```env
ASAAS_API_URL="https://sandbox.asaas.com/api/v3"
ASAAS_API_KEY=""
PAYMENT_SANDBOX_MODE=""
PAYMENT_SANDBOX_ENABLED="false"
PAYMENT_WEBHOOK_SECRET=""
```

- Quando `ASAAS_API_KEY` está vazio e `PAYMENT_SANDBOX_MODE` / `PAYMENT_SANDBOX_ENABLED` estão desativados (padrão seguro de apresentação do MVP), o checkout exibe claramente a badge **"Online em breve"** nas opções de PIX e Cartão, registra o pedido no banco com status `"aguardando pagamento"` e abre o WhatsApp oficial da Mariane Cosméticos (`+55 49 99125-1617`) com o número do pedido.
- Quando `PAYMENT_SANDBOX_MODE="mock"` ou `PAYMENT_SANDBOX_ENABLED="true"` (ou `forceSandboxMock: true` nos testes de contrato server-side), o endpoint `POST /api/pagamentos/criar` emite os dados de cobrança Sandbox e o endpoint `POST /api/webhooks/pagamento` processa as transições de status mediante assinatura criptográfica válida.
