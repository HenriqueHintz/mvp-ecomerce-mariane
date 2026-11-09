import {
  OrderStatus,
  canTransition,
  validateTransition,
  isRestockStatus,
  ALLOWED_STATUS_TRANSITIONS,
} from "../../src/lib/order-state-machine";

console.log("▶ Iniciando testes da máquina de estados monotônica...");

// 1. Transições Válidas
if (!canTransition("aguardando_confirmacao", "pago")) throw new Error("aguardando_confirmacao -> pago deve ser válida");
if (!canTransition("aguardando_confirmacao", "cancelado")) throw new Error("aguardando_confirmacao -> cancelado deve ser válida");
if (!canTransition("aguardando_confirmacao", "expirado")) throw new Error("aguardando_confirmacao -> expirado deve ser válida");

if (!canTransition("aguardando_pagamento", "pago")) throw new Error("aguardando_pagamento -> pago deve ser válida");
if (!canTransition("pago", "em_separacao")) throw new Error("pago -> em_separacao deve ser válida");
if (!canTransition("em_separacao", "enviado")) throw new Error("em_separacao -> enviado deve ser válida");
if (!canTransition("em_separacao", "pronto_para_retirada")) throw new Error("em_separacao -> pronto_para_retirada deve ser válida");
if (!canTransition("enviado", "entregue")) throw new Error("enviado -> entregue deve ser válida");
if (!canTransition("pronto_para_retirada", "entregue")) throw new Error("pronto_para_retirada -> entregue deve ser válida");

// 2. Transições Inválidas (Regressões Iilegais)
if (canTransition("cancelado", "pago")) throw new Error("cancelado -> pago NÃO pode ser permitida");
if (canTransition("expirado", "pago")) throw new Error("expirado -> pago NÃO pode ser permitida");
if (canTransition("entregue", "cancelado")) throw new Error("entregue -> cancelado NÃO pode ser permitida");
if (canTransition("pago", "aguardando_pagamento")) throw new Error("pago -> aguardando_pagamento NÃO pode ser permitida");
if (canTransition("em_separacao", "aguardando_confirmacao")) throw new Error("em_separacao -> aguardando_confirmacao NÃO pode ser permitida");

// 3. validateTransition deve disparar exceção em transição ilegal
let threw = false;
try {
  validateTransition("cancelado", "em_separacao");
} catch {
  threw = true;
}
if (!threw) throw new Error("validateTransition deveria ter lançado erro em transição ilegal");

// 4. Verificação de estados de liberação de estoque (restock)
if (!isRestockStatus("cancelado")) throw new Error("cancelado deve ser restock");
if (!isRestockStatus("expirado")) throw new Error("expirado deve ser restock");
if (isRestockStatus("pago")) throw new Error("pago NÃO deve ser restock");
if (isRestockStatus("entregue")) throw new Error("entregue NÃO deve ser restock");

console.log("✔ Todos os testes da máquina de estados passaram com sucesso!");
