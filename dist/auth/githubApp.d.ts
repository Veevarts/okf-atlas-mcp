import type { GitHubTreeUrlParts } from "../loaders/githubLoader.js";
export interface GitHubAppConfig {
    appId: string;
    privateKey: string;
}
export declare function detectGitHubAppEnv(env?: NodeJS.ProcessEnv): boolean;
export declare function loadGitHubAppConfigFromEnv(env?: NodeJS.ProcessEnv): Promise<GitHubAppConfig | null>;
export declare function createGitHubAppJwt(config: GitHubAppConfig, nowSeconds?: number): string;
export declare function getInstallationAccessToken(parts: GitHubTreeUrlParts, config: GitHubAppConfig, fetchFn?: typeof fetch): Promise<string>;
export declare function clearGitHubAppTokenCache(): void;
export declare function githubApiHeaders(token: string): HeadersInit;
