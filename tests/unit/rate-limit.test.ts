import assert from "assert";
import {
  checkRateLimit,
  extractClientIp,
  resetRateLimitStore,
} from "../../src/lib/rate-limit";

console.log("▶ Iniciando testes unitários do módulo de Rate Limiting (rate-limit.ts)...");

resetRateLimitStore();

// 1. Limite de criação de pedidos: máx 5 pedidos por IP a cada 10 minutos
const testIp = "203.0.113.42";
for (let i = 1; i <= 5; i++) {
  const res = checkRateLimit("create_order", testIp, 5, 10 * 60 * 1000, 1000);
  assert.strictEqual(res.allowed, true, `Requisição ${i}/5 deve ser permitida`);
  assert.strictEqual(res.remaining, 5 - i);
}

// 6ª requisição no mesmo intervalo deve ser bloqueada
const sixth = checkRateLimit("create_order", testIp, 5, 10 * 60 * 1000, 1500);
assert.strictEqual(sixth.allowed, false, "6ª requisição dentro de 10 minutos deve ser bloqueada");
assert.ok(sixth.retryAfterSeconds > 0, "Deve informar retryAfterSeconds positivo");
console.log("  ✓ 1. Bloqueio no 6º disparo dentro da janela de 10 minutos validado.");

// 2. Isolamento por IP e por bucket
const otherIp = checkRateLimit("create_order", "198.51.100.7", 5, 10 * 60 * 1000, 1500);
assert.strictEqual(otherIp.allowed, true, "Outro IP não deve ser afetado");

const quoteBucket = checkRateLimit("checkout_quote", testIp, 30, 60 * 1000, 1500);
assert.strictEqual(quoteBucket.allowed, true, "Outro bucket (cotação) não deve ser afetado");
console.log("  ✓ 2. Isolamento por IP e por bucket validado.");

// 3. Expiração da janela deslizante libera novas requisições
const afterWindow = checkRateLimit(
  "create_order",
  testIp,
  5,
  10 * 60 * 1000,
  1000 + 10 * 60 * 1000 + 1
);
assert.strictEqual(afterWindow.allowed, true, "Após expiração da janela de 10 min, deve permitir novamente");
console.log("  ✓ 3. Expiração da janela deslizante validada.");

// 4. Extração segura de IP de headers HTTP
const fakeReq = new Request("https://marianecosmeticos.com.br/api/pedidos", {
  headers: {
    "x-forwarded-for": "177.54.12.99, 10.0.0.1",
  },
});
assert.strictEqual(extractClientIp(fakeReq), "177.54.12.99");
console.log("  ✓ 4. Extração de IP via x-forwarded-for validada.");

console.log("✔ Todos os testes de Rate Limiting passaram com 100% de sucesso!");
