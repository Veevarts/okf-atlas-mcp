# okf-atlas-mcp (Veevarts fork)

[![CI](https://github.com/Veevarts/okf-atlas-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Veevarts/okf-atlas-mcp/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Fork of [rodcar/okf-atlas-mcp](https://github.com/rodcar/okf-atlas-mcp): a TypeScript MCP server for navigating OKF knowledge bundles.

What this fork adds:

- **Zero-build usage via `npx`**: `dist/` is committed, so `npx github:Veevarts/okf-atlas-mcp` runs without cloning or compiling.
- **Local bundle sources**: load bundles from a local directory, a downloaded repository `.zip`, or a `file://` URL, in addition to GitHub URLs.

## Quick Start

```bash
npx github:Veevarts/okf-atlas-mcp --bundle-url "https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf/bundles/crypto_bitcoin"
```

Or with a local folder or a repository zip you downloaded from GitHub:

```bash
npx github:Veevarts/okf-atlas-mcp --bundle-path ./my-okf-bundle
npx github:Veevarts/okf-atlas-mcp --bundle-path ~/Downloads/knowledge-catalog-main.zip#okf/bundles/crypto_bitcoin
```

## Why

OKF is the source of truth. This server treats each loaded OKF bundle as a navigable graph:

```text
OKF bundle source (GitHub URL, local folder, or .zip)
  -> download or extract bundle
  -> parse Markdown + YAML frontmatter
  -> build local concept graph
  -> expose MCP resources and tools
  -> agent navigates concepts
```

The server does not execute domain-specific queries. For example, the Bitcoin OKF bundle can explain tables, schemas, and relationships, but BigQuery execution should be handled by a separate tool.

## Requirements

- Node.js 22.12.0 or newer
- npm
- An MCP client such as Claude Desktop or Claude Code

## Install From Source

```bash
git clone https://github.com/Veevarts/okf-atlas-mcp.git
cd okf-atlas-mcp
npm ci
npm run build
```

Run locally:

```bash
node bin/okf-atlas-mcp.js --bundle-path ./path/to/bundle
```

During development:

```bash
npm run dev -- --bundle-path ./path/to/bundle
```

## CLI

Start empty and let the agent load bundles at runtime:

```bash
npx github:Veevarts/okf-atlas-mcp
```

### Bundle sources

Every source flag (`--bundle-url`, `--bundle-path`, and the `bundle_url` argument of `okf_load_bundle`) accepts any of:

| Source | Example |
| --- | --- |
| GitHub tree URL | `https://github.com/owner/repo/tree/main/okf/bundles/sample` |
| GitHub repository root | `https://github.com/owner/repo` |
| Markdown link wrapping a GitHub URL | `[owner/repo](https://github.com/owner/repo)` |
| Local directory | `./okf/bundles/sample` or `/abs/path/sample` |
| Local `.zip` archive | `~/Downloads/repo-main.zip` |
| Local `.zip` with a sub path | `~/Downloads/repo-main.zip#okf/bundles/sample` |
| `file://` URL | `file:///abs/path/sample` |

Zip handling:

- Archives downloaded from GitHub ("Download ZIP") wrap everything in a single `repo-branch/` folder. That folder is detected automatically, so `repo-main.zip` loads the repository root as the bundle.
- When the bundle lives in a subdirectory, append `#path/inside/archive`.
- Archives are extracted once into `--cache-dir`, keyed by content hash. Pass `--refresh true` to re-extract.
- The bundle id defaults to the archive name (without `.zip`), or to the last segment of the sub path when one is given. Directories use the folder name.

Start with one or several bundles, mixing sources freely:

```bash
npx github:Veevarts/okf-atlas-mcp \
  --bundle-url "https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf/bundles/crypto_bitcoin" \
  --bundle-path ./internal-okf \
  --bundle-path ~/Downloads/knowledge-catalog-main.zip#okf/bundles/another_bundle
```

Options:

```bash
okf-atlas-mcp \
  --bundle-url <source> \
  --bundle-path <path> \
  --cache-dir ~/.okf-atlas-mcp/cache \
  --refresh false \
  --server-name okf-atlas-mcp
```

`--bundle-url` and `--bundle-path` are interchangeable, can be repeated, and are optional. If omitted, use `okf_load_bundle` from the MCP client with a GitHub URL or an absolute local path. `--cache-dir` defaults to `~/.okf-atlas-mcp/cache`, so no flag is required for MCP clients that start the server with an arbitrary working directory. Repository root URLs load the root directory as the OKF bundle after resolving the repository default branch. Use `/tree/{branch}/{path}` URLs for bundles stored in subdirectories.

## Claude Desktop

Edit your Claude Desktop MCP config.

On macOS:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Zero-config: start empty and let the agent load bundles at runtime with `okf_load_bundle` (pass absolute paths for local folders or zips):

```json
{
  "mcpServers": {
    "okf-atlas-mcp": {
      "command": "npx",
      "args": ["-y", "github:Veevarts/okf-atlas-mcp"]
    }
  }
}
```

Preloading a bundle at startup with `npx` (no clone, no build):

```json
{
  "mcpServers": {
    "okf-atlas-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "github:Veevarts/okf-atlas-mcp",
        "--bundle-path",
        "/absolute/path/to/okf-bundle-or-archive.zip"
      ]
    }
  }
}
```

Using a local clone:

```json
{
  "mcpServers": {
    "okf-atlas-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/okf-atlas-mcp/bin/okf-atlas-mcp.js",
        "--bundle-url",
        "https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf/bundles/crypto_bitcoin"
      ]
    }
  }
}
```

If Claude Desktop cannot find `node` or `npx`, replace the command with the absolute path from `which node` or `which npx`.

## Claude Code

```bash
claude mcp add okf-atlas-mcp -- npx -y github:Veevarts/okf-atlas-mcp
```

Or preload a bundle:

```bash
claude mcp add okf-atlas-mcp -- npx -y github:Veevarts/okf-atlas-mcp --bundle-path /absolute/path/to/bundle
```

### Private GitHub Repositories

For private repositories, configure a GitHub App with read-only repository contents access and pass the app credentials to the MCP server environment. The user still provides normal GitHub URLs; credentials are never passed through MCP tool arguments.

Claude Desktop example:

```json
{
  "mcpServers": {
    "okf-atlas-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/okf-atlas-mcp/dist/cli.js"
      ],
      "env": {
        "GITHUB_APP_ID": "123456",
        "GITHUB_APP_PRIVATE_KEY_PATH": "/secure/path/okf-atlas-mcp.private-key.pem"
      }
    }
  }
}
```

You can also use `GITHUB_APP_PRIVATE_KEY` for an inline PEM value. If using JSON config, encode newlines as `\n`.

GitHub admin setup:

1. Create a GitHub App.
2. Grant repository permission `Contents: Read-only`.
3. Install the app only on repositories that contain OKF bundles.
4. Generate a private key for the app.
5. Provide `GITHUB_APP_ID` and either `GITHUB_APP_PRIVATE_KEY_PATH` or `GITHUB_APP_PRIVATE_KEY` to the MCP server process.

When these variables are present, `okf-atlas-mcp` auto-discovers the app installation for each requested repository and downloads through GitHub's API zipball endpoint. Public unauthenticated loading continues to work when the variables are absent.

## Runtime Bundle Loading

Ask your MCP client to call the tool `okf_load_bundle` with a GitHub URL, a local folder, or a zip archive:

```json
{
  "bundle_url": "/absolute/path/to/knowledge-catalog-main.zip#okf/bundles/crypto_bitcoin",
  "refresh": false
}
```

The loaded bundle is session-only. It stays available until the MCP server process exits. Downloaded and extracted archives are cached locally under `--cache-dir`.

## MCP Tools

- `okf_list_bundles({})`
- `okf_load_bundle({ bundle_url, refresh? })`
- `okf_bundle_overview({ bundle_id })`
- `okf_list_concepts({ bundle_id, type?, tag?, limit?, offset? })`
- `okf_get_concept({ bundle_id, concept_id, include_body?, include_links?, include_backlinks? })`
- `okf_get_index({ bundle_id, include_body?, include_links?, include_backlinks? })`
- `okf_search_concepts({ bundle_id, query, type?, tag?, limit? })`
- `okf_get_neighbors({ bundle_id, concept_id, direction?, depth? })`
- `okf_get_backlinks({ bundle_id, concept_id, limit? })`
- `okf_validate_bundle({ bundle_id })`

## MCP Resources

- `okf://{bundle_id}/`
- `okf://{bundle_id}/{concept_id}`

## MCP Prompt

- `navigate_okf_bundle`

## Example Agent Flow

```text
User: What concepts are related to transactions?

Agent:
1. okf_list_bundles()
2. If needed, okf_load_bundle(bundle_url="https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf/bundles/crypto_bitcoin")
3. okf_get_index(bundle_id="crypto_bitcoin")
4. okf_search_concepts(bundle_id="crypto_bitcoin", query="transactions")
5. okf_get_concept(bundle_id="crypto_bitcoin", concept_id="tables/transactions")
6. okf_get_neighbors(bundle_id="crypto_bitcoin", concept_id="tables/transactions", direction="both")
7. Answer using concept body and linked concepts.
```

## Development

Install:

```bash
npm ci
```

`dist/` is committed so that `npx github:Veevarts/okf-atlas-mcp` works without a build step. After changing anything under `src/`, run `npm run build` and commit the updated `dist/`. CI fails when `dist/` is stale.

Run checks:

```bash
npm run typecheck
npm test
npm run build
```

Run all checks:

```bash
npm run check
```

Preview the npm package:

```bash
npm pack --dry-run
```

## Security And Privacy

`okf-atlas-mcp` downloads user-provided GitHub bundle URLs, extracts user-provided local archives, and stores them in the configured local cache directory. Only load bundles from sources you trust.

For private repositories, keep GitHub App credentials in environment variables or a secret manager. Do not paste tokens, private keys, or installation tokens into prompts or MCP tool arguments.

The server does not send bundle contents to any service by itself. Your MCP client decides what context is sent to a model.

Report security issues privately. See [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Apache-2.0. See [LICENSE](LICENSE).
