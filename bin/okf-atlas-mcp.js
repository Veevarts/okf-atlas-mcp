#!/usr/bin/env node
// Entry point used by `npx github:Veevarts/okf-atlas-mcp`.
// dist/ is pre-built and committed, so no build step is needed at install time.
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const { main } = await import(path.join(root, "dist", "cli.js"));

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
