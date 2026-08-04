const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    ProjectEvolutionExecutor
} = require("../../compiler/project/evolution_executor");

const {
    hashAST
} = require("../../compiler/ast/serializer");

function makeShell(purpose) {
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
            createdAt: "2026-08-04T00:00:00.000Z",
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

try {
    const repository =
        new ShellRepository();

    const tree =
        new ProjectTree();

    const v1 =
        repository.create(
            makeShell(
                "Controls weapon behavior."
            )
        );

    tree.addShell(v1);

    const proposed =
        makeShell(
            "Controls weapon and pistol behavior."
        );

    //
    // The proposed shell represents the AI-generated
    // evolution. It still has the old version metadata;
    // repository.save() creates the next immutable version.
    //

    const plan = {
        type: "EvolutionPlan",
        schemaVersion: 1,

        snapshotHash:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        intent:
            "Add pistol support to the weapon system.",

        affectedShells: [
            "systems.weapon"
        ],

        changes: [
            {
                shellId: "weapon-system",
                operation: "UPDATE",
                path: "systems.weapon",
                baseVersion: 1
            }
        ]
    };

    const executor =
        new ProjectEvolutionExecutor(
            repository,
            tree
        );

    const result =
        executor.execute(
            plan,
            [proposed]
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
        actual.semantic.purpose,
        "Controls weapon and pistol behavior."
    );

    const old =
        repository.getVersion(
            "weapon-system",
            1
        );

    assert.strictEqual(
        old.lifecycle.actual,
        false
    );

    assert.strictEqual(
        repository.count(
            "weapon-system"
        ),
        2
    );

    console.log(
        "PROJECT EVOLUTION EXECUTOR OK"
    );

    console.log(
        JSON.stringify(
            {
                result,
                actual: {
                    id: actual.identity.id,
                    version: actual.identity.version,
                    generation:
                        actual.lifecycle.generation,
                    hash:
                        actual.identity.hash,
                    supersedes:
                        actual.lifecycle.supersedes
                }
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION EXECUTOR FAILED"
    );

    console.error(error);

    process.exit(1);
}
