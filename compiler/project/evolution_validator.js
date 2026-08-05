// compiler/project/evolution_validator.js
//
// Deterministic EvolutionPlan Validator.
//
// Purpose:
// - validate an EvolutionPlan before execution;
// - verify snapshot binding;
// - verify affected shells;
// - verify every planned change;
// - perform no mutation.
//
// Pipeline:
//
// EvolutionRequest
//      |
//      v
// EvolutionPlanner
//      |
//      v
// EvolutionPlan
//      |
//      v
// EvolutionValidator
//      |
//      v
// ProjectEvolutionExecutor

class EvolutionValidatorError extends Error {
    constructor(message, value = null) {
        super(message);

        this.name =
            "EvolutionValidatorError";

        this.code =
            "LS019";

        this.value =
            value;
    }
}

function assertHash(value, fieldName) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(value)
    ) {
        throw new EvolutionValidatorError(
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
        throw new EvolutionValidatorError(
            `${fieldName} must be a non-empty string.`,
            value
        );
    }
}

function assertPositiveInteger(value, fieldName) {
    if (
        !Number.isInteger(value) ||
        value < 1
    ) {
        throw new EvolutionValidatorError(
            `${fieldName} must be a positive integer.`,
            value
        );
    }
}

function assertPlan(plan) {
    if (
        !plan ||
        typeof plan !== "object"
    ) {
        throw new EvolutionValidatorError(
            "Expected EvolutionPlan.",
            plan
        );
    }

    if (
        plan.type !== "EvolutionPlan"
    ) {
        throw new EvolutionValidatorError(
            "Expected EvolutionPlan.",
            plan
        );
    }

    if (
        plan.schemaVersion !== 1
    ) {
        throw new EvolutionValidatorError(
            "Unsupported EvolutionPlan schema version.",
            plan.schemaVersion
        );
    }

    assertHash(
        plan.baseSnapshotHash ||
        plan.snapshotHash,
        "EvolutionPlan snapshotHash"
    );

    assertNonEmptyString(
        plan.intent,
        "EvolutionPlan.intent"
    );

    if (
        !Array.isArray(plan.affectedShells)
    ) {
        throw new EvolutionValidatorError(
            "EvolutionPlan.affectedShells must be an array.",
            plan.affectedShells
        );
    }

    if (
        !Array.isArray(plan.changes)
    ) {
        throw new EvolutionValidatorError(
            "EvolutionPlan.changes must be an array.",
            plan.changes
        );
    }

    for (
        const path
        of plan.affectedShells
    ) {
        assertNonEmptyString(
            path,
            "EvolutionPlan.affectedShells entry"
        );
    }

    const affected =
        new Set(
            plan.affectedShells
        );

    for (
        const change
        of plan.changes
    ) {
        if (
            !change ||
            typeof change !== "object"
        ) {
            throw new EvolutionValidatorError(
                "EvolutionPlan change must be an object.",
                change
            );
        }

        assertNonEmptyString(
            change.shellId,
            "EvolutionPlan change.shellId"
        );

        if (
            change.operation !== "UPDATE"
        ) {
            throw new EvolutionValidatorError(
                `Unsupported evolution operation '${change.operation}'.`,
                change
            );
        }

        assertNonEmptyString(
            change.path,
            "EvolutionPlan change.path"
        );

        assertPositiveInteger(
            change.baseVersion,
            "EvolutionPlan change.baseVersion"
        );

        assertHash(
            change.baseHash,
            "EvolutionPlan change.baseHash"
        );

        if (
            !affected.has(
                change.path
            )
        ) {
            throw new EvolutionValidatorError(
                "EvolutionPlan change.path is missing from affectedShells.",
                change
            );
        }
    }

    return true;
}

function validateEvolutionPlan(plan) {
    assertPlan(plan);

    return {
        type:
            "ValidatedEvolutionPlan",

        schemaVersion:
            1,

        plan
    };
}

function serializeValidatedEvolutionPlan(
    validated
) {
    if (
        !validated ||
        validated.type !==
            "ValidatedEvolutionPlan"
    ) {
        throw new EvolutionValidatorError(
            "Expected ValidatedEvolutionPlan.",
            validated
        );
    }

    assertPlan(
        validated.plan
    );

    return JSON.stringify(
        validated,
        null,
        2
    );
}

module.exports = {
    EvolutionValidatorError,
    validateEvolutionPlan,
    serializeValidatedEvolutionPlan
};
