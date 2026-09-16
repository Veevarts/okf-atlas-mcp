import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OkfBundleRegistry } from "./bundles/registry.js";
export interface CreateOkfMcpServerOptions {
    cacheDir?: string;
    serverName?: string;
    version?: string;
}
export declare function createOkfMcpServer(registry: OkfBundleRegistry, options?: CreateOkfMcpServerOptions): McpServer;
export declare function runStdioServer(registry: OkfBundleRegistry, options?: CreateOkfMcpServerOptions): Promise<void>;
