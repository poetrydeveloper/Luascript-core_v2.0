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
    createProjectContext
} = require("../../compiler/project/context");

const {
    createAIProjectContext,
    serializeAIProjectContext,
    parseAIProjectContext,
    cloneAIProjectContext
} = require("../../compiler/project/context_serializer");

function makeShell(
    id,
    path,
    parent,
    purpose,
    order = 0
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
            tags: [
                "test"
            ],
            description: `Test shell for ${id}.`
        },

        payload
    };
}

try {
    const repository =
        new ShellRepository();

    const systems =
        repository.create(
            makeShell(
                "systems",
                "systems",
                null,
                "Root systems."
            )
        );

    const weapon =
        repository.create(
            makeShell(
                "weapon-system",
                "systems.weapon",
                "systems",
                "Controls weapon behavior."
            )
        );

    const timer =
        repository.create(
            makeShell(
                "weapon-timer-system",
                "systems.weapon.timer",
                "systems.weapon",
                "Updates weapon cooldown state."
            )
        );

    const tree =
        new ProjectTree();

    tree.addShell(systems);
    tree.addShell(weapon);
    tree.addShell(timer);

    const projectContext =
        createProjectContext(tree);

    const aiContext =
        createAIProjectContext(
            projectContext
        );

    assert.strictEqual(
        aiContext.type,
        "AIProjectContext"
    );

    assert.strictEqual(
        aiContext.schemaVersion,
        1
    );

    assert.strictEqual(
        aiContext.project.snapshotHash,
        projectContext.project.snapshotHash
    );

    assert.strictEqual(
        aiContext.shellCount,
        3
    );

    assert.strictEqual(
        aiContext.shells.length,
        3
    );

    assert.deepStrictEqual(
        aiContext.shells.map(
            shell => shell.path
        ),
        [
            "systems",
            "systems.weapon",
            "systems.weapon.timer"
        ]
    );

    const timerContext =
        aiContext.shells.find(
            shell =>
                shell.id === "weapon-timer-system"
        );

    assert.ok(timerContext);

    assert.strictEqual(
        timerContext.version,
        1
    );

    assert.strictEqual(
        timerContext.actual,
        true
    );

    assert.strictEqual(
        timerContext.purpose,
        "Updates weapon cooldown state."
    );

    /*
     * The AI context deliberately does not contain
     * the complete AST payload.
     */
    assert.strictEqual(
        Object.prototype.hasOwnProperty.call(
            timerContext,
            "payload"
        ),
        false
    );

    const serialized =
        serializeAIProjectContext(
            projectContext
        );

    assert.ok(
        serialized.includes(
            "AIProjectContext"
        )
    );

    const restored =
        parseAIProjectContext(
            serialized
        );

    assert.deepStrictEqual(
        restored,
        aiContext
    );

    const cloned =
        cloneAIProjectContext(
            projectContext
        );

    assert.deepStrictEqual(
        cloned,
        aiContext
    );

    console.log(
        "PROJECT CONTEXT SERIALIZER OK"
    );

    console.log(
        JSON.stringify(
            {
                type: aiContext.type,
                schemaVersion:
                    aiContext.schemaVersion,
                snapshotHash:
                    aiContext.snapshotHash,
                shellCount:
                    aiContext.shellCount,
                shells:
                    aiContext.shells
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT CONTEXT SERIALIZER FAILED"
    );

    console.error(error);

    process.exit(1);
}
