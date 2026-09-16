import YAML from "yaml";
export function parseFrontmatter(markdown, filePath) {
    const warnings = [];
    const lines = markdown.split(/\r?\n/);
    if (lines[0]?.trim() !== "---") {
        warnings.push({
            severity: "warning",
            code: "MISSING_FRONTMATTER",
            message: "Markdown file does not start with YAML frontmatter.",
            path: filePath
        });
        return {
            frontmatter: {},
            body: markdown,
            hasFrontmatter: false,
            warnings
        };
    }
    const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (closingIndex === -1) {
        warnings.push({
            severity: "warning",
            code: "INVALID_FRONTMATTER",
            message: "YAML frontmatter is missing a closing delimiter.",
            path: filePath
        });
        return {
            frontmatter: {},
            body: markdown,
            hasFrontmatter: true,
            warnings
        };
    }
    const yamlText = lines.slice(1, closingIndex).join("\n");
    const body = lines.slice(closingIndex + 1).join("\n");
    try {
        const parsed = YAML.parse(yamlText);
        if (parsed === null || parsed === undefined) {
            return { frontmatter: {}, body, hasFrontmatter: true, warnings };
        }
        if (typeof parsed !== "object" || Array.isArray(parsed)) {
            warnings.push({
                severity: "warning",
                code: "INVALID_FRONTMATTER",
                message: "YAML frontmatter must be a mapping/object.",
                path: filePath
            });
            return { frontmatter: {}, body, hasFrontmatter: true, warnings };
        }
        return {
            frontmatter: parsed,
            body,
            hasFrontmatter: true,
            warnings
        };
    }
    catch (error) {
        warnings.push({
            severity: "warning",
            code: "INVALID_FRONTMATTER",
            message: `YAML frontmatter could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
            path: filePath
        });
        return {
            frontmatter: {},
            body,
            hasFrontmatter: true,
            warnings
        };
    }
}
export function normalizeStringField(value) {
    return typeof value === "string" && value.trim().length > 0 ? value : null;
}
export function normalizeTags(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}
//# sourceMappingURL=frontmatter.js.map