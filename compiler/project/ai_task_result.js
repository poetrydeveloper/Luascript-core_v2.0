// compiler/project/ai_task_result.js
//
// Normalized result of an AI task.
//
// Boundary:
//
//     AITaskGateway
//          |
//          v
//     AITaskResult
//
// This module does NOT mutate:
//   - ProjectTree
//   - ShellRepository
//
// It only defines and validates the result
// returned by the AI task boundary.

class AITaskResultError extends Error {
    constructor(
        message,
        value = null
    ) {
        super(message);

        this.name =
            "AITaskResultError";

        this.code =
            "LS023";

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
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        throw new AITaskResultError(
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
        throw new AITaskResultError(
            message,
            value
        );
    }

    if (
        value.schemaVersion !== 1
    ) {
        throw new AITaskResultError(
            `Unsupported ${type} schema version.`,
            value.schemaVersion
        );
    }
}

function assertEvolutionRequest(
    request
) {
    assertType(
        request,
        "EvolutionRequest",
        "AITaskResult.request must be EvolutionRequest."
    );
}

function assertEvolutionRunResult(
    result
) {
    assertType(
        result,
        "EvolutionRunResult",
        "AITaskResult.evolutionRunResult must be EvolutionRunResult."
    );
}

function assertShells(
    shells
) {
    if (
        !Array.isArray(shells)
    ) {
        throw new AITaskResultError(
            "AITaskResult.proposedShells must be an array.",
            shells
        );
    }

    for (
        const shell of shells
    ) {
        assertObject(
            shell,
            "AITaskResult.proposedShells must contain objects."
        );

        if (
            shell.type !== "Shell"
        ) {
            throw new AITaskResultError(
                "AITaskResult.proposedShells must contain Shell objects.",
                shell
            );
        }

        if (
            shell.schemaVersion !== 1
        ) {
            throw new AITaskResultError(
                "Unsupported Shell schema version.",
                shell.schemaVersion
            );
        }
    }
}

function createAITaskResult({
    request,
    proposedShells = [],
    evolutionRunResult
}) {
    assertEvolutionRequest(
        request
    );

    assertShells(
        proposedShells
    );

    assertEvolutionRunResult(
        evolutionRunResult
    );

    return {
        type:
            "AITaskResult",

        schemaVersion:
            1,

        request,

        proposedShells,

        evolutionRunResult
    };
}

function validateAITaskResult(
    result
) {
    assertType(
        result,
        "AITaskResult",
        "Expected AITaskResult."
    );

    assertEvolutionRequest(
        result.request
    );

    assertShells(
        result.proposedShells
    );

    assertEvolutionRunResult(
        result.evolutionRunResult
    );

    return result;
}

function serializeAITaskResult(
    result
) {
    validateAITaskResult(
        result
    );

    return JSON.stringify(
        result,
        null,
        2
    );
}

function parseAITaskResult(
    serialized
) {
    if (
        typeof serialized !==
        "string"
    ) {
        throw new AITaskResultError(
            "Expected serialized AITaskResult string.",
            serialized
        );
    }

    let result;

    try {
        result =
            JSON.parse(
                serialized
            );
    } catch (error) {
        throw new AITaskResultError(
            "Invalid serialized AITaskResult JSON.",
            error
        );
    }

    return validateAITaskResult(
        result
    );
}

function cloneAITaskResult(
    result
) {
    return parseAITaskResult(
        serializeAITaskResult(
            result
        )
    );
}

module.exports = {
    AITaskResultError,
    createAITaskResult,
    validateAITaskResult,
    serializeAITaskResult,
    parseAITaskResult,
    cloneAITaskResult
};
