#!/usr/bin/env node
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Command } from "commander";
import { loadBundleFromUrl } from "./bundles/loadBundle.js";
import { OkfBundleRegistry } from "./bundles/registry.js";
import { runStdioServer } from "./server.js";
export async function main(argv = process.argv) {
    const program = createCliProgram();
    program.parse(argv);
    const options = program.opts();
    const registry = new OkfBundleRegistry();
    for (const bundleUrl of [...options.bundleUrl, ...options.bundlePath]) {
        const entry = await loadBundleFromUrl({
            bundleUrl,
            cacheDir: options.cacheDir,
            refresh: options.refresh
        });
        registry.addBundle(entry);
    }
    await runStdioServer(registry, { cacheDir: options.cacheDir, serverName: options.serverName });
}
export function createCliProgram() {
    const program = new Command();
    return program
        .name("okf-atlas-mcp")
        .description("MCP server for navigating OKF knowledge bundles.")
        .option("--bundle-url <source>", "GitHub URL, local directory, or local .zip archive of an OKF bundle. Can be provided multiple times.", collectValues, [])
        .option("--bundle-path <path>", "Alias of --bundle-url for local directories or .zip archives.", collectValues, [])
        .option("--cache-dir <path>", "Local folder for downloaded and extracted bundles.", defaultCacheDir())
        .option("--refresh <boolean>", "Re-download even if cached.", parseBoolean, false)
        .option("--server-name <name>", "Name exposed by the MCP server.", "okf-atlas-mcp");
}
export function defaultCacheDir() {
    return path.join(os.homedir(), ".okf-atlas-mcp", "cache");
}
function parseBoolean(value) {
    const normalized = value.toLowerCase().trim();
    if (["true", "1", "yes", "y"].includes(normalized)) {
        return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
        return false;
    }
    throw new Error(`Expected boolean value, received: ${value}`);
}
function collectValues(value, previous) {
    return [...previous, value];
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
//# sourceMappingURL=cli.js.map