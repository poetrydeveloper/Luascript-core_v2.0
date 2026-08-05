// tests/unit/project_evolution_flow.test.js

const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectSnapshot,
    hashProjectSnapshot
} = require("../../compiler/project/snapshot");

const {
    EvolutionFlow
} = require("../../compiler/project/evolution_flow");

const HASH =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

function makeShell() {
    return {
        type:
            "Shell",

        schemaVersion:
            1,

        identity: {
            id:
                "weapon-system",

            hash:
                HASH,

            version:
                1
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
                true,

            generation:
                1,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes:
                null
        },

        semantic: {
            name:
                "WeaponSystem",

            purpose:
                "Controls weapon behavior.",

            tags: [
                "system",
                "weapon"
            ],

            description:
                "Weapon system."
        },

        payload: {
            type:
                "Program",

            declarations:
                []
        }
    };
}

function makeRequest(
    snapshotHash
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
                    HASH,

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

                baseHash:
                    HASH,

                reason:
                    "Add pistol support."
            }
        ]
    };
}

try {
    const repository =
        new ShellRepository();

    const tree =
        new ProjectTree();

    const shell =
        makeShell();

    repository.create(
        shell
    );

    tree.addShell(
        shell
    );

    const snapshot =
        createProjectSnapshot(
            tree
        );

    const snapshotHash =
        hashProjectSnapshot(
            snapshot
        );

    const flow =
        new EvolutionFlow(
            repository,
            tree
        );

    const request =
        makeRequest(
            snapshotHash
        );

    /*
     * The current flow is responsible for
     * planning and validation, but execution
     * still requires the proposed Shell.
     *
     * Build the proposal directly from the
     * current Shell so this test exercises
     * the complete orchestration without AI.
     */

    const proposedShell = {
        ...shell,

        identity: {
            ...shell.identity,

            version:
                2,

            hash:
                HASH
        },

        lifecycle: {
            ...shell.lifecycle,

            actual:
                false,

            generation:
                2,

            supersedes:
                HASH
        }
    };

    const result =
        flow.execute(
            request,
            [
                proposedShell
            ]
        );

    assert.ok(
        result
    );

    assert.strictEqual(
        result.type,
        "EvolutionResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.ok(
        Array.isArray(
            result.changes
        )
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
        result.changes[0].path,
        "systems.weapon"
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
        tree.getShell(
            "systems.weapon"
        ).identity.version,
        2
    );

    console.log(
        "PROJECT EVOLUTION FLOW OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    result.type,

                shellId:
                    result.changes[0].shellId,

                path:
                    result.changes[0].path,

                version:
                    result.changes[0].version,

                generation:
                    result.changes[0].generation,

                snapshotHash:
                    result.snapshotHash
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION FLOW FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
