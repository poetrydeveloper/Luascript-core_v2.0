// compiler/project/evolution_planner.js
//
// Evolution Planner.
//
// Purpose:
// - convert an AI evolution intent into an explicit change plan;
// - identify the Shells involved in the evolution;
// - keep the plan bound to the exact ProjectContext snapshot;
// - prevent accidental planning against another project state.
//
// IMPORTANT:
// Planner does NOT mutate ProjectTree.
// Planner does NOT modify ShellRepository.
// Planner does NOT compile Luau.
//
// Pipeline:
//
// AI Project Context
//        |
//        v
// EvolutionRequest
//        |
//        v
// EvolutionPlanner
//        |
//        v
// EvolutionPlan
//        |
//        v
// EvolutionValidator
//

class EvolutionPlannerError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "EvolutionPlannerError";
        this.code = "LS013";
        this.value = value;
    }
}

function assertHash(value, fieldName) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(value)
    ) {
        throw new EvolutionPlannerError(
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
        throw new EvolutionPlannerError(
            `${fieldName} must be a non-empty string.`,
            value
        );
    }
}

function assertEvolutionRequest(request) {
    if (
        !request ||
        typeof request !== "object"
    ) {
        throw new EvolutionPlannerError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.type !== "EvolutionRequest"
    ) {
        throw new EvolutionPlannerError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.schemaVersion !== 1
    ) {
        throw new EvolutionPlannerError(
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
        throw new EvolutionPlannerError(
            "EvolutionRequest.baseShells must be an array.",
            request.baseShells
        );
    }

    if (!Array.isArray(request.changes)) {
        throw new EvolutionPlannerError(
            "EvolutionRequest.changes must be an array.",
            request.changes
        );
    }
}

function assertProjectContext(context) {
    if (
        !context ||
        typeof context !== "object"
    ) {
        throw new EvolutionPlannerError(
            "Expected ProjectContext.",
            context
        );
    }

    if (
        context.type !== "ProjectContext"
    ) {
        throw new EvolutionPlannerError(
            "Expected ProjectContext.",
            context
        );
    }

    if (
        context.schemaVersion !== 1
    ) {
        throw new EvolutionPlannerError(
            "Unsupported ProjectContext schema version.",
            context.schemaVersion
        );
    }

    if (!context.project) {
        throw new EvolutionPlannerError(
            "ProjectContext.project is required.",
            context
        );
    }

    assertHash(
        context.project.snapshotHash,
        "ProjectContext.project.snapshotHash"
    );

    if (!Array.isArray(context.shells)) {
        throw new EvolutionPlannerError(
            "ProjectContext.shells must be an array.",
            context.shells
        );
    }
}

function findShell(context, shellId) {
    return context.shells.find(
        shell => shell.id === shellId
    ) || null;
}

function findShellByPath(context, path) {
    return context.shells.find(
        shell => shell.path === path
    ) || null;
}

function createPlanChange({
    requestChange,
    contextShell
}) {
    const operation =
        requestChange.operation;

    const change = {
        shellId:
            requestChange.shellId,

        operation,

        path:
            contextShell
                ? contextShell.path
                : (
                    requestChange.shell?.position?.path ||
                    null
                ),

        baseVersion:
            contextShell
                ? contextShell.version
                : (
                    requestChange.baseVersion ||
                    null
                ),

        baseHash:
            contextShell
                ? contextShell.hash
                : (
                    requestChange.baseHash ||
                    null
                ),

        reason:
            requestChange.reason ||
            null
    };

    if (requestChange.shell) {
        change.shell =
            requestChange.shell;
    }

    return change;
}

function planEvolution(
    context,
    request
) {
    assertProjectContext(context);
    assertEvolutionRequest(request);

    const contextSnapshotHash =
        context.project.snapshotHash;

    if (
        contextSnapshotHash !==
        request.baseSnapshotHash
    ) {
        throw new EvolutionPlannerError(
            "EvolutionRequest snapshot does not match ProjectContext.",
            {
                expected:
                    request.baseSnapshotHash,

                received:
                    contextSnapshotHash
            }
        );
    }

    const plannedChanges = [];

    for (
        const requestChange
        of request.changes
    ) {
        const contextShell =
            findShell(
                context,
                requestChange.shellId
            );

        if (
            requestChange.operation !==
            "CREATE" &&
            !contextShell
        ) {
            throw new EvolutionPlannerError(
                `Shell '${requestChange.shellId}' was not found in ProjectContext.`,
                requestChange
            );
        }

        plannedChanges.push(
            createPlanChange({
                requestChange,
                contextShell
            })
        );
    }

    const affectedShells = [];

    for (
        const change
        of plannedChanges
    ) {
        if (
            change.path &&
            !affectedShells.includes(
                change.path
            )
        ) {
            affectedShells.push(
                change.path
            );
        }
    }

    affectedShells.sort();

    return {
        type:
            "EvolutionPlan",

        schemaVersion:
            1,

        baseSnapshotHash:
            contextSnapshotHash,

        intent:
            request.intent,

        affectedShells,

        changes:
            plannedChanges
    };
}

function serializeEvolutionPlan(plan) {
    if (
        !plan ||
        typeof plan !== "object"
    ) {
        throw new EvolutionPlannerError(
            "Expected EvolutionPlan.",
            plan
        );
    }

    if (
        plan.type !== "EvolutionPlan"
    ) {
        throw new EvolutionPlannerError(
            "Expected EvolutionPlan.",
            plan
        );
    }

    if (
        plan.schemaVersion !== 1
    ) {
        throw new EvolutionPlannerError(
            "Unsupported EvolutionPlan schema version.",
            plan.schemaVersion
        );
    }

    assertHash(
        plan.baseSnapshotHash,
        "EvolutionPlan.baseSnapshotHash"
    );

    assertNonEmptyString(
        plan.intent,
        "EvolutionPlan.intent"
    );

    if (
        !Array.isArray(plan.affectedShells)
    ) {
        throw new EvolutionPlannerError(
            "EvolutionPlan.affectedShells must be an array.",
            plan.affectedShells
        );
    }

    if (
        !Array.isArray(plan.changes)
    ) {
        throw new EvolutionPlannerError(
            "EvolutionPlan.changes must be an array.",
            plan.changes
        );
    }

    return JSON.stringify(
        plan,
        null,
        2
    );
}

function parseEvolutionPlan(serialized) {
    if (
        typeof serialized !== "string"
    ) {
        throw new EvolutionPlannerError(
            "Expected serialized EvolutionPlan string.",
            serialized
        );
    }

    let plan;

    try {
        plan =
            JSON.parse(serialized);
    } catch (error) {
        throw new EvolutionPlannerError(
            "Invalid serialized EvolutionPlan JSON."
        );
    }

    // Reuse serializer validation.
    serializeEvolutionPlan(plan);

    return plan;
}

function cloneEvolutionPlan(plan) {
    return parseEvolutionPlan(
        serializeEvolutionPlan(plan)
    );
}

module.exports = {
    EvolutionPlannerError,
    planEvolution,
    serializeEvolutionPlan,
    parseEvolutionPlan,
    cloneEvolutionPlan,
    findShell,
    findShellByPath
};
