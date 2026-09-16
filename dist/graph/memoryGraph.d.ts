import type { BacklinkResult, BundleGraph, BundleOverview, ConceptDetail, ConceptListResult, GetBacklinksOptions, GetConceptOptions, GetNeighborsOptions, LinkResolutionResult, ListConceptsOptions, NeighborhoodResult, ResolveLinkOptions, SearchConceptsOptions, SearchResult, ValidationReport } from "../models.js";
import type { OkfGraphApi } from "./api.js";
export declare class InMemoryOkfGraphApi implements OkfGraphApi {
    private readonly graph;
    constructor(graph: BundleGraph);
    getBundleOverview(): BundleOverview;
    listConcepts(options?: ListConceptsOptions): ConceptListResult;
    getConcept(options: GetConceptOptions): ConceptDetail;
    searchConcepts(options: SearchConceptsOptions): SearchResult;
    getNeighbors(options: GetNeighborsOptions): NeighborhoodResult;
    getBacklinks(options: GetBacklinksOptions): BacklinkResult;
    resolveLink(options: ResolveLinkOptions): LinkResolutionResult;
    validateBundle(): ValidationReport;
    private conceptNodes;
    private requireNode;
    private outboundEdges;
    private edgesForDirection;
}
