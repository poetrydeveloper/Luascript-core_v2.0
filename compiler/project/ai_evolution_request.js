// compiler/project/ai_evolution_request.js
//
// AI Evolution Request Adapter
//
// Purpose:
//
// Convert an AI-facing AITask / AI proposal into the
// canonical EvolutionRequest contract already used by:
//
//     evolution.js
//     evolution_planner.js
//     evolution_executor.js
//
// This module does NOT mutate:
//
//     ShellRepository
//     ProjectTree
//
// It only resolves trusted project information and creates
// a deterministic EvolutionRequest.
//
// Canonical contract:
//
//     EvolutionRequest
//         baseSnapshotHash
//         baseShells[]
//         changes[]
//
// IMPORTANT:
//
// AI-provided path information is NOT trusted.
// AI-provided version information is checked against
// the supplied ProjectContext.
//
// The ProjectContext remains authoritative.

class AIEvolutionRequestError extends Error {
    constructor(
        message,
        value = null
    ) {
        super(message);

        this.name =
            "AIEvolutionRequestError";

        this.code =
            "LS015";

        this.value =
            value;
    }
}


/*
 * ------------------------------------------------------------
 * Validation helpers
 * ------------------------------------------------------------
 */

function assertHash(
    value,
    fieldName
) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(
            value
        )
    ) {
        throw new AIEvolutionRequestError(
            `${fieldName} must be a SHA-256 hexadecimal hash.`,
            value
        );
    }
}


function assertString(
    value,
    fieldName
) {
    if (
        typeof value !== "string" ||
        value.trim().length === 0
    ) {
        throw new AIEvolutionRequestError(
            `${fieldName} must be a non-empty string.`,
            value
        );
    }
}


function assertPositiveInteger(
    value,
    fieldName
) {
    if (
        !Number.isInteger(value) ||
        value < 1
    ) {
        throw new AIEvolutionRequestError(
            `${fieldName} must be a positive integer.`,
            value
        );
    }
}


/*
 * ------------------------------------------------------------
 * ProjectContext
 * ------------------------------------------------------------
 */

function assertProjectContext(
    context
) {
    if (
        !context ||
        typeof context !== "object"
    ) {
        throw new AIEvolutionRequestError(
            "Expected ProjectContext.",
            context
        );
    }

    if (
        context.type !==
        "ProjectContext"
    ) {
        throw new AIEvolutionRequestError(
            "Expected ProjectContext.",
            context
        );
    }

    if (
        context.schemaVersion !== 1
    ) {
        throw new AIEvolutionRequestError(
            "Unsupported ProjectContext schema version.",
            context.schemaVersion
        );
    }

    if (
        !context.project ||
        typeof context.project !==
            "object"
    ) {
        throw new AIEvolutionRequestError(
            "ProjectContext.project is required.",
            context
        );
    }

    assertHash(
        context.project.snapshotHash,
        "ProjectContext.project.snapshotHash"
    );

    if (
        !Array.isArray(
            context.shells
        )
    ) {
        throw new AIEvolutionRequestError(
            "ProjectContext.shells must be an array.",
            context.shells
        );
    }
}


/*
 * ------------------------------------------------------------
 * AITask
 * ------------------------------------------------------------
 */

function assertAITask(
    task
) {
    if (
        !task ||
        typeof task !== "object"
    ) {
        throw new AIEvolutionRequestError(
            "Expected AITask.",
            task
        );
    }

    if (
        task.type !==
        "AITask"
    ) {
        throw new AIEvolutionRequestError(
            "Expected AITask.",
            task
        );
    }

    if (
        task.schemaVersion !== 1
    ) {
        throw new AIEvolutionRequestError(
            "Unsupported AITask schema version.",
            task.schemaVersion
        );
    }

    assertHash(
        task.snapshotHash,
        "AITask.snapshotHash"
    );

    assertString(
        task.intent,
        "AITask.intent"
    );

    if (
        !Array.isArray(
            task.changes
        )
    ) {
        throw new AIEvolutionRequestError(
            "AITask.changes must be an array.",
            task.changes
        );
    }

    if (
        task.changes.length === 0
    ) {
        throw new AIEvolutionRequestError(
            "AITask must contain at least one change."
        );
    }
}


/*
 * ------------------------------------------------------------
 * Shell lookup
 * ------------------------------------------------------------
 */

function findShell(
    context,
    shellId
) {
    return (
        context.shells.find(
            shell =>
                shell &&
                shell.id === shellId
        ) ||
        null
    );
}


/*
 * ------------------------------------------------------------
 * Operation normalization
 * ------------------------------------------------------------
 *
 * AI-facing code has historically used several names.
 *
 * Canonical EvolutionRequest uses:
 *
 *     CREATE
 *     UPDATE
 *     REFACTOR
 *     DELETE
 *
 * We normalize only aliases that have an unambiguous meaning.
 */

function normalizeOperation(
    operation
) {
    if (
        operation === "ADD"
    ) {
        return "CREATE";
    }

    if (
        operation === "REMOVE"
    ) {
        return "DELETE";
    }

    if (
        operation === "CREATE" ||
        operation === "UPDATE" ||
        operation === "REFACTOR" ||
        operation === "DELETE"
    ) {
        return operation;
    }

    throw new AIEvolutionRequestError(
        `Unsupported AI evolution operation '${operation}'.`,
        operation
    );
}


/*
 * ------------------------------------------------------------
 * Build base shell
 * ------------------------------------------------------------
 */

function createBaseShell(
    shell
) {
    return {
        shellId:
            shell.id,

        version:
            shell.version,

        hash:
            shell.hash,

        path:
            shell.path
    };
}


/*
 * ------------------------------------------------------------
 * Build change
 * ------------------------------------------------------------
 */

function createChange(
    context,
    taskChange
) {
    assertString(
        taskChange.shellId,
        "AITask change.shellId"
    );

    const shell =
        findShell(
            context,
            taskChange.shellId
        );

    const operation =
        normalizeOperation(
            taskChange.operation
        );

    /*
     * CREATE does not require an
     * existing Shell.
     */

    if (
        operation === "CREATE"
    ) {
        return {
            shellId:
                taskChange.shellId,

            operation,

            baseVersion:
                null,

            baseHash:
                null,

            path:
                taskChange.path ||
                null,

            reason:
                taskChange.reason ||
                null,

            ...(taskChange.shell
                ? {
                    shell:
                        taskChange.shell
                }
                : {})
        };
    }

    /*
     * UPDATE / REFACTOR / DELETE
     * must reference an actual
     * Shell visible in context.
     */

    if (!shell) {
        throw new AIEvolutionRequestError(
            `AI referenced unknown Shell '${taskChange.shellId}'.`,
            taskChange
        );
    }

    if (
        taskChange.baseVersion !==
        undefined &&
        taskChange.baseVersion !==
        null
    ) {
        assertPositiveInteger(
            taskChange.baseVersion,
            "AITask change.baseVersion"
        );

        if (
            taskChange.baseVersion !==
            shell.version
        ) {
            throw new AIEvolutionRequestError(
                `AI proposal for Shell '${shell.id}' is based on version ${taskChange.baseVersion}, but the supplied ProjectContext contains version ${shell.version}.`,
                {
                    shellId:
                        shell.id,

                    proposedVersion:
                        taskChange.baseVersion,

                    contextVersion:
                        shell.version
                }
            );
        }
    }

    return {
        shellId:
            shell.id,

        operation,

        path:
            shell.path,

        baseVersion:
            shell.version,

        baseHash:
            shell.hash,

        reason:
            taskChange.reason ||
            null,

        ...(taskChange.proposal
            ? {
                shell:
                    taskChange.proposal
            }
            : {})
    };
}


/*
 * ------------------------------------------------------------
 * Main adapter
 * ------------------------------------------------------------
 */

function createEvolutionRequestFromAITask(
    context,
    task
) {
    assertProjectContext(
        context
    );

    assertAITask(
        task
    );

    /*
     * The task must be bound to
     * the exact ProjectContext.
     */

    if (
        task.snapshotHash !==
        context.project.snapshotHash
    ) {
        throw new AIEvolutionRequestError(
            "AITask snapshot does not match ProjectContext.",
            {
                taskSnapshot:
                    task.snapshotHash,

                contextSnapshot:
                    context.project.snapshotHash
            }
        );
    }

    const changes =
        task.changes.map(
            change =>
                createChange(
                    context,
                    change
                )
        );

    const baseShellMap =
        new Map();

    for (const change of changes) {
        if (
            change.operation ===
            "CREATE"
        ) {
            continue;
        }

        const shell =
            findShell(
                context,
                change.shellId
            );

        if (
            !shell
        ) {
            throw new AIEvolutionRequestError(
                `Could not resolve base Shell '${change.shellId}'.`
            );
        }

        if (
            !baseShellMap.has(
                shell.id
            )
        ) {
            baseShellMap.set(
                shell.id,
                createBaseShell(
                    shell
                )
            );
        }
    }

    const baseShells =
        Array.from(
            baseShellMap.values()
        ).sort(
            (a, b) =>
                a.shellId.localeCompare(
                    b.shellId
                )
        );

    return {
        type:
            "EvolutionRequest",

        schemaVersion:
            1,

        baseSnapshotHash:
            context.project.snapshotHash,

        intent:
            task.intent.trim(),

        baseShells,

        changes
    };
}


/*
 * ------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------
 */

module.exports = {
    AIEvolutionRequestError,
    createEvolutionRequestFromAITask
};
