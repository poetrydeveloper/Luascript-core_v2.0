// tests/unit/project_ai_evolution.test.js

const assert = require("assert");

const {
    AIEvolutionBoundary
} = require(
    "../../compiler/project/ai_evolution"
);

const HASH =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const context = {
    type: "AIProjectContext",
    schemaVersion: 1,

    snapshotHash: HASH,

    shellCount: 3,

    shells: [
        {
            id: "systems",
            path: "systems",
            parent: null,
            order: 0,
            version: 1,
            generation: 1,
            actual: true,
            name: "systems",
            purpose: "Root systems.",
            tags: [
                "system"
            ],
            description:
                "Root project systems."
        },

        {
            id: "weapon-system",
            path: "systems.weapon",
            parent: "systems",
            order: 0,
            version: 1,
            generation: 1,
            actual: true,
            name: "weapon-system",
            purpose:
                "Controls weapon behavior.",
            tags: [
                "system",
                "weapon"
            ],
            description:
                "Weapon system."
        },

        {
            id: "weapon-timer-system",
            path:
                "systems.weapon.timer",
            parent:
                "systems.weapon",
            order: 0,
            version: 1,
            generation: 1,
            actual: true,
            name:
                "weapon-timer-system",
            purpose:
                "Updates weapon cooldown state.",
            tags: [
                "system",
                "weapon",
                "timer"
            ],
            description:
                "Weapon timer system."
        }
    ]
};

try {
    const boundary =
        new AIEvolutionBoundary();

    /*
     * Simulate what an AI model would return.
     *
     * Notice that the proposal does NOT control the snapshot
     * hash and does NOT control the trusted project path.
     */
    const proposal = {
        intent:
            "Add pistol support to the weapon system.",

        changes: [
            {
                shellId:
                    "weapon-system",

                operation:
                    "UPDATE",

                baseVersion:
                    1
            }
        ]
    };

    const request =
        boundary.createRequest(
            context,
            proposal
        );

    assert.strictEqual(
        request.type,
        "EvolutionRequest"
    );

    assert.strictEqual(
        request.schemaVersion,
        1
    );

    assert.strictEqual(
        request.snapshotHash,
        HASH
    );

    assert.strictEqual(
        request.intent,
        proposal.intent
    );

    assert.strictEqual(
        request.changes.length,
        1
    );

    assert.strictEqual(
        request.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        request.changes[0].path,
        "systems.weapon"
    );

    assert.strictEqual(
        request.changes[0].baseVersion,
        1
    );

    /*
     * Test 1:
     * Unknown Shell must be rejected.
     */
    assert.throws(
        () => {
            boundary.createRequest(
                context,
                {
                    intent:
                        "Modify unknown system.",

                    changes: [
                        {
                            shellId:
                                "unknown-system",

                            operation:
                                "UPDATE",

                            baseVersion:
                                1
                        }
                    ]
                }
            );
        },
        /unknown Shell/
    );

    /*
     * Test 2:
     * Stale version must be rejected.
     */
    assert.throws(
        () => {
            boundary.createRequest(
                context,
                {
                    intent:
                        "Modify weapon system.",

                    changes: [
                        {
                            shellId:
                                "weapon-system",

                            operation:
                                "UPDATE",

                            baseVersion:
                                99
                        }
                    ]
                }
            );
        },
        /based on version 99/
    );

    /*
     * Test 3:
     * Invalid operation must be rejected.
     */
    assert.throws(
        () => {
            boundary.createRequest(
                context,
                {
                    intent:
                        "Do something.",

                    changes: [
                        {
                            shellId:
                                "weapon-system",

                            operation:
                                "MAGIC",

                            baseVersion:
                                1
                        }
                    ]
                }
            );
        },
        /Unsupported AI evolution operation/
    );

    /*
     * Test 4:
     * Empty proposal must be rejected.
     */
    assert.throws(
        () => {
            boundary.createRequest(
                context,
                {
                    intent:
                        "Do something.",

                    changes: []
                }
            );
        },
        /contains no changes/
    );

    /*
     * Test 5:
     * AI cannot replace trusted context snapshot.
     *
     * There is deliberately a fake snapshotHash in the proposal.
     * The resulting request must still use the real context hash.
     */
    const maliciousProposal = {
        snapshotHash:
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

        intent:
            "Add pistol support.",

        changes: [
            {
                shellId:
                    "weapon-system",

                operation:
                    "UPDATE",

                baseVersion:
                    1
            }
        ]
    };

    const protectedRequest =
        boundary.createRequest(
            context,
            maliciousProposal
        );

    assert.strictEqual(
        protectedRequest.snapshotHash,
        HASH
    );

    /*
     * Test 6:
     * AI cannot move a Shell by supplying another path.
     */
    const pathAttackProposal = {
        intent:
            "Move weapon system.",

        changes: [
            {
                shellId:
                    "weapon-system",

                operation:
                    "UPDATE",

                baseVersion:
                    1,

                path:
                    "../../../outside-project"
            }
        ]
    };

    const protectedPathRequest =
        boundary.createRequest(
            context,
            pathAttackProposal
        );

    assert.strictEqual(
        protectedPathRequest.changes[0].path,
        "systems.weapon"
    );

    console.log(
        "PROJECT AI EVOLUTION OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    request.type,

                snapshotHash:
                    request.snapshotHash,

                intent:
                    request.intent,

                changes:
                    request.changes,

                securityChecks: {
                    unknownShellRejected: true,
                    staleVersionRejected: true,
                    invalidOperationRejected: true,
                    emptyProposalRejected: true,
                    snapshotOverrideRejected: true,
                    pathOverrideRejected: true
                }
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT AI EVOLUTION FAILED"
    );

    console.error(error);

    process.exit(1);
}
