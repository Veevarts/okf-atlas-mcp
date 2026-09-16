import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import AdmZip from "adm-zip";

export interface LocalBundleSource {
  localPath: string;
  subPath: string;
}

export interface LocalBundleResult {
  bundlePath: string;
  sourceUrl: string;
  bundleId: string;
}

const HTTP_URL_PATTERN = /^https?:\/\//i;
const MARKDOWN_LINK_PATTERN = /^\[[^\]]+\]\(([^)\s]+)\)$/;

/**
 * Returns true when the input points at something on the local filesystem
 * (directory, .zip archive, or file:// URL) instead of a GitHub URL.
 */
export function isLocalBundleSource(input: string): boolean {
  const trimmed = input.trim();
  const markdownMatch = trimmed.match(MARKDOWN_LINK_PATTERN);
  const candidate = markdownMatch?.[1] ?? trimmed;
  if (HTTP_URL_PATTERN.test(candidate)) {
    return false;
  }
  return candidate.length > 0;
}

/**
 * Splits `path/to/archive.zip#okf/bundles/sample` into the filesystem path
 * and the optional sub path inside the archive or directory.
 */
export function parseLocalBundleSource(input: string): LocalBundleSource {
  let raw = input.trim();
  const markdownMatch = raw.match(MARKDOWN_LINK_PATTERN);
  if (markdownMatch?.[1]) {
    raw = markdownMatch[1];
  }

  let subPath = "";
  const hashIndex = raw.indexOf("#");
  if (hashIndex !== -1) {
    subPath = raw.slice(hashIndex + 1);
    raw = raw.slice(0, hashIndex);
  }

  const localPath = raw.startsWith("file:") ? fileURLToPath(raw) : raw;
  return {
    localPath: path.resolve(localPath),
    subPath: normalizeSubPath(subPath)
  };
}

export async function loadBundleFromLocalPath(bundlePath: string): Promise<string> {
  const absolutePath = path.resolve(bundlePath);
  const stat = await fs.stat(absolutePath);
  if (!stat.isDirectory()) {
    throw new Error(`Local bundle path is not a directory: ${absolutePath}`);
  }
  return absolutePath;
}

export async function loadBundleFromLocalSource(input: string, cacheDir: string, refresh: boolean): Promise<LocalBundleResult> {
  const source = parseLocalBundleSource(input);
  const stat = await fs.stat(source.localPath).catch(() => null);
  if (!stat) {
    throw new Error(`Local bundle source does not exist: ${source.localPath}`);
  }

  const sourceUrl = pathToFileURL(source.localPath).href + (source.subPath ? `#${source.subPath}` : "");

  if (stat.isDirectory()) {
    const bundlePath = source.subPath ? path.join(source.localPath, ...source.subPath.split("/")) : source.localPath;
    await assertDirectory(bundlePath, `Bundle sub path is not a directory: ${bundlePath}`);
    return { bundlePath, sourceUrl, bundleId: path.basename(bundlePath) };
  }

  if (!stat.isFile() || path.extname(source.localPath).toLowerCase() !== ".zip") {
    throw new Error(`Local bundle source must be a directory or a .zip archive: ${source.localPath}`);
  }

  const bundlePath = await extractZipBundle(source, cacheDir, refresh);
  const archiveName = path.basename(source.localPath, path.extname(source.localPath));
  const bundleId = source.subPath ? path.basename(bundlePath) : archiveName;
  return { bundlePath, sourceUrl, bundleId };
}

async function extractZipBundle(source: LocalBundleSource, cacheDir: string, refresh: boolean): Promise<string> {
  const archiveBytes = await fs.readFile(source.localPath);
  const cacheKey = createHash("sha256").update(archiveBytes).digest("hex").slice(0, 16);
  const archiveName = path.basename(source.localPath, path.extname(source.localPath));
  const rootCacheDir = path.resolve(cacheDir, `local-${sanitize(archiveName)}-${cacheKey}`);
  const extractDir = path.join(rootCacheDir, "extract");

  if (refresh) {
    await fs.rm(rootCacheDir, { recursive: true, force: true });
  }

  const alreadyExtracted = await fs
    .stat(extractDir)
    .then((entry) => entry.isDirectory())
    .catch(() => false);

  if (!alreadyExtracted) {
    await fs.mkdir(extractDir, { recursive: true });
    const zip = new AdmZip(archiveBytes);
    zip.extractAllTo(extractDir, true);
  }

  return resolveBundleRoot(extractDir, source.subPath);
}

async function resolveBundleRoot(extractDir: string, subPath: string): Promise<string> {
  const candidates = [extractDir];
  const topLevel = await listDirectories(extractDir);
  if (topLevel.length === 1) {
    candidates.push(topLevel[0]!);
  }

  if (subPath) {
    for (const root of candidates) {
      const candidate = path.join(root, ...subPath.split("/"));
      if (await isDirectory(candidate)) {
        return candidate;
      }
    }
    throw new Error(`Archive does not contain bundle sub path: ${subPath}`);
  }

  // GitHub-style archives wrap everything in a single `repo-branch/` folder.
  // Descend while there is exactly one directory and no Markdown at this level.
  let current = extractDir;
  for (let depth = 0; depth < 8; depth += 1) {
    if (await hasMarkdown(current)) {
      return current;
    }
    const directories = await listDirectories(current);
    if (directories.length !== 1) {
      return current;
    }
    current = directories[0]!;
  }
  return current;
}

async function listDirectories(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "__MACOSX")
    .map((entry) => path.join(dir, entry.name));
}

async function hasMarkdown(dir: string): Promise<boolean> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries.some((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"));
}

async function isDirectory(target: string): Promise<boolean> {
  return fs
    .stat(target)
    .then((entry) => entry.isDirectory())
    .catch(() => false);
}

async function assertDirectory(target: string, message: string): Promise<void> {
  if (!(await isDirectory(target))) {
    throw new Error(message);
  }
}

function normalizeSubPath(value: string): string {
  return value
    .replace(/\\/g, "/")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}
