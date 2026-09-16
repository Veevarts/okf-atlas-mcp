import path from "node:path";
export function toPosixPath(value) {
    return value.split(path.sep).join("/");
}
export function stripMarkdownExtension(value) {
    return value.replace(/\.md$/i, "");
}
export function normalizeConceptPath(value) {
    return stripMarkdownExtension(toPosixPath(value).replace(/^\/+/, "")).replace(/\/+/g, "/");
}
export function isReservedMarkdownFile(relativePath) {
    const base = path.posix.basename(toPosixPath(relativePath)).toLowerCase();
    return base === "index.md" || base === "log.md";
}
export function bundleIdFromPath(bundlePath) {
    return path.basename(bundlePath);
}
//# sourceMappingURL=path.js.map