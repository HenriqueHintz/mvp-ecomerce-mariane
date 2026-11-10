# Mapa de Dados (Data Mapping) — Mariane Cosméticos

**Versão**: v1.0
**Data**: 2026-11-09
**Owner global**: Encarregado de Dados / Administração Mariane Cosméticos

## Atividades de Tratamento Inventariadas

### A001 — Processamento, Cobrança e Entrega de Pedidos (Checkout)

| Campo | Valor |
|---|---|
| Slug | `a001-checkout-order-processing` |
| Finalidade | Registrar o pedido da titular, calcular valores oficiais em centavos, reservar estoque e viabilizar pagamento e entrega/retirada |
| Base legal | Art. 7º, V — Execução de Contrato ([detalhes](./legal-basis.md)) |
| Categorias de titulares | Clientes compradoras (adultos; sem direcionamento a menores) |
| Sensíveis? | Não |
| Dados | `customer_name`, `customer_phone`, `customer_email` (opcional), `shipping_address` (rua, número, bairro, cidade, CEP), `notes` |
| Fonte | Coletado diretamente da titular no formulário `/checkout` |
| Sistemas | SQLite/LibSQL (`orders`, `order_items`, `order_status_history`), API Next.js (`POST /api/pedidos`, `GET /api/pedidos/[token]`) |
| Operadores | WhatsApp / Meta Platforms Inc. (quando meio de pagamento = `whatsapp`), Asaas Gestão Financeira S.A. (quando `pix` ou `cartao`) |
| Transferência intl. | WhatsApp/Meta (infraestrutura global — apenas quando a titular aciona o link `wa.me`) |
| Retenção | 5 anos para pedidos pagos/entregues (Art. 27 CDC / CTN); 90 dias para anonimização de pedidos expirados/cancelados |
| Segurança | Validação Zod, sanitização anti-XSS (`<>`), `public_token` UUID v4 128 bits, mascaramento `maskPiiPhone`/`maskPiiEmail`, PRAGMA WAL |
| Alto risco? | Não (baixo volume, zero dados sensíveis, zero decisões automatizadas/profiling — Art. 4º Res. CD/ANPD nº 2/2022) |
| RIPD | Dispensado (baixo risco + regime ATPP) |
| Owner | Administração Mariane Cosméticos |

---

### A002 — Guarda Fiscal, Contábil e Pós-Venda

| Campo | Valor |
|---|---|
| Slug | `a002-fiscal-retention-and-warranty` |
| Finalidade | Atender fiscalização tributária, garantia legal, trocas/devoluções e histórico de status do pedido |
| Base legal | Art. 7º, II — Obrigação Legal ou Regulatória; Art. 7º, VI — Exercício Regular de Direitos |
| Categorias de titulares | Clientes compradoras |
| Sensíveis? | Não |
| Dados | Dados do pedido (`orders`, `order_items`, `order_status_history`, `payment_webhooks`) |
| Fonte | Gerado na confirmação e ciclo de vida do pedido |
| Sistemas | SQLite/LibSQL (`local.sqlite`), Painel `/admin/pedidos` e exportação CSV administrativa |
| Operadores | Hospedagem da aplicação / banco de dados |
| Transferência intl. | Não aplicável em ambiente local/nacional |
| Retenção | 5 anos após conclusão do pedido (Art. 16, I LGPD) |
| Segurança | Autenticação administrativa via HMAC-SHA256 (`admin_session`), proteção contra CSV Injection |
| Alto risco? | Não |
| RIPD | N/A |
| Owner | Administração Mariane Cosméticos |

---

### A003 — Comunicações Promocionais e Cupons (Marketing Opt-In)

| Campo | Valor |
|---|---|
| Slug | `a003-marketing-communications` |
| Finalidade | Envio de promoções, lançamentos e cupons via WhatsApp ou e-mail exclusivamente para titulares que optaram ativamente |
| Base legal | Art. 7º, I — Consentimento ([detalhes](./legal-basis.md)) |
| Categorias de titulares | Clientes compradoras que marcaram voluntariamente `marketingConsent = true` |
| Sensíveis? | Não |
| Dados | `customer_name`, `customer_phone`, `customer_email`, `marketing_consent` (`0` ou `1`), `created_at` |
| Fonte | Checkbox opcional desmarcado por padrão (`useState(false)`) em `CheckoutContact.tsx` |
| Sistemas | SQLite/LibSQL (`orders.marketing_consent`) |
| Operadores | WhatsApp / Meta Platforms Inc. |
| Transferência intl. | WhatsApp/Meta |
| Retenção | Até revogação do consentimento pela titular (Art. 18, IX) ou 24 meses sem interação |
| Segurança | Opt-in granular não-bloqueante (Art. 8º), registro em banco |
| Alto risco? | Não |
| RIPD | N/A |
| Owner | Administração Mariane Cosméticos |

---

### A004 — Consulta de CEP para Autopreenchimento de Endereço

| Campo | Valor |
|---|---|
| Slug | `a004-cep-lookup` |
| Finalidade | Autopreencher rua, bairro e cidade no checkout a partir do CEP informado |
| Base legal | Art. 7º, V — Procedimentos Preliminares a Contrato |
| Categorias de titulares | Clientes em preenchimento de checkout (modalidade `entrega`) |
| Sensíveis? | Não |
| Dados | CEP (8 dígitos) |
| Fonte | Digitado pela titular em `CheckoutDelivery.tsx` |
| Sistemas | Requisição HTTP GET client-side para `https://viacep.com.br/ws/{cep}/json/` com timeout de 4s |
| Operadores | ViaCEP (serviço público de consulta de diretórios postais) |
| Transferência intl. | Não |
| Retenção | Efêmero em memória |
| Segurança | Timeout de 4s via `AbortController` e fallback manual imediato |
| Alto risco? | Não |
| RIPD | N/A |
| Owner | Engenharia Mariane Cosméticos |

---

### A005 — Prevenção à Fraude, Rate Limiting e Conciliação de Webhooks

| Campo | Valor |
|---|---|
| Slug | `a005-antifraud-and-webhook-security` |
| Finalidade | Impedir ataques de força bruta, bots, cliques duplos e adulteração de notificações de pagamento |
| Base legal | Art. 7º, IX — Legítimo Interesse (segurança e prevenção à fraude — Art. 46) |
| Categorias de titulares | Visitantes do checkout e clientes compradoras |
| Sensíveis? | Não |
| Dados | Endereço IP (em memória), `idempotency_key`, campo honeypot `website_url`, `event_id` e payload resumido de webhook |
| Fonte | Cabeçalhos HTTP de requisição e webhook do Asaas |
| Sistemas | Rate limiter em memória (`src/lib/rate-limit.ts`), SQLite (`orders.idempotency_key`, `payment_webhooks`) |
| Operadores | Asaas Gestão Financeira S.A. |
| Transferência intl. | Não |
| Retenção | IP em memória: 10–15 min; `payment_webhooks`: 5 anos junto ao pedido |
| Segurança | Comparação `crypto.timingSafeEqual`, chave única `idempotency_key`, validação estrita de centavos (`paidCents === totalCents`) |
| Alto risco? | Não |
| RIPD | N/A |
| Owner | Engenharia Mariane Cosméticos |

---

### A006 — Persistência Local da Sacola (`localStorage`)

| Campo | Valor |
|---|---|
| Slug | `a006-local-shopping-bag` |
| Finalidade | Preservar itens selecionados na Sacola de Compras durante a navegação |
| Base legal | Art. 7º, V — Procedimentos Preliminares a Contrato |
| Categorias de titulares | Visitantes da loja online |
| Sensíveis? | Não |
| Dados | Lista de produtos e quantidades (`mariane_cart`); zero PII |
| Fonte | Interação da visitante com botões "Adicionar à Sacola" |
| Sistemas | `window.localStorage` no navegador da titular |
| Operadores | Nenhum |
| Transferência intl. | Não |
| Retenção | Até confirmação do pedido (`clearCart()`) ou limpeza pela titular |
| Segurança | Sem armazenamento de dados pessoais ou financeiros no `localStorage` |
| Alto risco? | Não |
| RIPD | N/A |
| Owner | Engenharia Mariane Cosméticos |

## Checklist de Qualidade (`lgpd-data-mapping`)
- [x] Toda tabela com dados pessoais (`orders`, `order_items`, `order_status_history`, `payment_webhooks`) está coberta
- [x] Toda integração de terceiro (WhatsApp/Meta, Asaas, ViaCEP) está listada como compartilhamento
- [x] Toda atividade tem base legal explícita em `.lgpd/legal-basis.md`
- [x] Atividades de alto risco avaliadas (nenhuma enquadrada no Art. 4º da Res. CD/ANPD nº 2/2022)
- [x] Atividades com menores avaliadas (não aplicável — e-commerce de cosméticos voltado ao público adulto)
- [x] Prazos e critérios de retenção definidos para 100% das atividades
