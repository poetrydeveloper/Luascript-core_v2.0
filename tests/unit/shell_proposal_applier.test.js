// tests/unit/shell_proposal_applier.test.js

const assert = require("assert");

const {
    ShellProposalApplier
} = require(
    "../../compiler/project/shell_proposal_applier"
);

function makeExecutor() {
    return {
        execute(plan, candidate) {
            return {
                type: "EvolutionResult",

                schemaVersion: 1,

                snapshotHash:
                    plan.snapshotHash,

                intent:
                    plan.intent,

                changes: [
                    {
                        shellId:
                            candidate.identity.id,

                        path:
                            candidate.position.path,

                        version:
                            candidate.identity.version,

                        generation:
                            candidate.lifecycle.generation,

                        hash:
                            candidate.identity.hash,

                        supersedes:
                            candidate.lifecycle.supersedes
                    }
                ]
            };
        }
    };
}

function makePreparedProposal() {
    return {
        type:
            "PreparedShellProposal",

        schemaVersion:
            1,

        shellId:
            "weapon-system",

        operation:
            "UPDATE",

        baseVersion:
            1,

        baseHash:
            "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164",

        source:
`class WeaponSystem extends System do
end
# AURA_END`,

        tokens: [],

        ast: {
            type: "Program",
            declarations: []
        },

        astValidated: false,

        candidate: {
            type: "Shell",
            schemaVersion: 1,

            identity: {
                id:
                    "weapon-system",

                hash:
                    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

                version:
                    2
            },

            position: {
                path:
                    "systems.weapon",

                parent:
                    "systems",

                order:
                    0
            },

            lifecycle: {
                actual:
                    false,

                generation:
                    2,

                createdAt:
                    "2026-08-04T00:00:00.000Z",

                supersedes:
                    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164"
            },

            semantic: {
                name:
                    "WeaponSystem",

                purpose:
                    "Controls weapon behavior.",

                tags:
                    ["weapon"],

                description:
                    "Weapon system."
            },

            payload: {
                type:
                    "Program",

                declarations: []
            }
        }
    };
}

function makePlan() {
    return {
        type:
            "EvolutionPlan",

        schemaVersion:
            1,

        snapshotHash:
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

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
                    1
            }
        ]
    };
}

try {
    const executor =
        makeExecutor();

    const applier =
        new ShellProposalApplier(
            executor
        );

    const prepared =
        makePreparedProposal();

    const plan =
        makePlan();

    const result =
        applier.apply(
            prepared,
            plan
        );

    assert.strictEqual(
        result.type,
        "EvolutionResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.intent,
        plan.intent
    );

    assert.strictEqual(
        result.changes.length,
        1
    );

    assert.strictEqual(
        result.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        result.changes[0].version,
        2
    );

    assert.strictEqual(
        result.changes[0].generation,
        2
    );

    assert.strictEqual(
        result.changes[0].supersedes,
        prepared.baseHash
    );

    /*
     * Operation mismatch must be rejected.
     */

    assert.throws(
        () =>
            applier.apply(
                prepared,
                {
                    ...plan,

                    changes: [
                        {
                            ...plan.changes[0],

                            operation:
                                "DELETE"
                        }
                    ]
                }
            )
    );

    /*
     * Version mismatch must be rejected.
     */

    assert.throws(
        () =>
            applier.apply(
                prepared,
                {
                    ...plan,

                    changes: [
                        {
                            ...plan.changes[0],

                            baseVersion:
                                99
                        }
                    ]
                }
            )
    );

    /*
     * Missing shell change must be rejected.
     */

    assert.throws(
        () =>
            applier.apply(
                prepared,
                {
                    ...plan,

                    changes: []
                }
            )
    );

    console.log(
        "SHELL PROPOSAL APPLIER OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    result.type,

                shellId:
                    result.changes[0].shellId,

                version:
                    result.changes[0].version,

                generation:
                    result.changes[0].generation,

                supersedes:
                    result.changes[0].supersedes
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "SHELL PROPOSAL APPLIER FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
