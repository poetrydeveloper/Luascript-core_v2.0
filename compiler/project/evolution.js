// compiler/project/evolution.js
//
// AI Project Evolution Request.
//
// Purpose:
// - represent a proposed project evolution;
// - bind the proposal to an exact ProjectContext snapshot;
// - identify the Shell versions used as the base;
// - describe the requested operation;
// - carry proposed Shell changes;
// - validate the request before it reaches the mutation pipeline.
//
// IMPORTANT:
// This module does NOT mutate the repository or ProjectTree.
//
// Pipeline:
//
// AI
//  |
//  v
// EvolutionRequest
//  |
//  v
// EvolutionValidator
//  |
//  v
// ShellRepository
//  |
//  v
// ProjectTree
//

class ProjectEvolutionError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectEvolutionError";
        this.code = "LS012";
        this.value = value;
    }
}

function assertHash(value, fieldName) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(value)
    ) {
        throw new ProjectEvolutionError(
            `${fieldName} must be a SHA-256 hexadecimal hash.`,
            value
        );
    }
}

function assertPositiveInteger(value, fieldName) {
    if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 1
    ) {
        throw new ProjectEvolutionError(
            `${fieldName} must be a positive integer.`,
            value
        );
    }
}

function assertNonEmptyString(value, fieldName) {
    if (
        typeof value !== "string" ||
        value.length === 0
    ) {
        throw new ProjectEvolutionError(
            `${fieldName} must be a non-empty string.`,
            value
        );
    }
}

function assertOperation(operation) {
    const allowed = [
        "CREATE",
        "UPDATE",
        "REFACTOR",
        "DELETE"
    ];

    if (!allowed.includes(operation)) {
        throw new ProjectEvolutionError(
            `Unsupported evolution operation '${operation}'.`,
            operation
        );
    }
}

function assertBaseShell(shell) {
    if (
        !shell ||
        typeof shell !== "object"
    ) {
        throw new ProjectEvolutionError(
            "Evolution baseShell must be an object.",
            shell
        );
    }

    assertNonEmptyString(
        shell.shellId,
        "Evolution baseShell.shellId"
    );

    assertPositiveInteger(
        shell.version,
        "Evolution baseShell.version"
    );

    assertHash(
        shell.hash,
        "Evolution baseShell.hash"
    );

    assertNonEmptyString(
        shell.path,
        "Evolution baseShell.path"
    );
}

function assertChange(change) {
    if (
        !change ||
        typeof change !== "object"
    ) {
        throw new ProjectEvolutionError(
            "Evolution change must be an object.",
            change
        );
    }

    assertNonEmptyString(
        change.shellId,
        "Evolution change.shellId"
    );

    assertOperation(
        change.operation
    );

    if (
        change.operation !== "CREATE"
    ) {
        assertPositiveInteger(
            change.baseVersion,
            "Evolution change.baseVersion"
        );

        assertHash(
            change.baseHash,
            "Evolution change.baseHash"
        );
    }

    if (
        change.shell &&
        typeof change.shell !== "object"
    ) {
        throw new ProjectEvolutionError(
            "Evolution change.shell must be an object.",
            change.shell
        );
    }
}

function assertEvolutionRequest(request) {
    if (
        !request ||
        typeof request !== "object"
    ) {
        throw new ProjectEvolutionError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.type !== "EvolutionRequest"
    ) {
        throw new ProjectEvolutionError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.schemaVersion !== 1
    ) {
        throw new ProjectEvolutionError(
            "Unsupported EvolutionRequest schema version.",
            request.schemaVersion
        );
    }

    assertHash(
        request.baseSnapshotHash,
        "EvolutionRequest.baseSnapshotHash"
    );

    assertNonEmptyString(
        request.intent,
        "EvolutionRequest.intent"
    );

    if (!Array.isArray(request.baseShells)) {
        throw new ProjectEvolutionError(
            "EvolutionRequest.baseShells must be an array.",
            request.baseShells
        );
    }

    if (!Array.isArray(request.changes)) {
        throw new ProjectEvolutionError(
            "EvolutionRequest.changes must be an array.",
            request.changes
        );
    }

    if (
        request.baseShells.length === 0 &&
        request.changes.length === 0
    ) {
        throw new ProjectEvolutionError(
            "EvolutionRequest must contain baseShells or changes."
        );
    }

    for (const shell of request.baseShells) {
        assertBaseShell(shell);
    }

    for (const change of request.changes) {
        assertChange(change);
    }
}

function createEvolutionRequest({
    baseSnapshotHash,
    intent,
    baseShells = [],
    changes = []
}) {
    const request = {
        type: "EvolutionRequest",
        schemaVersion: 1,

        baseSnapshotHash,

        intent,

        baseShells: [...baseShells],

        changes: [...changes]
    };

    assertEvolutionRequest(request);

    return request;
}

function serializeEvolutionRequest(request) {
    assertEvolutionRequest(request);

    return JSON.stringify(
        request,
        null,
        2
    );
}

function parseEvolutionRequest(serialized) {
    if (
        typeof serialized !== "string"
    ) {
        throw new ProjectEvolutionError(
            "Expected serialized EvolutionRequest string.",
            serialized
        );
    }

    let request;

    try {
        request = JSON.parse(
            serialized
        );
    } catch (error) {
        throw new ProjectEvolutionError(
            "Invalid serialized EvolutionRequest JSON."
        );
    }

    assertEvolutionRequest(request);

    return request;
}

function cloneEvolutionRequest(request) {
    return parseEvolutionRequest(
        serializeEvolutionRequest(request)
    );
}

module.exports = {
    ProjectEvolutionError,
    assertEvolutionRequest,
    createEvolutionRequest,
    serializeEvolutionRequest,
    parseEvolutionRequest,
    cloneEvolutionRequest
};
