---
trigger: glob
globs: "src/**/*.tsx, src/**/*.css"
description: Governança estrita da identidade visual e cadastral da Mariane Cosméticos conforme docs/DESIGN.md
---

# Regra de Identidade Visual & Cadastral — Mariane Cosméticos

Ao criar ou editar qualquer arquivo em `src/**/*.tsx` ou `src/**/*.css`, obedeça sem exceção ao contrato definido em [`docs/DESIGN.md`](../../docs/DESIGN.md):

1. **Usar exclusivamente tokens do `docs/DESIGN.md`:**
   - Utilize apenas as classes semânticas do `tailwind.config.ts` e variáveis CSS de `src/app/globals.css`: escala Roxo/Violeta Imperial (`marina-50` a `marina-950`, com primária `#75066A`, vibrante `#9C27B0` e escuro `#4D0046`), destaque Magenta (`brand-accent` `#EB1E78`), neutros (`onyx`, `silk`) e WhatsApp (`emerald-whatsapp` `#25D366`, `emerald-dark` `#128C7E`).
   - Proibido usar valores hexadecimais avulsos hardcoded em componentes `.tsx` ou reintroduzir a paleta legada (`#EC268F` / `#9A1458`).
   - Utilize apenas as famílias tipográficas `font-serif` (`Playfair Display`) e `font-sans` (`Plus Jakarta Sans`) carregadas via `next/font/google`.

2. **Nunca redesenhar ou trocar o logotipo:**
   - Utilize sempre o componente `<Logo />` (`src/components/Logo.tsx`) e mantenha intocados os ativos oficiais:
     - `/logo-nav.png` (header claro — `variant="horizontal" tone="dark"`)
     - `/logo-white.png` (footer escuro — `variant="horizontal" tone="light"`)
     - `/logo-mariane-banner.png` (badge — `variant="badge"`)
     - `/logo.svg` (OpenGraph)
     - `src/app/icon.svg` + `/favicon.ico` (ícones da aplicação)

3. **Nunca alterar o nome oficial, o slogan ou os contatos:**
   - **Nome:** `Mariane Cosméticos` (nunca escrever `"Marina"` ou `"Marina Cosméticos"`).
   - **Slogan:** `"Linda é a mulher que bem se quer"`.
   - **WhatsApp:** `+55 (49) 99125-1617` (`5549991251617` em todos os links `wa.me` e `api.whatsapp.com`).
   - **Instagram:** `@mariane_cosmeticos_01` (`https://www.instagram.com/mariane_cosmeticos_01/`).
   - **Endereço:** `Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)`.
