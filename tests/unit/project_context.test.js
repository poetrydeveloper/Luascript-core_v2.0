const assert = require("assert");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectContext,
    serializeProjectContext,
    cloneProjectContext
} = require("../../compiler/project/context");

function makeShell(
    id,
    path,
    parent,
    order,
    purpose
) {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id,
            hash: hashAST(payload),
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
            name: id,
            purpose,
            tags: ["system"],
            description: purpose
        },

        payload
    };
}

try {
    const tree =
        new ProjectTree();

    tree.addShell(
        makeShell(
            "systems",
            "systems",
            null,
            0,
            "Root systems."
        )
    );

    tree.addShell(
        makeShell(
            "weapon-system",
            "systems.weapon",
            "systems",
            0,
            "Controls weapon state."
        )
    );

    tree.addShell(
        makeShell(
            "weapon-timer-system",
            "systems.weapon.timer",
            "systems.weapon",
            0,
            "Updates weapon cooldown state."
        )
    );

    const context =
        createProjectContext(tree);

    assert.strictEqual(
        context.type,
        "ProjectContext"
    );

    assert.strictEqual(
        context.schemaVersion,
        1
    );

    assert.strictEqual(
        context.project.shellCount,
        3
    );

    assert.deepStrictEqual(
        context.tree.roots,
        ["systems"]
    );

    assert.deepStrictEqual(
        context.tree.paths,
        [
            "systems",
            "systems.weapon",
            "systems.weapon.timer"
        ]
    );

    assert.strictEqual(
        context.shells.length,
        3
    );

    const timer =
        context.shells.find(
            shell =>
                shell.id === "weapon-timer-system"
        );

    assert.ok(
        timer,
        "Timer Shell must exist in context."
    );

    assert.strictEqual(
        timer.path,
        "systems.weapon.timer"
    );

    assert.strictEqual(
        timer.semantic.purpose,
        "Updates weapon cooldown state."
    );

    /*
     * The compact context must not contain
     * the full AST payload.
     */
    assert.strictEqual(
        Object.prototype.hasOwnProperty.call(
            timer,
            "payload"
        ),
        false
    );

    const serialized =
        serializeProjectContext(context);

    assert.ok(
        serialized.length > 0,
        "Serialized ProjectContext must not be empty."
    );

    const cloned =
        cloneProjectContext(context);

    assert.deepStrictEqual(
        cloned,
        context
    );

    console.log(
        "PROJECT CONTEXT OK"
    );

    console.log(
        JSON.stringify(
            {
                type: context.type,
                schemaVersion: context.schemaVersion,
                snapshotHash:
                    context.project.snapshotHash,
                shellCount:
                    context.project.shellCount,
                roots:
                    context.tree.roots,
                shells:
                    context.shells.map(
                        shell => ({
                            id: shell.id,
                            path: shell.path,
                            version: shell.version,
                            generation: shell.generation,
                            actual: shell.actual
                        })
                    )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT CONTEXT FAILED"
    );

    console.error(error);

    process.exit(1);
}
