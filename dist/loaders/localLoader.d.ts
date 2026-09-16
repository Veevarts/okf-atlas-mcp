export interface LocalBundleSource {
    localPath: string;
    subPath: string;
}
export interface LocalBundleResult {
    bundlePath: string;
    sourceUrl: string;
    bundleId: string;
}
/**
 * Returns true when the input points at something on the local filesystem
 * (directory, .zip archive, or file:// URL) instead of a GitHub URL.
 */
export declare function isLocalBundleSource(input: string): boolean;
/**
 * Splits `path/to/archive.zip#okf/bundles/sample` into the filesystem path
 * and the optional sub path inside the archive or directory.
 */
export declare function parseLocalBundleSource(input: string): LocalBundleSource;
export declare function loadBundleFromLocalPath(bundlePath: string): Promise<string>;
export declare function loadBundleFromLocalSource(input: string, cacheDir: string, refresh: boolean): Promise<LocalBundleResult>;
