#!/usr/bin/env node
/**
 * OBP Validator CLI
 * Usage: npx @obp/validator <server-url> [--api-key <key>] [--json]
 */
import { runChecks, type ValidationReport } from "./checks.js";

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function parseArgs(argv: string[]): { url: string; apiKey?: string; json: boolean } {
  const args = argv.slice(2);
  let url = "";
  let apiKey: string | undefined;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--api-key" || arg === "-k") {
      apiKey = args[++i];
    } else if (arg === "--json") {
      jsonOutput = true;
    } else if (!arg.startsWith("-")) {
      url = arg;
    }
  }

  return { url, apiKey, json: jsonOutput };
}

function printReport(report: ValidationReport): void {
  console.log(`\n${BOLD}OBP Compliance Validator${RESET}`);
  console.log(`${DIM}Server: ${report.serverUrl}${RESET}`);
  console.log(`${DIM}Time:   ${report.timestamp}${RESET}\n`);

  for (const check of report.checks) {
    const icon = check.passed ? `${GREEN}✓${RESET}` : check.required ? `${RED}✗${RESET}` : `${YELLOW}⚠${RESET}`;
    const msg = check.passed ? DIM + check.message + RESET : check.message;
    console.log(`  ${icon} ${check.name}`);
    if (!check.passed) {
      console.log(`    ${DIM}→ ${msg}${RESET}`);
    }
  }

  console.log();
  console.log(`  Passed:   ${GREEN}${report.passed}${RESET}`);
  console.log(`  Failed:   ${report.failed > 0 ? RED : DIM}${report.failed}${RESET}`);
  console.log(`  Warnings: ${report.warnings > 0 ? YELLOW : DIM}${report.warnings}${RESET}`);
  console.log();

  if (report.compliant) {
    console.log(`${GREEN}${BOLD}✓ Server is OBP compliant!${RESET}\n`);
  } else {
    console.log(`${RED}${BOLD}✗ Server is NOT OBP compliant (${report.failed} required check(s) failed)${RESET}\n`);
  }
}

async function main(): Promise<void> {
  const { url, apiKey, json } = parseArgs(process.argv);

  if (!url) {
    console.error("Usage: obp-validate <server-url> [--api-key <key>] [--json]");
    console.error("Example: obp-validate https://obp.example.com --api-key obpk_...");
    process.exit(1);
  }

  console.log(`Validating OBP server: ${url} ...`);

  try {
    const report = await runChecks(url, apiKey);

    if (json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    process.exit(report.compliant ? 0 : 1);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }
}

await main();
