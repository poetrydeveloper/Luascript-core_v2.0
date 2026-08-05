// tests/unit/project_evolution_flow_gateway.test.js

const assert = require("assert");

const {
    ShellRepository
} = require(
    "../../compiler/shell/repository"
);

const {
    ProjectTree
} = require(
    "../../compiler/project_tree"
);

const {
    createProjectSnapshot,
    hashProjectSnapshot
} = require(
    "../../compiler/project/snapshot"
);

const {
    EvolutionFlowGateway
} = require(
    "../../compiler/project/evolution_flow_gateway"
);

const {
    hashAST
} = require(
    "../../compiler/ast/serializer"
);

function makeShell(
    purpose,
    version = 1,
    actual = true,
    generation = 1,
    supersedes = null
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
            version
        },

        position: {
            path: "systems.weapon",
            parent: "systems",
            order: 0
        },

        lifecycle: {
            actual,
            generation,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes
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

function makeRequest(
    snapshotHash,
    baseHash
) {
    return {
        type:
            "EvolutionRequest",

        schemaVersion:
            1,

        baseSnapshotHash:
            snapshotHash,

        intent:
            "Add pistol support to the weapon system.",

        baseShells: [
            {
                shellId:
                    "weapon-system",

                version:
                    1,

                hash:
                    baseHash,

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

                path:
                    "systems.weapon",

                baseVersion:
                    1,

                baseHash,

                reason:
                    "Add pistol support."
            }
        ]
    };
}

function makeWeaver() {
    return {
        weave(tree) {
            return {
                type:
                    "WovenProject",

                tree
            };
        }
    };
}

function makeCompiler() {
    return {
        compile(woven) {
            return {
                type:
                    "CompiledProject",

                woven
            };
        }
    };
}

function makeEmitter() {
    return {
        emit(compiled) {
            return {
                type:
                    "EmittedProject",

                compiled
            };
        }
    };
}

try {
    const repository =
        new ShellRepository();

    const tree =
        new ProjectTree();

    const current =
        repository.create(
            makeShell(
                "Controls weapon behavior."
            )
        );

    tree.addShell(
        current
    );

    const snapshot =
        createProjectSnapshot(
            tree
        );

    const snapshotHash =
        hashProjectSnapshot(
            snapshot
        );

    const baseHash =
        current.identity.hash;

    const request =
        makeRequest(
            snapshotHash,
            baseHash
        );

    /*
     * The executor requires the candidate Shell
     * separately from EvolutionRequest.
     *
     * This is intentional:
     *
     * EvolutionRequest
     *      ->
     * EvolutionFlow
     *      ->
     * EvolutionPlan
     *      +
     * proposedShells
     *      ->
     * ProjectEvolutionExecutor
     */
    const proposed =
        makeShell(
            "Controls weapon and pistol behavior.",
            2,
            false,
            2,
            baseHash
        );

    const gateway =
        new EvolutionFlowGateway({
            repository,
            tree,

            weaver:
                makeWeaver(),

            compiler:
                makeCompiler(),

            emitter:
                makeEmitter()
        });

    const result =
        gateway.run(
            request,
            [
                proposed
            ]
        );

    assert.ok(
        result
    );

    assert.strictEqual(
        result.type,
        "EvolutionRunResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.ok(
        result.execution
    );

    assert.strictEqual(
        result.execution.type,
        "EvolutionResult"
    );

    assert.strictEqual(
        result.execution.changes.length,
        1
    );

    assert.strictEqual(
        result.execution.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        result.execution.changes[0].version,
        2
    );

    assert.ok(
        result.woven
    );

    assert.strictEqual(
        result.woven.type,
        "WovenProject"
    );

    assert.ok(
        result.compiled
    );

    assert.strictEqual(
        result.compiled.type,
        "CompiledProject"
    );

    assert.ok(
        result.emitted
    );

    assert.strictEqual(
        result.emitted.type,
        "EmittedProject"
    );

    const actual =
        tree.getShell(
            "systems.weapon"
        );

    assert.strictEqual(
        actual.identity.version,
        2
    );

    assert.strictEqual(
        actual.lifecycle.actual,
        true
    );

    assert.strictEqual(
        actual.lifecycle.generation,
        2
    );

    assert.strictEqual(
        actual.semantic.purpose,
        "Controls weapon and pistol behavior."
    );

    assert.strictEqual(
        repository.count(
            "weapon-system"
        ),
        2
    );

    console.log(
        "PROJECT EVOLUTION FLOW GATEWAY OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    result.type,

                execution:
                    result.execution.type,

                woven:
                    result.woven.type,

                compiled:
                    result.compiled.type,

                emitted:
                    result.emitted.type,

                shellId:
                    actual.identity.id,

                version:
                    actual.identity.version,

                generation:
                    actual.lifecycle.generation
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION FLOW GATEWAY FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
