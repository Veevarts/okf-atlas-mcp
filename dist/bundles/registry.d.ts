import type { OkfGraphApi } from "../graph/api.js";
import type { BundleOverview } from "../models.js";
export interface BundleRegistryEntry {
    bundle_id: string;
    source_url: string;
    api: OkfGraphApi;
}
export interface BundleListItem extends BundleOverview {
    source_url: string;
}
export declare class OkfBundleRegistry {
    private readonly entries;
    listBundles(): BundleListItem[];
    hasBundle(bundleId: string): boolean;
    addBundle(entry: BundleRegistryEntry): void;
    requireApi(bundleId: string): OkfGraphApi;
}
