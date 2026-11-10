# Execução de Contrato (Art. 7º, V) vs. Consentimento Granular de Marketing na LGPD

Status: accepted

O checkout legado inicializava um checkbox de consentimento LGPD como `useState(true)` e bloqueava a compra se desmarcado, violando o Art. 8º (vedação ao consentimento pré-assinalado ou coagido) e enquadrando erroneamente a compra sob a base de Consentimento. Decidimos fundamentar o tratamento dos dados cadastrais e de entrega do Pedido na base legal de **Execução de Contrato** (Art. 7º, V da Lei 13.709/2018) e **Obrigação Legal** fiscal/CDC (Art. 7º, II), mantendo no checkout apenas um checkbox opcional e desmarcado por padrão (`marketingConsent = false`) exclusivo para comunicações promocionais (Art. 7º, I).
