// tests/unit/project_evolution.test.js

const assert = require("assert");

const {
    createEvolutionRequest,
    serializeEvolutionRequest,
    parseEvolutionRequest,
    cloneEvolutionRequest,
    ProjectEvolutionError
} = require("../../compiler/project/evolution");

const SNAPSHOT_HASH =
    "b759f181feff2547e566e9a95f94dad3bfa6603673a58df48f1b0c8da58f2703";

const SHELL_HASH =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

try {
    // ------------------------------------------------------------
    // UPDATE request.
    // ------------------------------------------------------------

    const request =
        createEvolutionRequest({
            baseSnapshotHash:
                SNAPSHOT_HASH,

            intent:
                "Add pistol support to the weapon system.",

            baseShells: [
                {
                    shellId:
                        "weapon-system",

                    version:
                        1,

                    hash:
                        SHELL_HASH,

                    path:
                        "systems.weapon"
                }
            ],

            changes: [
                {
                    shellId:
                        "weapon-system",

                    operation:
                        "UPDATE",

                    baseVersion:
                        1,

                    baseHash:
                        SHELL_HASH,

                    shell: {
                        type:
                            "Shell",

                        identity: {
                            id:
                                "weapon-system"
                        }
                    }
                }
            ]
        });

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
        SNAPSHOT_HASH
    );

    assert.strictEqual(
        request.baseShells.length,
        1
    );

    assert.strictEqual(
        request.changes.length,
        1
    );

    assert.strictEqual(
        request.changes[0].operation,
        "UPDATE"
    );

    // ------------------------------------------------------------
    // Serialization round-trip.
    // ------------------------------------------------------------

    const serialized =
        serializeEvolutionRequest(
            request
        );

    const parsed =
        parseEvolutionRequest(
            serialized
        );

    assert.deepStrictEqual(
        parsed,
        request
    );

    const cloned =
        cloneEvolutionRequest(
            request
        );

    assert.deepStrictEqual(
        cloned,
        request
    );

    // ------------------------------------------------------------
    // CREATE request.
    // ------------------------------------------------------------

    const createRequest =
        createEvolutionRequest({
            baseSnapshotHash:
                SNAPSHOT_HASH,

            intent:
                "Create pistol system.",

            baseShells: [],

            changes: [
                {
                    shellId:
                        "pistol-system",

                    operation:
                        "CREATE",

                    shell: {
                        type:
                            "Shell"
                    }
                }
            ]
        });

    assert.strictEqual(
        createRequest.changes[0].operation,
        "CREATE"
    );

    // ------------------------------------------------------------
    // Invalid snapshot hash.
    // ------------------------------------------------------------

    assert.throws(
        () => {
            createEvolutionRequest({
                baseSnapshotHash:
                    "invalid",

                intent:
                    "Invalid request.",

                baseShells: [
                    {
                        shellId:
                            "weapon-system",

                        version:
                            1,

                        hash:
                            SHELL_HASH,

                        path:
                            "systems.weapon"
                    }
                ],

                changes: []
            });
        },
        error => {
            return (
                error instanceof ProjectEvolutionError &&
                error.code === "LS012"
            );
        }
    );

    // ------------------------------------------------------------
    // Invalid operation.
    // ------------------------------------------------------------

    assert.throws(
        () => {
            createEvolutionRequest({
                baseSnapshotHash:
                    SNAPSHOT_HASH,

                intent:
                    "Invalid operation.",

                baseShells: [],

                changes: [
                    {
                        shellId:
                            "weapon-system",

                        operation:
                            "MAGIC"
                    }
                ]
            });
        },
        error => {
            return (
                error instanceof ProjectEvolutionError &&
                error.code === "LS012"
            );
        }
    );

    // ------------------------------------------------------------
    // UPDATE without base hash.
    // ------------------------------------------------------------

    assert.throws(
        () => {
            createEvolutionRequest({
                baseSnapshotHash:
                    SNAPSHOT_HASH,

                intent:
                    "Missing base hash.",

                baseShells: [],

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
            });
        },
        error => {
            return (
                error instanceof ProjectEvolutionError &&
                error.code === "LS012"
            );
        }
    );

    console.log(
        "PROJECT EVOLUTION OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    request.type,

                snapshotHash:
                    request.baseSnapshotHash,

                intent:
                    request.intent,

                baseShells:
                    request.baseShells.length,

                changes:
                    request.changes.map(
                        change => ({
                            shellId:
                                change.shellId,

                            operation:
                                change.operation,

                            baseVersion:
                                change.baseVersion || null
                        })
                    )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION FAILED"
    );

    console.error(error);

    process.exit(1);
}
