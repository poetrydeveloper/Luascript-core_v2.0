const assert = require("assert");

const {
    ShellTree
} = require("../../compiler/shell/tree");

function shell(
    path,
    parent,
    order,
    name
) {
    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: name.toLowerCase(),
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
            name,
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
    const tree = new ShellTree();

    const systems = shell(
        "systems",
        null,
        0,
        "Systems"
    );

    const weapon = shell(
        "systems.weapon",
        "systems",
        0,
        "Weapon"
    );

    const timer = shell(
        "systems.weapon.timer",
        "systems.weapon",
        0,
        "WeaponTimerSystem"
    );

    const combat = shell(
        "systems.combat",
        "systems",
        1,
        "Combat"
    );

    tree.add(systems);
    tree.add(weapon);
    tree.add(timer);
    tree.add(combat);

    assert.strictEqual(
        tree.size(),
        4
    );

    assert.strictEqual(
        tree.getRoots().length,
        1
    );

    assert.strictEqual(
        tree.getChildren("systems").length,
        2
    );

    assert.strictEqual(
        tree.getChildren("systems")[0]
            .position.path,
        "systems.weapon"
    );

    assert.strictEqual(
        tree.getChildren("systems.weapon")[0]
            .position.path,
        "systems.weapon.timer"
    );

    assert.strictEqual(
        tree.getActual("systems.weapon.timer")
            .semantic.name,
        "WeaponTimerSystem"
    );

    assert.strictEqual(
        tree.has("systems.weapon.timer"),
        true
    );

    assert.strictEqual(
        tree.has("systems.missing"),
        false
    );

    assert.deepStrictEqual(
        tree.listPaths(),
        [
            "systems",
            "systems.combat",
            "systems.weapon",
            "systems.weapon.timer"
        ]
    );

    console.log("SHELL TREE OK");

    console.log(
        JSON.stringify(
            {
                size: tree.size(),
                roots: tree.getRoots()
                    .map(node => node.position.path),
                weaponChildren: tree
                    .getChildren("systems.weapon")
                    .map(node => node.position.path)
            },
            null,
            2
        )
    );

} catch (error) {
    console.error("SHELL TREE FAILED");
    console.error(error);
    process.exit(1);
}
