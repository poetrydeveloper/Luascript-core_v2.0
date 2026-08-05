// tests/unit/ai_task_gateway.test.js

const assert = require("assert");

const {
    AITaskGateway,
    AITaskGatewayError,
    extractProposedShells
} = require(
    "../../compiler/project/ai_task_gateway"
);

const {
    hashAST
} = require(
    "../../compiler/ast/serializer"
);

const SNAPSHOT_HASH =
    "8069aba4607a22b88a0157a018999faf47ab2540c06185622dc17807cbe95d36";

const HASH =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

function makeShell(
    id = "weapon-system",
    version = 1,
    purpose = "Controls weapon behavior."
) {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id,
            hash: hashAST(payload),
            version
        },

        position: {
            path:
                id === "weapon-system"
                    ? "systems.weapon"
                    : "systems.secondary",

            parent: "systems",
            order: 0
        },

        lifecycle: {
            actual: true,
            generation: version,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes:
                version > 1
                    ? HASH
                    : null
        },

        semantic: {
            name:
                id === "weapon-system"
                    ? "WeaponSystem"
                    : "SecondarySystem",

            purpose,

            tags: [
                "system",
                "weapon"
            ],

            description:
                "Weapon system."
        },

        payload
    };
}

function makeRequest(
    shell = null
) {
    return {
        type: "EvolutionRequest",
        schemaVersion: 1,

        baseSnapshotHash:
            SNAPSHOT_HASH,

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

                ...(shell
                    ? {
                        shell
                    }
                    : {})
            }
        ]
    };
}

function makeTask() {
    return {
        type: "AITask",
        schemaVersion: 1,

        snapshotHash:
            SNAPSHOT_HASH,

        intent:
            "Add pistol support to the weapon system.",

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

                shell:
                    makeShell(
                        "weapon-system",
                        2,
                        "Controls weapon and pistol behavior."
                    )
            }
        ]
    };
}

function makeContext() {
    /*
     * IMPORTANT:
     *
     * ProjectContext.project is required by
     * createEvolutionRequestFromAITask().
     *
     * snapshotHash belongs inside project.
     */

    return {
        type: "ProjectContext",
        schemaVersion: 1,

        project: {
            snapshotHash:
                SNAPSHOT_HASH
        },

        shells: [
            {
                shellId:
                    "weapon-system",

                version:
                    1,

                hash:
                    HASH,

                path:
                    "systems.weapon"
            }
        ]
    };
}

function makeExecutionResult() {
    return {
        type:
            "EvolutionResult",

        schemaVersion:
            1,

        snapshotHash:
            SNAPSHOT_HASH,

        intent:
            "Add pistol support to the weapon system.",

        changes: [
            {
                shellId:
                    "weapon-system",

                path:
                    "systems.weapon",

                version:
                    2,

                generation:
                    2,

                hash:
                    HASH,

                supersedes:
                    HASH
            }
        ]
    };
}

function makeRunResult() {
    return {
        type:
            "EvolutionRunResult",

        schemaVersion:
            1,

        request:
            makeRequest(
                makeShell(
                    "weapon-system",
                    2,
                    "Controls weapon and pistol behavior."
                )
            ),

        execution:
            makeExecutionResult(),

        woven: {
            type:
                "WovenProject",

            schemaVersion:
                1,

            files: []
        },

        compiled: {
            type:
                "CompiledProject",

            schemaVersion:
                1,

            files: []
        },

        emitted: {
            type:
                "EmittedProject",

            schemaVersion:
                1,

            files: []
        }
    };
}

/*
 * ------------------------------------------------------------
 * extractProposedShells
 * ------------------------------------------------------------
 */

try {
    const shell =
        makeShell();

    const request =
        makeRequest(
            shell
        );

    const extracted =
        extractProposedShells(
            request
        );

    assert.ok(
        Array.isArray(
            extracted
        )
    );

    assert.strictEqual(
        extracted.length,
        1
    );

    assert.strictEqual(
        extracted[0],
        shell
    );

    assert.strictEqual(
        extracted[0].identity.id,
        "weapon-system"
    );

    /*
     * No embedded shell.
     */

    const empty =
        extractProposedShells(
            makeRequest()
        );

    assert.ok(
        Array.isArray(
            empty
        )
    );

    assert.strictEqual(
        empty.length,
        0
    );

    /*
     * Invalid request.
     */

    assert.throws(
        () =>
            extractProposedShells(
                null
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    assert.throws(
        () =>
            extractProposedShells(
                {
                    changes: null
                }
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    /*
     * Invalid change entries are ignored.
     */

    const mixed =
        extractProposedShells(
            {
                changes: [
                    null,
                    42,
                    {},
                    {
                        shell
                    }
                ]
            }
        );

    assert.strictEqual(
        mixed.length,
        1
    );

    assert.strictEqual(
        mixed[0],
        shell
    );

    /*
     * --------------------------------------------------------
     * Constructor
     * --------------------------------------------------------
     */

    const constructorGateway = {
        run() {
            return makeRunResult();
        }
    };

    const gateway =
        new AITaskGateway(
            constructorGateway
        );

    assert.ok(
        gateway
    );

    assert.strictEqual(
        gateway.flowGateway,
        constructorGateway
    );

    assert.throws(
        () =>
            new AITaskGateway(
                null
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    assert.throws(
        () =>
            new AITaskGateway(
                {}
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    /*
     * --------------------------------------------------------
     * run()
     * --------------------------------------------------------
     */

    let capturedRequest =
        null;

    let capturedShells =
        null;

    let capturedOptions =
        null;

    const flowGateway = {
        run(
            requestValue,
            proposedShells,
            options
        ) {
            capturedRequest =
                requestValue;

            capturedShells =
                proposedShells;

            capturedOptions =
                options;

            return makeRunResult();
        }
    };

    const taskGateway =
        new AITaskGateway(
            flowGateway
        );

    const result =
        taskGateway.run(
            makeTask(),
            makeContext()
        );

    assert.ok(
        result
    );

    assert.strictEqual(
        result.type,
        "EvolutionRunResult"
    );

    /*
     * Converted request.
     */

    assert.ok(
        capturedRequest
    );

    assert.strictEqual(
        capturedRequest.type,
        "EvolutionRequest"
    );

    assert.strictEqual(
        capturedRequest.schemaVersion,
        1
    );

    assert.strictEqual(
        capturedRequest.baseSnapshotHash,
        SNAPSHOT_HASH
    );

    assert.strictEqual(
        capturedRequest.changes.length,
        1
    );

    /*
     * Extracted proposal.
     */

    assert.ok(
        Array.isArray(
            capturedShells
        )
    );

    assert.strictEqual(
        capturedShells.length,
        1
    );

    assert.strictEqual(
        capturedShells[0].identity.id,
        "weapon-system"
    );

    assert.strictEqual(
        capturedShells[0].identity.version,
        2
    );

    assert.strictEqual(
        capturedShells[0].semantic.purpose,
        "Controls weapon and pistol behavior."
    );

    /*
     * Default flow options.
     */

    assert.deepStrictEqual(
        capturedOptions,
        {}
    );

    /*
     * --------------------------------------------------------
     * options.proposedShells
     * --------------------------------------------------------
     */

    const extraShell =
        makeShell(
            "secondary-system",
            1
        );

    let mergedShells =
        null;

    const mergeGateway = {
        run(
            requestValue,
            proposedShells
        ) {
            mergedShells =
                proposedShells;

            return makeRunResult();
        }
    };

    const mergeTaskGateway =
        new AITaskGateway(
            mergeGateway
        );

    mergeTaskGateway.run(
        makeTask(),
        makeContext(),
        {
            proposedShells: [
                extraShell
            ]
        }
    );

    assert.ok(
        Array.isArray(
            mergedShells
        )
    );

    assert.strictEqual(
        mergedShells.length,
        2
    );

    assert.strictEqual(
        mergedShells[0].identity.id,
        "weapon-system"
    );

    assert.strictEqual(
        mergedShells[1].identity.id,
        "secondary-system"
    );

    /*
     * --------------------------------------------------------
     * options.flowOptions
     * --------------------------------------------------------
     */

    let receivedFlowOptions =
        null;

    const optionsGateway = {
        run(
            requestValue,
            proposedShells,
            options
        ) {
            receivedFlowOptions =
                options;

            return makeRunResult();
        }
    };

    const optionsTaskGateway =
        new AITaskGateway(
            optionsGateway
        );

    optionsTaskGateway.run(
        makeTask(),
        makeContext(),
        {
            flowOptions: {
                dryRun: true,
                source: "unit-test"
            }
        }
    );

    assert.deepStrictEqual(
        receivedFlowOptions,
        {
            dryRun: true,
            source: "unit-test"
        }
    );

    /*
     * --------------------------------------------------------
     * Invalid task
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            taskGateway.run(
                null,
                makeContext()
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    assert.throws(
        () =>
            taskGateway.run(
                {
                    type:
                        "WrongType",

                    schemaVersion:
                        1
                },
                makeContext()
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    assert.throws(
        () =>
            taskGateway.run(
                {
                    type:
                        "AITask",

                    schemaVersion:
                        999
                },
                makeContext()
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    /*
     * --------------------------------------------------------
     * Invalid context
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            taskGateway.run(
                makeTask(),
                null
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    assert.throws(
        () =>
            taskGateway.run(
                makeTask(),
                {
                    type:
                        "WrongType",

                    schemaVersion:
                        1,

                    project: {
                        snapshotHash:
                            SNAPSHOT_HASH
                    },

                    shells: []
                }
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    assert.throws(
        () =>
            taskGateway.run(
                makeTask(),
                {
                    type:
                        "ProjectContext",

                    schemaVersion:
                        999,

                    project: {
                        snapshotHash:
                            SNAPSHOT_HASH
                    },

                    shells: []
                }
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    /*
     * --------------------------------------------------------
     * Invalid options
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            taskGateway.run(
                makeTask(),
                makeContext(),
                null
            ),
        error =>
            error instanceof
                AITaskGatewayError
    );

    /*
     * --------------------------------------------------------
     * Flow gateway failure
     * --------------------------------------------------------
     */

    const failingGateway = {
        run() {
            throw new Error(
                "flow failed"
            );
        }
    };

    const failingTaskGateway =
        new AITaskGateway(
            failingGateway
        );

    assert.throws(
        () =>
            failingTaskGateway.run(
                makeTask(),
                makeContext()
            ),
        error =>
            error instanceof
                AITaskGatewayError &&
            error.message ===
                "Evolution flow gateway failed."
    );

    /*
     * --------------------------------------------------------
     * Invalid flow result
     * --------------------------------------------------------
     */

    const invalidResultGateway = {
        run() {
            return {
                type:
                    "InvalidResult"
            };
        }
    };

    const invalidResultTaskGateway =
        new AITaskGateway(
            invalidResultGateway
        );

    assert.throws(
        () =>
            invalidResultTaskGateway.run(
                makeTask(),
                makeContext()
            ),
        error =>
            error instanceof
                AITaskGatewayError &&
            error.message ===
                "Evolution gateway returned an invalid result."
    );

    /*
     * --------------------------------------------------------
     * Success
     * --------------------------------------------------------
     */

    console.log(
        "AI TASK GATEWAY OK"
    );

} catch (error) {
    console.error(
        "AI TASK GATEWAY FAILED"
    );

    console.error(
        error
    );

    process.exit(
        1
    );
}
