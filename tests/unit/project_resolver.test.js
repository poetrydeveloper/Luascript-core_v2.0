const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectState
} = require("../../compiler/project/state");

const {
    ProjectStateResolver
} = require("../../compiler/project/resolver");

function makeShell() {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: "weapon-timer-system",
            hash: hashAST(payload),
            version: 1
        },

        position: {
            path: "systems.weapon.timer",
            parent: "systems.weapon",
            order: 0
        },

        lifecycle: {
            actual: true,
            generation: 1,
            createdAt: "2026-08-04T00:00:00.000Z",
            supersedes: null
        },

        semantic: {
            name: "WeaponTimerSystem",
            purpose: "Updates weapon cooldown state.",
            tags: [
                "system",
                "weapon",
                "cooldown"
            ],
            description: "Weapon cooldown ECS system."
        },

        payload
    };
}

try {
    const repository =
        new ShellRepository();

    const shell =
        repository.create(
            makeShell()
        );

    const tree =
        new ProjectTree();

    tree.addShell(shell);

    const state =
        createProjectState(tree);

    const resolver =
        new ProjectStateResolver(
            repository
        );

    const resolved =
        resolver.resolve(state);

    assert.strictEqual(
        resolved.type,
        "ResolvedProject"
    );

    assert.strictEqual(
        resolved.schemaVersion,
        1
    );

    assert.strictEqual(
        resolved.snapshotHash,
        state.snapshotHash
    );

    assert.strictEqual(
        resolved.shells.length,
        1
    );

    assert.strictEqual(
        resolved.shells[0].identity.id,
        "weapon-timer-system"
    );

    assert.strictEqual(
        resolved.shells[0].identity.version,
        1
    );

    assert.strictEqual(
        resolved.shells[0].identity.hash,
        shell.identity.hash
    );

    assert.strictEqual(
        resolved.shells[0].position.path,
        "systems.weapon.timer"
    );

    console.log(
        "PROJECT RESOLVER OK"
    );

    console.log(
        JSON.stringify(
            {
                snapshotHash:
                    resolved.snapshotHash,
                shells:
                    resolved.shells.map(
                        item => ({
                            id: item.identity.id,
                            version: item.identity.version,
                            path: item.position.path,
                            hash: item.identity.hash
                        })
                    )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT RESOLVER FAILED"
    );

    console.error(error);

    process.exit(1);
}
