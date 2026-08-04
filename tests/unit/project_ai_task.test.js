// tests/unit/project_ai_task.test.js

const assert = require("assert");

const {
    createAITask,
    serializeAITask,
    parseAITask,
    cloneAITask,
    toEvolutionRequest,
    AITaskError
} = require("../../compiler/project/ai_task");

const {
    getShellContract,
    getAIShellInstructions
} = require("../../compiler/project/shell_contract");

const SNAPSHOT =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

try {
    const task = createAITask({
        snapshotHash: SNAPSHOT,

        intent:
            "Add pistol support to the weapon system.",

        constraints: [
            "Preserve existing weapon behavior.",
            "Do not modify unrelated systems."
        ],

        changes: [
            {
                shellId: "weapon-system",
                operation: "UPDATE",
                baseVersion: 1,
                proposal: {
                    purpose:
                        "Add pistol support to weapon behavior."
                }
            }
        ]
    });

    assert.strictEqual(
        task.type,
        "AITask"
    );

    assert.strictEqual(
        task.schemaVersion,
        1
    );

    assert.strictEqual(
        task.snapshotHash,
        SNAPSHOT
    );

    assert.strictEqual(
        task.changes.length,
        1
    );

    assert.strictEqual(
        task.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        task.changes[0].baseVersion,
        1
    );

    const serialized =
        serializeAITask(task);

    const parsed =
        parseAITask(serialized);

    assert.deepStrictEqual(
        parsed,
        task
    );

    const cloned =
        cloneAITask(task);

    assert.deepStrictEqual(
        cloned,
        task
    );

    const evolution =
        toEvolutionRequest(task);

    assert.strictEqual(
        evolution.type,
        "EvolutionRequest"
    );

    assert.strictEqual(
        evolution.schemaVersion,
        1
    );

    assert.strictEqual(
        evolution.snapshotHash,
        SNAPSHOT
    );

    assert.strictEqual(
        evolution.intent,
        task.intent
    );

    assert.strictEqual(
        evolution.changes.length,
        1
    );

    assert.strictEqual(
        evolution.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        evolution.changes[0].operation,
        "UPDATE"
    );

    assert.strictEqual(
        evolution.changes[0].baseVersion,
        1
    );

    assert.throws(
        () => createAITask({
            snapshotHash: SNAPSHOT,
            intent: "Bad task",
            changes: []
        }),
        error =>
            error instanceof AITaskError
    );

    assert.throws(
        () => createAITask({
            snapshotHash: SNAPSHOT,
            intent: "Bad operation",
            changes: [
                {
                    shellId: "weapon-system",
                    operation: "HACK"
                }
            ]
        }),
        error =>
            error instanceof AITaskError
    );

    assert.throws(
        () => createAITask({
            snapshotHash:
                "not-a-hash",
            intent: "Bad snapshot",
            changes: [
                {
                    shellId: "weapon-system",
                    operation: "UPDATE",
                    baseVersion: 1
                }
            ]
        }),
        error =>
            error instanceof AITaskError
    );

    const contract =
        getShellContract();

    assert.strictEqual(
        contract.type,
        "ShellContract"
    );

    assert.strictEqual(
        contract.schemaVersion,
        1
    );

    assert.strictEqual(
        contract.payload.requiredType,
        "Program"
    );

    assert.ok(
        Array.isArray(
            contract.forbidden
        )
    );

    const instructions =
        getAIShellInstructions();

    assert.ok(
        Array.isArray(instructions)
    );

    assert.ok(
        instructions.length > 0
    );

    console.log(
        "PROJECT AI TASK OK"
    );

    console.log(
        JSON.stringify(
            {
                type: task.type,
                snapshotHash:
                    task.snapshotHash,
                intent: task.intent,
                changes: task.changes,
                contract:
                    contract.type,
                instructionCount:
                    instructions.length
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT AI TASK FAILED"
    );

    console.error(error);

    process.exit(1);
}
