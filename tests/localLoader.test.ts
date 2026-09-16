import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import AdmZip from "adm-zip";
import { afterEach, describe, expect, it } from "vitest";
import { isLocalBundleSource, loadBundleFromLocalSource, parseLocalBundleSource } from "../src/loaders/localLoader.js";
import { loadBundleFromUrl } from "../src/bundles/loadBundle.js";

const fixtureDir = path.resolve("tests/fixtures/sample_bundle");
const tmpDirs: string[] = [];

async function makeTmpDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "okf-local-"));
  tmpDirs.push(dir);
  return dir;
}

async function writeZip(target: string, rootPrefix: string): Promise<void> {
  const zip = new AdmZip();
  zip.addLocalFolder(fixtureDir, rootPrefix);
  await fs.writeFile(target, zip.toBuffer());
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe("local bundle sources", () => {
  it("detects local sources versus GitHub URLs", () => {
    expect(isLocalBundleSource("https://github.com/owner/repo")).toBe(false);
    expect(isLocalBundleSource("[repo](https://github.com/owner/repo)")).toBe(false);
    expect(isLocalBundleSource("./bundles/sample")).toBe(true);
    expect(isLocalBundleSource("/abs/path/bundle.zip")).toBe(true);
    expect(isLocalBundleSource("file:///abs/path/bundle.zip")).toBe(true);
    expect(isLocalBundleSource("C:\\bundles\\sample")).toBe(true);
  });

  it("parses optional archive sub paths", () => {
    expect(parseLocalBundleSource("/a/bundle.zip#okf/bundles/sample")).toEqual({
      localPath: path.resolve("/a/bundle.zip"),
      subPath: "okf/bundles/sample"
    });
    expect(parseLocalBundleSource("/a/bundle")).toEqual({ localPath: path.resolve("/a/bundle"), subPath: "" });
    expect(parseLocalBundleSource("file:///a/bundle.zip")).toEqual({ localPath: path.resolve("/a/bundle.zip"), subPath: "" });
  });

  it("loads a bundle from a local directory", async () => {
    const cacheDir = await makeTmpDir();
    const result = await loadBundleFromLocalSource(fixtureDir, cacheDir, false);
    expect(result.bundlePath).toBe(fixtureDir);
    expect(result.bundleId).toBe("sample_bundle");
    expect(result.sourceUrl).toBe(pathToFileURL(fixtureDir).href);
  });

  it("loads a bundle from a zip whose single root folder wraps the bundle", async () => {
    const tmp = await makeTmpDir();
    const zipPath = path.join(tmp, "sample-repo-main.zip");
    await writeZip(zipPath, "sample-repo-main");

    const result = await loadBundleFromLocalSource(zipPath, path.join(tmp, "cache"), false);
    expect(result.bundleId).toBe("sample-repo-main");
    await expect(fs.stat(path.join(result.bundlePath, "index.md"))).resolves.toBeTruthy();
    expect(result.sourceUrl).toBe(pathToFileURL(zipPath).href);
  });

  it("loads a bundle from a zip using an explicit sub path", async () => {
    const tmp = await makeTmpDir();
    const zipPath = path.join(tmp, "repo.zip");
    await writeZip(zipPath, "repo-main/okf/bundles/sample");

    const result = await loadBundleFromLocalSource(`${zipPath}#okf/bundles/sample`, path.join(tmp, "cache"), false);
    expect(result.bundleId).toBe("sample");
    await expect(fs.stat(path.join(result.bundlePath, "index.md"))).resolves.toBeTruthy();
  });

  it("reuses the extracted cache and honors refresh", async () => {
    const tmp = await makeTmpDir();
    const zipPath = path.join(tmp, "repo.zip");
    await writeZip(zipPath, "repo-main");
    const cacheDir = path.join(tmp, "cache");

    const first = await loadBundleFromLocalSource(zipPath, cacheDir, false);
    const marker = path.join(first.bundlePath, "marker.txt");
    await fs.writeFile(marker, "cached");

    const second = await loadBundleFromLocalSource(zipPath, cacheDir, false);
    expect(second.bundlePath).toBe(first.bundlePath);
    await expect(fs.stat(marker)).resolves.toBeTruthy();

    await loadBundleFromLocalSource(zipPath, cacheDir, true);
    await expect(fs.stat(marker)).rejects.toThrow();
  });

  it("rejects missing paths and unsupported files", async () => {
    const tmp = await makeTmpDir();
    await expect(loadBundleFromLocalSource(path.join(tmp, "missing"), tmp, false)).rejects.toThrow(/does not exist/);
    const textFile = path.join(tmp, "notes.txt");
    await fs.writeFile(textFile, "hello");
    await expect(loadBundleFromLocalSource(textFile, tmp, false)).rejects.toThrow(/directory or a \.zip/);
  });

  it("builds a registry entry from a local directory through loadBundleFromUrl", async () => {
    const cacheDir = await makeTmpDir();
    const entry = await loadBundleFromUrl({ bundleUrl: fixtureDir, cacheDir });
    expect(entry.bundle_id).toBe("sample_bundle");
    expect(entry.source_url).toBe(pathToFileURL(fixtureDir).href);
    expect(entry.api.getBundleOverview().bundle_id).toBe("sample_bundle");
  });
});
