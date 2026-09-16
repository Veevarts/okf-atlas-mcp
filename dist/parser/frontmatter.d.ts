import type { ValidationIssue } from "../models.js";
export interface FrontmatterParseResult {
    frontmatter: Record<string, unknown>;
    body: string;
    hasFrontmatter: boolean;
    warnings: ValidationIssue[];
}
export declare function parseFrontmatter(markdown: string, filePath: string): FrontmatterParseResult;
export declare function normalizeStringField(value: unknown): string | null;
export declare function normalizeTags(value: unknown): string[];
