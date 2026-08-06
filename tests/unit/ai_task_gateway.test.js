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
    ProjectTree
} = require(
    "../../compiler/project_tree"
);

const {
    hashAST
} = require(
    "../../compiler/ast/serializer"
);

const HASH =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

function makeShell(
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

function makeTree() {
    const tree =
        new ProjectTree();

    tree.addShell(
        makeShell()
    );

    return tree;
}

function makeContext() {
    const tree =
        makeTree();

    const snapshot =
        createProjectSnapshot(
            tree
        );

    const snapshotHash =
        hashProjectSnapshot(
            snapshot
        );

    return {
        type: "ProjectContext",
        schemaVersion: 1,

        project: {
            type: "Project",
            schemaVersion: 1,
            root: "systems",
            snapshotHash
        },

        snapshotHash,

        shells: [
            tree.getShell(
                "systems.weapon"
            )
        ]
    };
}

function makeTask() {
    const context =
        makeContext();

    return {
        type: "AITask",
        schemaVersion: 1,

        taskId:
            "task-weapon-pistol",

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
                    HASH,

                shell:
                    makeShell(
                        "Controls weapon and pistol behavior."
                    )
            }
        ]
    };
}

function makeRunResult(
    request
) {
    const state = {
        type: "ProjectState",
        schemaVersion: 1,

        snapshotHash:
            request.snapshotHash,

        shells: [
            makeShell(
                "Controls weapon and pistol behavior."
            )
        ]
    };

    const woven = {
        type: "WovenProject",
        schemaVersion: 1,
        files: []
    };

    const compiled = {
        type: "CompiledProject",
        schemaVersion: 1,
        files: []
    };

    const emitted = {
        type: "EmittedProject",
        schemaVersion: 1,
        files: []
    };

    const evolution = {
        type: "EvolutionResult",
        schemaVersion: 1,

        shellId:
            "weapon-system",

        path:
            "systems.weapon",

        version: 2,

        generation: 2,

        snapshotHash:
            request.snapshotHash,

        changes: [
            {
                shellId:
                    "weapon-system",

                path:
                    "systems.weapon",

                version: 2,

                generation: 2
            }
        ]
    };

    return createAITaskEvolutionRunResult({
        request,
        evolution,
        state,
        woven,
        compiled,
        emitted
    });
}

/*
 * ------------------------------------------------------------
 * extractProposedShells()
 * ------------------------------------------------------------
 */

{
    const shell =
        makeShell(
            "Controls pistol behavior."
        );

    const request = {
        type: "EvolutionRequest",
        schemaVersion: 1,

        changes: [
            {
                shellId:
                    "weapon-system",

                operation:
                    "UPDATE",

                shell
            },

            {
                shellId:
                    "ignored",

                operation:
                    "UPDATE"
            }
        ]
    };

    const result =
        extractProposedShells(
            request
        );

    assert.strictEqual(
        result.length,
        1
    );

    assert.strictEqual(
        result[0],
        shell
    );
}

/*
 * ------------------------------------------------------------
 * Gateway construction
 * ------------------------------------------------------------
 */

{
    assert.throws(
        () => {
            new AITaskGateway(
                null
            );
        },
        AITaskGatewayError
    );

    assert.throws(
        () => {
            new AITaskGateway(
                {}
            );
        },
        AITaskGatewayError
    );
}

/*
 * ------------------------------------------------------------
 * Main gateway execution
 * ------------------------------------------------------------
 */

{
    const task =
        makeTask();

    const context =
        makeContext();

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

            return makeRunResult(
                request
            );
        }
    };

    const gateway =
        new AITaskGateway(
            flowGateway
        );

    const result =
        gateway.run(
            task,
            context
        );

    assert.ok(
        result
    );

    assert.strictEqual(
        result.type,
        "AITaskEvolutionRunResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.ok(
        result.request
    );

    assert.strictEqual(
        result.request.type,
        "EvolutionRequest"
    );

    assert.ok(
        result.evolution
    );

    assert.strictEqual(
        result.evolution.type,
        "EvolutionResult"
    );

    assert.ok(
        result.state
    );

    assert.strictEqual(
        result.state.type,
        "ProjectState"
    );

    assert.ok(
        capturedRequest
    );

    assert.strictEqual(
        capturedRequest.type,
        "EvolutionRequest"
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

    assert.ok(
        capturedShells
    );

    assert.strictEqual(
        capturedShells.length,
        1
    );

    assert.strictEqual(
        capturedShells[0].identity.id,
        "weapon-system"
    );

    assert.ok(
        capturedOptions
    );
}

/*
 * ------------------------------------------------------------
 * Additional proposed shells
 * ------------------------------------------------------------
 */

{
    const task =
        makeTask();

    const context =
        makeContext();

    const extra =
        makeShell(
            "Extra proposed shell."
        );

    let capturedShells =
        null;

    const flowGateway = {
        run(
            request,
            proposedShells
        ) {
            capturedShells =
                proposedShells;

            return makeRunResult(
                request
            );
        }
    };

    const gateway =
        new AITaskGateway(
            flowGateway
        );

    gateway.run(
        task,
        context,
        {
            proposedShells: [
                extra
            ]
        }
    );

    assert.strictEqual(
        capturedShells.length,
        2
    );

    assert.strictEqual(
        capturedShells[1],
        extra
    );
}

/*
 * ------------------------------------------------------------
 * Flow options
 * ------------------------------------------------------------
 */

{
    const task =
        makeTask();

    const context =
        makeContext();

    const flowOptions = {
        dryRun: true,
        strict: true
    };

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

            return makeRunResult(
                request
            );
        }
    };

    const gateway =
        new AITaskGateway(
            flowGateway
        );

    gateway.run(
        task,
        context,
        {
            flowOptions
        }
    );

    assert.deepStrictEqual(
        capturedOptions,
        flowOptions
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
            run() {
                throw new Error(
                    "must not run"
                );
            }
        });

    assert.throws(
        () => {
            gateway.run(
                null,
                makeContext()
            );
        },
        error => {
            return (
                error instanceof
                AITaskGatewayError
            );
        }
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
            run() {
                throw new Error(
                    "must not run"
                );
            }
        });

    assert.throws(
        () => {
            gateway.run(
                makeTask(),
                null
            );
        },
        error => {
            return (
                error instanceof
                AITaskGatewayError
            );
        }
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
            run() {
                throw new Error(
                    "must not run"
                );
            }
        });

    assert.throws(
        () => {
            gateway.run(
                makeTask(),
                makeContext(),
                null
            );
        },
        error => {
            return (
                error instanceof
                AITaskGatewayError
            );
        }
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
                    "evolution failed"
                );
            }
        });

    assert.throws(
        () => {
            gateway.run(
                makeTask(),
                makeContext()
            );
        },
        error => {
            return (
                error instanceof
                AITaskGatewayError &&
                error.message ===
                    "Evolution flow gateway failed."
            );
        }
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
                    type:
                        "InvalidResult"
                };
            }
        });

    assert.throws(
        () => {
            gateway.run(
                makeTask(),
                makeContext()
            );
        },
        error => {
            return (
                error instanceof
                AITaskGatewayError &&
                error.message ===
                    "Evolution gateway returned an invalid result."
            );
        }
    );
}

/*
 * ------------------------------------------------------------
 * AITask result validation
 * ------------------------------------------------------------
 */

{
    const result =
        makeRunResult(
            makeTask()
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
 * AITask result creation
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

        changes:
            task.changes
    };

    const result =
        makeRunResult(
            request
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

console.log(
    "AI TASK GATEWAY OK"
);

console.log(
    "TOTAL:  11"
);

console.log(
    "OK:     11"
);

console.log(
    "FAILED: 0"
);

console.log(
    "------------------------------------------------------------"
);

console.log(
    "ALL AI TASK GATEWAY TESTS PASSED"
);
