# Mariane Cosméticos: E-commerce

Plataforma de comércio eletrônico de cosméticos profissionais, perfumaria e tratamentos capilares da Mariane Cosméticos (`@mariane_cosmeticos_01`), localizada em Lages, SC.

> "Linda é a mulher que bem se quer"

## Tecnologias e arquitetura

- Frontend e renderização no servidor: Next.js 15.1.7 (App Router e React Server Components), React 19, TypeScript 5 e validação de esquemas com Zod 4.
- Design system ([`docs/DESIGN.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/DESIGN.md)): Tailwind CSS 3.4 com tokens semânticos da marca (Roxo Imperial `#75066A` primária, `#9C27B0` vibrante, `#4D0046` escuro, Magenta `#EB1E78` destaque, Ônix `#1A0918`, Seda Off-White `#FAF7FB` e Esmeralda WhatsApp `#25D366`) e componentes base em `src/components/ui/` (`Button`, `Badge`, `Price`, `SectionHeader`, `Container`).
- Identidade visual: ativos oficiais gerenciados em [`src/components/Logo.tsx`](file:///c:/Projetos/Mariane%20Cosmeticos/src/components/Logo.tsx) (`/logo-nav.png`, `/logo-white.png`, `/logo-mariane-banner.png`, `/logo.svg`, `src/app/icon.svg`, `/favicon.ico`) como Revendedora Oficial Madressenza.
- Banco de dados e ORM: SQLite / LibSQL (`local.sqlite` em ambiente local, compatível com Cloudflare D1 e Turso) gerenciado via Drizzle ORM ([`src/db/schema.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/db/schema.ts)).
- Catálogo paginado no servidor ([`src/lib/catalog.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/lib/catalog.ts)):
  - 70 produtos distribuídos em 7 marcas (*Madressenza, Wella Profissional, L'Oréal Professionnel, Truss, Braé, Lola Cosmetics, Amend*) e 6 categorias (*Tratamento & Máscaras, Cronograma Capilar, Shampoos & Condicionadores, Óleos & Séruns, Perfumaria & Casa, Kits Promocionais*).
  - Filtros combináveis na URL resolvidos no servidor (`?marca=`, `?categoria=`, `?preco=ate-100|100-200|acima-200`, `?q=`, `?ordem=destaques|mais_vendidos|menor_preco|maior_preco`, `?pagina=`).
  - Exibição de desconto restrita a promoções reais (`promoPrice < price`), fallback para imagens externas, `generateMetadata` dinâmico e dados estruturados `JSON-LD` (`Schema.org Product`).
- Checkout, motor financeiro em centavos inteiros e pagamentos ([`docs/checkout/README.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/checkout/README.md)):
  - Configuração compartilhada em [`src/config/store.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/config/store.ts) e [`src/config/commerce.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/config/commerce.ts) e cálculo de preços, descontos PIX por produto e frete em centavos inteiros em [`src/lib/pricing.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/lib/pricing.ts).
  - Criação transacional de pedidos em [`src/lib/orders.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/lib/orders.ts) com reserva condicional de estoque (`stock >= quantity`), chave de idempotência (`idempotencyKey`), código curto (`MC-YYYYMMDD-XXXXXX`) e token público de 128 bits (`publicToken`).
  - Máquina de estados monotônica em [`src/lib/order-state-machine.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/lib/order-state-machine.ts) com trilha de auditoria em `order_status_history`, reposição automática de estoque em cancelamentos ou expirações de 24 horas e integração Asaas Sandbox PIX/Cartão com webhook idempotente em [`src/lib/payments.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/lib/payments.ts).
  - Página pública de acompanhamento (`/pedido/[token]`) com mascaramento de dados pessoais conforme a LGPD e painel operacional da lojista (`/admin/login` e `/admin/pedidos`) protegido por sessão assinada via HMAC-SHA256 em [`src/middleware.ts`](file:///c:/Projetos/Mariane%20Cosmeticos/src/middleware.ts).

## Rotas da aplicação e endpoints de API

### Páginas (App Router)

| Rota | Arquivo | Descrição |
| :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Vitrine inicial com banners, carrossel de marcas, produtos em destaque, mais vendidos e localização da loja física. |
| `/produtos` | `src/app/produtos/page.tsx` | Catálogo paginado com filtros combináveis de marca, categoria, faixa de preço, busca textual e ordenação. |
| `/categoria/[slug]` | `src/app/categoria/[slug]/page.tsx` | Vitrine filtrada por categoria com metadados dinâmicos. |
| `/produto/[slug]` | `src/app/produto/[slug]/page.tsx` | Página de detalhes do produto com galeria, cálculo de desconto PIX, parcelamento, modo de uso e produtos relacionados. |
| `/carrinho` | `src/app/carrinho/page.tsx` | Sacola dedicada sincronizada com `localStorage` e barra de progresso para frete grátis (acima de R$ 199,00). |
| `/checkout` | `src/app/checkout/page.tsx` | Finalização de pedido em 3 etapas (contato, entrega/retirada com busca ViaCEP e pagamento via WhatsApp, PIX ou Cartão). |
| `/pedido/[token]` | `src/app/pedido/[token]/page.tsx` | Acompanhamento seguro do pedido via token de 128 bits, linha do tempo de status, QR Code PIX, link Asaas e dados mascarados (LGPD). |
| `/admin/login` | `src/app/admin/login/page.tsx` | Autenticação administrativa da loja com proteção contra força bruta. |
| `/admin/pedidos` | `src/app/admin/pedidos/page.tsx` | Painel operacional para listagem, busca, transição de status, contato direto no WhatsApp da cliente e exportação CSV. |
| `/atendimento` | `src/app/atendimento/page.tsx` | Canais de suporte, horários de funcionamento e localização em Lages, SC. |
| `/politica-de-privacidade` | `src/app/politica-de-privacidade/page.tsx` | Diretrizes de privacidade e tratamento de dados pessoais sob a LGPD. |
| `/trocas-e-devolucoes` | `src/app/trocas-e-devolucoes/page.tsx` | Regras de troca, devolução e direito de arrependimento (CDC). |

### Endpoints de API

| Endpoint | Método | Descrição |
| :--- | :--- | :--- |
| `/api/produtos` | `GET` | Consulta paginada de produtos com suporte a filtros de busca, categoria e marca. |
| `/api/checkout/cotacao` | `POST` | Cotação autoritativa no servidor em centavos inteiros (subtotal, desconto PIX, frete e total). |
| `/api/pedidos` | `POST` | Criação transacional de pedido com reserva de estoque, chave de idempotência e retorno de `publicToken`. |
| `/api/pedidos/[token]` | `GET` | Consulta pública do pedido pelo token de 128 bits com mascaramento de PII e histórico de status. |
| `/api/pagamentos/criar` | `POST` | Geração de cobrança PIX ou Cartão no Asaas Sandbox com validação contra Open Redirect. |
| `/api/webhooks/pagamento` | `POST` | Recepção de eventos de cobrança Asaas validada por HMAC-SHA256 ou `asaas-access-token` com idempotência em banco. |
| `/api/admin/auth` | `POST` / `DELETE` | Login administrativo com emissão de cookie `HttpOnly` (`admin_session`) e logout. |
| `/api/admin/pedidos` | `GET` | Listagem paginada e filtrada de pedidos para o painel da lojista com expiração automática de pendentes vencidos. |
| `/api/admin/pedidos/[id]/status` | `PATCH` | Atualização de status do pedido validada pela máquina de estados monotônica e reposição automática de estoque. |
| `/api/admin/pedidos/export-csv` | `GET` | Exportação de até 500 pedidos em formato CSV com sanitização contra injeção de fórmulas. |

## Variáveis de ambiente

Copie o arquivo [`.env.example`](file:///c:/Projetos/Mariane%20Cosmeticos/.env.example) para `.env.local` em ambiente de desenvolvimento. Nunca versione segredos reais no Git.

| Variável | Obrigatória | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | Sim (padrão `file:./local.sqlite`) | URL de conexão com o banco SQLite local ou instância LibSQL/Turso. |
| `ADMIN_PASSWORD` | Sim (para `/admin/*`) | Senha administrativa usada para autenticar no painel da loja e assinar o token HMAC-SHA256 do cookie `admin_session`. |
| `ASAAS_WEBHOOK_TOKEN` | Sim (para webhooks) | Token secreto verificado no cabeçalho `asaas-access-token` ou `x-webhook-signature` em `POST /api/webhooks/pagamento`. |
| `PAYMENT_WEBHOOK_SECRET` | Alternativa a `ASAAS_WEBHOOK_TOKEN` | Segredo HMAC-SHA256 de fallback aceito pelo verificador de assinatura do webhook de pagamento. |
| `ASAAS_API_KEY` | Opcional no MVP | Chave da API v3 do Asaas para emissão de cobranças e sincronização ativa de status. |
| `ASAAS_API_URL` | Opcional | URL base da API do Asaas (`https://sandbox.asaas.com/api/v3` em homologação). |
| `PAYMENT_SANDBOX_MODE` | Opcional | Quando definido como `"mock"` ou `"true"`, habilita o gerador determinístico de cobranças Sandbox sem chave externa. |
| `PAYMENT_SANDBOX_ENABLED` | Opcional | Flag booleana (`"true"` ou `"false"`) para ativação do modo Sandbox local. |
| `NEXT_PUBLIC_ENABLE_PIX` | Opcional | Exibe a opção de pagamento PIX no checkout quando `"true"` e acompanhada de `ASAAS_API_KEY`. |
| `NEXT_PUBLIC_ENABLE_CARD` | Opcional | Exibe a opção de cartão de crédito no checkout quando `"true"` e acompanhada de `ASAAS_API_KEY`. |
| `NEXT_PUBLIC_SITE_URL` | Opcional | Domínio canônico da loja (`https://marianecosmeticos.com.br`). |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Opcional | Número oficial do WhatsApp da loja (`5549991251617`). |

## Como executar localmente

No terminal, acesse a pasta do projeto, instale as dependências, aplique a preparação do banco de dados e inicie o servidor:

```powershell
cd "C:\Projetos\Mariane Cosmeticos"
npm install
npm run seed
npx tsx src/scripts/migrate-checkout-expansion.ts
npm run dev
```

A aplicação ficará disponível em `http://localhost:3001`.

## Comandos de banco de dados e migração

- `npm run seed`: inicializa `local.sqlite` a partir de `drizzle/0000_init.sql` e popula marcas, categorias e produtos (`tsx src/scripts/seed-linda-rea.ts`).
- `npx tsx src/scripts/migrate-checkout-expansion.ts`: executa a migração aditiva da Fase Expand (`drizzle/0001_checkout_expansion.sql`), criando colunas em centavos inteiros, `public_token`, `idempotency_key`, a tabela `order_status_history`, índices B-Tree e o backfill dos registros existentes.
- `npx tsx src/scripts/curate-db.ts`: executa a curadoria Madressenza e higienização de descontos e avaliações no banco.
- `npm run drizzle:generate`: gera novas migrações SQL em `drizzle/` a partir de `src/db/schema.ts`.
- `npm run drizzle:push`: aplica o esquema do Drizzle diretamente no banco SQLite local (`local.sqlite`).

## Scripts de compilação e suítes de testes

### Build e verificação estática

- `npm run dev`: inicia o servidor de desenvolvimento na porta `3001`.
- `npm run build`: compila a aplicação Next.js 15 para produção (`exit code 0`).
- `npm start`: inicia o servidor de produção na porta `3001`.
- `npm run lint`: executa a verificação estrita de tipos TypeScript (`tsc --noEmit`).

### Testes unitários (`tests/unit/`)

- `npx tsx --test tests/unit/pricing.test.ts`: valida conversões `toCents`/`toReais`, cálculo de preços promocionais, frete grátis, desconto PIX por item e cotação completa.
- `npx tsx --test tests/unit/config.test.ts`: verifica `STORE_CONFIG`, `COMMERCE_CONFIG` e a formatação parametrizada da mensagem de WhatsApp.
- `npx tsx --test tests/unit/schema-expand.test.ts`: testa a migração de expansão do esquema SQLite, índices, triggers de estoque não negativo e backfill.
- `npx tsx --test tests/unit/checkout-validation.test.ts`: testa os contratos Zod (`createOrderSchema` e `quoteRequestSchema`), sanitização de HTML, validação condicional de CEP/endereço e consentimento LGPD desmarcado por padrão.
- `npx tsx --test tests/unit/order-state-machine.test.ts`: valida todas as transições permitidas e proibidas da máquina de estados e a identificação de status que repõem estoque.
- `npx tsx --test tests/unit/rate-limit.test.ts`: valida o limitador de taxa em janela deslizante por IP e bucket.
- `npx tsx --test tests/unit/admin-and-csv.test.ts`: testa autenticação administrativa em tempo constante, tokens de sessão HMAC-SHA256, verificação CSRF Origin e sanitização contra CSV Injection.

### Testes de integração (`tests/integration/`)

- `npx tsx --test tests/integration/order-creation.test.ts`: testa criação transacional de pedidos, reserva atômica de estoque, concorrência (`Promise.all` disputando a última unidade), idempotência e mascaramento de PII.
- `npx tsx --test tests/integration/webhook-payment.test.ts`: valida assinatura HMAC-SHA256 e `asaas-access-token`, rejeição de subpagamento em centavos, idempotência na tabela `payment_webhooks`, alerta em pedido expirado e estorno de estoque.
- `npx tsx --test tests/integration/asaas-checkout-and-tracking.test.ts`: testa emissão de cobrança PIX/Cartão Sandbox, validação de `returnUrl` e `checkoutUrl`, vínculo com `publicToken` e sincronização ativa de status com o provedor.
- `npx tsx --test tests/integration/order-tracking-page.test.ts`: valida a página `/pedido/[token]`, expiração preguiçosa de pedidos vencidos e ocultação de dados pessoais.
- `npx tsx --test tests/integration/admin-panel-tdd.test.ts`: valida o fluxo completo de login administrativo, bloqueio por rate limit, listagem paginada, busca escapada, transição de status via API e exportação CSV.
- `npx tsx --test tests/integration/architectural-risks-and-frontend.test.ts`: testa resiliência do hook ViaCEP com timeout de 4 segundos, cancelamento de cotações concorrentes via `AbortController` e preservação da sacola em falhas de rede.
- `npx tsx tests/integration/checkout-e2e-journeys.test.ts`: valida as 5 jornadas ponta a ponta de checkout em Mobile (`375x812`) e Desktop (`1280x800`), cobrindo retirada, entrega, erro/timeout de CEP, clique duplo idempotente e produto esgotado durante a compra (`409 Conflict`).

### Testes de segurança, E2E e ativos (`tests/security/` e `tests/e2e/`)

- `npx tsx tests/security/adversarial-checkout.test.ts`: suíte de testes adversariais locais cobrindo as 10 categorias do checklist de segurança (Business Logic Errors, Mass Assignment, Race Condition, IDOR, XSS Injection, SQL Injection, CSV Injection, Open Redirect, Brute Force Rate Limit e Insecure Randomness).
- `npm test` (ou `npx tsx tests/e2e/runner.ts`): executa a suíte E2E e de contrato em 4 Tiers (`tier1-features`, `tier2-boundaries`, `tier3-combinations` e `tier4-scenarios`).
- `npx tsx tests/stress-m1-adversarial.ts`: testa as 24 combinações do componente `Logo` e tokens da marca.
- `python tests/stress-m1-binary.py`: valida a integridade binária e XML dos ativos de imagem e SVG.
- `python tests/stress-m1-tokens-css.py`: valida regras CSS, contraste WCAG 2.2 AA e compilação JIT do Tailwind.

## Documentação técnica do projeto

- [`docs/DESIGN.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/DESIGN.md): contrato de marca, paleta de cores, tipografia e componentes de interface.
- [`docs/checkout/README.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/checkout/README.md): arquitetura detalhada do checkout, motor financeiro em centavos, máquina de estados, integração Asaas, proteção LGPD e painel administrativo.
- [`docs/checkout/ESPECIFICACAO.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/checkout/ESPECIFICACAO.md): diagnóstico do código legado e especificação dos módulos do checkout.
- [`docs/adr/`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/adr/): registros de decisão de arquitetura (ADRs 0001 a 0004).
- [`docs/payments-comparison.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/payments-comparison.md): comparativo de gateways (Mercado Pago, Pagar.me e Asaas) e desenho de Sandbox/Webhook.
- [`docs/reports/relatorio-entrega-e-prontidao-cloudflare.md`](file:///c:/Projetos/Mariane%20Cosmeticos/docs/reports/relatorio-entrega-e-prontidao-cloudflare.md): relatório de entrega, auditoria LGPD/segurança e plano de deploy e rollback na Cloudflare.

## Contatos oficiais da marca

- Instagram: [@mariane_cosmeticos_01](https://www.instagram.com/mariane_cosmeticos_01/)
- WhatsApp: [+55 (49) 99125-1617](https://wa.me/5549991251617)
- Endereço físico: Rua Blumenau, Nº 623, Bairro São Cristóvão, Lages, SC (CEP: 88505-300)
