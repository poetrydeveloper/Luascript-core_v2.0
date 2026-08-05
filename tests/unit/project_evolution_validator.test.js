// tests/unit/project_evolution_validator.test.js

const assert = require("assert");

const {
    validateEvolutionPlan
} = require(
    "../../compiler/project/evolution_validator"
);

const HASH =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

const plan = {
    type:
        "EvolutionPlan",

    schemaVersion:
        1,

    baseSnapshotHash:
        HASH,

    intent:
        "Add pistol support to the weapon system.",

    affectedShells: [
        "systems.weapon"
    ],

    changes: [
        {
            shellId:
                "weapon-system",

            operation:
                "UPDATE",

            path:
                "systems.weapon",

            baseVersion:
                1,

            baseHash:
                HASH,

            reason:
                null
        }
    ]
};

try {
    const validated =
        validateEvolutionPlan(
            plan
        );

    assert.strictEqual(
        validated.type,
        "ValidatedEvolutionPlan"
    );

    assert.strictEqual(
        validated.schemaVersion,
        1
    );

    assert.strictEqual(
        validated.plan.type,
        "EvolutionPlan"
    );

    assert.strictEqual(
        validated.plan.changes.length,
        1
    );

    assert.strictEqual(
        validated.plan.changes[0].shellId,
        "weapon-system"
    );

    assert.throws(
        () =>
            validateEvolutionPlan({
                ...plan,
                changes: [
                    {
                        ...plan.changes[0],
                        operation: "DELETE"
                    }
                ]
            }),
        /Unsupported evolution operation/
    );

    assert.throws(
        () =>
            validateEvolutionPlan({
                ...plan,
                affectedShells: []
            }),
        /missing from affectedShells/
    );

    console.log(
        "PROJECT EVOLUTION VALIDATOR OK"
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION VALIDATOR FAILED"
    );

    console.error(error);

    process.exit(1);
}
