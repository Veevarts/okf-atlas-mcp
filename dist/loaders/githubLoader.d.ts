export interface GitHubTreeUrlParts {
    owner: string;
    repo: string;
    branch: string;
    bundlePath: string;
}
export interface GitHubBundleReference extends GitHubTreeUrlParts {
    canonicalUrl: string;
    isRepositoryRoot: boolean;
}
export declare function parseGitHubTreeUrl(url: string): GitHubTreeUrlParts;
export declare function normalizeGitHubBundleUrl(input: string): Promise<GitHubBundleReference>;
export declare function loadBundleFromGithubUrl(input: string, cacheDir: string, refresh: boolean): Promise<{
    bundlePath: string;
    reference: GitHubBundleReference;
}>;
export declare function loadBundleFromGithubTreeUrl(url: string, cacheDir: string, refresh: boolean): Promise<string>;
