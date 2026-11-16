import { NextRequest, NextResponse } from "next/server";
import { db, products, brands, categories } from "@/db";
import { eq, desc } from "drizzle-orm";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function formatBrl(val: number): string {
  return `R$ ${val.toFixed(2).replace(".", ",")}`;
}

function renderNotFoundMarkdown(requestedPath: string): NextResponse {
  const body = `# 404 — Página Não Encontrada | Mariane Cosméticos

A rota solicitada \`${requestedPath}\` não foi encontrada no catálogo ou não está mais disponível.

## Navegação e Recursos Disponíveis
- [Catálogo Geral de Produtos](${SITE_URL}/produtos)
- [Sitemap Oficial XML](${SITE_URL}/sitemap.xml)
- [Diretrizes para Agentes de IA (llms.txt)](${SITE_URL}/llms.txt)
- [Central de Atendimento via WhatsApp](${SITE_URL}/atendimento)
- [Sobre a Mariane Cosméticos](${SITE_URL}/sobre)

---
**Mariane Cosméticos** — Rua Blumenau, Nº 623, Lages – SC | WhatsApp: +55 (49) 99125-1617
`;

  return new NextResponse(body, {
    status: 404,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
    },
  });
}

function markdownResponse(content: string, status = 200): NextResponse {
  return new NextResponse(content, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept",
    },
  });
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawPath = url.searchParams.get("path") || url.pathname;
  // Limpar prefixo de query e trailing slashes redundantes
  const pathname = (rawPath.startsWith("/") ? rawPath : `/${rawPath}`)
    .replace(/\/$/, "") || "/";

  // 1. Home ("/")
  if (pathname === "/") {
    const allCategories = await db.select().from(categories).limit(20);
    const allBrands = await db.select().from(brands).limit(20);
    const featuredProds = await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, 1))
      .limit(8);

    // Fallback se não houver produtos marcados como destaque
    const displayProds =
      featuredProds.length > 0
        ? featuredProds
        : await db.select().from(products).limit(8);

    const categoriesList = allCategories
      .map((c) => `- [${c.name}](${SITE_URL}/categoria/${c.slug})`)
      .join("\n");

    const brandsList = allBrands
      .map((b) => `- [${b.name}](${SITE_URL}/produtos?marca=${b.slug})`)
      .join("\n");

    const productsList = displayProds
      .map((p) => {
        const currentPrice =
          p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price
            ? p.promoPrice
            : p.price;
        const pixPrice = currentPrice * 0.95;
        return `- **[${p.name}](${SITE_URL}/produto/${p.slug})**: ${formatBrl(currentPrice)} (PIX 5% OFF: ${formatBrl(pixPrice)} ou 10x sem juros)`;
      })
      .join("\n");

    const content = `# Mariane Cosméticos

> "Linda é a mulher que bem se quer"

Catálogo oficial de cosméticos capilares profissionais e perfumaria de ambiente fina. Revendedora Oficial Madressenza em Lages – SC.

## Resumo Institucional
A **Mariane Cosméticos** é revendedora oficial da conceituada marca **Madressenza** e distribuidora de linhas capilares profissionais consagradas para cronograma capilar (Wella Profissional, L'Oréal Professionnel, Truss, Braé, Lola Cosmetics e Amend). Sediada em Lages – SC, a loja oferece atendimento consultivo, produtos 100% originais com lacre de fábrica e entrega segura para todo o Brasil.

## Condições Comerciais
- **Frete Grátis:** Para pedidos a partir de R$ 199 para todo o Brasil.
- **Formas de Pagamento:** Até 10x sem juros no cartão ou 5% de desconto à vista no PIX.
- **Retirada Local:** Opção de retirada na loja física em Lages – SC sem custo de frete.

## Categorias em Destaque
${categoriesList || "- Nenhum departamento cadastrado"}

## Marcas Oficiais
${brandsList || "- Nenhuma marca cadastrada"}

## Produtos em Destaque
${productsList || "- Nenhum produto em destaque no momento"}

## Contatos Oficiais e Atendimento
- **WhatsApp Oficial:** [+55 (49) 99125-1617](https://wa.me/5549991251617)
- **Endereço Físico:** Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)
- **Horário de Atendimento:** Segunda a Sexta: 09:00 às 18:30 | Sábado: 09:00 às 13:00
- **Instagram:** [@mariane_cosmeticos_01](https://www.instagram.com/mariane_cosmeticos_01/)

## Recursos para Agentes e Descoberta
- **Sitemap XML:** [${SITE_URL}/sitemap.xml](${SITE_URL}/sitemap.xml)
- **Diretrizes para IA (llms.txt):** [${SITE_URL}/llms.txt](${SITE_URL}/llms.txt)
- **Catálogo Completo:** [${SITE_URL}/produtos](${SITE_URL}/produtos)
`;

    return markdownResponse(content);
  }

  // 2. Catálogo Geral ("/produtos")
  if (pathname === "/produtos") {
    const allProds = await db.select().from(products).limit(50);
    const list = allProds
      .map((p) => {
        const currentPrice =
          p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price
            ? p.promoPrice
            : p.price;
        const pixPrice = currentPrice * 0.95;
        return `### [${p.name}](${SITE_URL}/produto/${p.slug})\n- Preço: ${formatBrl(currentPrice)} | PIX (5% OFF): ${formatBrl(pixPrice)}\n- Parcelamento: Até 10x de ${formatBrl(currentPrice / 10)} sem juros\n- Disponibilidade: ${p.stock && p.stock > 0 ? "Em estoque" : "Consulte disponibilidade"}\n- Link: ${SITE_URL}/produto/${p.slug}\n`;
      })
      .join("\n");

    const content = `# Catálogo de Produtos | Mariane Cosméticos

Confira nossa seleção completa de cosméticos capilares profissionais e perfumaria Madressenza em Lages – SC.

${list || "Nenhum produto encontrado no momento."}

---
[Voltar ao Início](${SITE_URL}) | [Sitemap XML](${SITE_URL}/sitemap.xml) | [llms.txt](${SITE_URL}/llms.txt)
`;
    return markdownResponse(content);
  }

  // 3. Página de Produto Individual ("/produto/[slug]")
  if (pathname.startsWith("/produto/")) {
    const slug = pathname.replace(/^\/produto\//, "").split("/")[0].split("?")[0];
    if (!slug) return renderNotFoundMarkdown(pathname);

    const prodList = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (prodList.length === 0) {
      return renderNotFoundMarkdown(pathname);
    }

    const prod = prodList[0];
    let brandName = "Profissional";
    if (prod.brandId) {
      const bList = await db
        .select()
        .from(brands)
        .where(eq(brands.id, prod.brandId))
        .limit(1);
      if (bList.length > 0) brandName = bList[0].name;
    }

    const currentPrice =
      prod.promoPrice && prod.promoPrice > 0 && prod.promoPrice < prod.price
        ? prod.promoPrice
        : prod.price;
    const pixPrice = currentPrice * 0.95;
    const installmentVal = currentPrice / 10;
    const canonicalUrl = `${SITE_URL}/produto/${prod.slug}`;

    const content = `# ${prod.name}

- **Marca:** ${brandName}
- **Preço:** ${formatBrl(currentPrice)}
- **Preço no PIX (5% OFF):** ${formatBrl(pixPrice)}
- **Parcelamento:** Até 10x de ${formatBrl(installmentVal)} sem juros
- **Disponibilidade:** ${prod.stock && prod.stock > 0 ? "Em estoque" : "Sob consulta"}
- **Link Canônico:** ${canonicalUrl}
- **Código / SKU:** ${prod.sku || "MC-" + prod.id.slice(0, 8)}

## Descrição do Produto
${prod.description || "Cosmético profissional de alta performance, 100% original, enviado com lacre de fábrica e garantia de procedência."}

${prod.howToUse ? `## Modo de Uso\n${prod.howToUse}\n` : ""}

## Como Comprar
- **Pedido via WhatsApp:** [Iniciar Atendimento via WhatsApp](https://wa.me/5549991251617?text=${encodeURIComponent(`Olá! Tenho interesse no produto ${prod.name} (${formatBrl(currentPrice)}) visto em: ${canonicalUrl}`)})
- **Loja Física:** Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)
- **Frete Grátis:** A partir de R$ 199 para todo o Brasil.

---
[Ver Todos os Produtos](${SITE_URL}/produtos) | [Sitemap XML](${SITE_URL}/sitemap.xml) | [llms.txt](${SITE_URL}/llms.txt)
`;
    return markdownResponse(content);
  }

  // 4. Categoria do Catálogo ("/categoria/[slug]")
  if (pathname.startsWith("/categoria/")) {
    const slug = pathname.replace(/^\/categoria\//, "").split("/")[0].split("?")[0];
    if (!slug) return renderNotFoundMarkdown(pathname);

    const catList = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (catList.length === 0) {
      return renderNotFoundMarkdown(pathname);
    }

    const cat = catList[0];
    const catProds = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, cat.id))
      .limit(20);

    const prodsList = catProds
      .map((p) => {
        const currentPrice =
          p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price
            ? p.promoPrice
            : p.price;
        return `- [${p.name}](${SITE_URL}/produto/${p.slug}): ${formatBrl(currentPrice)}`;
      })
      .join("\n");

    const content = `# Categoria: ${cat.name} | Mariane Cosméticos

> Curadoria oficial de ${cat.name} na Mariane Cosméticos em Lages – SC.

## Produtos Disponíveis nesta Categoria
${prodsList || "- Nenhum produto disponível nesta categoria no momento."}

---
[Ver Catálogo Completo](${SITE_URL}/produtos) | [Página Inicial](${SITE_URL}) | [Sitemap XML](${SITE_URL}/sitemap.xml)
`;
    return markdownResponse(content);
  }

  // 5. Páginas Institucionais e de Confiança
  if (pathname === "/sobre") {
    const content = `# Sobre a Mariane Cosméticos

> "Linda é a mulher que bem se quer"

A **Mariane Cosméticos** é uma loja especializada em cosméticos capilares profissionais e perfumaria de ambiente refinada, localizada em Lages – SC (Rua Blumenau, Nº 623).

## Curadoria de Excelência
- **Revendedora Oficial Madressenza:** Aromatizadores de ambientes, difusores, sabonetes botânicos e águas perfumadas.
- **Tratamento Capilar Profissional:** Marcas renomadas como Wella Profissional, L'Oréal Professionnel, Truss, Braé, Lola Cosmetics e Amend.
- **Origem Garantida:** Todos os produtos são 100% originais, adquiridos de distribuidores autorizados e enviados com lacre de fábrica.

## Condições e Facilidades
- Frete grátis a partir de R$ 199 para todo o Brasil.
- Até 10x sem juros no cartão ou 5% de desconto à vista no PIX.
- Retirada no balcão da loja física em Lages sem custo de frete.

## Contato
- WhatsApp: [+55 (49) 99125-1617](https://wa.me/5549991251617)
- Endereço: Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)
- Horário: Segunda a Sexta: 09:00 às 18:30 | Sábado: 09:00 às 13:00

---
[Catálogo de Produtos](${SITE_URL}/produtos) | [Sitemap XML](${SITE_URL}/sitemap.xml) | [llms.txt](${SITE_URL}/llms.txt)
`;
    return markdownResponse(content);
  }

  if (pathname === "/atendimento") {
    const content = `# Central de Atendimento | Mariane Cosméticos

Nossa equipe em Lages – SC está à disposição para esclarecer dúvidas sobre produtos, pedidos, cronograma capilar e perfumaria Madressenza.

## Canais Oficiais de Atendimento
- **WhatsApp Oficial:** [+55 (49) 99125-1617](https://wa.me/5549991251617) (Atendimento rápido e humanizado)
- **Loja Física:** Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)
- **Instagram:** [@mariane_cosmeticos_01](https://www.instagram.com/mariane_cosmeticos_01/)
- **Horário de Funcionamento:**
  - Segunda a Sexta-feira: 09:00 às 18:30
  - Sábado: 09:00 às 13:00
  - Domingo e Feriados: Fechado

## Perguntas Frequentes
1. **Qual o valor para frete grátis?** Frete grátis para todo o Brasil em compras a partir de R$ 199.
2. **Posso retirar na loja?** Sim, retirada sem custo na Rua Blumenau, Nº 623, Lages – SC.
3. **Quais as formas de pagamento?** Cartão de crédito em até 10x sem juros ou 5% de desconto no PIX.
4. **Os produtos são originais?** Sim, 100% originais com lacre de fábrica e procedência garantida.

---
[Catálogo de Produtos](${SITE_URL}/produtos) | [Sitemap XML](${SITE_URL}/sitemap.xml) | [llms.txt](${SITE_URL}/llms.txt)
`;
    return markdownResponse(content);
  }

  if (pathname === "/trocas-e-devolucoes") {
    const content = `# Política de Trocas e Devoluções | Mariane Cosméticos

A Mariane Cosméticos atua em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990).

## Diretrizes Gerais
- **Direito de Arrependimento (Art. 49 do CDC):** Em compras realizadas à distância, o cliente tem até 7 (sete) dias corridos após o recebimento para solicitar o cancelamento e a devolução integral.
- **Condições do Produto:** O produto deve estar em sua embalagem original, lacrado, sem indícios de uso e acompanhado de todos os acessórios.
- **Avarias ou Defeitos:** Caso a encomenda chegue violada ou com defeito, entre em contato em até 30 dias para substituição ou reembolso imediato.
- **Como Solicitar:** Envie mensagem para nosso WhatsApp oficial: [+55 (49) 99125-1617](https://wa.me/5549991251617) informando número do pedido e fotos do produto.

---
[Página Inicial](${SITE_URL}) | [Catálogo de Produtos](${SITE_URL}/produtos) | [Sitemap XML](${SITE_URL}/sitemap.xml)
`;
    return markdownResponse(content);
  }

  if (pathname === "/politica-de-privacidade") {
    const content = `# Política de Privacidade e Proteção de Dados (LGPD) | Mariane Cosméticos

A Mariane Cosméticos preza pela total segurança e transparência no tratamento de dados pessoais das suas clientes, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## Princípios e Bases Legais
- **Finalidade:** Coletamos apenas dados indispensáveis para o processamento do pedido, emissão de nota fiscal, cobrança e entrega (Art. 7º, V da LGPD).
- **Não Comercialização:** Nunca comercializamos nem transferimos dados para terceiros para finalidades de marketing externo.
- **Operadores Essenciais:** Compartilhamento estritamente operacional com WhatsApp (Meta Platforms) e instituição de pagamento homologada.
- **Direitos da Titular:** Confirmação de tratamento, acesso, correção e eliminação mediante solicitação no canal oficial WhatsApp: +55 (49) 99125-1617.

---
[Página Inicial](${SITE_URL}) | [Catálogo de Produtos](${SITE_URL}/produtos) | [Sitemap XML](${SITE_URL}/sitemap.xml)
`;
    return markdownResponse(content);
  }

  // 6. Rota Inexistente -> Status 404
  return renderNotFoundMarkdown(pathname);
}
