# Registro de Construções — Sites Incríveis

| Data | Seção / Arquivo | Técnica / Família de Efeito | Notas |
| :--- | :--- | :--- | :--- |
| 2026-11-10 | Hero (`src/components/home/Hero.tsx`) | Crossfade de cenas 21:9 (desktop) e 4:5 (mobile) com setas laterais e indicadores finos | Mantida 100% intacta |
| 2026-11-12 | Marcas (`src/components/home/BrandShowcase.tsx`) | Revelação única na rolagem (`75ms` entre itens, sem movimento com `prefers-reduced-motion`) + índice editorial 3×2 com hover/foco (500ms) no desktop e trilho `scroll-snap` 4:5 no celular | Sem cards genéricos; logos oficiais em `public/brands/official/` via CSS mask; cenas em `public/brands/scenes/` |
