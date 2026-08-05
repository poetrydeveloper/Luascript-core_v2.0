// compiler/project/evolution_run_result.js
//
// EvolutionRunResult contract.
//
// This module owns only:
// - creation of the final gateway result;
// - validation of its structure.
//
// It does not execute evolution.
// It does not resolve projects.
// It does not weave, compile, or emit.

class EvolutionRunResultError extends Error {
    constructor(message, value = null) {
        super(message);

        this.name =
            "EvolutionRunResultError";

        this.code =
            "LS022";

        this.value =
            value;
    }
}

function assertObject(
    value,
    message
) {
    if (
        !value ||
        typeof value !== "object"
    ) {
        throw new EvolutionRunResultError(
            message,
            value
        );
    }
}

function assertType(
    value,
    type,
    message
) {
    if (
        !value ||
        value.type !== type
    ) {
        throw new EvolutionRunResultError(
            message,
            value
        );
    }
}

function assertSchemaVersion(
    value,
    type
) {
    if (
        value.schemaVersion !== 1
    ) {
        throw new EvolutionRunResultError(
            `Unsupported ${type} schema version.`,
            value.schemaVersion
        );
    }
}

function createEvolutionRunResult({
    request,
    execution,
    state,
    resolved,
    woven,
    compiled,
    emitted
}) {
    assertObject(
        request,
        "EvolutionRunResult request is required."
    );

    assertObject(
        execution,
        "EvolutionRunResult execution is required."
    );

    assertObject(
        state,
        "EvolutionRunResult state is required."
    );

    assertObject(
        resolved,
        "EvolutionRunResult resolved project is required."
    );

    assertObject(
        woven,
        "EvolutionRunResult woven project is required."
    );

    assertObject(
        compiled,
        "EvolutionRunResult compiled project is required."
    );

    assertObject(
        emitted,
        "EvolutionRunResult emitted project is required."
    );

    return {
        type:
            "EvolutionRunResult",

        schemaVersion:
            1,

        request,
        execution,
        state,
        resolved,
        woven,
        compiled,
        emitted
    };
}

function validateEvolutionRunResult(
    result
) {
    assertObject(
        result,
        "Expected EvolutionRunResult."
    );

    assertType(
        result,
        "EvolutionRunResult",
        "Expected EvolutionRunResult."
    );

    assertSchemaVersion(
        result,
        "EvolutionRunResult"
    );

    assertObject(
        result.request,
        "EvolutionRunResult.request is required."
    );

    assertObject(
        result.execution,
        "EvolutionRunResult.execution is required."
    );

    assertObject(
        result.state,
        "EvolutionRunResult.state is required."
    );

    assertType(
        result.resolved,
        "ResolvedProject",
        "EvolutionRunResult.resolved must be a ResolvedProject."
    );

    assertType(
        result.woven,
        "WovenProject",
        "EvolutionRunResult.woven must be a WovenProject."
    );

    assertType(
        result.compiled,
        "CompiledProject",
        "EvolutionRunResult.compiled must be a CompiledProject."
    );

    assertType(
        result.emitted,
        "EmittedProject",
        "EvolutionRunResult.emitted must be an EmittedProject."
    );

    return result;
}

module.exports = {
    EvolutionRunResultError,
    createEvolutionRunResult,
    validateEvolutionRunResult
};
