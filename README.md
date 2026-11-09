# Mariane Cosméticos — E-Commerce de Alta Performance

E-commerce moderno de cosméticos profissionais, perfumaria fina e tratamentos capilares para a **Mariane Cosméticos** (`@mariane_cosmeticos_01`), localizada em **Lages – SC**.

> _"Linda é a mulher que bem se quer"_

---

## 🚀 Tecnologias & Arquitetura

- **Frontend & SSR:** Next.js 15.1.7 (App Router / React Server Components), React 19, TypeScript 5
- **Design System (`docs/DESIGN.md`):** Tailwind CSS 3.4 com conjunto único de tokens semânticos da marca (Roxo Imperial `#75066A` primária / `#9C27B0` vibrante / `#4D0046` escuro + Magenta `#EB1E78` destaque, Ônix `#1A0918`, Seda Off-White `#FAF7FB`, Esmeralda WhatsApp `#25D366`) e componentes base reutilizáveis em `src/components/ui/` (`Button`, `Badge`, `Price`, `SectionHeader`, `Container`).
- **Identidade Oficial:** Ativos oficiais de marca preservados em `src/components/Logo.tsx` (`/logo-nav.png`, `/logo-white.png`, `/logo-mariane-banner.png`, `/logo.svg`, `src/app/icon.svg`, `/favicon.ico`) — **Revendedora Oficial Madressenza**.
- **Banco de Dados & ORM:** SQLite / LibSQL (`local.sqlite` em dev, compatível com Cloudflare D1) gerenciado via **Drizzle ORM** (`src/db/schema.ts`).
- **Catálogo Server-Side Paginado (`src/lib/catalog.ts`):**
  - 70 produtos distribuídos em 7 marcas oficiais (*Madressenza, Wella Profissional, L'Oréal Professionnel, Truss, Braé, Lola Cosmetics, Amend*) e 6 categorias (*Tratamento & Máscaras, Cronograma Capilar, Shampoos & Condicionadores, Óleos & Séruns, Perfumaria & Casa, Kits Promocionais*).
  - Filtros combináveis na URL resolvidos no servidor (`?marca=`, `?categoria=`, `?preco=ate-100|100-200|acima-200`, `?q=`, `?ordem=destaques|mais_vendidos|menor_preco|maior_preco`, `?pagina=`).
  - Desconto exibido exclusivamente quando há promoção real (`promoPrice < price`), fallback seguro para imagens externas (`onError`), `generateMetadata` dinâmico e dados estruturados `JSON-LD` (`Schema.org Product`).
- **Sacola, Checkout Persistente & Pagamento Sandbox (`src/lib/orders.ts` & `src/lib/payments.ts`):**
  - Gaveta lateral (`CartDrawer.tsx`) e página dedicada (`/carrinho`) sincronizadas com `localStorage`.
  - Checkout validado (`/checkout` + `POST /api/pedidos`) que grava o pedido em `orders` e `order_items` com status `"aguardando pagamento"` e abre o WhatsApp oficial (`+55 49 99125-1617`) com o código do pedido (`MC-YYYYMMDD-XXXX`) e os itens.
  - Integração Sandbox com **Asaas** (`POST /api/pagamentos/criar` e `POST /api/webhooks/pagamento`) com verificação criptográfica HMAC-SHA256 (`crypto.timingSafeEqual`) e proteção de idempotência na tabela `payment_webhooks`.

---

## 📦 Como Executar Localmente

No terminal, acesse a pasta do projeto:

```powershell
cd "C:\Projetos\Mariane Cosmeticos"
npm install
npm run dev
```

Acesse no navegador:
👉 **http://localhost:3001**

---

## 🛠️ Scripts e Suítes de Verificação

- `npm run dev` — Inicia o servidor de desenvolvimento na porta `3001`
- `npm run build` — Compila a aplicação para produção (`exit code 0`)
- `npm run lint` — Executa a validação estrita de tipos TypeScript (`tsc --noEmit`)
- `npm test` / `npx tsx tests/e2e/runner.ts` — Executa as 70 verificações E2E e de contrato (Tiers 1 a 4)
- `npm run seed` — Executa o seed completo do catálogo (`src/scripts/seed-linda-rea.ts`)
- `npx tsx src/scripts/curate-db.ts` — Executa a curadoria Madressenza e higienização de descontos/avaliações no banco
- `npx tsx tests/stress-m1-adversarial.ts` — Testes adversariais do componente `Logo` e tokens
- `python tests/stress-m1-binary.py` — Auditoria binária dos ativos de imagem e SVG
- `python tests/stress-m1-tokens-css.py` — Auditoria de 181 regras CSS, contraste WCAG 2.2 AA e resolução JIT do Tailwind

---

## 📚 Documentação Técnica do Projeto

- [`docs/DESIGN.md`](docs/DESIGN.md) — Contrato de Marca, Tokens Semânticos, Tipografia e Componentes Base (`src/components/ui/`)
- [`docs/plans/mvp.md`](docs/plans/mvp.md) — Plano de Implementação do MVP (100% concluído)
- [`docs/payments-comparison.md`](docs/payments-comparison.md) — Comparativo Oficial de Gateways (Mercado Pago vs. Pagar.me vs. Asaas) e Arquitetura de Sandbox/Webhook
- [`docs/reports/relatorio-entrega-e-prontidao-cloudflare.md`](docs/reports/relatorio-entrega-e-prontidao-cloudflare.md) — Relatório de Entrega 360º, Pendências de Dados da Cliente, Auditoria LGPD/Segurança e Plano de Prontidão/Deploy/Rollback Cloudflare

---

## 📞 Contatos Oficiais da Marca

- **Instagram:** [@mariane_cosmeticos_01](https://www.instagram.com/mariane_cosmeticos_01/)
- **WhatsApp:** [+55 (49) 99125-1617](https://wa.me/5549991251617)
- **Endereço Físico:** Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)
