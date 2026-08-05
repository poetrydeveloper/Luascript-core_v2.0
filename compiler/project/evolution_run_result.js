// compiler/project/evolution_run_result.js
//
// Evolution Run Result.
//
// Immutable contract for the complete evolution pipeline.
//
// EvolutionRunResult
//      |
//      ├── request
//      ├── execution
//      ├── state
//      ├── resolved
//      ├── woven
//      ├── compiled
//      └── emitted
//

class EvolutionRunResultError extends Error {
    constructor(
        message,
        value = null
    ) {
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
    assertObject(
        value,
        message
    );

    if (
        value.type !== type
    ) {
        throw new EvolutionRunResultError(
            message,
            value
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
    assertType(
        request,
        "EvolutionRequest",
        "Expected EvolutionRequest."
    );

    assertObject(
        execution,
        "Expected EvolutionResult."
    );

    if (
        execution.type !==
        "EvolutionResult"
    ) {
        throw new EvolutionRunResultError(
            "Expected EvolutionResult.",
            execution
        );
    }

    assertType(
        state,
        "ProjectState",
        "Expected ProjectState."
    );

    assertType(
        resolved,
        "ResolvedProject",
        "Expected ResolvedProject."
    );

    assertObject(
        woven,
        "Expected WovenProject."
    );

    assertObject(
        compiled,
        "Expected CompiledProject."
    );

    assertObject(
        emitted,
        "Expected EmittedProject."
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
    assertType(
        result,
        "EvolutionRunResult",
        "Expected EvolutionRunResult."
    );

    if (
        result.schemaVersion !== 1
    ) {
        throw new EvolutionRunResultError(
            "Unsupported EvolutionRunResult schema version.",
            result.schemaVersion
        );
    }

    assertType(
        result.request,
        "EvolutionRequest",
        "EvolutionRunResult.request must be EvolutionRequest."
    );

    assertType(
        result.execution,
        "EvolutionResult",
        "EvolutionRunResult.execution must be EvolutionResult."
    );

    assertType(
        result.state,
        "ProjectState",
        "EvolutionRunResult.state must be ProjectState."
    );

    assertType(
        result.resolved,
        "ResolvedProject",
        "EvolutionRunResult.resolved must be ResolvedProject."
    );

    assertObject(
        result.woven,
        "EvolutionRunResult.woven must be an object."
    );

    assertObject(
        result.compiled,
        "EvolutionRunResult.compiled must be an object."
    );

    assertObject(
        result.emitted,
        "EvolutionRunResult.emitted must be an object."
    );

    return result;
}

function cloneEvolutionRunResult(
    result
) {
    validateEvolutionRunResult(
        result
    );

    return JSON.parse(
        JSON.stringify(
            result
        )
    );
}

module.exports = {
    EvolutionRunResultError,
    createEvolutionRunResult,
    validateEvolutionRunResult,
    cloneEvolutionRunResult
};
