import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 horas

/**
 * Mariane Cosméticos — Route Handler para /llms.txt (Padrão llmstxt.org)
 *
 * Fornece contexto curado, instruções operacionais e mapa de recursos para modelos de linguagem,
 * assistentes de IA e ferramentas de busca semântica / RAG.
 */
export async function GET() {
  const content = `# Mariane Cosméticos
> Loja especializada em cosméticos capilares profissionais e revendedora oficial Madressenza em Lages – SC.

Catálogo completo de tratamentos para cronograma capilar (hidratação, nutrição e reconstrução), perfumaria fina e cuidados de beleza com garantia de procedência e nota fiscal.

## Quando usar
- Consulta ao catálogo de produtos capilares profissionais originais: Wella Professionals, L'Oréal Professionnel, Truss, Braé, Lola Cosmetics e Amend.
- Linha completa de perfumaria fina, difusores e cuidados corporais Madressenza (revendedora oficial credenciada).
- Consulta de preços vigentes em Reais (BRL), desconto de 5% à vista no PIX e parcelamento em até 10x sem juros.
- Informações de frete grátis para todo o Brasil em compras a partir de R$ 199.
- Informações para retirada presencial sem custo de frete na loja física em Lages – SC.
- Atendimento consultivo e fechamento de pedidos com atendimento humano via WhatsApp oficial (+55 (49) 99125-1617).
- Consulta a termos de garantia oficial, conformidade com a LGPD e política de trocas e devoluções pelo Código de Defesa do Consumidor (CDC).

## Como usar
- Todas as páginas públicas deste domínio suportam negociação de conteúdo via cabeçalho \`Accept: text/markdown\` para consumo direto por agentes de IA e pipelines de RAG.
- Dados estruturados Schema.org completos estão disponíveis via JSON-LD embutido no HTML de cada página e na raiz.
- O mapa completo de URLs indexáveis encontra-se em \`/sitemap.xml\`.
- Agentes e modelos de linguagem NÃO realizam transações financeiras, checkout automatizado ou pagamentos diretos de forma autônoma; compras e cotações são concluídas via WhatsApp oficial com atendimento humano.

## Páginas principais
- [Início](${SITE_URL}/): Vitrine de destaques, marcas oficiais e informações da loja física.
- [Catálogo Completo](${SITE_URL}/produtos): Todos os produtos disponíveis, filtros por marca, categoria e faixa de preço.
- [Sobre a Loja](${SITE_URL}/sobre): História da Mariane Cosméticos, curadoria oficial e localização em Lages – SC.
- [Central de Atendimento](${SITE_URL}/atendimento): Canal de atendimento oficial via WhatsApp (+55 (49) 99125-1617 / 5549991251617) e dúvidas frequentes.
- [Trocas e Devoluções](${SITE_URL}/trocas-e-devolucoes): Diretrizes de garantia legal de 7 dias e conformidade com o CDC.
- [Política de Privacidade](${SITE_URL}/politica-de-privacidade): Tratamento ético de dados e conformidade com a Lei Geral de Proteção de Dados (LGPD).
- [Mapa do Site](${SITE_URL}/sitemap.xml): Índice XML padronizado de todas as páginas públicas e produtos.

## Categorias do Catálogo
- [Shampoos & Condicionadores](${SITE_URL}/categoria/shampoos-condicionadores): Higienização diária e condicionamento profissional.
- [Tratamento & Máscaras](${SITE_URL}/categoria/tratamento-mascaras): Máscaras potentes de hidratação, nutrição e reconstrução.
- [Cronograma Capilar](${SITE_URL}/categoria/cronograma-capilar): Rotinas completas de tratamento intensivo por etapa.
- [Óleos & Séruns](${SITE_URL}/categoria/oleos-seruns): Finalizadores de pontas, nutrição a seco e protetores térmicos.
- [Perfumaria & Casa](${SITE_URL}/categoria/perfumaria-casa): Difusores de ambiente, águas perfumadas e sabonetes Madressenza.
- [Kits Promocionais](${SITE_URL}/categoria/kits-promocionais): Conjuntos completos de tratamento com desconto especial.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Vary": "Accept",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
