/**
 * Autonomous E2E Test Framework for Mariane Cosméticos
 * 
 * Lightweight, zero-external-dependency, deterministic test harness
 * supporting async tests, rich assertions, tier filtering, and milestone isolation.
 */

export class AssertionError extends Error {
  public expected: any;
  public actual: any;

  constructor(message: string, expected?: any, actual?: any) {
    super(message);
    this.name = "AssertionError";
    this.expected = expected;
    this.actual = actual;
  }
}

export interface TestMetadata {
  tier?: number;
  milestone?: "M1" | "M2" | "M3" | "M4" | "M5" | "E2E";
  authoritativeSource?: string;
  description?: string;
}

export interface TestCase {
  suite: string;
  name: string;
  fn: () => void | Promise<void>;
  meta: TestMetadata;
}

export interface TestResult {
  suite: string;
  name: string;
  meta: TestMetadata;
  status: "PASS" | "FAIL";
  durationMs: number;
  error?: Error;
}

// Global test registry
const testRegistry: TestCase[] = [];
let currentSuite = "General";

export function describe(name: string, fn: () => void) {
  const previousSuite = currentSuite;
  currentSuite = previousSuite === "General" ? name : `${previousSuite} > ${name}`;
  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
}

export function test(
  name: string,
  fn: () => void | Promise<void>,
  meta: TestMetadata = { tier: 1 }
) {
  testRegistry.push({
    suite: currentSuite,
    name,
    fn,
    meta,
  });
}

// Matchers
export function expect(actual: any) {
  return {
    toBe(expected: any, message?: string) {
      if (actual !== expected) {
        throw new AssertionError(
          message || `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`,
          expected,
          actual
        );
      }
    },
    toEqual(expected: any, message?: string) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) {
        throw new AssertionError(
          message || `Expected deep equality:\nActual: ${a}\nExpected: ${b}`,
          expected,
          actual
        );
      }
    },
    toContain(expectedSubstringOrItem: any, message?: string) {
      if (typeof actual === "string") {
        if (!actual.includes(String(expectedSubstringOrItem))) {
          throw new AssertionError(
            message || `Expected string to contain "${expectedSubstringOrItem}".\nActual: "${actual.length > 200 ? actual.slice(0, 200) + '...' : actual}"`,
            expectedSubstringOrItem,
            actual
          );
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expectedSubstringOrItem)) {
          throw new AssertionError(
            message || `Expected array to contain item ${JSON.stringify(expectedSubstringOrItem)}`,
            expectedSubstringOrItem,
            actual
          );
        }
      } else {
        throw new AssertionError(
          `toContain matcher used on unsupported type: ${typeof actual}`,
          expectedSubstringOrItem,
          actual
        );
      }
    },
    toMatch(regex: RegExp | string, message?: string) {
      const r = typeof regex === "string" ? new RegExp(regex) : regex;
      if (!r.test(String(actual))) {
        throw new AssertionError(
          message || `Expected "${String(actual).slice(0, 150)}" to match pattern ${r}`,
          r.toString(),
          actual
        );
      }
    },
    toBeGreaterThan(expected: number, message?: string) {
      if (!(actual > expected)) {
        throw new AssertionError(
          message || `Expected ${actual} to be greater than ${expected}`,
          expected,
          actual
        );
      }
    },
    toBeGreaterThanOrEqual(expected: number, message?: string) {
      if (!(actual >= expected)) {
        throw new AssertionError(
          message || `Expected ${actual} to be >= ${expected}`,
          expected,
          actual
        );
      }
    },
    toBeLessThan(expected: number, message?: string) {
      if (!(actual < expected)) {
        throw new AssertionError(
          message || `Expected ${actual} to be less than ${expected}`,
          expected,
          actual
        );
      }
    },
    toBeLessThanOrEqual(expected: number, message?: string) {
      if (!(actual <= expected)) {
        throw new AssertionError(
          message || `Expected ${actual} to be <= ${expected}`,
          expected,
          actual
        );
      }
    },
    toBeCloseTo(expected: number, delta: number = 0.01, message?: string) {
      const diff = Math.abs(actual - expected);
      if (diff > delta) {
        throw new AssertionError(
          message || `Expected ${actual} to be close to ${expected} (diff: ${diff} > max allowed ${delta})`,
          expected,
          actual
        );
      }
    },
    toBeDefined(message?: string) {
      if (actual === undefined) {
        throw new AssertionError(message || "Expected value to be defined, but got undefined", "defined", actual);
      }
    },
    toBeUndefined(message?: string) {
      if (actual !== undefined) {
        throw new AssertionError(message || `Expected undefined, but got ${actual}`, undefined, actual);
      }
    },
    toBeNull(message?: string) {
      if (actual !== null) {
        throw new AssertionError(message || `Expected null, but got ${actual}`, null, actual);
      }
    },
    toBeTruthy(message?: string) {
      if (!actual) {
        throw new AssertionError(message || `Expected truthy value, but got ${actual}`, true, actual);
      }
    },
    toBeFalsy(message?: string) {
      if (actual) {
        throw new AssertionError(message || `Expected falsy value, but got ${actual}`, false, actual);
      }
    },
    not: {
      toBe(expected: any, message?: string) {
        if (actual === expected) {
          throw new AssertionError(message || `Expected ${actual} NOT to be ${expected}`, `not ${expected}`, actual);
        }
      },
      toContain(expectedSubstringOrItem: any, message?: string) {
        if (typeof actual === "string" && actual.includes(String(expectedSubstringOrItem))) {
          throw new AssertionError(
            message || `Expected string NOT to contain "${expectedSubstringOrItem}"`,
            `not ${expectedSubstringOrItem}`,
            actual
          );
        }
      },
      toMatch(regex: RegExp | string, message?: string) {
        const r = typeof regex === "string" ? new RegExp(regex) : regex;
        if (r.test(String(actual))) {
          throw new AssertionError(
            message || `Expected "${actual}" NOT to match ${r}`,
            `not match ${r}`,
            actual
          );
        }
      },
      toBeNull(message?: string) {
        if (actual === null) {
          throw new AssertionError(message || "Expected value NOT to be null", "not null", actual);
        }
      },
      toBeUndefined(message?: string) {
        if (actual === undefined) {
          throw new AssertionError(message || "Expected value NOT to be undefined", "not undefined", actual);
        }
      },
    },
  };
}

export interface RunOptions {
  tier?: number;
  milestone?: string;
  bail?: boolean;
  verbose?: boolean;
}

export async function runAllTests(options: RunOptions = {}): Promise<{
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}> {
  const startTime = Date.now();
  let filteredTests = testRegistry;

  if (options.tier !== undefined) {
    filteredTests = filteredTests.filter((t) => t.meta.tier === options.tier);
  }

  if (options.milestone) {
    const targetMilestone = options.milestone.toUpperCase();
    filteredTests = filteredTests.filter(
      (t) => t.meta.milestone?.toUpperCase() === targetMilestone
    );
  }

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  console.log("\n==================================================================");
  console.log("   MARIANE COSMÉTICOS — AUTOMATED E2E TEST SUITE RUNNER");
  console.log("==================================================================");
  console.log(`Discovered: ${filteredTests.length} test(s) | Filters: Tier=${options.tier ?? "ALL"}, Milestone=${options.milestone ?? "ALL"}\n`);

  let currentHeader = "";

  for (const t of filteredTests) {
    if (t.suite !== currentHeader) {
      currentHeader = t.suite;
      console.log(`\n\x1b[1m\x1b[36m▶ Suite: ${currentHeader}\x1b[0m`);
    }

    const testStart = Date.now();
    try {
      await t.fn();
      const durationMs = Date.now() - testStart;
      passed++;
      results.push({
        suite: t.suite,
        name: t.name,
        meta: t.meta,
        status: "PASS",
        durationMs,
      });
      const tierBadge = t.meta.tier ? `[Tier ${t.meta.tier}]` : "";
      const msBadge = t.meta.milestone ? `[${t.meta.milestone}]` : "";
      console.log(`  \x1b[32m✔ PASS\x1b[0m ${tierBadge}${msBadge} ${t.name} \x1b[90m(${durationMs}ms)\x1b[0m`);
    } catch (err: any) {
      const durationMs = Date.now() - testStart;
      failed++;
      results.push({
        suite: t.suite,
        name: t.name,
        meta: t.meta,
        status: "FAIL",
        durationMs,
        error: err,
      });
      const tierBadge = t.meta.tier ? `[Tier ${t.meta.tier}]` : "";
      const msBadge = t.meta.milestone ? `[${t.meta.milestone}]` : "";
      console.log(`  \x1b[31m✖ FAIL\x1b[0m ${tierBadge}${msBadge} ${t.name} \x1b[90m(${durationMs}ms)\x1b[0m`);
      console.log(`     \x1b[33mError: ${err.message}\x1b[0m`);
      if (err.expected !== undefined && err.actual !== undefined) {
        console.log(`     \x1b[90mExpected: ${JSON.stringify(err.expected)}\x1b[0m`);
        console.log(`     \x1b[90mActual:   ${JSON.stringify(err.actual)}\x1b[0m`);
      }

      if (options.bail) {
        console.log("\n[Runner] Bail triggered on first failure.");
        break;
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log("\n------------------------------------------------------------------");
  console.log("   TEST SUMMARY REPORT");
  console.log("------------------------------------------------------------------");
  console.log(`Total Tests Run:  ${results.length}`);
  console.log(`\x1b[32mPassed:\x1b[0m           ${passed}`);
  console.log(`\x1b[31mFailed:\x1b[0m           ${failed}`);
  console.log(`Pass Rate:        ${results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : "0.0"}%`);
  console.log(`Total Duration:   ${(totalDuration / 1000).toFixed(2)}s`);
  console.log("------------------------------------------------------------------\n");

  return {
    total: results.length,
    passed,
    failed,
    durationMs: totalDuration,
    results,
  };
}
