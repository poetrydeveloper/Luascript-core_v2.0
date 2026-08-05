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
    createAITaskEvolutionRunResult,
    validateAITaskEvolutionRunResult
} = require(
    "../../compiler/project/ai_task_result"
);

const {
    createProjectSnapshot,
    hashProjectSnapshot
} = require(
    "../../compiler/project/snapshot"
);

const {
    hashAST
} = require(
    "../../compiler/ast/serializer"
);

function makeShell(
    purpose =
        "Controls weapon behavior."
) {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: "weapon-system",
            hash: hashAST(payload),
            version: 1
        },

        position: {
            path: "systems.weapon",
            parent: "systems",
            order: 0
        },

        lifecycle: {
            actual: true,
            generation: 1,
            createdAt:
                "2026-08-04T00:00:00.000Z",
            supersedes: null
        },

        semantic: {
            name: "WeaponSystem",
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

function makeProject() {
    return {
        type: "Project",
        schemaVersion: 1,

        root: "systems",

        shells: [
            makeShell()
        ]
    };
}

function makeContext() {
    const project =
        makeProject();

    /*
     * ProjectContext.snapshotHash must correspond
     * to the actual project snapshot.
     */
    const snapshot =
        createProjectSnapshot(
            project
        );

    const snapshotHash =
        hashProjectSnapshot(
            snapshot
        );

    return {
        type: "ProjectContext",
        schemaVersion: 1,

        snapshotHash,

        project
    };
}

function makeTask() {
    const context =
        makeContext();

    return {
        type: "AITask",
        schemaVersion: 1,

        id:
            "ai-task-weapon-001",

        snapshotHash:
            context.snapshotHash,

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
                    makeShell().identity.hash,

                shell:
                    makeShell(
                        "Controls weapon and pistol behavior."
                    )
            }
        ]
    };
}

/*
 * The EvolutionFlowGateway is mocked here.
 *
 * This test verifies only the AITaskGateway boundary:
 *
 * AITask
 *   ->
 * EvolutionRequest
 *   ->
 * EvolutionFlowGateway
 *   ->
 * EvolutionRunResult
 *   ->
 * AITaskEvolutionRunResult
 */

function makeEvolutionRunResult(
    request
) {
    return {
        type:
            "EvolutionRunResult",

        schemaVersion:
            1,

        request,

        execution: {
            type:
                "EvolutionResult",

            schemaVersion:
                1,

            shellId:
                "weapon-system",

            path:
                "systems.weapon",

            version:
                2,

            generation:
                2,

            snapshotHash:
                request.snapshotHash,

            changes: [
                {
                    shellId:
                        "weapon-system",

                    version:
                        2,

                    generation:
                        2
                }
            ]
        },

        state: {
            type:
                "ProjectState",

            schemaVersion:
                1,

            snapshotHash:
                request.snapshotHash
        },

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

{
    const task =
        makeTask();

    const context =
        makeContext();

    /*
     * The real gateway conversion is responsible
     * for producing the EvolutionRequest.
     *
     * Here we only test extraction behavior
     * against a request-shaped object.
     */
    const request = {
        type:
            "EvolutionRequest",

        schemaVersion:
            1,

        snapshotHash:
            context.snapshotHash,

        intent:
            task.intent,

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
                    makeShell().identity.hash,

                shell:
                    makeShell(
                        "Controls weapon and pistol behavior."
                    )
            }
        ]
    };

    const shells =
        extractProposedShells(
            request
        );

    assert.ok(
        Array.isArray(shells)
    );

    assert.strictEqual(
        shells.length,
        1
    );

    assert.strictEqual(
        shells[0].type,
        "Shell"
    );
}

/*
 * ------------------------------------------------------------
 * Empty proposal extraction
 * ------------------------------------------------------------
 */

{
    const shells =
        extractProposedShells({
            type:
                "EvolutionRequest",

            schemaVersion:
                1,

            changes: []
        });

    assert.ok(
        Array.isArray(shells)
    );

    assert.strictEqual(
        shells.length,
        0
    );
}

/*
 * ------------------------------------------------------------
 * Constructor
 * ------------------------------------------------------------
 */

{
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
}

/*
 * ------------------------------------------------------------
 * Main execution
 * ------------------------------------------------------------
 */

{
    let capturedRequest =
        null;

    let capturedShells =
        null;

    let capturedOptions =
        null;

    const flowGateway = {
        run(
            request,
            proposedShells,
            options
        ) {
            capturedRequest =
                request;

            capturedShells =
                proposedShells;

            capturedOptions =
                options;

            return makeEvolutionRunResult(
                request
            );
        }
    };

    const gateway =
        new AITaskGateway(
            flowGateway
        );

    const task =
        makeTask();

    const context =
        makeContext();

    const result =
        gateway.run(
            task,
            context
        );

    assert.ok(
        result
    );

    /*
     * IMPORTANT:
     *
     * AITaskGateway returns its own
     * AITaskEvolutionRunResult.
     *
     * It does NOT return the raw
     * EvolutionRunResult anymore.
     */
    assert.strictEqual(
        result.type,
        "AITaskEvolutionRunResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.task.type,
        "AITask"
    );

    assert.strictEqual(
        result.request.type,
        "EvolutionRequest"
    );

    assert.strictEqual(
        result.evolution.type,
        "EvolutionRunResult"
    );

    /*
     * Request conversion.
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
        capturedRequest.snapshotHash,
        context.snapshotHash
    );

    assert.strictEqual(
        capturedRequest.changes.length,
        1
    );

    assert.strictEqual(
        capturedRequest.changes[0].shellId,
        "weapon-system"
    );

    /*
     * Proposal extraction.
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

    /*
     * Default options.
     */

    assert.deepStrictEqual(
        capturedOptions,
        {}
    );
}

/*
 * ------------------------------------------------------------
 * Additional proposed shells
 * ------------------------------------------------------------
 */

{
    let capturedShells =
        null;

    const flowGateway = {
        run(
            request,
            proposedShells
        ) {
            capturedShells =
                proposedShells;

            return makeEvolutionRunResult(
                request
            );
        }
    };

    const gateway =
        new AITaskGateway(
            flowGateway
        );

    const extra =
        makeShell(
            "Additional shell."
        );

    gateway.run(
        makeTask(),
        makeContext(),
        {
            proposedShells: [
                extra
            ]
        }
    );

    assert.ok(
        Array.isArray(capturedShells)
    );

    assert.strictEqual(
        capturedShells.length,
        2
    );
}

/*
 * ------------------------------------------------------------
 * flowOptions forwarding
 * ------------------------------------------------------------
 */

{
    let capturedOptions =
        null;

    const flowGateway = {
        run(
            request,
            proposedShells,
            options
        ) {
            capturedOptions =
                options;

            return makeEvolutionRunResult(
                request
            );
        }
    };

    const gateway =
        new AITaskGateway(
            flowGateway
        );

    gateway.run(
        makeTask(),
        makeContext(),
        {
            flowOptions: {
                dryRun: true
            }
        }
    );

    assert.deepStrictEqual(
        capturedOptions,
        {
            dryRun: true
        }
    );
}

/*
 * ------------------------------------------------------------
 * Invalid task
 * ------------------------------------------------------------
 */

{
    const gateway =
        new AITaskGateway({
            run(request) {
                return makeEvolutionRunResult(
                    request
                );
            }
        });

    assert.throws(
        () =>
            gateway.run(
                null,
                makeContext()
            ),
        error =>
            error instanceof
            AITaskGatewayError
    );
}

/*
 * ------------------------------------------------------------
 * Invalid context
 * ------------------------------------------------------------
 */

{
    const gateway =
        new AITaskGateway({
            run(request) {
                return makeEvolutionRunResult(
                    request
                );
            }
        });

    assert.throws(
        () =>
            gateway.run(
                makeTask(),
                null
            ),
        error =>
            error instanceof
            AITaskGatewayError
    );
}

/*
 * ------------------------------------------------------------
 * Invalid options
 * ------------------------------------------------------------
 */

{
    const gateway =
        new AITaskGateway({
            run(request) {
                return makeEvolutionRunResult(
                    request
                );
            }
        });

    assert.throws(
        () =>
            gateway.run(
                makeTask(),
                makeContext(),
                null
            ),
        error =>
            error instanceof
            AITaskGatewayError
    );
}

/*
 * ------------------------------------------------------------
 * Evolution gateway failure
 * ------------------------------------------------------------
 */

{
    const gateway =
        new AITaskGateway({
            run() {
                throw new Error(
                    "boom"
                );
            }
        });

    assert.throws(
        () =>
            gateway.run(
                makeTask(),
                makeContext()
            ),
        error =>
            error instanceof
            AITaskGatewayError
    );
}

/*
 * ------------------------------------------------------------
 * Invalid evolution result
 * ------------------------------------------------------------
 */

{
    const gateway =
        new AITaskGateway({
            run() {
                return {
                    invalid:
                        true
                };
            }
        });

    assert.throws(
        () =>
            gateway.run(
                makeTask(),
                makeContext()
            ),
        error =>
            error instanceof
            AITaskGatewayError
    );
}

/*
 * ------------------------------------------------------------
 * AITask result validation
 * ------------------------------------------------------------
 */

{
    const task =
        makeTask();

    const context =
        makeContext();

    const request = {
        type:
            "EvolutionRequest",

        schemaVersion:
            1,

        snapshotHash:
            context.snapshotHash,

        intent:
            task.intent,

        affectedShells: [
            "systems.weapon"
        ],

        changes: []
    };

    const evolution =
        makeEvolutionRunResult(
            request
        );

    const result =
        createAITaskEvolutionRunResult(
            task,
            request,
            evolution
        );

    assert.ok(
        result
    );

    assert.strictEqual(
        result.type,
        "AITaskEvolutionRunResult"
    );

    assert.strictEqual(
        validateAITaskEvolutionRunResult(
            result
        ),
        true
    );
}

/*
 * ------------------------------------------------------------
 * Invalid AITask result
 * ------------------------------------------------------------
 */

{
    assert.throws(
        () =>
            validateAITaskEvolutionRunResult(
                null
            ),
        error =>
            error instanceof Error
    );

    assert.throws(
        () =>
            validateAITaskEvolutionRunResult({
                type:
                    "WrongType",

                schemaVersion:
                    1
            }),
        error =>
            error instanceof Error
    );
}

console.log(
    "AI TASK GATEWAY OK"
);
