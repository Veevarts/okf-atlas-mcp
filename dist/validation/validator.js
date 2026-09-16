export function validateBundle(graph) {
    const errors = graph.warnings.filter((issue) => issue.severity === "error");
    const warnings = graph.warnings.filter((issue) => issue.severity === "warning");
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=validator.js.map