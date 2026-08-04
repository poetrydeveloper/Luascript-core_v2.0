// compiler/project/ai_task.js
//
// AI Task Protocol.
//
// Назначение:
// - принять задачу от внешнего AI;
// - привязать задачу к конкретному snapshot проекта;
// - не позволить AI подменить ProjectTree напрямую;
// - преобразовать естественно-языковую задачу в строгий EvolutionRequest;
// - сохранить границу между "что хочет AI" и "что разрешает Core".
//
// AI НЕ создаёт ProjectTree.
// AI НЕ меняет версии.
// AI НЕ меняет snapshot.
// AI НЕ назначает произвольные paths.
// AI только формирует намерение и предложения изменений.
//
// Deterministic Core затем:
// AI Task
//     ↓
// EvolutionRequest
//     ↓
// Planner
//     ↓
// Executor
//     ↓
// Validator
//     ↓
// Weaver
//     ↓
// Compiler
//     ↓
// Emitter

class AITaskError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "AITaskError";
        this.code = "LS011";
        this.value = value;
    }
}

function assertHash(value, fieldName) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(value)
    ) {
        throw new AITaskError(
            `${fieldName} must be a SHA-256 hexadecimal hash.`,
            value
        );
    }
}

function assertNonEmptyString(value, fieldName) {
    if (
        typeof value !== "string" ||
        value.trim().length === 0
    ) {
        throw new AITaskError(
            `${fieldName} must be a non-empty string.`,
            value
        );
    }
}

function assertOperation(operation) {
    const allowed = [
        "ADD",
        "UPDATE",
        "REMOVE"
    ];

    if (!allowed.includes(operation)) {
        throw new AITaskError(
            `Unsupported AI evolution operation '${operation}'.`,
            operation
        );
    }
}

function assertAIChange(change) {
    if (!change || typeof change !== "object") {
        throw new AITaskError(
            "AI change must be an object.",
            change
        );
    }

    assertNonEmptyString(
        change.shellId,
        "AI change shellId"
    );

    assertOperation(
        change.operation
    );

    if (
        change.path !== undefined &&
        change.path !== null
    ) {
        assertNonEmptyString(
            change.path,
            "AI change path"
        );
    }

    if (
        change.baseVersion !== undefined &&
        change.baseVersion !== null
    ) {
        if (
            !Number.isInteger(change.baseVersion) ||
            change.baseVersion < 1
        ) {
            throw new AITaskError(
                "AI change baseVersion must be a positive integer.",
                change.baseVersion
            );
        }
    }

    if (
        change.proposal !== undefined &&
        change.proposal !== null &&
        typeof change.proposal !== "object"
    ) {
        throw new AITaskError(
            "AI change proposal must be an object.",
            change.proposal
        );
    }
}

function assertAITask(task) {
    if (!task || typeof task !== "object") {
        throw new AITaskError(
            "Expected AITask.",
            task
        );
    }

    if (task.type !== "AITask") {
        throw new AITaskError(
            "Expected AITask.",
            task
        );
    }

    if (task.schemaVersion !== 1) {
        throw new AITaskError(
            "Unsupported AITask schema version.",
            task.schemaVersion
        );
    }

    assertHash(
        task.snapshotHash,
        "AITask snapshotHash"
    );

    assertNonEmptyString(
        task.intent,
        "AITask intent"
    );

    if (!Array.isArray(task.changes)) {
        throw new AITaskError(
            "AITask.changes must be an array.",
            task.changes
        );
    }

    if (task.changes.length === 0) {
        throw new AITaskError(
            "AITask must contain at least one change.",
            task.changes
        );
    }

    for (const change of task.changes) {
        assertAIChange(change);
    }
}

function createAITask({
    snapshotHash,
    intent,
    changes,
    constraints = []
}) {
    assertHash(
        snapshotHash,
        "snapshotHash"
    );

    assertNonEmptyString(
        intent,
        "intent"
    );

    if (!Array.isArray(changes) || changes.length === 0) {
        throw new AITaskError(
            "AITask requires at least one change.",
            changes
        );
    }

    for (const change of changes) {
        assertAIChange(change);
    }

    if (!Array.isArray(constraints)) {
        throw new AITaskError(
            "AITask.constraints must be an array.",
            constraints
        );
    }

    return {
        type: "AITask",
        schemaVersion: 1,
        snapshotHash,
        intent: intent.trim(),
        constraints: [...constraints],
        changes: changes.map(change => ({
            shellId: change.shellId,
            operation: change.operation,

            ...(change.path !== undefined
                ? { path: change.path }
                : {}),

            ...(change.baseVersion !== undefined
                ? { baseVersion: change.baseVersion }
                : {}),

            ...(change.proposal !== undefined
                ? { proposal: change.proposal }
                : {})
        }))
    };
}

function serializeAITask(task) {
    assertAITask(task);

    return JSON.stringify(
        task,
        null,
        2
    );
}

function parseAITask(serialized) {
    if (typeof serialized !== "string") {
        throw new AITaskError(
            "Expected serialized AITask string.",
            serialized
        );
    }

    let task;

    try {
        task = JSON.parse(serialized);
    } catch (error) {
        throw new AITaskError(
            "Invalid serialized AITask JSON."
        );
    }

    assertAITask(task);

    return task;
}

function cloneAITask(task) {
    return parseAITask(
        serializeAITask(task)
    );
}

/*
 * Converts the AI-facing task into the existing EvolutionRequest.
 *
 * Important:
 * - snapshotHash comes ONLY from the validated task;
 * - shellId comes ONLY from the task;
 * - baseVersion is preserved;
 * - the Core's EvolutionPlanner remains responsible for
 *   resolving paths and validating the actual project state.
 *
 * AI cannot inject a new snapshot or silently rewrite the tree.
 */
function toEvolutionRequest(task) {
    assertAITask(task);

    return {
        type: "EvolutionRequest",
        schemaVersion: 1,
        snapshotHash: task.snapshotHash,
        intent: task.intent,
        changes: task.changes.map(change => ({
            shellId: change.shellId,
            operation: change.operation,

            ...(change.baseVersion !== undefined
                ? { baseVersion: change.baseVersion }
                : {}),

            ...(change.proposal !== undefined
                ? { proposal: change.proposal }
                : {})
        }))
    };
}

module.exports = {
    AITaskError,
    assertAITask,
    createAITask,
    serializeAITask,
    parseAITask,
    cloneAITask,
    toEvolutionRequest
};
