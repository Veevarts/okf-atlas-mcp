import { buildGraph } from "../graph/builder.js";
import { InMemoryOkfGraphApi } from "../graph/memoryGraph.js";
import { loadBundleFromGithubUrl } from "../loaders/githubLoader.js";
import { isLocalBundleSource, loadBundleFromLocalSource } from "../loaders/localLoader.js";
import { parseOkfBundle } from "../parser/okfParser.js";
import type { BundleRegistryEntry } from "./registry.js";

export interface LoadBundleFromUrlOptions {
  /** GitHub URL, Markdown link, local directory, local .zip archive, or file:// URL. */
  bundleUrl: string;
  cacheDir: string;
  refresh?: boolean;
}

interface ResolvedBundleSource {
  bundlePath: string;
  sourceUrl: string;
  bundleId?: string;
}

async function resolveBundleSource(options: LoadBundleFromUrlOptions): Promise<ResolvedBundleSource> {
  const refresh = options.refresh ?? false;

  if (isLocalBundleSource(options.bundleUrl)) {
    const local = await loadBundleFromLocalSource(options.bundleUrl, options.cacheDir, refresh);
    return { bundlePath: local.bundlePath, sourceUrl: local.sourceUrl, bundleId: local.bundleId };
  }

  const { bundlePath, reference } = await loadBundleFromGithubUrl(options.bundleUrl, options.cacheDir, refresh);
  return {
    bundlePath,
    sourceUrl: reference.canonicalUrl,
    bundleId: reference.isRepositoryRoot ? reference.repo : undefined
  };
}

export async function loadBundleFromUrl(options: LoadBundleFromUrlOptions): Promise<BundleRegistryEntry> {
  const source = await resolveBundleSource(options);
  const parsedBundle = await parseOkfBundle(source.bundlePath, {
    sourceUrl: source.sourceUrl,
    bundleId: source.bundleId
  });
  const graph = buildGraph(parsedBundle);
  const api = new InMemoryOkfGraphApi(graph);
  const overview = api.getBundleOverview();

  if (api.validateBundle().errors.length > 0) {
    throw new Error(`Bundle has fatal validation errors: ${overview.bundle_id}`);
  }

  return {
    bundle_id: overview.bundle_id,
    source_url: source.sourceUrl,
    api
  };
}
