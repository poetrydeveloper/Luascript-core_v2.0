const assert = require("assert");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectState,
    serializeProjectState,
    parseProjectState,
    cloneProjectState
} = require("../../compiler/project/state");

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

    const state =
        createProjectState(tree);

    assert.strictEqual(
        state.type,
        "ProjectState"
    );

    assert.strictEqual(
        state.schemaVersion,
        1
    );

    assert.strictEqual(
        state.nodes.length,
        3
    );

    assert.deepStrictEqual(
        state.nodes.map(
            node => node.path
        ),
        [
            "systems",
            "systems.weapon",
            "systems.weapon.timer"
        ]
    );

    assert.strictEqual(
        state.snapshotHash.length,
        64
    );

    const serialized =
        serializeProjectState(state);

    assert.ok(
        serialized.length > 0
    );

    const restored =
        parseProjectState(serialized);

    assert.deepStrictEqual(
        restored,
        state
    );

    const cloned =
        cloneProjectState(state);

    assert.deepStrictEqual(
        cloned,
        state
    );

    console.log("PROJECT STATE OK");

    console.log(
        JSON.stringify(
            {
                type: state.type,
                schemaVersion: state.schemaVersion,
                snapshotHash: state.snapshotHash,
                nodes: state.nodes.map(
                    node => node.path
                )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT STATE FAILED"
    );

    console.error(error);

    process.exit(1);
}
