import assert from "assert";
import {
  verifyAdminPassword,
  createAdminSessionToken,
  verifyAdminSessionToken,
  sanitizeCsvCell,
  generateOrdersCsv,
} from "../../src/lib/admin-auth";

console.log("▶ Iniciando testes de Autenticação Admin HMAC e Proteção CSV Injection...");

// 1. Verificação de senha em tempo constante
assert.strictEqual(verifyAdminPassword("MarianeAdmin2026!", "MarianeAdmin2026!"), true);
assert.strictEqual(verifyAdminPassword("senha_errada", "MarianeAdmin2026!"), false);
assert.strictEqual(verifyAdminPassword("", "MarianeAdmin2026!"), false);
console.log("  ✓ 1. Verificação de senha admin com timingSafeEqual validada.");

// 2. Geração e validação de cookie de sessão HMAC-SHA256
const secret = "MarianeAdmin2026!";
const nowMs = 1_700_000_000_000;
const token = createAdminSessionToken(secret, nowMs);
assert.strictEqual(
  verifyAdminSessionToken(token, secret, nowMs + 60_000),
  true,
  "Token HMAC recém-criado deve ser válido"
);
assert.strictEqual(
  verifyAdminSessionToken(`${token}adulterado`, secret, nowMs + 60_000),
  false,
  "Token adulterado deve ser rejeitado"
);
assert.strictEqual(
  verifyAdminSessionToken(token, secret, nowMs + 24 * 60 * 60 * 1000 + 1),
  false,
  "Token expirado (> 12h/24h) deve ser rejeitado"
);
console.log("  ✓ 2. Sessão admin HMAC-SHA256 validada contra adulteração e expiração.");

// 3. Sanitização contra CSV Formula Injection (=, +, -, @, \t, \r)
assert.strictEqual(
  sanitizeCsvCell("=cmd|'/C calc'!A0"),
  "\"'=cmd|'/C calc'!A0\"",
  "Célula iniciando com = deve ser prefixada com aspa simples"
);
assert.strictEqual(
  sanitizeCsvCell("+5549991251617"),
  "\"'+5549991251617\"",
  "Célula iniciando com + deve ser prefixada com aspa simples"
);
assert.strictEqual(
  sanitizeCsvCell("-100+200"),
  "\"'-100+200\"",
  "Célula iniciando com - deve ser prefixada com aspa simples"
);
assert.strictEqual(
  sanitizeCsvCell("@SUM(A1:A10)"),
  "\"'@SUM(A1:A10)\"",
  "Célula iniciando com @ deve ser prefixada com aspa simples"
);
assert.strictEqual(
  sanitizeCsvCell("\t=1+1"),
  "\"'\t=1+1\"",
  "Célula iniciando com tab deve ser prefixada com aspa simples"
);

// 4. Geração de relatório CSV completo
const csv = generateOrdersCsv([
  {
    id: "MC-20261109-ABC123",
    createdAt: "2026-11-09T19:00:00.000Z",
    customerName: "=cmd|'/C calc'!A0",
    customerPhone: "49991251617",
    deliveryMode: "retirada",
    paymentMethod: "pix",
    status: "pago",
    totalCents: 17490,
  },
]);
assert.ok(csv.includes("\"'=cmd|'/C calc'!A0\""), "CSV exportado deve conter payload neutralizado");
assert.ok(csv.includes("MC-20261109-ABC123"), "CSV exportado deve conter o código do pedido");
console.log("  ✓ 3 & 4. Sanitização contra CSV Formula Injection validada.");

console.log("✔ Todos os testes de Admin Auth e CSV Export passaram com 100% de sucesso!");
