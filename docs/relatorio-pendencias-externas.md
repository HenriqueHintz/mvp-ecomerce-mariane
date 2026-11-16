# Relatório de Pendências Externas — Mariane Cosméticos

**Projeto:** Mariane Cosméticos (E-commerce & Loja Física)  
**Data:** 16 de Novembro de 2026  
**Responsável Técnico:** Subagente Implementer M3 (Semantics, Ratio & JSON-LD)  
**Status da Aplicação:** Código e infraestrutura técnica 100% prontos para produção e indexação por agentes de IA e motores de busca.  
**Objetivo:** Este documento consolida todas as ações e pendências que dependem de intervenção externa, acesso a plataformas de terceiros ou credenciais do proprietário da marca, organizadas por prioridade de impacto.

---

## 1. Ativação do Domínio Próprio (`marianecosmeticos.com.br`)

### 1.1 Contexto Atual
A aplicação está temporariamente hospedada na Vercel sob a URL de homologação:
`https://mvp-ecomerce-mariane-ne8c.vercel.app`

Toda a arquitetura do projeto foi centralizada através do módulo `src/lib/site.ts`, que consome a variável de ambiente pública `NEXT_PUBLIC_SITE_URL`. Nenhuma referência estática ou quebrada ao domínio final existe no código ativo.

### 1.2 Passos Necessários para Ativação
1. **Configuração na Vercel:**
   - Acessar o painel do projeto na Vercel: `Settings` → `Domains`.
   - Adicionar o domínio próprio: `marianecosmeticos.com.br` (e o alias `www.marianecosmeticos.com.br`).
   - Definir a variável de ambiente de produção:
     - Chave: `NEXT_PUBLIC_SITE_URL`
     - Valor: `https://marianecosmeticos.com.br` (ou com `www`, conforme preferência do cliente).
2. **Apontamento de DNS no Provedor (ex: Registro.br, Cloudflare ou GoDaddy):**
   - Entrada `A` para `@` (raiz): apontar para `76.76.21.21` (IP anycast da Vercel).
   - Entrada `CNAME` para `www`: apontar para `cname.vercel-dns.com`.
3. **Redirecionamento Canônico Permanente (HTTP 308):**
   - Na Vercel, configurar o redirecionamento automático do domínio de pré-visualização (`mvp-ecomerce-mariane-ne8c.vercel.app`) para o domínio oficial próprio com código de status 308 (Permanent Redirect), garantindo transferência integral de autoridade SEO e preservação do tráfego.

---

## 2. Google Search Console & Envio de Sitemap

### 2.1 Contexto Atual
A rota de sitemap dinâmico foi implementada e validada em `src/app/sitemap.ts`, respondendo em:
`https://<DOMINIO>/sitemap.xml`

O arquivo `src/app/robots.ts` já referencia explicitamente este sitemap e concede permissão total de varredura aos agentes de busca e robôs de IA (ChatGPT-User, OAI-SearchBot, Claude-User, PerplexityBot).

### 2.2 Passos Necessários
1. **Verificação de Propriedade:**
   - Acessar o [Google Search Console](https://search.google.com/search-console).
   - Adicionar a propriedade por Domínio (via registro TXT DNS no Registro.br) ou por Prefixo de URL (via tag HTML / DNS).
2. **Envio do Sitemap:**
   - Navegar até `Indexação` → `Sitemaps`.
   - Inserir `sitemap.xml` e clicar em `Enviar`.
   - Monitorar a taxa de descoberta de URLs (o sitemap cobre Home, `/produtos`, páginas institucionais e todos os produtos e categorias dinâmicos do banco SQLite).
3. **Inspeção de URL & Rich Results:**
   - Utilizar a ferramenta "Inspecionar URL" na Home e em páginas de produtos (`/produto/[slug]`).
   - Confirmar a detecção dos dados estruturados Schema.org (`Store`, `HealthAndBeautyBusiness`, `Organization`, `WebSite`, `Product`, `Offer`).

---

## 3. Google Business Profile (Perfil da Empresa no Google)

### 3.1 Contexto Atual
Os dados da loja física física e cadastral em Lages – SC foram estritamente padronizados em todo o sistema:
- **Razão Social / Nome de Exibição:** Mariane Cosméticos
- **Credencial Oficial:** Revendedora Oficial Madressenza
- **Endereço Completo:** Rua Blumenau, Nº 623, Lages – SC, CEP 88505-300, Brasil
- **Telefone / WhatsApp Oficial:** +55 (49) 99125-1617
- **Horário de Atendimento:** Segunda a Sexta: 09:00 às 18:30 | Sábado: 09:00 às 13:00 | Domingo: Fechado

### 3.2 Passos Necessários
1. **Reivindicação / Atualização da Ficha:**
   - Acessar o [Google Perfil da Empresa](https://www.google.com/business/).
   - Confirmar ou criar a ficha com a categoria primária: *Loja de cosméticos* (Cosmetics store) e categorias secundárias: *Loja de produtos de beleza*, *Perfumaria*.
2. **Consistência NAP (Name, Address, Phone):**
   - O endereço e telefone na ficha do Google devem ser **idênticos** aos definidos no rodapé do site, na seção "Venha nos visitar" e no Schema.org (`Store` / `PostalAddress`):
     - `Rua Blumenau, 623, Lages - SC, 88505-300`
     - `+55 49 99125-1617`
3. **Vínculo do Website e Produtos:**
   - Inserir o link do website apontando para a URL canônica oficial.
   - Ativar o botão de mensagem com link direto para o WhatsApp comercial.

---

## 4. Citações Externas, Redes Sociais e Coerência Digital

### 4.1 Instagram Oficial
- **Perfil:** `@mariane_cosmeticos_01` (URL: `https://www.instagram.com/mariane_cosmeticos_01/`)
- **Ação:** Atualizar o link na bio do Instagram para apontar para a URL canônica oficial do e-commerce. Incluir no perfil a menção oficial "Revendedora Madressenza em Lages – SC".

### 4.2 Citações em Diretórios Locais
- Garantir que listagens em diretórios empresariais de Santa Catarina (CDL Lages, ACIL Lages, Guia Mais, TeleListas, Apontador) utilizem exatamente a mesma grafia do endereço e telefone oficial, consolidando sinais de relevância local e SEO de proximidade geográfica.

---

## 5. Resumo do Cronograma Recomendado

| Etapa | Ação | Responsável | Prazo Sugerido |
| :--- | :--- | :--- | :--- |
| 1 | Apontar DNS e ativar domínio próprio na Vercel | Proprietário / TI | Imediato |
| 2 | Configurar Google Search Console e submeter `sitemap.xml` | Marketing / TI | 24h após DNS |
| 3 | Atualizar / verificar Google Business Profile em Lages | Proprietário | 48h após DNS |
| 4 | Atualizar link da bio do Instagram `@mariane_cosmeticos_01` | Proprietário | Imediato após DNS |
