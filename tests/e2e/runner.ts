import { runAllTests, RunOptions } from "./framework";

// Import all suites to register tests
import "./tier1-features.test";
import "./tier2-boundaries.test";
import "./tier3-combinations.test";
import "./tier4-scenarios.test";

// Parse command line arguments
const args = process.argv.slice(2);
const options: RunOptions = {};

for (const arg of args) {
  if (arg.startsWith("--tier=")) {
    options.tier = parseInt(arg.split("=")[1], 10);
  } else if (arg.startsWith("--milestone=")) {
    options.milestone = arg.split("=")[1].toUpperCase();
  } else if (arg === "--bail") {
    options.bail = true;
  } else if (arg === "--help" || arg === "-h") {
    console.log(`
Mariane Cosméticos E2E Test Suite Runner

Usage:
  npx tsx tests/e2e/runner.ts [options]

Options:
  --tier=1|2|3|4         Run only tests belonging to a specific tier
  --milestone=M1|M2|M3|M4 Run only tests associated with a milestone
  --bail                 Stop execution on first failed test
  --help                 Show this help message
`);
    process.exit(0);
  }
}

async function main() {
  try {
    const summary = await runAllTests(options);
    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Fatal runner error:", err);
    process.exit(1);
  }
}

main();
