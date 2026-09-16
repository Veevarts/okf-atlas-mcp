import type { BundleRegistryEntry } from "./registry.js";
export interface LoadBundleFromUrlOptions {
    /** GitHub URL, Markdown link, local directory, local .zip archive, or file:// URL. */
    bundleUrl: string;
    cacheDir: string;
    refresh?: boolean;
}
export declare function loadBundleFromUrl(options: LoadBundleFromUrlOptions): Promise<BundleRegistryEntry>;
