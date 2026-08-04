const assert = require("assert");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectSnapshot,
    serializeProjectSnapshot,
    parseProjectSnapshot,
    hashProjectSnapshot
} = require("../../compiler/project/snapshot");

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

    tree.addShell(
        shell("systems", null, 0)
    );

    tree.addShell(
        shell("systems.weapon", "systems", 0)
    );

    tree.addShell(
        shell(
            "systems.weapon.timer",
            "systems.weapon",
            0
        )
    );

    const snapshot =
        createProjectSnapshot(tree);

    assert.strictEqual(
        snapshot.type,
        "ProjectSnapshot"
    );

    assert.strictEqual(
        snapshot.schemaVersion,
        1
    );

    assert.deepStrictEqual(
        snapshot.nodes.map(
            node => node.path
        ),
        [
            "systems",
            "systems.weapon",
            "systems.weapon.timer"
        ]
    );

    const serialized =
        serializeProjectSnapshot(snapshot);

    assert.ok(
        serialized.length > 0,
        "Serialized snapshot must not be empty."
    );

    const restored =
        parseProjectSnapshot(serialized);

    assert.deepStrictEqual(
        restored,
        snapshot
    );

    const hash1 =
        hashProjectSnapshot(snapshot);

    const hash2 =
        hashProjectSnapshot(restored);

    assert.strictEqual(
        hash1,
        hash2
    );

    assert.strictEqual(
        hash1.length,
        64
    );

    console.log("PROJECT SNAPSHOT OK");

    console.log(
        JSON.stringify(
            {
                type: snapshot.type,
                schemaVersion: snapshot.schemaVersion,
                paths: snapshot.paths,
                hash: hash1
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT SNAPSHOT FAILED"
    );

    console.error(error);

    process.exit(1);
}
