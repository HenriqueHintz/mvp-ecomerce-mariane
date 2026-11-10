# Gap Analysis e Plano de Remediação LGPD — 2026-11-09

## Resumo Executivo
- **2 gaps críticos** (exposição de endereço completo no JSON de `/api/pedidos/[token]` e ausência de Runbook formal de Incidentes Res. 15/2024)
- **4 gaps altos** (ROPA Art. 37 não consolidado, Política de Privacidade sem todos os 7 elementos do Art. 9º, retenção/expurgo automatizado de PII não implementado, ausência de Rate Limiting contra abuso nas rotas de pedido)
- **3 gaps médios** (ausência de DPA documentado com operadores, falta de mascaramento do endereço/sobrenome na rota pública `/pedido/[token]`, falta de exportação/consulta DSAR no painel admin)

> **Nota sobre o Problema #7 do Diagnóstico (Consentimento pré-marcado):**
> No código legado, o estado iniciava com `useState(true)` e impedia a compra sem consentimento (violação do Art. 8º e Art. 9º, § 2º da LGPD). No estado atual de `src/app/checkout/page.tsx:29` e `src/app/checkout/components/CheckoutContact.tsx:86-98`, o estado já foi corrigido para `useState(false)` (desmarcado por padrão) e restrito a comunicações promocionais (`marketingConsent`), enquanto a compra opera sob **Execução de Contrato (Art. 7º, V)** `[VERIFICADO]`.

## Matriz de Gaps (Fase 2 — `lgpd-legacy-retrofit`)

| Item | Status | Evidência (`arquivo:linha`) | Severidade | Norma Aplicável |
|---|---|---|---|---|
| Base legal da compra separada de marketing (`marketingConsent`) | GREEN | `src/app/checkout/page.tsx:29`, `CheckoutContact.tsx:86-98` (`useState(false)`) | — | Art. 7º, I e V; Art. 8º LGPD |
| Prevenção de enumeração pública de pedidos (IDOR) | GREEN | `src/app/api/pedidos/route.ts:43-53` (GET por código curto bloqueado; uso de `publicToken` 128 bits) | — | Art. 46 LGPD |
| Mascaramento de telefone e e-mail na consulta pública | GREEN | `src/lib/orders.ts:24-35,429-430` (`maskPiiPhone`, `maskPiiEmail`) | — | Art. 6º, III e VII LGPD |
| Endereço e nome completo expostos no retorno de `getOrderByPublicToken` | RED | `src/lib/orders.ts:427-433` espalha `...order` incluindo `shippingAddress` e `customerName` inteiros sem mascaramento parcial | Crítica | Art. 6º, III (Necessidade/Minimização) e Art. 46 LGPD |
| Página `/pedido/[token]` inexistente (404 após checkout) | RED | `src/app/checkout/page.tsx:184` redireciona para `/pedido/${publicToken}`, mas `src/app/pedido/[token]/page.tsx` ainda não foi criada | Crítica | Art. 6º, IV (Livre Acesso) e VIII (Transparência) |
| Rate Limiting ausente em `/api/pedidos` e `/api/checkout/cotacao` | YELLOW | `src/app/api/pedidos/route.ts` e `src/app/api/checkout/cotacao/route.ts` sem limitador por IP | Alta | Art. 46 e Art. 47 LGPD |
| Política de Privacidade incompleta quanto aos operadores e prazos | YELLOW | `src/app/politica-de-privacidade/page.tsx:1-87` não lista operadores (Asaas, ViaCEP, WhatsApp) nem prazos exatos de retenção (5 anos CDC/CTN vs. 24h expiração) | Alta | Art. 9º, I a VII LGPD |
| Retenção e anonimização de pedidos expirados/cancelados | RED | `src/lib/orders.ts:399-414` expira pedidos após 24h mas mantém PII indefinidamente sem rotina de anonimização após prazo legal | Alta | Art. 15 e Art. 16 LGPD |
| Runbook de Resposta a Incidentes e Log de 5 anos | RED | Ausência de `.lgpd/incidents/runbook.md` e `.lgpd/incidents/log.md` | Crítica | Art. 48 LGPD e Res. CD/ANPD nº 15/2024 (Arts. 6º, 9º e 10) |
| ROPA consolidado (Registro das Operações de Tratamento) | YELLOW | Mapeamento inicial criado em `.lgpd/data-map.md`, pendente consolidação em `.lgpd/ROPA.md` | Alta | Art. 37 LGPD e Res. CD/ANPD nº 2/2022 |
| Canal DSAR / Atendimento ao Titular no Painel Admin | YELLOW | Citado em `/politica-de-privacidade`, mas sem tela `/admin/pedidos` concluída para consulta/exportação/anonimização rápida pela lojista | Média | Art. 18 e Art. 19, II LGPD (15 dias / 30 dias ATPP) |

## Plano de Remediação Priorizado

### Ações Imediatas (Sprint Atual — integradas ao Plano de Implementação)
1. **Minimizar PII em `getOrderByPublicToken` e criar `/pedido/[token]`** (Art. 6º, III e Art. 46):
   - Mascarar `customerName` (exibir apenas primeiro nome + inicial do sobrenome na rota pública) e mascarar `shippingAddress` na resposta pública (`GET /api/pedidos/[token]` e `/pedido/[token]`).
2. **Implementar Rate Limiting por IP nas APIs de Checkout e Pedidos** (Art. 46):
   - Máximo 5 pedidos por IP a cada 10 minutos em `POST /api/pedidos` e 30 cotações por minuto em `POST /api/checkout/cotacao`.
3. **Atualizar `/politica-de-privacidade` com os 7 requisitos do Art. 9º da LGPD**:
   - Incluir finalidade detalhada, bases legais (Art. 7º, I, II, V e IX), identificação da controladora e canal do Encarregado (Res. 18/2024), compartilhamento com operadores (WhatsApp/Meta, Asaas, ViaCEP) e prazos de retenção (Art. 16).
4. **Concluir Painel Admin (`/admin/pedidos`) com autenticação HMAC e proteção contra CSV Injection**:
   - Permitir que a lojista localize pedidos por código ou telefone do titular para atender solicitações do Art. 18 (DSAR) e exporte CSV sanitizado.

### Próximas 2–4 Semanas (Governança Documental `.lgpd/`)
5. Consolidar `.lgpd/ROPA.md` (Art. 37) e `.lgpd/incidents/runbook.md` (Res. CD/ANPD nº 15/2024 — prazo de 3 dias úteis / 6 dias úteis para ATPP).
6. Documentar avaliação de operadores e transferência internacional em `.lgpd/vendors/` e `.lgpd/transfers/` (WhatsApp/Meta e Cloudflare — Res. CD/ANPD nº 19/2024).
7. Implementar rotina de anonimização automática de PII em pedidos com status `expirado` ou `cancelado` após 90 dias (Art. 16).
