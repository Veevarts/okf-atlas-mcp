# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - Veevarts fork

### Added

- Local bundle sources: directories, `.zip` archives (with optional `#sub/path`), and `file://` URLs for `--bundle-url`, the new `--bundle-path` alias, and `okf_load_bundle`.
- Automatic detection of the single `repo-branch/` wrapper folder in GitHub "Download ZIP" archives.
- `bin/okf-atlas-mcp.js` entry point and committed `dist/` so `npx github:Veevarts/okf-atlas-mcp` runs without a build step.

### Changed

- Package renamed to `@veevarts/okf-atlas-mcp`; repository metadata points at the Veevarts fork.
- CI verifies that the committed `dist/` matches the sources.

## [0.1.0] - 2026-06-17

### Added

- Initial TypeScript MCP server for navigating OKF knowledge bundles.
- GitHub tree URL bundle loading with local cache support.
- GitHub App authentication support for private GitHub OKF bundle repositories.
- Runtime multi-bundle loading with `okf_load_bundle`.
- MCP tools, resources, and prompt for listing, searching, reading, and validating OKF bundles.
- In-memory graph API with lexical search, links, backlinks, tags, and types.
- Vitest coverage for parsing, loading, graph behavior, MCP tools, and CLI parsing.

### Changed

- Dropped Node 20 support and raised the minimum runtime to Node 22.12.0 for Commander 15.
