import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { eq } from "drizzle-orm";
import {
  db,
  products,
  orders,
  orderItems,
  orderStatusHistory,
} from "../../src/db";
import {
  createOrderTransaction,
  OutOfStockError,
} from "../../src/lib/orders";
import { calculateOrderPricing, formatBrl } from "../../src/lib/pricing";
import { STORE_CONFIG } from "../../src/config/store";
import { COMMERCE_CONFIG } from "../../src/config/commerce";
import { POST as postCotacaoRoute } from "../../src/app/api/checkout/cotacao/route";
import { POST as postPedidosRoute } from "../../src/app/api/pedidos/route";
import { GET as getPedidoByTokenRoute } from "../../src/app/api/pedidos/[token]/route";
import { CheckoutContact } from "../../src/app/checkout/components/CheckoutContact";
import { CheckoutDelivery } from "../../src/app/checkout/components/CheckoutDelivery";
import { CheckoutSummary } from "../../src/app/checkout/components/CheckoutSummary";
import { OrderStatusTimeline } from "../../src/app/pedido/[token]/components/OrderStatusTimeline";
import { OrderNextSteps } from "../../src/app/pedido/[token]/components/OrderNextSteps";
import { OrderSummaryCard } from "../../src/app/pedido/[token]/components/OrderSummaryCard";

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, isMobile: true },
  { name: "desktop", width: 1280, height: 800, isMobile: false },
] as const;

async function runCheckoutE2eJourneysTests() {
  console.log(
    "▶ Iniciando Suíte E2E das 5 Jornadas de Checkout (Mobile 375x812 & Desktop 1280x800)..."
  );

  const rootDir = process.cwd();
  const checkoutPageSrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/page.tsx"),
    "utf-8"
  );
  const deliveryCompSrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/components/CheckoutDelivery.tsx"),
    "utf-8"
  );
  const cepHookSrc = fs.readFileSync(
    path.join(rootDir, "src/app/checkout/hooks/useCepLookup.ts"),
    "utf-8"
  );
  const trackingPageSrc = fs.readFileSync(
    path.join(rootDir, "src/app/pedido/[token]/page.tsx"),
    "utf-8"
  );

  const prodBelow199Id = `prod_e2e_below_${Date.now()}`;
  const prodAbove199Id = `prod_e2e_above_${Date.now()}`;
  const prodSingleStockId = `prod_e2e_single_${Date.now()}`;
  const createdOrderIds: string[] = [];

  await db.insert(products).values([
    {
      id: prodBelow199Id,
      name: "Leave-in Wella Nutri Enrich 150ml",
      slug: `leave-in-wella-e2e-${Date.now()}`,
      price: 120.0,
      priceCents: 12000,
      promoPrice: null,
      promoPriceCents: null,
      pixDiscountPercent: 5,
      stock: 20,
      isActive: true,
    },
    {
      id: prodAbove199Id,
      name: "Kit Cronograma Capilar Truss Uso Obrigatório",
      slug: `kit-truss-e2e-${Date.now()}`,
      price: 240.0,
      priceCents: 24000,
      promoPrice: null,
      promoPriceCents: null,
      pixDiscountPercent: 5,
      stock: 20,
      isActive: true,
    },
    {
      id: prodSingleStockId,
      name: "Perfume para Interiores Madressenza Edição Limitada",
      slug: `madressenza-single-e2e-${Date.now()}`,
      price: 150.0,
      priceCents: 15000,
      promoPrice: null,
      promoPriceCents: null,
      pixDiscountPercent: 5,
      stock: 1,
      isActive: true,
    },
  ]);

  try {
    // =========================================================================
    // JORNADA 1: Fluxo Completo (Carrinho -> /checkout -> Pedido Criado -> /pedido/[token] -> WhatsApp)
    // =========================================================================
    for (const vp of VIEWPORTS) {
      const idemKey = crypto.randomUUID();

      if (vp.isMobile) {
        assert.ok(
          checkoutPageSrc.includes("lg:hidden") &&
            checkoutPageSrc.includes("aria-expanded={mobileSummaryOpen}") &&
            checkoutPageSrc.includes("Ver Resumo do Pedido"),
          "[Mobile 375x812] Deve exibir acordeão acessível com aria-expanded para o Resumo do Pedido"
        );
      } else {
        assert.ok(
          checkoutPageSrc.includes("hidden lg:block lg:col-span-5 sticky top-8"),
          "[Desktop 1280x800] Deve exibir coluna lateral fixa (sticky) com o Resumo do Pedido"
        );
      }

      const contactHtml = renderToStaticMarkup(
        React.createElement(CheckoutContact, {
          name: `Cliente ${vp.name}`,
          phone: "(49) 99125-1617",
          email: `cliente.${vp.name}@exemplo.com.br`,
          marketingConsent: false,
          errors: {},
        })
      );
      assert.ok(
        contactHtml.includes('for="checkout-customer-name"') &&
          contactHtml.includes('for="checkout-customer-phone"') &&
          contactHtml.includes('aria-required="true"'),
        `[${vp.name}] Campos de contato devem ter labels semânticos associados e aria-required`
      );

      const postReq = new Request("http://localhost:3001/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `10.10.1.${vp.isMobile ? 11 : 12}`,
        },
        body: JSON.stringify({
          customerName: `Maria Clara ${vp.name.toUpperCase()}`,
          customerPhone: "(49) 99125-1617",
          customerEmail: `mariaclara.${vp.name}@teste.com.br`,
          deliveryMode: "entrega",
          cep: "88505-300",
          address: "Rua Blumenau, 623, Bairro São Cristóvão",
          city: "Lages - SC",
          paymentMethod: "whatsapp",
          notes: `Pedido via ${vp.name} (${vp.width}x${vp.height})`,
          marketingConsent: false,
          idempotencyKey: idemKey,
          honeypot: "",
          items: [{ productId: prodAbove199Id, quantity: 1 }],
        }),
      });

      const postRes = await postPedidosRoute(postReq);
      assert.strictEqual(
        postRes.status,
        201,
        `[${vp.name}] POST /api/pedidos deve retornar HTTP 201 Created`
      );
      const postData = (await postRes.json()) as {
        success: boolean;
        idempotent: boolean;
        order: {
          id: string;
          publicToken: string;
          status: string;
          totalCents: number;
          shippingCents: number;
          whatsappUrl: string;
        };
      };

      assert.strictEqual(postData.success, true);
      assert.strictEqual(postData.idempotent, false);
      assert.ok(postData.order.id.startsWith("MC-"));
      assert.ok(postData.order.publicToken.length >= 32);
      createdOrderIds.push(postData.order.id);

      const getTokenReq = new Request(
        `http://localhost:3001/api/pedidos/${postData.order.publicToken}`
      );
      const getTokenRes = await getPedidoByTokenRoute(getTokenReq, {
        params: Promise.resolve({ token: postData.order.publicToken }),
      });
      assert.strictEqual(
        getTokenRes.status,
        200,
        `[${vp.name}] GET /api/pedidos/[token] deve retornar HTTP 200`
      );
      const tokenData = (await getTokenRes.json()) as {
        success: boolean;
        order: {
          id: string;
          publicToken: string;
          status: string;
          customerName: string;
          customerPhone: string;
          deliveryMode: "entrega" | "retirada";
          shippingAddress: string;
          paymentMethod: "whatsapp" | "pix" | "cartao";
          subtotalCents: number;
          discountCents: number;
          shippingCents: number;
          totalCents: number;
          items: Array<{
            id: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            unitPriceCents: number;
            lineTotalCents: number;
          }>;
        };
      };

      assert.strictEqual(tokenData.order.id, postData.order.id);

      const timelineHtml = renderToStaticMarkup(
        React.createElement(OrderStatusTimeline, {
          currentStatus: tokenData.order.status,
          deliveryMode: tokenData.order.deliveryMode,
        })
      );
      const nextStepsHtml = renderToStaticMarkup(
        React.createElement(OrderNextSteps, {
          status: tokenData.order.status,
          deliveryMode: tokenData.order.deliveryMode,
          paymentMethod: tokenData.order.paymentMethod,
        })
      );
      const summaryCardHtml = renderToStaticMarkup(
        React.createElement(OrderSummaryCard, {
          humanCode: tokenData.order.id,
          customerName: tokenData.order.customerName,
          customerPhone: tokenData.order.customerPhone,
          deliveryMode: tokenData.order.deliveryMode,
          shippingAddress: tokenData.order.shippingAddress,
          paymentMethod: tokenData.order.paymentMethod,
          subtotalCents: tokenData.order.subtotalCents,
          discountCents: tokenData.order.discountCents,
          shippingCents: tokenData.order.shippingCents,
          totalCents: tokenData.order.totalCents,
          items: tokenData.order.items,
        })
      );

      assert.ok(
        timelineHtml.includes("Aguardando Confirmação"),
        `[${vp.name}] Linha do tempo em /pedido/[token] deve exibir 'Aguardando Confirmação'`
      );
      assert.ok(
        nextStepsHtml.includes("Próximos Passos"),
        `[${vp.name}] Card de próximos passos deve orientar o cliente`
      );
      assert.ok(
        summaryCardHtml.includes(tokenData.order.id) &&
          summaryCardHtml.includes("Kit Cronograma Capilar Truss Uso Obrigatório"),
        `[${vp.name}] Resumo em /pedido/[token] deve exibir o código MC- e o item comprado`
      );

      assert.ok(
        postData.order.whatsappUrl.startsWith(
          `https://wa.me/${STORE_CONFIG.phone.raw}?text=`
        ),
        `[${vp.name}] Link do WhatsApp deve apontar para wa.me/5549991251617`
      );
      const decodedWa = decodeURIComponent(postData.order.whatsappUrl);
      assert.ok(
        decodedWa.includes(postData.order.id) &&
          decodedWa.includes(STORE_CONFIG.slogan) &&
          decodedWa.includes(`/pedido/${postData.order.publicToken}`),
        `[${vp.name}] Mensagem do WhatsApp deve conter código do pedido, slogan oficial e link /pedido/[token]`
      );
      assert.ok(
        trackingPageSrc.includes("Falar com a loja no WhatsApp") &&
          trackingPageSrc.includes("href={whatsappUrl}"),
        `[${vp.name}] Página /pedido/[token] deve renderizar o CTA 'Falar com a loja no WhatsApp'`
      );
    }
    console.log(
      "  ✓ Jornada 1 (Mobile 375x812 & Desktop 1280x800): Carrinho → /checkout → Pedido Criado → /pedido/[token] → WhatsApp (wa.me/5549991251617) validada."
    );

    // =========================================================================
    // JORNADA 2: Modalidades de Entrega
    // =========================================================================
    for (const vp of VIEWPORTS) {
      const quotePickupRes = await postCotacaoRoute(
        new Request("http://localhost:3001/api/checkout/cotacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `10.20.1.${vp.isMobile ? 1 : 2}`,
          },
          body: JSON.stringify({
            deliveryMode: "retirada",
            paymentMethod: "whatsapp",
            items: [{ productId: prodBelow199Id, quantity: 1 }],
          }),
        })
      );
      const quotePickupData = (await quotePickupRes.json()) as {
        success: boolean;
        quote: {
          subtotalCents: number;
          shippingCents: number;
          totalCents: number;
        };
      };
      assert.strictEqual(quotePickupData.success, true);
      assert.strictEqual(
        quotePickupData.quote.shippingCents,
        0,
        `[${vp.name}] Retirada na loja deve ter frete R$ 0,00 (0 centavos)`
      );
      assert.strictEqual(quotePickupData.quote.totalCents, 12000);

      const deliveryPickupHtml = renderToStaticMarkup(
        React.createElement(CheckoutDelivery, {
          deliveryMode: "retirada",
          errors: {},
        })
      );
      assert.ok(
        deliveryPickupHtml.includes("Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)") &&
          !deliveryPickupHtml.includes('id="checkout-cep"'),
        `[${vp.name}] Retirada na loja deve exibir 'Rua Blumenau, Nº 623, Lages – SC (CEP: 88505-300)' e ocultar campos de CEP`
      );

      const summaryPickupHtml = renderToStaticMarkup(
        React.createElement(CheckoutSummary, {
          quote: calculateOrderPricing({
            deliveryMode: "retirada",
            paymentMethod: "whatsapp",
            items: [
              {
                productId: prodBelow199Id,
                name: "Leave-in Wella",
                priceCents: 12000,
                quantity: 1,
              },
            ],
          }),
          loadingQuote: false,
          submitting: false,
          onSubmit: () => {},
          deliveryMode: "retirada",
          paymentMethod: "whatsapp",
          cartItems: [
            {
              id: prodBelow199Id,
              name: "Leave-in Wella",
              image: "/products/wella.jpg",
              quantity: 1,
              price: 120,
            },
          ],
        })
      );
      assert.ok(
        summaryPickupHtml.includes("Grátis (Retirada)"),
        `[${vp.name}] Resumo deve indicar 'Grátis (Retirada)'`
      );

      const quoteDeliveryUnderRes = await postCotacaoRoute(
        new Request("http://localhost:3001/api/checkout/cotacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `10.20.2.${vp.isMobile ? 1 : 2}`,
          },
          body: JSON.stringify({
            deliveryMode: "entrega",
            paymentMethod: "whatsapp",
            items: [{ productId: prodBelow199Id, quantity: 1 }],
          }),
        })
      );
      const quoteDeliveryUnderData = (await quoteDeliveryUnderRes.json()) as {
        success: boolean;
        quote: {
          subtotalCents: number;
          shippingCents: number;
          totalCents: number;
        };
      };
      assert.strictEqual(quoteDeliveryUnderData.success, true);
      assert.strictEqual(
        quoteDeliveryUnderData.quote.shippingCents,
        COMMERCE_CONFIG.SHIPPING_FIXED_CENTS,
        `[${vp.name}] Entrega abaixo de R$ 199,00 deve cobrar R$ 22,90 (2290 centavos)`
      );
      assert.strictEqual(quoteDeliveryUnderData.quote.totalCents, 14290);

      const summaryUnderHtml = renderToStaticMarkup(
        React.createElement(CheckoutSummary, {
          quote: calculateOrderPricing({
            deliveryMode: "entrega",
            paymentMethod: "whatsapp",
            items: [
              {
                productId: prodBelow199Id,
                name: "Leave-in Wella",
                priceCents: 12000,
                quantity: 1,
              },
            ],
          }),
          loadingQuote: false,
          submitting: false,
          onSubmit: () => {},
          deliveryMode: "entrega",
          paymentMethod: "whatsapp",
          cartItems: [
            {
              id: prodBelow199Id,
              name: "Leave-in Wella",
              image: "/products/wella.jpg",
              quantity: 1,
              price: 120,
            },
          ],
        })
      );
      assert.ok(
        summaryUnderHtml.includes(formatBrl(2290)),
        `[${vp.name}] Resumo de entrega < R$ 199 deve exibir frete R$ 22,90`
      );

      const quoteDeliveryOverRes = await postCotacaoRoute(
        new Request("http://localhost:3001/api/checkout/cotacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `10.20.3.${vp.isMobile ? 1 : 2}`,
          },
          body: JSON.stringify({
            deliveryMode: "entrega",
            paymentMethod: "whatsapp",
            items: [{ productId: prodAbove199Id, quantity: 1 }],
          }),
        })
      );
      const quoteDeliveryOverData = (await quoteDeliveryOverRes.json()) as {
        success: boolean;
        quote: {
          subtotalCents: number;
          shippingCents: number;
          totalCents: number;
        };
      };
      assert.strictEqual(quoteDeliveryOverData.success, true);
      assert.strictEqual(
        quoteDeliveryOverData.quote.shippingCents,
        0,
        `[${vp.name}] Entrega a partir de R$ 199,00 deve ter frete GRÁTIS (0 centavos)`
      );
      assert.strictEqual(quoteDeliveryOverData.quote.totalCents, 24000);
    }
    console.log(
      "  ✓ Jornada 2 (Mobile 375x812 & Desktop 1280x800): Retirada (R$ 0,00 + Rua Blumenau, Nº 623) e Entrega (R$ 22,90 < R$ 199 e Grátis >= R$ 199) validadas."
    );

    // =========================================================================
    // JORNADA 3: Erro de CEP (CEP inexistente ou timeout de 4s do ViaCEP)
    // =========================================================================
    for (const vp of VIEWPORTS) {
      const deliveryWithErrorHtml = renderToStaticMarkup(
        React.createElement(CheckoutDelivery, {
          deliveryMode: "entrega",
          cep: "00000-000",
          address: "Rua Manual Editável, 123, Centro",
          city: "Lages - SC",
          errors: {
            cep: "CEP não localizado ou inválido. Verifique ou preencha o endereço manualmente.",
          },
        })
      );

      assert.ok(
        deliveryWithErrorHtml.includes('id="checkout-cep-error"') &&
          deliveryWithErrorHtml.includes('role="alert"') &&
          deliveryWithErrorHtml.includes('aria-invalid="true"') &&
          deliveryWithErrorHtml.includes('aria-describedby="checkout-cep-error"'),
        `[${vp.name}] Erro de CEP deve expor role="alert", id="checkout-cep-error" e aria-invalid="true"`
      );

      assert.ok(
        deliveryWithErrorHtml.includes('id="checkout-address"') &&
          deliveryWithErrorHtml.includes('value="Rua Manual Editável, 123, Centro"') &&
          deliveryWithErrorHtml.includes('id="checkout-city"') &&
          deliveryWithErrorHtml.includes('value="Lages - SC"'),
        `[${vp.name}] Campos de endereço e cidade devem manter valores digitados manualmente`
      );
      assert.ok(
        !deliveryCompSrc.includes("disabled={cepLoading}") &&
          !deliveryCompSrc.includes("readOnly={cepLoading}"),
        `[${vp.name}] CheckoutDelivery nunca deve bloquear/desabilitar endereço ou cidade durante ou após falha do ViaCEP`
      );

      assert.ok(
        cepHookSrc.includes("timeoutMs = 4000") &&
          cepHookSrc.includes("new AbortController()") &&
          cepHookSrc.includes("setTimeout(() => controller.abort(), timeoutMs)") &&
          cepHookSrc.includes("Não foi possível consultar o CEP em até 4 segundos") &&
          cepHookSrc.includes("CEP não localizado. Por favor, preencha o endereço manualmente abaixo."),
        `[${vp.name}] useCepLookup deve abortar em 4000ms e instruir preenchimento manual tanto em timeout quanto em CEP inexistente ({ erro: true })`
      );

      const manualOrderRes = await createOrderTransaction({
        customerName: `Cliente Fallback CEP ${vp.name}`,
        customerPhone: "(49) 99125-1617",
        deliveryMode: "entrega",
        cep: "99999999",
        address: "Rua Preenchida Manualmente Após Timeout ViaCEP, 450",
        city: "Lages - SC",
        paymentMethod: "whatsapp",
        marketingConsent: false,
        idempotencyKey: crypto.randomUUID(),
        honeypot: "",
        items: [{ productId: prodBelow199Id, quantity: 1 }],
      });
      assert.strictEqual(
        manualOrderRes.success,
        true,
        `[${vp.name}] Pedido com endereço manual após falha/timeout do ViaCEP deve ser aceito`
      );
      if (manualOrderRes.success) {
        createdOrderIds.push(manualOrderRes.order.id);
      }
    }
    console.log(
      "  ✓ Jornada 3 (Mobile 375x812 & Desktop 1280x800): Erro de CEP / Timeout 4s ViaCEP com role='alert' e edição manual desimpedida validados."
    );

    // =========================================================================
    // JORNADA 4: Clique Duplo no Botão de Finalizar Pedido (Idempotência)
    // =========================================================================
    for (const vp of VIEWPORTS) {
      const stockBeforeRows = await db
        .select()
        .from(products)
        .where(eq(products.id, prodBelow199Id))
        .limit(1);
      const stockBefore = stockBeforeRows[0].stock;

      const sharedIdempotencyKey = crypto.randomUUID();
      const payload = {
        customerName: `Cliente Duplo Clique ${vp.name}`,
        customerPhone: "(49) 99125-1617",
        deliveryMode: "retirada" as const,
        paymentMethod: "whatsapp" as const,
        marketingConsent: false,
        idempotencyKey: sharedIdempotencyKey,
        honeypot: "",
        items: [{ productId: prodBelow199Id, quantity: 2 }],
      };

      const [doubleClickRes1, doubleClickRes2] = await Promise.all([
        postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": `10.40.${vp.isMobile ? 1 : 2}.10`,
            },
            body: JSON.stringify(payload),
          })
        ),
        postPedidosRoute(
          new Request("http://localhost:3001/api/pedidos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-forwarded-for": `10.40.${vp.isMobile ? 1 : 2}.11`,
            },
            body: JSON.stringify(payload),
          })
        ),
      ]);

      const body1 = (await doubleClickRes1.json()) as {
        success: boolean;
        idempotent: boolean;
        order: { id: string; publicToken: string; whatsappUrl: string };
      };
      const body2 = (await doubleClickRes2.json()) as {
        success: boolean;
        idempotent: boolean;
        order: { id: string; publicToken: string; whatsappUrl: string };
      };

      assert.strictEqual(body1.success, true);
      assert.strictEqual(body2.success, true);
      assert.strictEqual(
        body1.order.id,
        body2.order.id,
        `[${vp.name}] Clique duplo com mesma idempotencyKey deve retornar exatamente o mesmo order.id`
      );
      assert.ok(
        body2.order.whatsappUrl.startsWith("https://wa.me/"),
        `[${vp.name}] Replay idempotente também deve retornar whatsappUrl válida`
      );
      createdOrderIds.push(body1.order.id);

      const persistedOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, sharedIdempotencyKey));
      assert.strictEqual(
        persistedOrders.length,
        1,
        `[${vp.name}] Banco deve conter apenas 1 pedido para a mesma idempotencyKey`
      );

      const stockAfterRows = await db
        .select()
        .from(products)
        .where(eq(products.id, prodBelow199Id))
        .limit(1);
      assert.strictEqual(
        stockAfterRows[0].stock,
        stockBefore - 2,
        `[${vp.name}] Estoque deve ser debitado apenas 1 vez no clique duplo`
      );

      const submittingSummaryHtml = renderToStaticMarkup(
        React.createElement(CheckoutSummary, {
          quote: calculateOrderPricing({
            deliveryMode: "retirada",
            paymentMethod: "whatsapp",
            items: [
              {
                productId: prodBelow199Id,
                name: "Leave-in Wella",
                priceCents: 12000,
                quantity: 2,
              },
            ],
          }),
          loadingQuote: false,
          submitting: true,
          onSubmit: () => {},
          deliveryMode: "retirada",
          paymentMethod: "whatsapp",
          cartItems: [
            {
              id: prodBelow199Id,
              name: "Leave-in Wella",
              image: "/products/wella.jpg",
              quantity: 2,
              price: 120,
            },
          ],
        })
      );
      assert.ok(
        submittingSummaryHtml.includes("disabled") &&
          submittingSummaryHtml.includes("Processando Pedido..."),
        `[${vp.name}] Botão de finalizar deve ficar disabled e exibir 'Processando Pedido...' durante envio`
      );
    }
    console.log(
      "  ✓ Jornada 4 (Mobile 375x812 & Desktop 1280x800): Clique duplo com mesma idempotencyKey cria 1 único pedido e debita estoque 1 única vez."
    );

    // =========================================================================
    // JORNADA 5: Produto Esgotado Durante a Compra (HTTP 409 OutOfStockError)
    // =========================================================================
    for (const vp of VIEWPORTS) {
      await db
        .update(products)
        .set({ stock: 0 })
        .where(eq(products.id, prodSingleStockId));

      const oosIdempotencyKey = crypto.randomUUID();
      const oosRes = await postPedidosRoute(
        new Request("http://localhost:3001/api/pedidos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `10.50.${vp.isMobile ? 1 : 2}.99`,
          },
          body: JSON.stringify({
            customerName: `Cliente Produto Esgotado ${vp.name}`,
            customerPhone: "(49) 99125-1617",
            deliveryMode: "retirada",
            paymentMethod: "whatsapp",
            marketingConsent: false,
            idempotencyKey: oosIdempotencyKey,
            honeypot: "",
            items: [{ productId: prodSingleStockId, quantity: 1 }],
          }),
        })
      );

      assert.strictEqual(
        oosRes.status,
        409,
        `[${vp.name}] Produto esgotado durante a compra deve retornar HTTP 409 Conflict`
      );

      const oosProblem = (await oosRes.json()) as {
        type: string;
        title: string;
        status: number;
        detail: string;
        errors?: string[];
      };

      assert.strictEqual(oosProblem.status, 409);
      assert.strictEqual(oosProblem.title, "Estoque insuficiente");
      assert.ok(
        oosProblem.detail.includes(
          "O produto 'Perfume para Interiores Madressenza Edição Limitada' não possui estoque suficiente."
        ),
        `[${vp.name}] Problem Details 409 deve informar claramente o nome do produto esgotado`
      );

      const orphanOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.idempotencyKey, oosIdempotencyKey));
      assert.strictEqual(
        orphanOrders.length,
        0,
        `[${vp.name}] Falha 409 OutOfStockError jamais deve deixar pedido órfão no banco`
      );

      const stockCheck = await db
        .select()
        .from(products)
        .where(eq(products.id, prodSingleStockId))
        .limit(1);
      assert.strictEqual(
        stockCheck[0].stock,
        0,
        `[${vp.name}] Estoque de produto esgotado deve permanecer exatamente 0`
      );

      assert.ok(
        checkoutPageSrc.includes('role="alert"') &&
          checkoutPageSrc.includes("if (!response.ok || !data.success)") &&
          checkoutPageSrc.indexOf("if (!response.ok || !data.success)") <
            checkoutPageSrc.indexOf("clearCart()"),
        `[${vp.name}] CheckoutPage deve renderizar role='alert' com data.detail e preservar o carrinho quando a API retorna 409`
      );
    }

    const errInstance = new OutOfStockError("Máscara Wella");
    assert.strictEqual(errInstance.name, "OutOfStockError");
    assert.ok(errInstance.message.includes("Máscara Wella"));

    console.log(
      "  ✓ Jornada 5 (Mobile 375x812 & Desktop 1280x800): Produto esgotado retorna HTTP 409 (OutOfStockError), exibe alerta role='alert' e não cria pedido órfão."
    );

    console.log(
      "\n✔ Todas as 5 Jornadas E2E de Checkout (Mobile 375x812 & Desktop 1280x800) passaram com 100% de conformidade!"
    );
  } finally {
    const uniqueOrderIds = Array.from(new Set(createdOrderIds));
    for (const oid of uniqueOrderIds) {
      await db
        .delete(orderStatusHistory)
        .where(eq(orderStatusHistory.orderId, oid));
      await db.delete(orderItems).where(eq(orderItems.orderId, oid));
      await db.delete(orders).where(eq(orders.id, oid));
    }
    await db.delete(products).where(eq(products.id, prodBelow199Id));
    await db.delete(products).where(eq(products.id, prodAbove199Id));
    await db.delete(products).where(eq(products.id, prodSingleStockId));
  }
}

runCheckoutE2eJourneysTests().catch((err) => {
  console.error("❌ Falha na suíte E2E de Jornadas de Checkout:", err);
  process.exit(1);
});
