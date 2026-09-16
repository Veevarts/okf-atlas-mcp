export class OkfBundleRegistry {
    entries = new Map();
    listBundles() {
        return [...this.entries.values()]
            .map((entry) => entry.api.getBundleOverview())
            .sort((a, b) => a.bundle_id.localeCompare(b.bundle_id));
    }
    hasBundle(bundleId) {
        return this.entries.has(bundleId);
    }
    addBundle(entry) {
        if (this.entries.has(entry.bundle_id)) {
            throw new Error(`Bundle is already loaded: ${entry.bundle_id}`);
        }
        this.entries.set(entry.bundle_id, entry);
    }
    requireApi(bundleId) {
        const entry = this.entries.get(bundleId);
        if (!entry) {
            throw new Error(`Bundle does not exist: ${bundleId}`);
        }
        return entry.api;
    }
}
//# sourceMappingURL=registry.js.map