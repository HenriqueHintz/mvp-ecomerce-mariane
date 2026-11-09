# Plano de Implementação do MVP — Mariane Cosméticos

> **Para agentes implementadores:** Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar este plano tarefa por tarefa. Passos utilizam sintaxe de checkbox (`- [ ]`) para rastreamento.
>
> **Status atual:** **CONCLUÍDO E VERIFICADO (`[VERIFICADO]` — 67/67 testes E2E, 181/181 testes de tokens/CSS, `npm run build` exit 0)** — Todas as tarefas do MVP e da integração Sandbox de Pagamentos foram implementadas e validadas. Consulte o relatório consolidado em [`docs/reports/relatorio-entrega-e-prontidao-cloudflare.md`](../reports/relatorio-entrega-e-prontidao-cloudflare.md).

**Meta (Goal):** Entregar o MVP da loja virtual **Mariane Cosméticos** pronto para apresentação comercial à cliente em Lages – SC, com Home (Hero + seções consultivas e vitrines), Catálogo e Categorias com filtros combináveis e ordenação funcionais, Página de Produto rica com SEO/OpenGraph para compartilhamento no WhatsApp e vitrine de relacionados, Sacola lateral (`CartDrawer`) e **fechamento de pedido 100% focado e seguro via WhatsApp (`+55 49 99125-1617`)**, reservando o gateway de pagamento online (PIX dinâmico / Cartão) para a Fase 2.

**Arquitetura:** Next.js 15.1.7 (App Router, Server Components para listagens/SEO e Client Components para interatividade de sacola e filtros), Drizzle ORM sobre SQLite/LibSQL (`local.sqlite` em dev / Cloudflare D1 em prod), estilização em Tailwind CSS 3.4 estritamente vinculada ao contrato [`docs/DESIGN.md`](../DESIGN.md) e à regra [`.agents/rules/identidade-visual.md`](../../.agents/rules/identidade-visual.md).

**Stack & Comandos de Verificação:**
- Runtime/Framework: Next.js 15.1.7 + React 19 + TypeScript 5
- Banco de Dados: `@libsql/client` + `drizzle-orm` (`local.sqlite`)
- Testes E2E/Integração: `npx tsx tests/e2e/runner.ts`
- Testes de Estresse (M1): `npx tsx tests/stress-m1-adversarial.ts`, `python tests/stress-m1-binary.py`, `python tests/stress-m1-tokens-css.py`
- Build de Produção: `npm run build`

---

## Fase 1 — Mapa de Escopo do MVP

Classificação rigorosa do que compõe a entrega para apresentação à cliente:

### 1.1 `[CONFIRMADO]` — Escopo Obrigatório do MVP
- **Identidade & Governança (Concluído nesta etapa):**
  - Marca `Mariane Cosméticos`, slogan *"Linda é a mulher que bem se quer"*, endereço `Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)`, WhatsApp `+55 (49) 99125-1617` (`5549991251617`), Instagram `@mariane_cosmeticos_01`.
  - Paleta Roxo/Violeta Imperial (`#75066A` primária / `#9C27B0` vibrante / `#4D0046` escuro) + Magenta (`#EB1E78` destaque) documentada em `docs/DESIGN.md` e protegida por `.agents/rules/identidade-visual.md`.
  - Logos oficiais preservados em `src/components/Logo.tsx` (`/logo-nav.png`, `/logo-white.png`, `/logo-mariane-banner.png`, `/logo.svg`, `src/app/icon.svg`, `/favicon.ico`).
- **Home (`src/app/page.tsx`):**
  - Hero split-column com `HeroBackgroundCarousel` + `HeroVisualCarousel`, selo oficial *Revendedora Oficial Madressenza*, CTAs para `/produtos` e consultoria no WhatsApp (`5549991251617`).
  - Barra de credibilidade (100% Originais, Frete Grátis > R$ 199, Até 10x Sem Juros, 5% OFF no PIX).
  - Carrossel de marcas parceiras (`BrandCarousel.tsx`).
  - Vitrines de *Mais Vendidos & Destaques* (8 itens), seção consultiva de *Cronograma Capilar em 3 Etapas* (Hidratação, Nutrição e Reconstrução com atalhos diretos) e vitrine de *Tratamentos & Nutrição*.
  - Seção de localização física em Lages – SC (`StoreMapSection.tsx`) com Google Maps embutido e botões *"Como Chegar"* e *"Waze"*.
- **Catálogo Geral (`src/app/produtos/page.tsx`), Categorias (`src/app/categoria/[slug]/page.tsx`) e API (`src/app/api/produtos/route.ts`):**
  - Busca textual (`?q=`), filtro por marca (`?marca=`), filtro por categoria (`?categoria=`) e ordenação (`?ordem=mais_vendidos|menor_preco|maior_preco`) com controles visuais completos na UI e preservação de query params combinados.
  - Navegação rápida entre categorias, seletor de ordenação e tratamento de estado vazio em `/categoria/[slug]`.
  - Aplicação real dos filtros `marca` e `categoria` na rota `/api/produtos` (hoje lidos em `src/app/api/produtos/route.ts:8-9`, mas não aplicados na lista retornada).
- **Página de Produto (`src/app/produto/[slug]/page.tsx` + `ProductDetailClient.tsx`):**
  - Galeria de imagens com miniaturas, cálculo de preço PIX (5% OFF) e parcelamento em até 10x, seletor de quantidade, adição à sacola (`CartDrawer`), botão de pedido direto no WhatsApp com link do produto, descrição e modo de uso profissional.
  - Metadados dinâmicos (`generateMetadata`) com título, descrição e imagem do produto para pré-visualização rica (OpenGraph) ao compartilhar links no WhatsApp, além de vitrine de *Produtos Relacionados* da mesma categoria/marca.
- **Sacola (`CartDrawer.tsx` + `CartContext.tsx`) e Pedido Finalizado pelo WhatsApp (`/checkout`):**
  - Barra de progresso dinâmica de Frete Grátis (meta R$ 199,00).
  - Fluxo de fechamento unificado via WhatsApp (`5549991251617`): tanto o fechamento rápido na gaveta (`CartDrawer`) quanto a página dedicada `/checkout` devem enviar o pedido formatado para o WhatsApp da Mariane (com itens, quantidades, subtotal, status de frete, endereço em Lages/região e **preferência de pagamento**: PIX com 5% OFF, Cartão em até 10x ou Retirada na Loja).

### 1.2 `[PROPOSTO]` — Melhorias Recomendadas para Blindar a Apresentação à Cliente
- **Curadoria de Produtos `Madressenza` no Seed/Banco (`local.sqlite`):**
  - Inclusão da marca `Madressenza` na tabela `brands` e de produtos reais da linha de perfumaria/aromatizadores/corpo Madressenza em `local.sqlite` para sustentar o selo *"Revendedora Oficial Madressenza"* do Hero e do Logo.
- **Fallback Visual de Imagem em `ProductCard.tsx`, `ProductDetailClient.tsx` e `CartDrawer.tsx`:**
  - Tratamento `onError` nas imagens de produtos para exibir um placeholder elegante com a identidade Roxo Imperial caso alguma URL externa do CDN falhe durante a demonstração.
- **Páginas Institucionais Enxutas no Rodapé (`Footer.tsx`):**
  - Criar páginas estáticas leves para `/atendimento`, `/trocas-e-devolucoes` e `/politica-de-privacidade` que hoje estão linkadas em `src/components/Footer.tsx:136-138` mas retornam `404 Not Found`.

### 1.3 `[FORA DO ESCOPO]` — Fase 2 (Pós-Aprovação do MVP)
- **Gateway de Pagamento Online Transparente:** Integração com API de PIX dinâmico (geração de QR Code/Copia-e-Cola real via Mercado Pago, Asaas, Pagar.me ou Stripe) e processamento de Cartão de Crédito com webhook de confirmação.
- **Persistência de Pedidos Autenticados & Painel Admin:** Gravação transacional nas tabelas `orders` / `order_items`, login de cliente, histórico de pedidos e backoffice administrativo de estoque.
- **Cálculo de Frete Dinâmico por API Externa:** Cotação em tempo real via Correios / Melhor Envio (no MVP mantém-se a regra comercial de Frete Grátis a partir de R$ 199,00 e combinação de entrega local em Lages – SC / frete via WhatsApp).
- **Deploy em Produção Cloudflare D1 + Domínio DNS:** Publicação final em `marianecosmeticos.com.br` após validação do catálogo definitivo pela cliente.

---

## Fase 2 — Questionamentos Críticos & Análise de Riscos ("O que está fraco")

Antes de iniciarmos a implementação das tarefas de UI/Catálogo/Checkout do MVP, precisamos alinhar **6 fragilidades concretas** identificadas na auditoria real do código e do banco de dados:

### 1. Contradição Crítica: Selo "Revendedora Oficial Madressenza" sem nenhum produto Madressenza no banco
- **Evidência:** O logo oficial (`public/logo.svg`, `src/components/Logo.tsx:62`), o selo do Hero (`src/app/page.tsx:93`) e o Slide 4 do carrossel principal (`src/components/HeroVisualCarousel.tsx:52`) destacam a **Madressenza** como diferencial número 1 da Mariane Cosméticos. Porém, a tabela `brands` em `local.sqlite` contém apenas 6 marcas capilares (`Wella Profissional`, `L'Oréal Professionnel`, `Truss`, `Braé`, `Lola Cosmetics`, `Amend`) e **0 produtos da Madressenza**. Quando o cliente clica no Slide 4 (*"Madressenza & Wella Oil"*), ele cai em `/categoria/oleos-seruns` vendo apenas óleos capilares.
- **Pergunta para decisão:** Devemos cadastrar a marca `Madressenza` e popular 4 a 6 produtos icônicos da Madressenza (difusor de aromas, perfume de ambiente, água perfumada, sabonete líquido) em `local.sqlite` para a apresentação à cliente?

### 2. Risco Grave de Perda de Pedido: `/checkout` atual simula PIX/Cartão sem avisar a Mariane
- **Evidência:** Em `src/app/checkout/page.tsx:18-42`, a opção padrão selecionada é `paymentMethod = "pix"`, e o texto na linha 243 promete *"Ao clicar em finalizar, o QR Code e a chave Copia e Cola serão gerados para pagamento instantâneo"*. Porém, quando o cliente escolhe **PIX** ou **Cartão de Crédito** e envia o formulário, `handleFinishOrder` apenas executa `setOrderCompleted(true); clearCart();` (linhas 40-41) **sem abrir o WhatsApp e sem gravar nada no banco**. Só quando o cliente seleciona manualmente o 3º botão (`paymentMethod === "whatsapp"`, linha 28) o WhatsApp é aberto.
- **Proposta no Plano (Task 4):** Como o pagamento online fica para a Fase 2, transformar `/checkout` na **Finalização Assistida via WhatsApp**: o cliente preenche seus dados de entrega em Lages/SC e escolhe **sua preferência de pagamento para o atendimento** (*PIX com 5% de desconto*, *Cartão de Crédito em até 10x* ou *Retirada na Loja em Lages*). Ao clicar no botão principal *"Finalizar Pedido no WhatsApp"*, o sistema abre sempre o WhatsApp da Mariane (`5549991251617`) com todos os itens, endereço, desconto PIX calculado e preferência de pagamento, além de exibir um botão de reabertura na tela de confirmação. Concorda com essa abordagem?

### 3. Dependência de Imagens Externas (Hotlinking de `lindacosmeticos.cdn.magazord.com.br`)
- **Evidência:** Todos os 65 produtos de `local.sqlite` foram populados por `src/scripts/seed-linda-rea.ts` apontando diretamente para URLs do CDN da loja *Linda Cosméticos* (`lindacosmeticos.cdn.magazord.com.br`). Se o CDN externo bloquear hotlinking ou remover uma foto, o componente `<Image>` do Next.js exibe erro visual.
- **Proposta no Plano (Task 5):** Adicionar estado de fallback seguro (`onError`) em `ProductCard.tsx`, `ProductDetailClient.tsx` e `CartDrawer.tsx` para renderizar um placeholder elegante da Mariane Cosméticos caso qualquer imagem externa falhe.

### 4. Preços Inflados em +25% e 100% da Loja com Preço Riscado
- **Evidência:** O script `src/scripts/seed-linda-rea.ts:150-151` definiu `originalPrice = Math.round((promoPrice * 1.25) * 100) / 100` em todos os 65 produtos. Como resultado, **100% dos produtos** aparecem simultaneamente com preço antigo riscado (`promoPrice < price`). Em uma vitrine de beleza premium, ter todos os itens remarcados dilui o destaque de promoções reais.
- **Pergunta para decisão:** Mantemos a precificação atual apenas como demonstração para a reunião ou ajustamos o banco para que apenas ~25% dos produtos tenham `promoPrice` ativo?

### 5. Links Quebrados (`404`) no Rodapé (`Footer.tsx`)
- **Evidência:** `src/components/Footer.tsx:136-138` renderiza links para `/atendimento`, `/politica-de-privacidade` e `/trocas-e-devolucoes`, rotas que não existem em `src/app/`.
- **Proposta no Plano (Task 6):** Criar as 3 páginas institucionais estáticas com os dados reais da Mariane Cosméticos em Lages – SC (`Rua Blumenau, Nº 623`, WhatsApp `+55 (49) 99125-1617`, regras de trocas conforme CDC e política de privacidade LGPD) para garantir zero links quebrados durante a apresentação.

### 6. Filtros e Ordenação Incompletos no Catálogo (`/produtos`, `/categoria/[slug]` e `/api/produtos`)
- **Evidência:**
  - `src/app/produtos/page.tsx:23-24, 68-80` suporta `?categoria=` e `?ordem=menor_preco|maior_preco|mais_vendidos` no servidor, mas o JSX (linhas 99-123) **só renderiza pílulas de marca** (sem seletor de categoria e sem controle de ordenação), e clicar em uma marca perde `?q=`, `?categoria=` e `?ordem=`.
  - `src/app/categoria/[slug]/page.tsx` não possui controle de ordenação nem navegação rápida entre categorias ou tratamento de lista vazia.
  - `src/app/api/produtos/route.ts:8-9` declara `const brand = searchParams.get("marca"); const category = searchParams.get("categoria");`, mas nunca aplica esses filtros sobre `result`.
- **Proposta no Plano (Task 2):** Adicionar controles visuais de Categoria e Ordenação preservando filtros combinados em `/produtos`, adicionar ordenação e pílulas de categorias em `/categoria/[slug]`, e aplicar os filtros `marca` e `categoria` em `/api/produtos`.

---

## Fase 3 — Arquitetura da Experiência do MVP

```
[Home (/)] ──┬──► [Catálogo (/produtos?q=&marca=&categoria=&ordem=)] ──┐
             ├──► [Categoria (/categoria/[slug]?ordem=)] ──────────────┼──► [Página de Produto (/produto/[slug])]
             └──► [Seção Loja Física Lages - SC (Google Maps)]         │          │
                                                                       │          ├──► Compra Rápida WhatsApp (1 item)
                                                                       ▼          ▼
                                                             [Sacola Lateral (CartDrawer)]
                                                                       │
                                           ┌───────────────────────────┴───────────────────────────┐
                                           ▼                                                       ▼
                        [Fechamento Rápido na Sacola]                        [Página de Fechamento (/checkout)]
                        (Nome + Endereço + Envio Imediato)                   (Dados + Entrega Lages/CEP + Preferência:
                                           │                                  PIX 5% OFF / Cartão / Retirada na Loja)
                                           └───────────────────────────┬───────────────────────────┘
                                                                       ▼
                                            [WhatsApp Oficial Mariane: wa.me/5549991251617]
                                            (Mensagem estruturada com itens, valores, frete e pagamento)
```

---

## Fase 4 — Plano de Implementação Detalhado (Tarefas Atômicas)

### Mapa de Arquivos do Plano
| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/app/page.tsx` | Modificar | Adicionar cards interativos das 3 etapas do *Cronograma Capilar* (Hidratação, Nutrição, Reconstrução) no bloco consultivo da Home. |
| `src/app/produtos/page.tsx` | Modificar | Exibir pílulas de categoria, seletor de ordenação (`mais_vendidos`, `menor_preco`, `maior_preco`) e preservar parâmetros combinados (`marca` + `categoria` + `q` + `ordem`). |
| `src/app/categoria/[slug]/page.tsx` | Modificar | Adicionar barra de navegação entre categorias, seletor de ordenação (`?ordem=`) e estado vazio amigável. |
| `src/app/api/produtos/route.ts` | Modificar | Aplicar efetivamente os filtros `marca` e `categoria` lidos de `searchParams`. |
| `src/app/produto/[slug]/page.tsx` | Modificar | Adicionar `generateMetadata` dinâmico (OpenGraph/WhatsApp preview), vitrine de *Produtos Relacionados* e remover imports não utilizados. |
| `src/app/checkout/page.tsx` | Modificar | Converter o submit para **Finalização Assistida via WhatsApp** em todas as preferências de pagamento (PIX 5% OFF, Cartão até 10x ou Retirada na Loja em Lages), abrindo o pedido completo em `wa.me/5549991251617`. |
| `src/components/CartDrawer.tsx` | Modificar | Clarificar CTAs de fechamento (fechamento rápido na gaveta vs. revisão completa com endereço/pagamento em `/checkout`) e adicionar fallback de imagem. |
| `src/components/ProductCard.tsx` | Modificar | Adicionar fallback visual (`onError`) caso uma imagem externa do CDN falhe ao carregar. |
| `src/app/produto/[slug]/ProductDetailClient.tsx` | Modificar | Adicionar fallback visual de imagem segura na galeria principal e miniaturas. |
| `src/app/atendimento/page.tsx` | Criar | Página de Central de Atendimento com canais oficiais (`+55 49 99125-1617`, `@mariane_cosmeticos_01`, loja física na Rua Blumenau, 623 — Lages – SC). |
| `src/app/trocas-e-devolucoes/page.tsx` | Criar | Política clara de Trocas e Devoluções (CDC — 7 dias para arrependimento, troca fácil em Lages – SC). |
| `src/app/politica-de-privacidade/page.tsx` | Criar | Política de Privacidade enxuta e alinhada à LGPD para navegação e atendimento via WhatsApp. |
| `tests/e2e/tier1-features.test.ts` | Modificar | Adicionar asserções para filtros combinados do catálogo, API `/api/produtos`, `generateMetadata` no produto e rotas institucionais sem 404. |

---

### Task 1: Enriquecer a Seção de Cronograma Capilar em 3 Etapas na Home (`src/app/page.tsx`)

**Files:**
- Modify: `src/app/page.tsx`
- Test: `tests/e2e/tier1-features.test.ts`

**Interfaces:**
- Consumes: `db`, `products`, `brands`, `productImages` from `@/db`
- Produces: Seção consultiva *Cronograma Capilar* na Home exibindo os 3 pilares (*Hidratação*, *Nutrição*, *Reconstrução*) com links diretos para `/categoria/cronograma-capilar` e `/categoria/tratamento-mascaras` + CTA de consultoria no WhatsApp `5549991251617`.

- [x] **Step 1: Escrever teste em `tests/e2e/tier1-features.test.ts`**
  Adicionar verificação garantindo que `src/app/page.tsx` apresenta explicitamente as 3 etapas do Cronograma Capilar (`Hidratação`, `Nutrição` e `Reconstrução`) com navegação acionável.

- [x] **Step 2: Atualizar a seção de Cronograma Capilar em `src/app/page.tsx`**
  Estruturar os 3 cards visuais (*1. Hidratação — Reposição de água e maciez*, *2. Nutrição — Lipídios, brilho e antifrizz*, *3. Reconstrução — Queratina e força pós-química*) dentro do bloco de consultoria da Home usando os tokens `marina-*` e `onyx-*` de `docs/DESIGN.md`.

- [x] **Step 3: Rodar a suíte de testes para confirmar aprovação**
  Run: `npx tsx tests/e2e/runner.ts --tier=1`
  Expected: PASS (100%).

**Critério de Pronto (Task 1):** A Home apresenta visualmente as 3 etapas do Cronograma Capilar com links diretos para o catálogo e consultoria no WhatsApp.

---

### Task 2: Completar Filtros Combinados e Ordenação em `/produtos`, `/categoria/[slug]` e `/api/produtos`

**Files:**
- Modify: `src/app/produtos/page.tsx`
- Modify: `src/app/categoria/[slug]/page.tsx`
- Modify: `src/app/api/produtos/route.ts`
- Test: `tests/e2e/tier1-features.test.ts`

**Interfaces:**
- Consumes: `searchParams: Promise<{ marca?: string; categoria?: string; q?: string; ordem?: string }>`
- Produces: UI de filtros combináveis (Marcas + Categorias + Ordenação `mais_vendidos` | `menor_preco` | `maior_preco` + chips de filtros ativos) em `/produtos`, ordenação e pílulas de categorias em `/categoria/[slug]`, e filtragem real por `marca` e `categoria` em `/api/produtos`.

- [x] **Step 1: Escrever teste em `tests/e2e/tier1-features.test.ts`**
  Verificar que:
  1. `src/app/produtos/page.tsx` renderiza controles visuais de ordenação (`menor_preco`, `maior_preco`, `mais_vendidos`) e filtros de categoria (`categoria=`), preservando parâmetros combinados na URL.
  2. `src/app/api/produtos/route.ts` filtra `result` quando `brand` (`marca`) ou `category` (`categoria`) são informados.

- [x] **Step 2: Rodar o teste e verificar a falha**
  Run: `npx tsx tests/e2e/runner.ts --tier=1`
  Expected: FAIL (`src/app/produtos/page.tsx` não possui links de ordenação/categoria no JSX e `src/app/api/produtos/route.ts` não aplica `brand`/`category`).

- [x] **Step 3: Implementar helper `buildCatalogUrl` e controles visuais em `src/app/produtos/page.tsx`, `src/app/categoria/[slug]/page.tsx` e `src/app/api/produtos/route.ts`**
  - Em `src/app/produtos/page.tsx`: criar função pura `buildCatalogUrl(currentParams, overrides)` para que clicar em uma marca mantenha `?categoria=`, `?q=` e `?ordem=`, adicionar barra de filtro por Categoria (`allCategories`) e seletor de ordenação (*Destaques*, *Mais Vendidos*, *Menor Preço*, *Maior Preço*).
  - Em `src/app/categoria/[slug]/page.tsx`: adicionar barra de pílulas para alternar rapidamente entre categorias, suporte a `?ordem=` e estado vazio caso não haja produtos.
  - Em `src/app/api/produtos/route.ts`: resolver `brand` por slug em `allBrands` e `category` por slug em `allCategories` e filtrar `result`.

- [x] **Step 4: Rodar os testes E2E**
  Run: `npx tsx tests/e2e/runner.ts`
  Expected: PASS em todas as suítes.

**Critério de Pronto (Task 2):** O usuário consegue filtrar por marca + categoria + busca simultaneamente e ordenar os produtos por preço ou mais vendidos diretamente pela interface de `/produtos` e `/categoria/[slug]`, e `/api/produtos` respeita todos os parâmetros.

---

### Task 3: Adicionar SEO / OpenGraph Dinâmico (`generateMetadata`) e Produtos Relacionados em `/produto/[slug]`

**Files:**
- Modify: `src/app/produto/[slug]/page.tsx`
- Test: `tests/e2e/tier1-features.test.ts`

**Interfaces:**
- Consumes: `params: Promise<{ slug: string }>`
- Produces: `export async function generateMetadata({ params }): Promise<Metadata>` com `title`, `description` e `openGraph.images` reais do produto + seção inferior de 4 *Produtos Relacionados* da mesma categoria/marca.

- [x] **Step 1: Escrever teste em `tests/e2e/tier1-features.test.ts`**
  Verificar que `src/app/produto/[slug]/page.tsx` exporta `generateMetadata` e renderiza seção de produtos relacionados.

- [x] **Step 2: Rodar o teste para confirmar a falha**
  Run: `npx tsx tests/e2e/runner.ts --tier=1`
  Expected: FAIL (`generateMetadata` ausente em `src/app/produto/[slug]/page.tsx`).

- [x] **Step 3: Implementar `generateMetadata` e vitrine de relacionados em `src/app/produto/[slug]/page.tsx`**
  Consultar produto, marca e imagem principal pelo `slug`; retornar título `${product.name} | Mariane Cosméticos`, descrição com preço PIX e imagem no `openGraph`; buscar até 4 produtos da mesma categoria (excluindo o produto atual) e renderizar com `<ProductCard />`.

- [x] **Step 4: Rodar os testes**
  Run: `npx tsx tests/e2e/runner.ts --tier=1`
  Expected: PASS.

**Critério de Pronto (Task 3):** Todo link `/produto/[slug]` enviado no WhatsApp gera pré-visualização OpenGraph com nome e foto do produto, e a página exibe sugestões complementares.

---

### Task 4: Alinhar `/checkout` e `CartDrawer` para Fechamento 100% via WhatsApp (Sem Pagamento Online Falso)

**Files:**
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/components/CartDrawer.tsx`
- Test: `tests/e2e/tier2-boundaries.test.ts`, `tests/e2e/tier4-scenarios.test.ts`

**Interfaces:**
- Consumes: `useCart()` (`items`, `subtotal`, `freeShippingThreshold`, `clearCart`, `generateWhatsAppLink`)
- Produces: Em `/checkout`, formulário completo de identificação e endereço (pré-configurado para Lages – SC e região) + seleção de **Preferência de Pagamento no Atendimento** (`pix` com 5% de desconto, `card` em até 10x sem juros, ou `whatsapp`/`retirada` na loja Rua Blumenau, 623) que **sempre** gera e abre o pedido completo no WhatsApp `5549991251617`.

- [x] **Step 1: Atualizar/escrever teste em `tests/e2e/tier4-scenarios.test.ts`**
  Verificar que `src/app/checkout/page.tsx` aciona `generateWhatsAppLink` em `handleFinishOrder` para qualquer modalidade selecionada (incluindo PIX 5% OFF e Cartão), enviando o pedido completo para `5549991251617`.

- [x] **Step 2: Implementar o fluxo de Finalização via WhatsApp em `src/app/checkout/page.tsx` e `src/components/CartDrawer.tsx`**
  - Em `src/app/checkout/page.tsx`: manter o cálculo transparente de 5% OFF no PIX, parcelamento em até 10x no Cartão e Frete Grátis acima de R$ 199,00, mas fazer `handleFinishOrder` abrir sempre o link do WhatsApp oficial (`generateWhatsAppLink`) com todos os dados preenchidos (nome, telefone, endereço/CEP, modalidade de pagamento escolhida e total com desconto PIX se aplicável) + preservar o link gerado no estado da tela de confirmação para reabertura com 1 clique.
  - Em `src/components/CartDrawer.tsx`: identificar claramente os dois caminhos de conversão: *"Finalizar Rápido no WhatsApp"* (direto na gaveta) e *"Informar Endereço e Forma de Pagamento"* (`/checkout`).

- [x] **Step 3: Rodar todos os testes E2E**
  Run: `npx tsx tests/e2e/runner.ts`
  Expected: PASS (100%).

**Critério de Pronto (Task 4):** Nenhum pedido pode ser perdido em simulação silenciosa; qualquer finalização em `/checkout` ou na sacola encaminha o pedido completo para o WhatsApp `+55 (49) 99125-1617` da Mariane Cosméticos.

---

### Task 5: Blindar Imagens de Produtos com Fallback Visual Elegante

**Files:**
- Modify: `src/components/ProductCard.tsx`
- Modify: `src/app/produto/[slug]/ProductDetailClient.tsx`
- Modify: `src/components/CartDrawer.tsx`
- Test: `tests/e2e/tier2-boundaries.test.ts`

**Interfaces:**
- Consumes: `imageUrl?: string | null`
- Produces: Handler `onError` / estado de fallback que substitui qualquer imagem inacessível por um placeholder refinado com a identidade Roxo Imperial (`bg-marina-50`, `text-marina-600`).

- [x] **Step 1: Adicionar teste em `tests/e2e/tier2-boundaries.test.ts`**
  Verificar que `ProductCard.tsx` e `ProductDetailClient.tsx` possuem tratamento de fallback para erro de carregamento de imagem (`onError`).

- [x] **Step 2: Implementar estado de erro de imagem + `onError` em `ProductCard.tsx`, `ProductDetailClient.tsx` e `CartDrawer.tsx`**
  Quando a imagem externa disparar `onError`, substituir por placeholder visual elegante da `Mariane Cosméticos`.

- [x] **Step 3: Rodar os testes E2E**
  Run: `npx tsx tests/e2e/runner.ts`
  Expected: PASS.

**Critério de Pronto (Task 5):** Mesmo se uma URL do CDN externo falhar, nenhum card, galeria ou item da sacola exibe ícone de imagem quebrada.

---

### Task 6: Eliminar Links 404 do Rodapé (Páginas Institucionais da Loja em Lages – SC)

**Files:**
- Create: `src/app/atendimento/page.tsx`
- Create: `src/app/trocas-e-devolucoes/page.tsx`
- Create: `src/app/politica-de-privacidade/page.tsx`
- Test: `tests/e2e/tier1-features.test.ts`

**Interfaces:**
- Produces: 3 rotas Server Component estáticas (`Static`) estilizadas com os tokens `marina-*` de `docs/DESIGN.md` e dados oficiais de Lages – SC (`Rua Blumenau, Nº 623`, CEP `88505-300`, WhatsApp `+55 (49) 99125-1617`, Instagram `@mariane_cosmeticos_01`).

- [x] **Step 1: Escrever teste em `tests/e2e/tier1-features.test.ts`**
  Verificar que todos os links internos do `Footer.tsx` (`/atendimento`, `/trocas-e-devolucoes`, `/politica-de-privacidade`) possuem arquivos `page.tsx` correspondentes em `src/app/`.

- [x] **Step 2: Rodar o teste e confirmar a falha**
  Run: `npx tsx tests/e2e/runner.ts --tier=1`
  Expected: FAIL (arquivos ainda não existem).

- [x] **Step 3: Criar `src/app/atendimento/page.tsx`, `src/app/trocas-e-devolucoes/page.tsx` e `src/app/politica-de-privacidade/page.tsx`**
  Construir as 3 páginas seguindo a tipografia `Playfair Display` + `Plus Jakarta Sans`, paleta Roxo Imperial e CTAs diretos para o WhatsApp `5549991251617`.

- [x] **Step 4: Rodar os testes E2E e o build de produção**
  Run: `npx tsx tests/e2e/runner.ts && npm run build`
  Expected: PASS em todos os testes e `exit code 0` no build com as 3 novas rotas listadas na tabela de rotas do Next.js.

**Critério de Pronto (Task 6):** Zero links internos quebrados (404) em toda a navegação do cabeçalho e do rodapé.

---

### Task 7 (Condicional à Decisão da Fase 2): Curadoria Madressenza no Catálogo Local

**Files:**
- Modify: `src/scripts/seed-linda-rea.ts` (ou script aditivo `src/scripts/seed-madressenza.ts`)
- Modify: `src/components/BrandCarousel.tsx`
- Modify: `local.sqlite`
- Test: `tests/e2e/tier1-features.test.ts`

- [x] **Step 1:** Inserir a marca `Madressenza` (`slug: "madressenza"`) na tabela `brands`, destacá-la no `BrandCarousel.tsx` e cadastrar produtos da linha Perfumaria & Casa (Aromatizador de Varetas, Água Perfumada para Tecidos, Sabonete Líquido Luxo, Difusor de Ambientes) em `local.sqlite`.
- [x] **Step 2:** Verificar renderização na Home (`BrandCarousel` e vitrines) e rodar `npx tsx tests/e2e/runner.ts` + `npm run build`.

**Critério de Pronto (Task 7):** Ao clicar no banner ou na marca *Madressenza*, a cliente visualiza produtos reais da marca que é o carro-chefe da loja física em Lages – SC.
