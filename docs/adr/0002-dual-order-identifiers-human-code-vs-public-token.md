# Separação entre Código Humano do Pedido e Token Público de 128 Bits

Status: accepted

O sufixo legado de 2 bytes hexadecimais (`MC-AAAAMMDD-XXXX`, 65.536 combinações diárias) exposto na rota aberta `GET /api/pedidos?id=` permitia enumeração sequencial/força bruta de pedidos e vazamento de dados pessoais (IDOR). Decidimos separar a identidade do Pedido em dois identificadores distintos: um **Human Order Code** (`MC-AAAAMMDD-XXXXXX`, 6 caracteres hexadecimais = 16.777.216 combinações/dia) restrito à comunicação humana via WhatsApp e busca autenticada no painel da lojista, e um **Public Order Token** UUID v4 de 128 bits (`public_token`) exigido nas rotas públicas `/pedido/[token]` e `GET /api/pedidos/[token]` com mascaramento de PII.
