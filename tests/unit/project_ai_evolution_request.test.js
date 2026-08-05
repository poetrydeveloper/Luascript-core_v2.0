// tests/unit/project_ai_evolution_request.test.js

const assert = require("assert");

const {
    createEvolutionRequestFromAITask,
    AIEvolutionRequestError
} = require(
    "../../compiler/project/ai_evolution_request"
);

const HASH =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const context = {
    type: "ProjectContext",
    schemaVersion: 1,

    project: {
        snapshotHash: HASH,
        shellCount: 2,
        rootCount: 1
    },

    tree: {
        roots: [
            "systems"
        ],

        paths: [
            "systems",
            "systems.weapon"
        ]
    },

    shells: [
        {
            id: "systems",
            path: "systems",
            parent: null,
            order: 0,
            version: 1,
            generation: 1,
            hash:
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            actual: true,

            semantic: {
                name: "systems",
                purpose: "Root systems.",
                tags: ["system"],
                description: "Root systems."
            }
        },

        {
            id: "weapon-system",
            path: "systems.weapon",
            parent: "systems",
            order: 0,
            version: 3,
            generation: 3,
            hash:
                "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
            actual: true,

            semantic: {
                name: "weapon-system",
                purpose: "Controls weapons.",
                tags: [
                    "system",
                    "weapon"
                ],
                description: "Weapon system."
            }
        }
    ]
};


try {
    const task = {
        type: "AITask",
        schemaVersion: 1,

        snapshotHash:
            HASH,

        intent:
            "Improve weapon behavior.",

        constraints: [],

        changes: [
            {
                shellId:
                    "weapon-system",

                operation:
                    "UPDATE",

                baseVersion:
                    3
            }
        ]
    };

    const request =
        createEvolutionRequestFromAITask(
            context,
            task
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
        request.baseSnapshotHash,
        HASH
    );

    assert.strictEqual(
        request.intent,
        task.intent
    );

    assert.strictEqual(
        request.baseShells.length,
        1
    );

    assert.strictEqual(
        request.baseShells[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        request.baseShells[0].version,
        3
    );

    assert.strictEqual(
        request.baseShells[0].hash,
        context.shells[1].hash
    );

    assert.strictEqual(
        request.baseShells[0].path,
        "systems.weapon"
    );

    assert.strictEqual(
        request.changes.length,
        1
    );

    assert.strictEqual(
        request.changes[0].operation,
        "UPDATE"
    );

    assert.strictEqual(
        request.changes[0].path,
        "systems.weapon"
    );

    assert.strictEqual(
        request.changes[0].baseVersion,
        3
    );

    assert.strictEqual(
        request.changes[0].baseHash,
        context.shells[1].hash
    );

    /*
     * CREATE does not require an
     * existing Shell.
     */

    const createTask = {
        type: "AITask",
        schemaVersion: 1,

        snapshotHash:
            HASH,

        intent:
            "Create a weapon timer.",

        constraints: [],

        changes: [
            {
                shellId:
                    "weapon-timer-system",

                operation:
                    "CREATE"
            }
        ]
    };

    const createRequest =
        createEvolutionRequestFromAITask(
            context,
            createTask
        );

    assert.strictEqual(
        createRequest.changes[0].operation,
        "CREATE"
    );

    assert.strictEqual(
        createRequest.baseShells.length,
        0
    );

    /*
     * Stale snapshot must be rejected.
     */

    assert.throws(
        () =>
            createEvolutionRequestFromAITask(
                context,
                {
                    ...task,
                    snapshotHash:
                        "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
                }
            ),
        error =>
            error instanceof
            AIEvolutionRequestError
    );

    /*
     * Stale Shell version must be rejected.
     */

    assert.throws(
        () =>
            createEvolutionRequestFromAITask(
                context,
                {
                    ...task,
                    changes: [
                        {
                            ...task.changes[0],
                            baseVersion: 99
                        }
                    ]
                }
            ),
        /based on version 99/
    );

    /*
     * Unknown Shell must be rejected.
     */

    assert.throws(
        () =>
            createEvolutionRequestFromAITask(
                context,
                {
                    ...task,
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
            ),
        /unknown Shell/
    );

    console.log(
        "PROJECT AI EVOLUTION REQUEST OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    request.type,

                snapshot:
                    request.baseSnapshotHash,

                baseShells:
                    request.baseShells,

                changes:
                    request.changes
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT AI EVOLUTION REQUEST FAILED"
    );

    console.error(error);

    process.exit(1);
}
