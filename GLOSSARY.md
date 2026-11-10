# Mariane Cosméticos — E-commerce & Pedidos

Contexto de vendas digitais, vitrine de cosméticos profissionais, sacola de compras, cotação financeira, finalização de pedidos, reserva de estoque, conciliação de pagamentos e conformidade com proteção de dados da loja física e online **Mariane Cosméticos** (Lages – SC).

## Catálogo & Precificação

**Product (Produto)**:
Item cosmético oficial disponível para comercialização no catálogo da loja, identificado por nome, marca, volume e disponibilidade física em estoque.
_Avoid_: SKU, Goods, Mercadoria, Artigo

**Catalog Price (Preço de Tabela)**:
Valor monetário padrão de venda unitária de um Produto quando nenhuma campanha promocional está ativa.
_Avoid_: Base price, Raw price, Preço cheio, Preço original

**Promotional Price (Preço Promocional)**:
Valor monetário reduzido temporariamente vigente para um Produto, que substitui o Preço de Tabela sempre que for positivo e estritamente inferior a este.
_Avoid_: Sale price, Discounted price, Preço com desconto, Oferta

**PIX Discount (Desconto PIX)**:
Abatimento percentual concedido sobre o valor de cada item do pedido exclusivamente quando a modalidade de pagamento escolhida pela Titular é transferência instantânea via PIX.
_Avoid_: Cash discount, Rebate, Desconto à vista, Cupom PIX

**Order Quote (Cotação do Pedido)**:
Cálculo oficial e autoritativo do subtotal dos itens, custo de frete, Desconto PIX aplicável e valor total líquido a pagar antes da confirmação do Pedido.
_Avoid_: Cart estimate, Price calculation, Orçamento, Simulação de carrinho

## Sacola & Finalização (Checkout)

**Shopping Bag (Sacola de Compras)**:
Seleção temporária de Produtos e respectivas quantidades mantida pela cliente durante a navegação antes de iniciar a finalização do Pedido.
_Avoid_: Cart, Basket, Carrinho de compras, Cesta

**Order (Pedido)**:
Compromisso formal de compra registrado pela Titular contendo os itens adquiridos com preços congelados no ato da confirmação, modalidade de entrega, meio de pagamento e endereço de destino.
_Avoid_: Purchase, Transaction, Sale, Compra, Venda

**Order Line Item (Item do Pedido)**:
Registro imutável de um Produto específico dentro de um Pedido confirmado, preservando nome, quantidade comprada, preço unitário vigente no momento da compra e subtotal da linha.
_Avoid_: Cart item, Product row, Linha da compra

**Human Order Code (Código Humano do Pedido)**:
Identificador curto e legível (`MC-AAAAMMDD-XXXXXX`) utilizado no atendimento via WhatsApp, em comprovantes e na operação interna da lojista.
_Avoid_: Order ID, Internal ID, Reference number, Número do protocolo

**Public Order Token (Token Público do Pedido)**:
Credencial opaca de alta entropia que autoriza a consulta pública segura do andamento de um Pedido sem expor pedidos de terceiros a enumeração.
_Avoid_: Tracking code, Secret link, Order hash, Código de rastreio

**Idempotency Key (Chave de Idempotência)**:
Identificador único da intenção de finalização de compra que garante que cliques repetidos ou reenvios de rede produzam exatamente um único Pedido.
_Avoid_: Request ID, Deduplication token, Nonce de sessão

**Delivery Mode (Modalidade de Entrega)**:
Forma escolhida pela cliente para recebimento dos Produtos do Pedido, restrita a Entrega em Domicílio (`entrega`) ou Retirada na Loja Física (`retirada`).
_Avoid_: Shipping type, Fulfillment method, Tipo de frete

## Ciclo de Vida, Estoque & Pagamento

**Order Status (Status do Pedido)**:
Etapa formal e estrita em que um Pedido se encontra dentro do seu ciclo de vida operacional (`aguardando_confirmacao`, `aguardando_pagamento`, `pago`, `em_separacao`, `enviado`, `pronto_para_retirada`, `entregue`, `cancelado`, `expirado`).
_Avoid_: Order state, Stage, Situação, Fase

**Status Transition (Transição de Status)**:
Mudança auditada de um Status do Pedido para outro estado subsequente permitido pelas regras de negócio, registrando autor, data/hora e justificativa.
_Avoid_: Status update, State change, Troca de situação

**Stock Reservation (Reserva de Estoque)**:
Dedução imediata e atômica das unidades disponíveis de um Produto no ato da criação do Pedido, garantindo que nenhuma unidade física seja vendida em duplicidade.
_Avoid_: Inventory lock, Hold, Bloqueio de saldo

**Lazy Expiration (Expiração Preguiçosa)**:
Política de vencimento que identifica Pedidos pendentes não pagos após o prazo limite de 24 horas no momento em que são consultados, transicionando-os para `expirado` e restituindo o estoque reservado.
_Avoid_: Cron cancellation, Auto-delete, Limpeza agendada

**Payment Confirmation (Confirmação de Pagamento)**:
Atestado emitido pelo meio de pagamento ou pela lojista de que o valor integral exato do Pedido foi recebido, autorizando o avanço para separação.
_Avoid_: Webhook event, Settlement, Baixa financeira

## Privacidade & Proteção de Dados (LGPD)

**Data Subject / Titular (Titular dos Dados)**:
Pessoa natural (cliente ou visitante da Mariane Cosméticos) a quem se referem os dados pessoais objeto de tratamento durante a navegação, compra e pós-venda.
_Avoid_: User, Client, Account, Usuário, Conta

**Contractual Execution (Execução de Contrato)**:
Base legal (Art. 7º, V da LGPD) que legitima o tratamento dos dados pessoais estritamente indispensáveis (nome, telefone, endereço de entrega) para processar, cobrar e entregar o Pedido solicitado pela Titular, sem depender de consentimento.
_Avoid_: Implied consent, Purchase consent, Aceite de termos, Consentimento obrigatório

**Marketing Consent (Consentimento de Marketing)**:
Manifestação livre, informada, inequívoca e desmarcada por padrão (Art. 7º, I e Art. 8º da LGPD) pela qual a Titular autoriza opcionalmente o envio de promoções e novidades pela loja.
_Avoid_: LGPD checkbox, Terms acceptance, Opt-out de promoções
