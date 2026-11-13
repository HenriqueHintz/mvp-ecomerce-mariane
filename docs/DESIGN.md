# DESIGN.md — Contrato de Marca e Design System: Mariane Cosméticos

> **Fonte Única da Verdade (Single Source of Truth):** Este documento governa toda a identidade visual, verbal, cromática e cadastral do e-commerce **Mariane Cosméticos**. Qualquer componente, página, mensagem de WhatsApp, metadado ou teste automatizado deve obedecer estritamente às definições abaixo.

---

## 1. Identidade Oficial, Contatos & Estrela Guia Criativa

### 1.1 Ficha Cadastral Imutável
- **Nome Oficial da Marca:** `Mariane Cosméticos`
- **Credencial Oficial:** `Revendedora Oficial Madressenza`
- **Slogan Oficial:** `"Linda é a mulher que bem se quer"`
- **WhatsApp Oficial (UI e Conversão):** `+55 (49) 99125-1617` (string numérica: `5549991251617` | exibição: `(49) 99125-1617`)
- **Instagram Oficial:** `@mariane_cosmeticos_01` (`https://www.instagram.com/mariane_cosmeticos_01/`)
- **Endereço Físico (UI e Google Maps):** `Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)`
- **Domínio Canônico:** `https://marianecosmeticos.com.br`

### 1.2 Direção Criativa & Tom de Voz
- **Arquétipo Visual:** Beleza Profissional de Salão & Luxo Acessível Acolhedor (inspirado na fachada física da loja em Lages – SC e na sofisticação editorial de perfumaria e haircare).
- **Tom de Voz:** Consultivo, acolhedor, especialista e direto. Fala como uma consultora de beleza de confiança que conhece profundamente cronograma capilar (Hidratação, Nutrição, Reconstrução), marcas profissionais (*Wella Professionals, L'Oréal Professionnel, Truss, Braé, Lola Cosmetics, Amend*) e perfumaria fina (*Madressenza*).
- **Princípio Fundamental:** *"Combinar a autoridade técnica dos melhores salões com a proximidade e o atendimento humano da loja física em Lages."*

---

## 2. Versões Oficiais do Logotipo e Quando Usar Cada Uma

O componente canônico [`src/components/Logo.tsx`](../src/components/Logo.tsx) encapsula os ativos oficiais da marca. É **proibido** redesenhar, vetorizar do zero com outra estética ou substituir qualquer um dos arquivos abaixo:

| Arquivo / Caminho | Variante / Prop em `Logo.tsx` | Contexto de Uso Obrigatório | Fundo Recomendado |
| :--- | :--- | :--- | :--- |
| `/logo-nav.png` | `variant="horizontal" tone="dark"` | **Header Claro e Drawer Mobile:** logotipo panorâmico com silhueta à esquerda e tipografia roxa escura à direita. | Fundos claros (`bg-white`, `bg-silk-50`, `bg-marina-50`). |
| `/logo-white.png` | `variant="horizontal" tone="light"` | **Footer Escuro e Banners Noturnos:** logotipo panorâmico com silhueta e tipografia em branco puro para contraste máximo. | Fundos escuros (`bg-onyx-900`, `bg-onyx-950`, `bg-marina-950`). |
| `/logo-mariane-banner.png` | `variant="badge"` | **Badge Institucional / Selos de Destaque:** arte retangular completa fiel à placa física da Mariane Cosméticos em degradê roxo/violeta. | Seções institucionais, cards de apresentação da loja física. |
| `/logo.svg` | Metadados SEO (`layout.tsx`) | **OpenGraph & Twitter Cards (`og:image`):** wrapper SVG (`907x358`) com `<title>Mariane Cosméticos</title>` e referência à arte oficial. | Compartilhamento social (WhatsApp, Instagram, links). |
| `src/app/icon.svg` + `/favicon.ico` | Ícones de Aplicação (`layout.tsx`) | **Favicon & Ícone de Aba:** silhueta vetorial oficial (`#E11D74`) em `src/app/icon.svg`, acompanhada de `/favicon.ico` multi-resolução e `/apple-icon.png` (`180x180`). | Navegadores desktop e atalhos mobile iOS/Android. |

### Tamanhos Padronizados em `Logo.tsx`
- `size="sm"`: `44x111px` (`h-11 w-auto`) — Header mobile e gaveta de navegação.
- `size="md"`: `64x162px` (`h-16 w-auto`) — Tamanho padrão intermediário.
- `size="lg"`: `84x213px` (`h-20 sm:h-24 w-auto`) — Header desktop e Footer institucional.
- `size="xl"`: `120x304px` (`h-28 sm:h-32 w-auto`) — Banners especiais de destaque.

---

## 3. Paleta de Cores & Tokens Semânticos

A paleta oficial une o **Roxo/Violeta Imperial** da fachada física da Mariane Cosméticos com o **Magenta Vibrante** como acento de destaque e o **Verde Esmeralda** para conversão imediata via WhatsApp.

### 3.1 Tokens Principais da Marca (`brand` e `globals.css`)

| Token Semântico | Classe Tailwind | Variável CSS (`:root`) | HEX | HSL | Papel na Interface |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primária (Roxo Imperial)** | `bg-brand`, `text-brand`, `marina-600` | `--brand-primary` | `#75066A` | `hsl(306, 90%, 24%)` | Cor oficial da marca, CTAs primários, links ativos, badges principais. |
| **Vibrante (Royal Violet)** | `bg-brand-vibrant`, `marina-500` | `--brand-vibrant` | `#9C27B0` | `hsl(291, 64%, 42%)` | Botões `.btn-brand-primary`, destaques interativos, indicadores de progresso. |
| **Escuro (Deep Violet)** | `bg-brand-dark`, `marina-800` | `--brand-dark` | `#4D0046` | `hsl(305, 100%, 15%)` | Textos de ênfase sobre fundos lilás claros, seleção de texto, sombras profundas. |
| **Destaque (Magenta)** | `bg-brand-accent`, `text-brand-accent` | `--brand-accent` | `#EB1E78` | `hsl(334, 84%, 52%)` | Acento cromático vibrante, gradientes de título (`.text-gradient-brand`), detalhes visuais. |
| **Superfície Lilás (Mist)** | `bg-brand-light`, `marina-50` | `--brand-light` | `#FAF5FB` | `hsl(290, 43%, 97%)` | Fundos suaves de seções, pills informativas e estados de hover sutis. |

### 3.2 Escala Completa Roxo/Violeta (`marina-50` a `marina-950` em `tailwind.config.ts`)
> *Nota técnica:* A chave `marina` é mantida no `tailwind.config.ts` para preservar compatibilidade com todas as classes utilitárias dos componentes existentes (`bg-marina-*`, `text-marina-*`, `border-marina-*`), mapeando exclusivamente a escala Roxo/Violeta Imperial da **Mariane Cosméticos**:

- `50`: `#FAF5FB` — Violet mist (fundo sutil de badges e seções)
- `100`: `#F3E5F5` — Delicate violet tint (bordas suaves e seleção `::selection`)
- `200`: `#E6C8E9` — Soft lilac border (divisores e hover de cards)
- `300`: `#D39ED9` — Lilac accent (ícones secundários em fundos escuros)
- `400`: `#B866C2` — Bright violet highlight (ícones na barra de anúncio e rodapé)
- `500`: `#9C27B0` — Vibrant royal violet (botões primários e barras de progresso)
- `600`: `#75066A` — **Official Primary Mariane Purple** (CTAs principais, títulos em destaque, `themeColor`)
- `700`: `#600356` — Deep imperial violet (hover de CTAs primários)
- `800`: `#4D0046` — Deep brand violet (texto sobre fundos claros da escala)
- `900`: `#360031` — Midnight velvet plum (gradientes noturnos)
- `950`: `#22001F` — Onyx violet deep (banners escuros de consultoria)

### 3.3 Superfícies Neutras de Luxo & Conversão WhatsApp
- **Background Principal (`--background` / `luxury-offwhite`):** `#FAF7FB` (`silk-50`: `#FAF7F7`)
- **Foreground Principal (`--foreground` / `luxury-onyx`):** `#1A0918` (`onyx-950`: `#120A0D`, `onyx-900`: `#1C1115`, `onyx-800`: `#2B1B21`, `onyx-700`: `#45333A`)
- **Superfícies Sedosas (`silk`):** `50: #FAF7F7`, `100: #F4EDED`, `200: #EAE0E3` (bordas padrão `--luxury-border`), `300: #D9C9CD`
- **WhatsApp & Confiança (`emerald`):**
  - `emerald-whatsapp` (`--whatsapp-green`): `#25D366` (botões de ação e ícones do WhatsApp)
  - `emerald-dark` (`--whatsapp-dark`): `#128C7E` (hover de botões do WhatsApp e textos de confirmação)

---

## 4. Tipografia & Escala de Tipos

As fontes oficiais são carregadas de forma otimizada via `next/font/google` em `src/app/layout.tsx` (eliminando bloqueio de renderização e garantindo geração determinística do manifesto de build do Next.js 15):

- **Fonte Display / Títulos (`font-serif`):** `Playfair Display` (pesos `400` a `700`, normal e `italic`). Usada em headlines (`h1`, `h2`, `h3`), nomes de produtos em destaque, chamadas editoriais e slogan.
- **Fonte de Interface / Corpo (`font-sans`):** `Plus Jakarta Sans` (pesos `300` a `700`). Usada em descrições, preços, botões, badges, navegação e formulários.

### Escala Tipográfica Padronizada
| Nível | Classes Tailwind | Uso |
| :--- | :--- | :--- |
| **Display Hero (`h1`)** | `font-serif text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.12] tracking-tight` | Chamada principal da Home |
| **Título de Página (`h1`)** | `font-serif text-2xl sm:text-4xl text-onyx-900 tracking-tight` | Cabeçalho de Catálogo, Categoria e Produto |
| **Título de Seção (`h2`, `h3`)** | `font-serif text-2xl sm:text-3xl text-onyx-950 tracking-tight` | Vitrines da Home e seção da Loja Física |
| **Título de Card (`h3`)** | `font-serif text-sm sm:text-base font-medium text-onyx-900 line-clamp-2 leading-snug` | Nome do produto no `ProductCard` |
| **Preço Principal** | `font-sans text-lg sm:text-xl font-bold text-onyx-900` (Card) / `text-3xl font-bold` (Detalhe) | Valor de venda atual |
| **Corpo Regular** | `font-sans text-sm sm:text-base text-onyx-700 leading-relaxed` | Descrições de produtos e textos institucionais |
| **Labels & Badges** | `font-sans text-[10px] sm:text-xs font-semibold uppercase tracking-wider` | Selos de marca, categorias e botões de ação |

---

## 5. Espaçamentos, Grid & Layout

- **Métrica Base:** Múltiplos estritos de `4px` e `8px` (`p-4`, `p-5`, `p-6`, `gap-4`, `gap-6`, `py-10`, `py-12`, `py-16`).
- **Container Global:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (largura máxima travada em `1280px` com gutters responsivos).
- **Grids de Vitrine:**
  - Home (Mais Vendidos / Tratamentos): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`
  - Catálogo (`/produtos` e `/categoria/[slug]`): `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`
  - Marcas (`BrandCarousel`): `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4`
- **Respiro entre Seções:** `space-y-16` na Home; `py-10` nas páginas internas de catálogo e produto.

---

## 6. Raios de Borda & Elevação (Sombras)

### 6.1 Raios de Borda
- `rounded-full`: Botões primários da Home, barra de busca desktop, badges de status e indicadores do carrossel.
- `rounded-xl` (`12px`): Botões de ação dentro de cards, inputs de formulário e botões da gaveta do carrinho.
- `rounded-2xl` (`16px`): `ProductCard`, blocos de resumo de preço e cartões de marca.
- `rounded-3xl` (`24px`): Banner de consultoria capilar, seção do mapa da loja física e galeria da página de produto.

### 6.2 Sombras Semânticas (`tailwind.config.ts`)
- `shadow-marina-sm`: `0 2px 8px -2px rgba(117, 6, 106, 0.18)`
- `shadow-marina-md`: `0 4px 16px -4px rgba(117, 6, 106, 0.24)`
- `shadow-marina-lg`: `0 8px 24px -6px rgba(117, 6, 106, 0.32)`
- `shadow-luxury-card`: `0 2px 12px 0 rgba(23, 14, 17, 0.04), 0 8px 24px -4px rgba(23, 14, 17, 0.06)`
- `shadow-luxury-hover`: `0 12px 32px -4px rgba(23, 14, 17, 0.12), 0 4px 12px -2px rgba(117, 6, 106, 0.18)`

---

## 7. Especificação de Componentes Atômicos e Base (`src/components/ui/`)

### 7.1 Componentes Base Reutilizáveis (`src/components/ui/`)
Todos os componentes base em [`src/components/ui/`](../src/components/ui/) utilizam exclusivamente os tokens semânticos de `tailwind.config.ts` e possuem estados completos de `hover`, `focus-visible` (`ring-2 ring-marina-500 ring-offset-2`), `active` e `disabled` (`disabled:opacity-50 disabled:cursor-not-allowed`):

- **[`Button.tsx`](../src/components/ui/Button.tsx):**
  - Variantes (`variant`): `primary` (`bg-marina-500 hover:bg-marina-600 text-white`), `secondary` (`bg-onyx-900 hover:bg-onyx-950 text-white`), `outline` (`border-marina-500 text-marina-600 hover:bg-marina-50`), `ghost` (`text-onyx-700 hover:bg-silk-100 hover:text-marina-600`), `whatsapp` (`bg-emerald-whatsapp hover:bg-emerald-dark text-white`).
  - Tamanhos (`size`): `sm` (`min-h-[38px]`), `md` (`min-h-[44px]`), `lg` (`min-h-[52px]`), `icon` (`min-h-[44px] min-w-[44px]`).
  - Formatos (`shape`): `pill` (`rounded-full`) ou `rounded` (`rounded-xl`), suporte a `isLoading`, `leftIcon`, `rightIcon` e `fullWidth`.
- **[`Badge.tsx`](../src/components/ui/Badge.tsx):**
  - Variantes (`variant`): `brand` (`bg-marina-50 text-marina-700 border-marina-200`), `solid` (`bg-marina-600 text-white`), `accent` (`bg-brand-accent text-white`), `emerald` (`bg-emerald-whatsapp/10 text-emerald-dark`), `dark` (`bg-onyx-900/90 text-silk-50`), `outline` (`bg-white text-onyx-700 border-silk-200`).
- **[`Price.tsx`](../src/components/ui/Price.tsx):**
  - Formatação em `R$` (`tabular-nums`) com exibição de preço riscado **apenas quando há desconto real** (`promoPrice !== null && promoPrice > 0 && promoPrice < price`), cálculo opcional de `5% OFF no PIX` e parcelamento em até `10x sem juros`.
- **[`SectionHeader.tsx`](../src/components/ui/SectionHeader.tsx):**
  - Cabeçalho padronizado para vitrines e seções com `eyebrow` (ícone + label em caixa alta `text-marina-600`), título `font-serif`, subtítulo opcional e slot de ação à direita (`action`).
- **[`Container.tsx`](../src/components/ui/Container.tsx):**
  - Wrapper responsivo `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (com variantes `narrow` e `wide`).

### 7.2 Classes Utilitárias & Card de Produto
- **`.btn-brand-primary`:** Botão arredondado (`rounded-full`), fundo `bg-marina-500 hover:bg-marina-600`, texto branco, `shadow-sm hover:shadow-marina-md`, compressão tátil `active:scale-[0.98]`.
- **`.btn-brand-outline`:** Borda `border-marina-500`, texto `text-marina-600`, hover `hover:bg-marina-50 hover:border-marina-600`.
- **`.btn-whatsapp`:** Fundo `bg-emerald-whatsapp hover:bg-emerald-dark`, texto branco, usado em todas as ações de fechamento de pedido e consultoria via WhatsApp.
- **`.card-luxury` / `ProductCard`:** Superfície `bg-white`, borda `border-silk-200/90 hover:border-marina-200`, imagem em proporção fixa `aspect-[4/5]` com fallback seguro (`onError`), desconto exibido exclusivamente quando `promoPrice < price`, preço à vista com `5% OFF no PIX`, parcelamento em até `10x sem juros`, botão "Adicionar" (`col-span-4`) e botão rápido do WhatsApp (`col-span-1`). Zero avaliações ou notas fictícias.

### 7.3 Fluxos Transacionais: Checkout, Acompanhamento (`/pedido/[token]`) e Painel Admin (`/admin`)
- **Composição de Estado (`src/app/checkout/CheckoutContext.tsx`):** Segue o padrão `{ state, actions, meta }` (`composition-patterns`), desacoplando os blocos visuais (`CheckoutContact`, `CheckoutDelivery`, `CheckoutPayment`, `CheckoutSummary`) da orquestração de rede.
- **Hooks Especializados (`src/app/checkout/hooks/`):**
  - [`useCheckoutQuote.ts`](../src/app/checkout/hooks/useCheckoutQuote.ts): cotação autoritativa em centavos inteiros (`POST /api/checkout/cotacao`) com cancelamento de requisições concorrentes via `AbortController`.
  - [`useCepLookup.ts`](../src/app/checkout/hooks/useCepLookup.ts): consulta ViaCEP com timeout estrito de `4000ms` (`AbortController`) e degradação graciosa para preenchimento manual imediato sem bloquear os inputs de endereço.
- **Acessibilidade e Formatação Numérica (`frontend-checklist` & `web-design-guidelines`):**
  - Todos os campos de formulário possuem `<label htmlFor>` vinculado a `id`, `autoComplete` semântico (`name`, `tel`, `email`, `postal-code`, `street-address`, `address-level2`, `current-password`), `aria-invalid` e mensagens de erro associadas via `aria-describedby` (`role="alert"`).
  - Seletores de modalidade de entrega e meio de pagamento utilizam `role="radiogroup"` e `role="radio"` com `aria-checked` e anel `:focus-visible`.
  - Valores monetários em centavos, quantidades, códigos de pedido (`MC-YYYYMMDD-XXXXXX`) e contadores utilizam `tabular-nums` para alinhamento ótico sem jitter.

### 7.4 Padrão da Hero Editorial Full-Bleed (`src/components/home/Hero.tsx` & `HeroScenes.tsx`)
- **Estrutura Borda a Borda (`100vw`, `CLS = 0`):** Banner em largura total da tela (sem card, sem borda, sem cantos arredondados), altura fixa `clamp(560px, 78vh, 760px)` no desktop e `88svh` (`min-h-[540px]`) no celular.
- **Elementos Permitidos (Exclusivamente 4):**
  1. Nome da marca (`"Mariane Cosméticos"`, `uppercase tracking-[0.28em] text-[11px] sm:text-xs font-semibold` acima do slogan).
  2. Slogan (`<h1>` em `Playfair Display`: `"Perfume que envolve, olhar que guarda, toque que desperta"`).
  3. Dois botões: `"Ver Catálogo"` (principal → `/produtos`, fundo Roxo Imperial `#75066A`) e `"Consultoria no WhatsApp"` (secundário → link oficial `5549991251617`).
  4. Controles do banner: setas circulares translúcidas nas laterais (`Slide anterior` / `Próximo slide`, `backdrop-blur-md`, ganham `#75066A` no hover/foco, `≥ 44×44px`) e indicadores finos (traços) na base (`Ir para o slide X de 5`, traço ativo `w-9 h-[3px]`, alvos de toque `≥ 44×44px`; posicionados acima dos botões no celular e na base central no desktop).
  - *Proibido na Hero:* nome ou preço escrito do produto, selos, tags de frete/PIX, categorias ou logos de marcas.
- **Cenas Publicitárias no Plano de Fundo (`src/data/hero-slides.ts` & `public/hero/generated/`):**
  - Arte-direção via `<picture>` + `getImageProps` (`next/image`), `sizes="100vw"`, `priority` exclusivamente no primeiro slide e preload automático do próximo slide.
  - **Desktop (`21:9`, `2400×1030`, WebP `≤ 350 KB`):** produto posicionado no terço direito (`60–75%` da altura); `45%+` da esquerda limpo e calmo para o bloco de texto fixo.
  - **Celular (`4:5`, `1080×1350`, WebP `≤ 220 KB`):** produto posicionado na metade superior; metade inferior limpa e calma para texto, indicadores e botões.
  - **Controle de Qualidade (Plano A vs. Plano B):** Toda cena gerada passa por inspeção lado a lado com a foto original. Em caso de micro-texto distorcido após tentativas, aplica-se o **Plano B**: cenário limpo sem produto (`-scene-desktop.webp` / `-scene-mobile.webp`) + recorte real da embalagem (`-cutout.webp`) com sombra de contato e reflexo em CSS (`.hero-plano-b-fx`). Registro auditável obrigatório em `public/hero/generated/MANIFEST.md`.
  - **Vínculo com o Catálogo:** Nome e link do produto (`/produto/[slug]`) vêm dinamicamente do catálogo (`resolveHeroSlides`), com área clicável sobre o produto (`aria-label="Ver produto <nome>"`).
- **Tons Adaptativos (`"claro"` e `"escuro"`) & Véu Local Suave:**
  - Cada slide declara `tone: "claro" | "escuro"`. Texto, botões e controles alternam suas cores suavemente (`duration-500`).
  - Véu local suave (`.hero-veil-light` / `.hero-veil-dark`) aplicado apenas atrás da zona de texto (gradiente da esquerda no desktop, de baixo no celular), sem caixa visível, garantindo contraste WCAG AA (`≥ 4.5:1` texto, `≥ 3.0:1` título grande) no pior ponto de cada slide.
- **Direção Cinematográfica & Acessibilidade:**
  - Na carga inicial: a cena surge com fade e zoom sutil (`scale(1.06) → 1` em `1.6s`); nome, slogan (palavra por palavra) e botões surgem em `< 1.2s`.
  - Na troca de slide (apenas por clique em seta/indicador, teclado `←`/`→` ou swipe no celular; **sem autoplay**, com loop): crossfade de `800ms`, entrada com `scale(1.04) → 1` e deslocamento horizontal de `28px` no sentido da seta; o slogan não reanima.
  - Paralaxe sutil com o mouse no desktop (`±6px`), desativado no celular e em `prefers-reduced-motion: reduce` (que reduz todas as transições a um fade curto de `200ms`).

---

## 8. Proibições Estritas (Invioláveis)

1. **Proibido alterar a identidade cadastral:** Nunca utilizar `"Marina Cosméticos"`, `@marina_cosmeticoss`, `(37) 99837-3933` (`5537998373933`) ou `"Martinho Campos – MG"` em nenhum arquivo de código, texto visível, link de WhatsApp, metadado SEO ou teste.
2. **Proibido trocar ou redesenhar os logotipos:** Nunca substituir `/logo-nav.png`, `/logo-white.png`, `/logo-mariane-banner.png`, `/logo.svg`, `src/app/icon.svg` ou `/favicon.ico` por SVGs genéricos ou novos desenhos.
3. **Proibido usar cores fora dos tokens:** Nunca declarar hexadecimais avulsos nos componentes `.tsx` ou reintroduzir a paleta antiga Hot Magenta (`#EC268F` / `#9A1458`) como cor primária.
4. **Proibido carregar fontes via `<link>` manual no `<head>`:** Utilizar exclusivamente `next/font/google` no `src/app/layout.tsx` para evitar quebra do `next-font-manifest.json` no build de produção.
5. **Proibido simular cobrança online falsa no MVP:** O fechamento de pedido do MVP ocorre via WhatsApp (`5549991251617`); o pagamento online (PIX/cartão) pertence exclusivamente à Fase 2.

---

## 9. Portão de Auto-Crítica & Conformidade

Antes de encerrar qualquer tarefa de UI ou conteúdo:
- [ ] Todos os textos e links citam exclusivamente **Mariane Cosméticos**, WhatsApp **5549991251617**, Instagram **@mariane_cosmeticos_01**, endereço **Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)** e slogan **"Linda é a mulher que bem se quer"**?
- [ ] O contraste entre texto e fundo atende ao mínimo WCAG AA (`4.5:1` para texto normal, `3.0:1` para títulos grandes e componentes)?
- [ ] `npm run build` executa com `exit code 0` sem erros de tipos ou de manifesto?


## Brand Showcase (home, abaixo da hero)

Componente `src/components/home/BrandShowcase.tsx`, dados em `src/data/brands.ts`. Cena calma e confiante (a hero e intensa), sem cards.

- **Conteudo:** apenas o titulo `Marcas Profissionais & Alta Perfumaria` e os 7 logos oficiais, cada um com link relativo `/produtos?marca=<slug>`.
- **Logos:** arquivos oficiais em `public/brands/official/` (SVG/PNG transparente), pintados por CSS mask (so a cor muda, o desenho nunca). Nunca gerar nem redesenhar logo.
- **Desktop (lg):** Madressenza em painel 5 colunas com cena sempre visivel; as outras 6 marcas em grade 3x2 (7 colunas) com fios `silk-200`. Normal: Onyx `#1A0918` a 72%. Hover/foco (500 ms, sem mudar layout): cena 4:5 surge, veu protege o logo, logo vira marfim `#FAF7FB` em cenas escuras, aparece "Ver produtos →" em pilula (marfim sobre cena clara, Onyx sobre cena escura) para garantir contraste AA.
- **Celular:** trilho horizontal com `scroll-snap`, paineis 4:5 com cena + logo, proximo painel parcialmente visivel e tracos finos indicando a posicao.
- **Entrada:** revelacao na rolagem uma unica vez, atraso de 75 ms entre itens; desligada com `prefers-reduced-motion`.
- **Cenas:** `public/brands/scenes/*-4x5.webp` (+ `madressenza-16x9.webp`), ver `MANIFEST.md`.
