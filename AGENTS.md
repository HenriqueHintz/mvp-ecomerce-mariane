# Mariane Cosméticos — Guia do Agente (`AGENTS.md`)

E-commerce da **Mariane Cosméticos** (Next.js 15 App Router, React 19, Tailwind CSS 3.4, Drizzle ORM + SQLite/LibSQL `@libsql/client`).
O contrato visual e cadastral da marca vive em [`docs/DESIGN.md`](docs/DESIGN.md) e é fiscalizado pela regra [`.agents/rules/identidade-visual.md`](.agents/rules/identidade-visual.md).

---

## 1. Identidade Imutável do Projeto

- **Marca:** `Mariane Cosméticos` (Revendedora Oficial Madressenza)
- **Slogan:** `"Linda é a mulher que bem se quer"`
- **WhatsApp:** `+55 (49) 99125-1617` (`5549991251617`)
- **Instagram:** `@mariane_cosmeticos_01` (`https://www.instagram.com/mariane_cosmeticos_01/`)
- **Endereço:** `Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)`
- **Logos (`src/components/Logo.tsx`):** `/logo-nav.png` (header claro), `/logo-white.png` (footer escuro), `/logo-mariane-banner.png` (badge), `/logo.svg` (OpenGraph) e `src/app/icon.svg` + `/favicon.ico`.

---

## 2. Comandos Verificados

Execute sempre a partir de `C:\Projetos\Mariane Cosmeticos`:

| Comando | Finalidade |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento em `http://localhost:3001` (`next dev -p 3001`). |
| `npm run build` | Compila a aplicação Next.js 15 para produção e valida tipos TypeScript (`exit code 0` obrigatório). |
| `npm start` | Inicia o servidor de produção na porta `3001` (`next start -p 3001`). |
| `npm run lint` | Executa o linter do Next.js (`next lint`). |
| `npm run seed` | Inicializa `local.sqlite` a partir de `drizzle/0000_init.sql` e popula marcas, categorias e produtos (`tsx src/scripts/seed-linda-rea.ts`). |
| `npm run drizzle:generate` | Gera novas migrações SQL em `drizzle/` a partir de `src/db/schema.ts`. |
| `npm run drizzle:push` | Empurra o schema do Drizzle diretamente para o banco SQLite local (`local.sqlite`). |
| `npx tsx tests/e2e/runner.ts` | Executa a suíte de 57 testes E2E em 4 Tiers (`tier1` a `tier4`). |
| `npx tsx tests/stress-m1-adversarial.ts` | Executa o teste de estresse do componente `<Logo />` (24 combinações) e tokens de marca. |
| `python tests/stress-m1-binary.py` | Valida integridade binária e XML dos ativos oficiais (`logo.svg`, `icon.svg`, `favicon.ico`, PNGs). |
| `python tests/stress-m1-tokens-css.py` | Valida compilação JIT do Tailwind, contraste WCAG 2.1 AA e bundle CSS de produção. |

---

## 3. Mapa de Pastas

| Caminho | Responsabilidade |
| :--- | :--- |
| `src/app/` | Rotas do Next.js 15 App Router: `/` (`page.tsx`), `/produtos`, `/categoria/[slug]`, `/produto/[slug]`, `/checkout`, `/api/produtos` e `layout.tsx` + `globals.css`. |
| `src/components/` | Componentes de interface: `Logo.tsx`, `Header.tsx`, `Footer.tsx`, `ProductCard.tsx`, `CartDrawer.tsx`, `BrandCarousel.tsx`, `HeroBackgroundCarousel.tsx`, `HeroVisualCarousel.tsx`, `StoreMapSection.tsx`. |
| `src/context/` | Estado global do carrinho no cliente: `CartContext.tsx` (persistência em `localStorage` e geração parametrizada do link de pedido via WhatsApp). |
| `src/db/` | Camada de dados: `schema.ts` (tabelas `brands`, `categories`, `products`, `product_images`, `orders`, `order_items`) e `index.ts` (conexão `@libsql/client` com `local.sqlite`). |
| `src/scripts/` | Scripts utilitários de banco e carga: `seed-linda-rea.ts` e `test-db.ts`. |
| `public/` | Ativos estáticos oficiais de marca (`/logo-nav.png`, `/logo-white.png`, `/logo-mariane-banner.png`, `/logo.svg`, `/favicon.ico`). |
| `docs/` | Contrato de design ([`docs/DESIGN.md`](docs/DESIGN.md)), especificações (`docs/specs/`) e planos de implementação (`docs/plans/`). |
| `tests/` | Suíte E2E autônoma (`tests/e2e/runner.ts` + `tier1`..`tier4`) e testes de estresse de tokens/ativos (`tests/stress-m1-*`). |

---

## 4. Convenções de Engenharia

1. **Tokens de Design:** Toda estilização deve usar os tokens de [`tailwind.config.ts`](tailwind.config.ts) e [`src/app/globals.css`](src/app/globals.css) documentados em [`docs/DESIGN.md`](docs/DESIGN.md) (`marina-50`..`950` para a escala Roxo/Violeta Imperial `#75066A`/`#9C27B0`/`#4D0046`, `brand-accent` `#EB1E78`, `onyx`, `silk`, `emerald-whatsapp`).
2. **Fontes no Next.js 15:** Carregar `Playfair Display` e `Inter` via `next/font/google` em `src/app/layout.tsx` (nunca via `<link>` manual no `<head>`).
3. **Server vs Client Components:** Páginas de catálogo e vitrine (`src/app/**/page.tsx`) buscam dados no servidor via Drizzle ORM; interações de sacola, busca, filtros dinâmicos e carrosséis usam `"use client"`.
4. **Conversão MVP:** Todo fechamento de pedido no MVP converge para o WhatsApp oficial (`5549991251617`) com mensagem estruturada; pagamento online (PIX/cartão) pertence à Fase 2.
5. **Tipagem Estrita:** Proibido usar `any` ou `@ts-ignore` em componentes e rotas.

---

## 5. Definição de Pronto (Definition of Done)

Uma tarefa só está pronta quando **todos** os critérios abaixo forem comprovados no mesmo turno:
- [ ] `npm run build` executa e termina com `exit code 0`.
- [ ] `npx tsx tests/e2e/runner.ts` executa com 100% dos testes passando (`exit code 0`).
- [ ] `npx tsx tests/stress-m1-adversarial.ts`, `python tests/stress-m1-binary.py` e `python tests/stress-m1-tokens-css.py` executam com `exit code 0`.
- [ ] Nenhuma divergência de identidade: zero ocorrências de `"Marina Cosméticos"`, `@marina_cosmeticoss`, `5537998373933` ou `"Martinho Campos"` no código ou nos testes.
- [ ] Conformidade total com [`docs/DESIGN.md`](docs/DESIGN.md) e [`.agents/rules/identidade-visual.md`](.agents/rules/identidade-visual.md).
