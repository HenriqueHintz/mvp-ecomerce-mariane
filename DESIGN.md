# DESIGN.md — Especificação do Design System Mariane Cosméticos

> **Fonte Única da Verdade (Single Source of Truth):** Este arquivo na raiz do projeto (espelhado em [`docs/DESIGN.md`](docs/DESIGN.md)) governa a identidade visual, verbal, cromática e cadastral do e-commerce **Mariane Cosméticos** conforme o protocolo **OpenDesign** (`open-design-system`).

---

## 1. Identidade & Estrela Guia Criativa (Creative North Star)
- **Nome Oficial da Marca:** `Mariane Cosméticos` (`Revendedora Oficial Madressenza`)
- **Slogan Oficial:** `"Linda é a mulher que bem se quer"`
- **WhatsApp Oficial:** `+55 (49) 99125-1617` (`5549991251617`)
- **Instagram Oficial:** `@mariane_cosmeticos_01` (`https://www.instagram.com/mariane_cosmeticos_01/`)
- **Endereço Físico:** `Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)`
- **Tom de Voz:** Consultivo, acolhedor, especialista e direto — como uma consultora de beleza de confiança em Lages – SC.
- **Arquétipo Visual:** Beleza Profissional de Salão & Luxo Acessível Acolhedor (Roxo/Violeta Imperial + Off-White Sedoso + Esmeralda WhatsApp).
- **Princípio Fundamental:** *"Combinar a autoridade técnica dos melhores salões com a proximidade e o atendimento humano da loja física em Lages."*

---

## 2. Paleta de Cores Semânticas (Formato HSL / CSS Variables)
- **Background (`--background` / `bg-luxury-offwhite`):** `hsl(285, 33%, 98%)` (`#FAF7FB`) — Fundo primário da aplicação
- **Foreground (`--foreground` / `text-onyx-950`):** `hsl(307, 49%, 7%)` (`#1A0918`) — Texto primário de alto contraste (CR > 14:1)
- **Card (`bg-white`):** `hsl(0, 0%, 100%)` (`#FFFFFF`) — Superfície de cartões e painéis
- **Card Foreground (`text-onyx-900`):** `hsl(338, 25%, 9%)` (`#1C1115`)
- **Primary (`--brand-primary` / `bg-brand` / `marina-600`):** `hsl(306, 90%, 24%)` (`#75066A`) — Roxo Imperial oficial da marca (CR = 10.55:1 sobre branco)
- **Primary Vibrant (`--brand-vibrant` / `bg-brand-vibrant` / `marina-500`):** `hsl(291, 64%, 42%)` (`#9C27B0`) — Destaques interativos e `.btn-brand-primary` (CR = 6.30:1 sobre branco)
- **Primary Dark (`--brand-dark` / `bg-brand-dark` / `marina-800`):** `hsl(305, 100%, 15%)` (`#4D0046`) — Hover profundo e seleção de texto
- **Secondary (`bg-silk-100`):** `hsl(0, 21%, 95%)` (`#F4EDED`) — Ações secundárias e superfícies de apoio
- **Secondary Foreground (`text-onyx-800`):** `hsl(338, 23%, 14%)` (`#2B1B21`)
- **Muted (`bg-brand-light` / `marina-50`):** `hsl(290, 43%, 97%)` (`#FAF5FB`) — Superfícies suaves e pills informativas
- **Muted Foreground (`text-onyx-600`):** `hsl(337, 13%, 36%)` (`#685058`) — Legendas, labels e metadados
- **Accent (`--brand-accent` / `bg-brand-accent`):** `hsl(334, 84%, 52%)` (`#EB1E78`) — Magenta para badges e gradientes de título (reservado para texto grande/UI >= 3:1)
- **WhatsApp Conversão (`--whatsapp-green` / `bg-emerald-whatsapp`):** `hsl(142, 70%, 49%)` (`#25D366`) / Hover `hsl(173, 76%, 31%)` (`#128C7E`)
- **Border (`--luxury-border` / `border-silk-200`):** `hsl(342, 20%, 90%)` (`#EAE0E3`) — Divisores e bordas de cards
- **Ring (`ring-brand` / `ring-marina-500`):** `hsl(306, 90%, 24%)` (`#75066A`) — Anéis de foco acessível (`:focus-visible`)

---

## 3. Tipografia & Escala de Tipos
- **Fonte Display / Títulos (`font-serif`):** `Playfair Display` via `next/font/google` (`400`–`700`, normal e `italic`).
- **Fonte Principal (`font-sans`):** `Plus Jakarta Sans` via `next/font/google` (`300`–`700`).
- **Dados Tabulares / Preços / Códigos:** `tabular-nums` (`font-variant-numeric: tabular-nums`) + `font-mono` para códigos de pedido (`MC-YYYYMMDD-XXXXXX`) e chaves PIX.
- **Escala de Tamanhos:**
  - `Display / Hero (h1):` `text-3xl sm:text-5xl lg:text-[3.5rem]` | Weight: `700` | Line-height: `1.12` | Tracking: `-0.025em`
  - `H1 (Page Title):` `text-2xl sm:text-3xl` | Weight: `700` | Line-height: `1.2`
  - `H2 (Section):` `text-lg sm:text-2xl` | Weight: `700` | Line-height: `1.3`
  - `H3 (Card Title):` `text-sm sm:text-base` | Weight: `600` | Line-height: `1.4`
  - `Body Regular:` `14px (text-sm)` a `16px (text-base)` | Weight: `400` | Line-height: `1.5`
  - `Small / Metadata / Labels:` `11px`–`12px (text-xs)` | Weight: `600` | Uppercase tracking `tracking-wider`

---

## 4. Espaçamento & Grid
- **Métrica Base:** Múltiplos estritos de `4px` e `8px` (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`).
- **Container Global:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (1280px).
- **Checkout & Painel Admin:** Grid de 12 colunas no desktop (`lg:grid-cols-12 gap-8`: 7 colunas formulário + 5 colunas resumo sticky).

---

## 5. Raios de Borda (Border Radii)
- `radius-md:` `12px` (`rounded-xl`) — Inputs de formulário, botões de ação em cards e seletores de checkout.
- `radius-lg:` `16px` (`rounded-2xl`) — Cards de etapa do checkout, cards de produto e blocos de resumo.
- `radius-xl:` `24px` (`rounded-3xl`) — Painéis de acompanhamento de pedido (`/pedido/[token]`), cards administrativos e seções de destaque.
- `radius-full:` `9999px` (`rounded-full`) — Botões `.btn-brand-primary`, pills de filtro e badges de status.

---

## 6. Elevação & Sombras
- `shadow-marina-sm:` `0 2px 8px -2px rgba(117, 6, 106, 0.18)`
- `shadow-marina-md:` `0 4px 16px -4px rgba(117, 6, 106, 0.24)`
- `shadow-luxury-card:` `0 2px 12px 0 rgba(23, 14, 17, 0.04), 0 8px 24px -4px rgba(23, 14, 17, 0.06)`
- `shadow-luxury-hover:` `0 12px 32px -4px rgba(23, 14, 17, 0.12), 0 4px 12px -2px rgba(117, 6, 106, 0.18)`

---

## 7. Especificação de Componentes Atômicos
- **Botões (`src/components/ui/Button.tsx`):** Altura mínima de toque `44px` (`min-h-[44px]`), foco visível `focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`, suporte a `disabled:opacity-50`.
- **Inputs Acessíveis (`CheckoutContact`, `CheckoutDelivery`, `AdminLoginPage`):** Associados a `<label htmlFor>`, `autoComplete` explícito, `aria-invalid`, `aria-describedby` apontando para mensagem de erro com `role="alert"`.
- **Preços (`src/components/ui/Price.tsx` & `src/lib/pricing.ts`):** Operam em centavos inteiros (`cents`), renderizados com `tabular-nums`, exibindo desconto apenas quando `promoPriceCents < priceCents`.

---

## 8. Princípios Anti-AI-Slop
- Proibido lorem ipsum, avaliações falsas ("4.9 estrelas") ou contadores de escassez fictícios.
- Proibido gradiente genérico desconectado da paleta Roxo/Violeta Imperial (`#75066A` / `#9C27B0` / `#4D0046`).
- Todos os preços, fretes e descontos vêm de cotação autoritativa do servidor em centavos inteiros.

---

## 9. Portão de Auto-Crítica
- Contraste WCAG 2.1 AA validado matematicamente (`python tests/stress-m1-tokens-css.py`).
- Respeito a `@media (prefers-reduced-motion: reduce)` em animações contínuas.
- Fidelidade absoluta aos ativos oficiais (`/logo-nav.png`, `/logo-white.png`, `/logo-mariane-banner.png`, `/logo.svg`, `src/app/icon.svg`, `/favicon.ico`).
