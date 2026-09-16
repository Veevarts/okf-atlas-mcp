import type { LinkResolutionResult } from "../models.js";
export declare function isExternalHref(href: string): boolean;
export declare function removeHrefFragmentAndQuery(href: string): string;
export declare function resolveLink(fromConceptId: string, href: string, knownConceptIds: Set<string>): LinkResolutionResult;
