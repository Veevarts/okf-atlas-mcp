import type { ParsedBundle } from "../models.js";
export interface ParseOkfBundleOptions {
    sourceUrl: string;
    bundleId?: string;
}
export declare function parseOkfBundle(bundlePath: string, options: ParseOkfBundleOptions): Promise<ParsedBundle>;
