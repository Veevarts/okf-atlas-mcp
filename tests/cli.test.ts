import { describe, expect, it } from "vitest";
import os from "node:os";
import path from "node:path";
import { createCliProgram, defaultCacheDir } from "../src/cli.js";

describe("CLI", () => {
  it("accepts repeated bundle URL flags and empty startup", () => {
    const emptyProgram = createCliProgram();
    emptyProgram.exitOverride();
    emptyProgram.parse([], { from: "user" });
    expect(emptyProgram.opts()).toMatchObject({ bundleUrl: [] });

    const program = createCliProgram();
    program.exitOverride();
    program.parse(["--bundle-url", "https://github.com/a/b/tree/main/one", "--bundle-url", "https://github.com/a/b/tree/main/two"], {
      from: "user"
    });

    expect(program.opts()).toMatchObject({
      bundleUrl: ["https://github.com/a/b/tree/main/one", "https://github.com/a/b/tree/main/two"]
    });
  });

  it("accepts local directories and zip archives through --bundle-url and --bundle-path", () => {
    const program = createCliProgram();
    program.exitOverride();
    program.parse(["--bundle-url", "./bundles/sample", "--bundle-path", "/tmp/repo.zip#okf/bundles/sample"], { from: "user" });

    expect(program.opts()).toMatchObject({
      bundleUrl: ["./bundles/sample"],
      bundlePath: ["/tmp/repo.zip#okf/bundles/sample"]
    });
  });

  it("defaults the cache dir to a writable home folder instead of the process cwd", () => {
    const program = createCliProgram();
    program.exitOverride();
    program.parse([], { from: "user" });
    expect(program.opts()).toMatchObject({ cacheDir: defaultCacheDir() });
    expect(defaultCacheDir()).toBe(path.join(os.homedir(), ".okf-atlas-mcp", "cache"));
  });
});
