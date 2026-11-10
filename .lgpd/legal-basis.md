# Bases Legais por Atividade de Tratamento (LGPD — Art. 7º)

**Última atualização**: 2026-11-09
**Controladora**: Mariane Cosméticos (`Mariane Cosméticos e Perfumaria Ltda`, Lages – SC)

---

## Atividade A001: Processamento, Cobrança e Entrega de Pedidos (Checkout)

- **Finalidade**: Identificar a compradora, calcular o frete, processar o pagamento escolhido (WhatsApp, PIX ou Cartão) e realizar a entrega domiciliar ou disponibilizar para retirada na loja física em Lages – SC (Art. 6º, I).
- **Dados tratados**: Nome completo (`customer_name`), telefone/WhatsApp (`customer_phone`), e-mail opcional (`customer_email`), endereço de entrega e CEP (`shipping_address`), observações do pedido (`notes`), itens e valores do pedido.
- **Sensíveis?**: Não (Art. 5º, II).
- **Base legal**: **Art. 7º, inciso V — Execução de contrato ou de procedimentos preliminares relacionados a contrato do qual seja parte o titular, a pedido do titular dos dados.**
- **Justificativa**: Os dados são estritamente indispensáveis para cumprir a compra iniciada voluntariamente pela titular. Exigir consentimento para processar a compra violaria o Art. 8º e seria inadequado pois a titular não pode revogar unilateralmente os dados de uma transação comercial em andamento sem cancelar o próprio contrato.
- **Retenção**: Durante toda a execução do pedido; após a entrega, conservado por **5 anos** para cumprimento de obrigações fiscais/tributárias e prazo prescricional do Código de Defesa do Consumidor (Art. 27 da Lei 8.078/1990 c/c Art. 16, I da LGPD).
- **Revogação possível?**: Não aplicável à base de execução contratual (cabendo cancelamento do pedido antes do envio, nos termos do Art. 49 do CDC).
- **Última revisão**: 2026-11-09

---

## Atividade A002: Guarda Fiscal, Contábil e Garantia Legal Pós-Venda

- **Finalidade**: Cumprimento de obrigações fiscais, contábeis, tributárias e garantia legal/trocas previstas no Código de Defesa do Consumidor (Art. 6º, I).
- **Dados tratados**: Histórico do pedido (`orders`, `order_items`, `order_status_history`, `payment_webhooks`), nome, telefone e endereço de entrega.
- **Sensíveis?**: Não.
- **Base legal**: **Art. 7º, inciso II — Cumprimento de obrigação legal ou regulatória pelo controlador** (combinado com **Art. 7º, inciso VI — Exercício regular de direitos em processo judicial, administrativo ou arbitral**).
- **Justificativa**: A legislação tributária brasileira (CTN Art. 173/174) e o CDC (Art. 27) exigem a guarda dos registros de transações comerciais por 5 anos.
- **Retenção**: **5 anos** contados da conclusão do pedido (`entregue`). Pedidos `expirado` ou `cancelado` sem pagamento têm PII anonimizada após **90 dias**.
- **Revogação possível?**: Não (prevalece a obrigação legal de retenção — Art. 16, I da LGPD).
- **Última revisão**: 2026-11-09

---

## Atividade A003: Envio de Comunicações Promocionais e Cupons (Marketing)

- **Finalidade**: Enviar novidades, lançamentos de cosméticos e cupons de desconto exclusivos da Mariane Cosméticos via WhatsApp ou e-mail (Art. 6º, I).
- **Dados tratados**: Nome, telefone/WhatsApp, e-mail e flag booleana `marketing_consent` (`0` ou `1`).
- **Sensíveis?**: Não.
- **Base legal**: **Art. 7º, inciso I — Mediante o fornecimento de consentimento pelo titular** (observando estritamente o **Art. 8º** e **Art. 9º, § 2º**).
- **Justificativa**: O envio de mensagens promocionais não é necessário para a execução da compra; portanto, depende de manifestação livre, informada e inequívoca da titular por meio de checkbox opcional e **desmarcado por padrão** (`useState(false)`).
- **Retenção**: Enquanto o consentimento estiver ativo ou até revogação expressa pela titular (opt-out imediato via WhatsApp ou solicitação ao Encarregado), limitada a 24 meses de inatividade.
- **Revogação possível?**: **Sim, a qualquer momento e de forma gratuita e facilitada** (Art. 8º, § 5º e Art. 18, IX da LGPD).
- **Última revisão**: 2026-11-09

---

## Atividade A004: Consulta de Endereço por CEP (Autopreenchimento ViaCEP)

- **Finalidade**: Facilitar o preenchimento de rua, bairro e cidade no checkout a partir do CEP de 8 dígitos informado pela titular (Art. 6º, I).
- **Dados tratados**: Código de Endereçamento Postal (CEP — 8 dígitos numéricos, sem envio de nome ou telefone ao serviço externo).
- **Sensíveis?**: Não.
- **Base legal**: **Art. 7º, inciso V — Procedimentos preliminares relacionados a contrato, a pedido do titular.**
- **Justificativa**: Acionado exclusivamente quando a titular seleciona a modalidade `entrega` e digita os 8 dígitos do CEP. Em caso de indisponibilidade (> 4s), o preenchimento manual é liberado.
- **Retenção**: Efêmero durante o preenchimento do formulário; gravado apenas se o pedido for submetido.
- **Revogação possível?**: N/A (dado efêmero pré-contratual).
- **Última revisão**: 2026-11-09

---

## Atividade A005: Prevenção à Fraude, Abuso Automatizado e Auditoria de Pagamento

- **Finalidade**: Proteger a loja e as titulares contra criação automatizada de pedidos falsos (bots), ataques de força bruta, duplicidade de cobrança e adulteração de webhooks de pagamento (Art. 6º, VII e VIII).
- **Dados tratados**: Endereço IP (em memória para rate limiting), `idempotency_key`, campo honeypot invisível (`website_url`), assinatura HMAC e payload de conciliação em `payment_webhooks`.
- **Sensíveis?**: Não.
- **Base legal**: **Art. 7º, inciso IX — Quando necessário para atender aos interesses legítimos do controlador ou de terceiro** (segurança da informação, prevenção à fraude e integridade transacional, em conformidade com o Art. 10, I e II e Art. 46 da LGPD).
- **Justificativa**: Indispensável para evitar exaustão de estoque por bots, cobrança duplicada e subpagamento fraudulento, utilizando o mínimo de dados (IP retido apenas em janela deslizante em memória de 10–15 minutos).
- **Retenção**: Janela de Rate Limit em memória: **10 a 15 minutos**; logs de conciliação de webhooks de pedidos pagos: **5 anos** (junto ao pedido).
- **Revogação possível?**: Sujeito a oposição em caso de descumprimento da LGPD (Art. 18, § 2º).
- **Última revisão**: 2026-11-09

---

## Atividade A006: Persistência Local da Sacola de Compras (`localStorage`)

- **Finalidade**: Manter os produtos selecionados na Sacola de Compras entre recarregamentos de página até a finalização do pedido (Art. 6º, I).
- **Dados tratados**: Identificadores, nomes, preços e quantidades de produtos na chave `localStorage: mariane_cart` (nenhum dado pessoal cadastral é salvo no `localStorage`).
- **Sensíveis?**: Não.
- **Base legal**: **Art. 7º, inciso V — Procedimentos preliminares relacionados a contrato, a pedido do titular.**
- **Justificativa**: Armazenamento estritamente funcional no dispositivo da própria titular, limpo automaticamente (`clearCart()`) assim que o pedido é confirmado.
- **Retenção**: Local no navegador da titular até a conclusão do pedido ou limpeza manual da sacola.
- **Revogação possível?**: Sim (botão de remover itens / limpar sacola).
- **Última revisão**: 2026-11-09
