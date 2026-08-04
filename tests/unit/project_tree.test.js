const assert = require("assert");

const {
    ProjectTree
} = require("../../compiler/project_tree");

function shell(path, parent, order) {
    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: path.replace(/\./g, "-"),
            hash: "0000000000000000000000000000000000000000000000000000000000000000",
            version: 1
        },

        position: {
            path,
            parent,
            order
        },

        lifecycle: {
            actual: true,
            generation: 1,
            createdAt: "2026-08-04T00:00:00.000Z",
            supersedes: null
        },

        semantic: {
            name: path,
            purpose: "",
            tags: [],
            description: ""
        },

        payload: {
            type: "Program",
            declarations: []
        }
    };
}

try {
    const tree = new ProjectTree();

    const systems =
        shell("systems", null, 0);

    const weapon =
        shell("systems.weapon", "systems", 0);

    const timer =
        shell(
            "systems.weapon.timer",
            "systems.weapon",
            0
        );

    tree.addShell(systems);
    tree.addShell(weapon);
    tree.addShell(timer);

    assert.strictEqual(
        tree.size(),
        3
    );

    assert.deepStrictEqual(
        tree.roots().map(
            node => node.position.path
        ),
        [
            "systems"
        ]
    );

    assert.deepStrictEqual(
        tree.children("systems").map(
            node => node.position.path
        ),
        [
            "systems.weapon"
        ]
    );

    assert.deepStrictEqual(
        tree.children("systems.weapon").map(
            node => node.position.path
        ),
        [
            "systems.weapon.timer"
        ]
    );

    assert.strictEqual(
        tree.getShell(
            "systems.weapon.timer"
        ),
        timer
    );

    assert.strictEqual(
        tree.hasShell(
            "systems.weapon.timer"
        ),
        true
    );

    assert.deepStrictEqual(
        tree.listPaths(),
        [
            "systems",
            "systems.weapon",
            "systems.weapon.timer"
        ]
    );

    const replacement =
        shell(
            "systems.weapon.timer",
            "systems.weapon",
            1
        );

    tree.replaceShell(replacement);

    assert.strictEqual(
        tree.getShell(
            "systems.weapon.timer"
        ).position.order,
        1
    );

    const removed =
        tree.removeShell(
            "systems.weapon.timer"
        );

    assert.strictEqual(
        removed,
        replacement
    );

    assert.strictEqual(
        tree.hasShell(
            "systems.weapon.timer"
        ),
        false
    );

    console.log("PROJECT TREE OK");

    console.log(
        JSON.stringify(
            {
                size: tree.size(),
                roots: tree.roots().map(
                    node => node.position.path
                ),
                paths: tree.listPaths()
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT TREE FAILED"
    );

    console.error(error);

    process.exit(1);
}
