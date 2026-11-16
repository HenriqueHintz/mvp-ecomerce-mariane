# Prompts de Redesign — Mariane Cosméticos

Ordem recomendada de execução: **4 (Mobile) → 1 (Vitrine) → 3 (Sacola) → 2 (Mapa + CTA)**.
O prompt 4 é transversal e já toca em vários pontos dos outros; rode os demais depois para refinar.

> Skills globais ficam em `C:\Users\ricop\.gemini\config\plugins\` (torre-frontend, torre-sites, superpowers).

---

## Prompt 1 — Vitrine de Produtos

```
/impeccable /ui-ux-pro-max /frontend-design /next-best-practices /web-design-guidelines /verification-before-completion

Use /sites-incriveis APENAS como referência para microanimações sutis (entrada dos cards ao rolar e trilho horizontal com scroll-snap no mobile), respeitando prefers-reduced-motion. Sem scrollytelling pesado na vitrine: prioridade é legibilidade e conversão.

Redesenhe a VITRINE DE PRODUTOS da Mariane Cosméticos (seção "Mais Vendidos & Destaques" da home e o card de produto usado em /produtos e /categoria/[slug]).

## Arquivos-alvo
- src/components/ProductCard.tsx
- src/components/ui/Price.tsx
- src/app/page.tsx (seção 3 – Vitrine, linha ~95)
- Se precisar: novo componente client `src/components/ProductShowcase.tsx`

## Problemas atuais (corrigir todos)
1. Fontes "cifradas"/ilegíveis: textos em 10–11px com tracking largo (marca, selo "Destaque", PIX, parcelamento). Tamanho mínimo: 12px no mobile para texto de apoio, 14px para o nome do produto; tracking largo só em eyebrows curtos.
2. Preço em formato americano (R$ 512.91). Use Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }) num helper único `formatBRL` e aplique em Price.tsx, no ProductCard e na mensagem do WhatsApp.
3. Hierarquia de preço confusa: o preço riscado, o preço final, o PIX e o parcelamento estão todos com o mesmo peso. Defina 3 níveis claros: preço final (destaque) > PIX em verde-esmeralda > parcelamento discreto. Mostre o selo de desconto (-20%) com mais contraste.
4. Nome do produto truncado com "…": permita 2–3 linhas com altura reservada e consistente para que os cards fiquem alinhados; o nome completo vai no title/aria.
5. Navegação fraca: só 4 produtos fixos. Proposta:
   - Abas/chips acima da grade: "Mais Vendidos", "Promoções", "Novidades" e por marca (Wella, L'Oréal, Madressenza…), filtrando no cliente os dados que já vêm do servidor (buscar ~12 produtos em getHomeData).
   - Mobile: carrossel horizontal com scroll-snap (card ~78% da largura, mostrando um pedaço do próximo), indicadores de posição e swipe nativo; sem bibliotecas novas.
   - Desktop: grade de 4 colunas (lg) / 3 (md) com setas prev/next acessíveis, ou grade + botão "Ver mais".
   - CTA "Ver catálogo completo" visível também no fim da seção no mobile.
6. Card: imagem maior e com fundo uniforme (aspect-[4/5]), o hover mostra uma segunda ação ("Ver detalhes"), o botão "Adicionar" ocupa largura total no mobile com área de toque ≥ 44px, e o WhatsApp vira botão secundário claramente rotulado. Feedback visual ao adicionar à sacola (estado "Adicionado ✓" por 1,5s).

## Responsividade (obrigatório validar)
- 360px, 390px, 768px, 1024px, 1440px — sem scroll horizontal da página, sem texto cortado, sem botões espremidos.
- Fontes legíveis em telas pequenas; nada abaixo de 12px.

## Restrições do projeto (AGENTS.md / docs/DESIGN.md)
- Use só os tokens existentes: marina-50..950, brand-accent #EB1E78, onyx, silk, emerald-whatsapp; fontes Playfair Display (títulos) e Plus Jakarta Sans (texto) via next/font.
- A página continua sendo Server Component; a interatividade (abas, carrossel) fica em componente "use client".
- Sem `any` e sem `@ts-ignore`. WhatsApp oficial 5549991251617. Contraste WCAG 2.1 AA.
- Acessibilidade: abas com role="tablist", carrossel com aria-roledescription, foco visível, prefers-reduced-motion respeitado.

## Processo
1. Rode `npm run dev` (porta 3001) e capture o antes (desktop + mobile 390px).
2. Proponha 2 direções visuais curtas e escolha a melhor seguindo DESIGN.md.
3. Implemente, capture o depois nos mesmos tamanhos e compare.
4. Definição de Pronto: `npm run build` sem erros, `npx tsx tests/e2e/runner.ts` 100% verde, os 3 testes stress-m1 com exit 0. Se algum teste E2E depender dos seletores/textos antigos do card, ajuste o teste e explique.
```

---

## Prompt 2 — Loja Física (Mapa) + Chamada Final

```
/impeccable /ui-ux-pro-max /frontend-design /web-design-guidelines /verification-before-completion

Melhore a visualização de DOIS blocos da home da Mariane Cosméticos: a seção da loja física com mapa e a chamada final "Pronta para cuidar da sua beleza?".

## Arquivos-alvo
- src/components/StoreMapSection.tsx
- src/app/page.tsx (seção 4 – Chamada Final, linha ~115)

## Bug a investigar primeiro
Nos prints os espaços entre palavras somem: "COMOCHEGAR", "FALARNOWHATSAPP(49)", "Segunda a Sexta:09hàs18h30", "Lages - SC • CEP88505-300". O texto no código tem espaço. Descubra a causa antes de mexer no visual: fonte Plus Jakarta Sans via next/font, combinação de tracking com uppercase, `gap` com `<span>` filhos ou espaços removidos no JSX. Corrija na causa e confirme com screenshot em 100% e 125% de zoom.

## Bloco 1 — "Venha nos visitar em Lages" (StoreMapSection)
1. Legibilidade: rótulos (Endereço / Horário / WhatsApp) com no mínimo 12px e tracking moderado; conteúdo (endereço, horários, telefone) com 15–16px e peso médio. Nada abaixo de 12px, nem o "Resposta rápida…".
2. Horários em lista alinhada (dia à esquerda, hora à direita, tabular-nums), com o status "Aberto agora / Fechado" calculado no cliente (fuso America/Sao_Paulo, Seg–Sex 09h–18h30, Sáb 09h–13h).
3. Ícones e textos alinhados na mesma grade, espaçamento vertical uniforme entre os 3 itens e divisórias sutis.
4. Botões: "Como chegar" (primário marina) e "Waze" com o mesmo peso visual (secundário com borda bem visível, não com cara de desativado). Altura ≥ 44px, rótulos com espaço legível. Considere um 3º botão discreto "Copiar endereço" com feedback "Copiado ✓".
5. Proporção: equilibre texto e mapa (lg: 5/7 → 6/6 ou 5/7 com mais padding no texto). O mapa com altura fixa coerente (lg ~420px) e cantos acompanhando o card. Se der, esconda o balão padrão do Google ou use embed com zoom mais fechado na Rua Blumenau, 623.
6. Mobile (360–390px): o texto vem primeiro, depois o mapa com ~260px de altura e os botões em largura total, empilhados. Sem scroll horizontal.
7. Carregamento: iframe com loading="lazy", title acessível e referrerPolicy adequado.

## Bloco 2 — Chamada final "Pronta para cuidar da sua beleza?"
1. LARGURA: hoje ocupa o container inteiro (max-w-7xl), longa demais para uma frase e dois botões. Limite o card a max-w-3xl (~768px), centralizado, para que fique na mesma linha visual do bloco do mapa ou mais estreito que ele, e nunca mais largo.
2. Padding mais compacto (py-10 sm:py-12) e título em 2 linhas no máximo, com Playfair.
3. Adicione uma linha de apoio curta abaixo do título (ex.: "Atendimento personalizado pelo WhatsApp ou retire na loja em Lages.").
4. Botões lado a lado no desktop com largura igual e empilhados em largura total no mobile. Rótulos curtos: "Ver catálogo" e "Falar no WhatsApp" (o número fica em aria-label/title, não no botão).
5. Reduza o espaço vazio entre o bloco do mapa e este card: o ritmo vertical deve ser igual ao das outras seções.

## Restrições (AGENTS.md / docs/DESIGN.md)
- Use só os tokens existentes: marina-50..950, brand-accent #EB1E78, onyx, silk, emerald-whatsapp; Playfair Display + Plus Jakarta Sans via next/font.
- Dados oficiais: Rua Blumenau, Nº 623, Lages – SC (CEP 88505-300); WhatsApp 5549991251617.
- Sem `any` e sem `@ts-ignore`. Contraste WCAG 2.1 AA. Foco visível. prefers-reduced-motion respeitado.

## Processo e Pronto
1. `npm run dev` (porta 3001): screenshots do antes e do depois em 390px, 768px e 1440px.
2. `npm run build` exit 0; `npx tsx tests/e2e/runner.ts` 100%; os 3 testes stress-m1 com exit 0. Se algum E2E depender dos textos antigos dos botões, ajuste o teste e explique.
```

---

## Prompt 3 — Sacola / Carrinho

```
/impeccable /ui-ux-pro-max /frontend-design /react-best-practices /next-best-practices /web-design-guidelines /verification-before-completion

Reconstrua a SACOLA / CARRINHO da Mariane Cosméticos: a gaveta lateral e a página /carrinho, com mais desempenho, visual mais bonito, navegação melhor e boa leitura no mobile e no desktop.

## Arquivos-alvo
- src/context/CartContext.tsx
- src/components/CartDrawer.tsx
- src/app/carrinho/page.tsx
- src/components/Header.tsx (ícone da sacola + montagem da gaveta)
- Novos componentes compartilhados em src/components/cart/: CartLineItem, CartSummary, FreeShippingBar, CartEmptyState, QuantityStepper

## 1. Desempenho (prioridade)
- Separe o contexto em dois: CartStateContext (items, subtotal, contagem) e CartUIContext (isOpen, open/close), para que abrir a sacola não re-renderize os ProductCards.
- Memoize o value com useMemo e as ações (addItem, removeItem, updateQuantity, clearCart) com useCallback. Considere useReducer para o carrinho.
- Carregue a gaveta com next/dynamic (ssr: false) e só monte no primeiro clique. Faça prefetch no hover/focus do ícone da sacola.
- Persistência no localStorage com debounce (~300ms), validação do JSON salvo (descartar itens inválidos) e sincronização entre abas via evento `storage`.
- Mantenha os cálculos em centavos com o pricing.ts/COMMERCE_CONFIG que já existem. Não duplique a regra de frete grátis (R$ 199).
- Imagens dos itens via next/image com sizes="80px".

## 2. Navegação e acessibilidade
- Gaveta lateral que desliza da direita (translate-x) com animação de entrada E de saída (manter montada durante a transição), respeitando prefers-reduced-motion.
- Fechar com Esc, clique no fundo e botão X. Prenda o foco dentro da gaveta, devolva o foco ao ícone ao fechar e trave o scroll do body.
- role="dialog", aria-modal, aria-labelledby no título e aria-live="polite" anunciando "Produto adicionado" e mudanças de quantidade/total.
- Badge com a contagem no ícone da sacola do Header, com animação sutil de "pulo" ao adicionar.
- Link "Ver sacola completa" na gaveta levando para /carrinho e o mesmo checkout nos dois lugares.

## 3. Visual e conteúdo
- Formate tudo com Intl.NumberFormat("pt-BR", BRL) num helper único `formatBRL`: nada de "R$ 199.00".
- Tipografia: nada abaixo de 12px. Nome do produto em 14–15px em até 2 linhas, marca como eyebrow e preço unitário + total da linha alinhados à direita com tabular-nums.
- Item da sacola: miniatura 72–80px, marca, nome, stepper de quantidade (botões ≥ 40px, desabilitar "−" em 1 e usar a lixeira para remover), "Remover" com opção de desfazer por 5s (toast).
- Barra de frete grátis: mensagem clara ("Faltam R$ 49,90 para frete grátis" → "Você ganhou frete grátis 🎉"), progresso animado e cores dos tokens.
- Resumo fixo no rodapé da gaveta: subtotal, preço no PIX (5% off) em verde, parcelamento em 10x, botão primário "Finalizar compra" (/checkout) e secundário "Pedir pelo WhatsApp" (generateWhatsAppLink existente, número 5549991251617).
- Sacola vazia: em vez da tela branca enorme, mostre uma composição compacta com ícone, frase, botão "Explorar produtos" e um trilho de 3–4 produtos sugeridos (mais vendidos) com "Adicionar" rápido.
- /carrinho: layout em 2 colunas no desktop (itens | resumo sticky) e 1 coluna no mobile, com o resumo numa barra fixa inferior (total + botão), reutilizando os mesmos componentes da gaveta.

## 4. Responsividade
- Gaveta: largura total no mobile (≤ 480px) com cabeçalho e rodapé fixos e só a lista rolando; max-w-md no desktop.
- Validar em 360, 390, 768, 1024 e 1440px: sem scroll horizontal, sem texto cortado, safe-area do iPhone no rodapé (env(safe-area-inset-bottom)).

## Restrições (AGENTS.md / docs/DESIGN.md)
- Use só os tokens existentes: marina-50..950, brand-accent #EB1E78, onyx, silk, emerald-whatsapp; Playfair Display + Plus Jakarta Sans via next/font.
- Não quebre a chave "mariane_cart" do localStorage (migre o formato se mudar) nem a API pública do useCart usada por ProductCard, Header, checkout e produto/[slug]. Se mudar, atualize todos os usos.
- Sem `any` e sem `@ts-ignore`. Contraste WCAG 2.1 AA.

## Processo e Pronto
1. `npm run dev` (porta 3001): screenshots do antes e do depois da gaveta vazia, com 1 item, com 5 itens e de /carrinho, em 390px e 1440px.
2. Meça re-renderizações com o React DevTools Profiler antes/depois ao adicionar um item e relate o ganho.
3. `npm run build` exit 0; `npx tsx tests/e2e/runner.ts` 100%; os 3 testes stress-m1 com exit 0. Se algum E2E depender dos seletores antigos da sacola, ajuste o teste e explique.
```

---

## Prompt 4 — Remodelação Completa do Mobile

```
/impeccable /ui-ux-pro-max /frontend-design /next-best-practices /react-best-practices /web-design-guidelines /verification-before-completion

Remodele TODA a experiência MOBILE da Mariane Cosméticos (telas < 768px). O DESKTOP NÃO PODE MUDAR: toda alteração deve ficar em classes base com override `md:`/`lg:` que preserve o visual atual, ou em componentes renderizados só no mobile. Prove isso com screenshots de 1440px antes/depois idênticos.

Objetivo: a melhor experiência possível no celular, com enquadramento, espaçamento, leitura e navegação de app de e-commerce premium. Você TEM permissão para remover ou fundir no mobile elementos redundantes; liste cada remoção e o motivo.

## Arquivos prováveis
src/components/Header.tsx, Footer.tsx, CartDrawer.tsx, HeroBackgroundCarousel.tsx / HeroVisualCarousel.tsx / Hero, BrandShowcase / BrandCarousel.tsx, ProductCard.tsx, StoreMapSection.tsx, src/app/page.tsx, src/app/layout.tsx, src/app/globals.css (+ barra de avisos, onde estiver).

## Sistema de espaçamento mobile (aplicar em tudo)
- Gutter lateral fixo de 16px; espaço entre seções de 40–48px (hoje ~100px); espaço interno dos cards de 16px.
- Escala tipográfica mobile: H1 28–32px, H2 24px (Playfair, peso regular, sem o "black" atual da vitrine), corpo 15–16px, apoio mínimo 12px. Títulos com no máximo 2 linhas.
- Áreas de toque ≥ 44px. Use `svh`/`dvh` em vez de `vh`. Respeite env(safe-area-inset-*).
- Corrija o bug de espaços sumindo entre palavras ("apartirdeR$199", "COMOCHEGAR") na causa raiz.

## 1. Barra de avisos (topo)
- Hoje são 3 linhas empilhadas (~70px). No mobile vira UMA linha de 32px com rotação automática/fade entre "Frete grátis acima de R$ 199", "10x sem juros" e "5% OFF no PIX" (pausar com prefers-reduced-motion e ao tocar).

## 2. Header mobile
- Altura de 56px. Avalie fundo branco/silk com logo colorido (o logo rosa sobre roxo tem pouco contraste) ou manter o roxo e usar /logo-white.png. Escolha pelo contraste e pelo DESIGN.md.
- Layout: [menu] [logo centralizado] [busca] [sacola com badge de quantidade].
- Comportamento: esconde ao rolar para baixo e volta ao rolar para cima. Nunca cobrir conteúdo (adicione scroll-padding-top / offset nas âncoras).

## 3. Menu (drawer)
- Remova o logo duplicado e a moldura estranha do botão X (botão ícone simples de 44px).
- Topo: campo de busca. Depois, abas ou acordeões "Categorias" e "Marcas" (hoje só aparecem marcas), mais links "Todos os produtos", "Promoções", "Rastrear pedido" e "Atendimento".
- Remova os blocos informativos repetidos (Revendedora / Frete / PIX) ou condense em uma linha discreta.
- Rodapé do menu: botão WhatsApp nas cores oficiais + Instagram.
- Trave o scroll do body, feche com gesto/Esc e prenda o foco.

## 4. Navegação inferior (NOVO, só mobile)
- Barra fixa inferior com 4–5 itens: Início, Categorias, Busca, Sacola (badge) e WhatsApp. Ícone + rótulo de 11–12px, item ativo destacado e safe-area no rodapé.
- Se adotada, remova botões flutuantes de WhatsApp redundantes e garanta padding-bottom no body para não cobrir conteúdo, inclusive o resumo da sacola.

## 5. Hero
- A primeira dobra (390×844) deve mostrar imagem + título + CTA sem rolar. Hero com no máximo ~75svh: imagem enquadrada (object-position no produto) com o texto sobreposto em gradiente, ou imagem de 55svh + bloco de texto compacto.
- Remova as setas no mobile: swipe + indicadores de posição menores.
- CTAs: um primário em largura total ("Ver catálogo") e um secundário em texto/link para o WhatsApp. Nada cortado.
- Imagem do 1º slide com priority e sizes="100vw". Lazy nos demais.

## 6. Marcas
- Substitua os cards de ~300px por um trilho de chips/logos (cards de ~120px de altura, 2,5 visíveis, scroll-snap) ou uma grade 2×N de logos. "Ver produtos" vira o card inteiro clicável.
- Título em 1–2 linhas no tamanho H2 mobile.

## 7. Vitrine de produtos
- Título H2 mobile (sem o peso black), abas com scroll horizontal e fade na borda indicando mais conteúdo.
- Escolha e justifique: grade 2 colunas compacta (recomendado para catálogo) ou trilho com 1,3 cards visíveis. Reduza o espaço branco ao redor da foto (aspect 4/5, padding 8px).
- Card compacto: marca 11–12px, nome 14px (2 linhas), preço 18px, PIX em verde, parcelamento 12px e botão "Adicionar" com ícone em largura total.
- "Ver catálogo completo" visível no fim da seção.

## 8. Loja física + mapa
- Endereço em 2 linhas sem quebrar o CEP. Horários em tabela compacta sem quebrar "Segunda a Sexta" (use "Seg–Sex"). Status "Aberto/Fechado agora" ao lado do título.
- Botões: "Como chegar" primário + Waze como ícone/secundário na mesma linha. Remova "Copiar endereço" ou torne o próprio endereço tocável para copiar.
- Mapa de ~220px de altura, com cantos arredondados, logo abaixo dos botões. Lazy.

## 9. Chamada final "Pronta para cuidar da sua beleza?"
- Com a navegação inferior e o WhatsApp acessíveis, essa seção é redundante no mobile: remova (hidden md:block) ou reduza a um banner de uma linha. Use o verde emerald-whatsapp oficial, igual em todo o site.

## 10. Rodapé
- Remova no mobile o card de benefícios (repete a barra de avisos).
- Logo + slogan + endereço + telefone compactos. "Categorias", "Marcas oficiais", "Ajuda" e "Políticas" viram acordeões (<details> acessível).
- Ícones sociais com 44px. Créditos/CNPJ em 12px. Padding inferior considerando a navegação inferior.

## 11. Sacola e páginas internas (mesmas regras)
- Gaveta da sacola em tela cheia no mobile com cabeçalho e resumo fixos.
- /produtos e /categoria/[slug]: filtros em bottom sheet com botão "Filtrar" sticky, ordenação em select nativo e grade 2 colunas.
- /produto/[slug]: galeria com swipe, barra fixa inferior com preço + "Adicionar à sacola".
- /checkout: campos com inputmode/autocomplete corretos (CEP, telefone, e-mail), teclado adequado e botão de finalizar sticky.

## Restrições (AGENTS.md / docs/DESIGN.md)
- Use só os tokens existentes: marina-50..950, brand-accent #EB1E78, onyx, silk, emerald-whatsapp; Playfair Display + Plus Jakarta Sans via next/font.
- Dados oficiais: Mariane Cosméticos, WhatsApp 5549991251617, @mariane_cosmeticos_01, Rua Blumenau, Nº 623, Lages – SC.
- Sem `any` e sem `@ts-ignore`. Contraste WCAG 2.1 AA. prefers-reduced-motion respeitado.
- Desempenho mobile: Lighthouse Mobile ≥ 90 em Performance e Acessibilidade na home, CLS < 0,1 e LCP < 2,5s. Sem bibliotecas novas de carrossel/animação.

## Processo e Pronto
1. `npm run dev` (porta 3001). Screenshots ANTES em 360×740, 390×844 e 430×932 de: home (página inteira), menu aberto, sacola vazia/com itens, /produtos, /produto/[slug], /checkout. Mais 1440px da home como referência do desktop.
2. Apresente um plano curto por seção com as remoções propostas antes de codar.
3. Implemente por seção, conferindo em 390px a cada passo.
4. Screenshots DEPOIS nos mesmos tamanhos + comparação lado a lado. Os prints de 1440px devem permanecer iguais.
5. `npm run build` exit 0; `npx tsx tests/e2e/runner.ts` 100%; os 3 testes stress-m1 com exit 0. Se algum E2E depender de elementos removidos no mobile, ajuste o teste e explique.
```
