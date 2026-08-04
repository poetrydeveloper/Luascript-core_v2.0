// tests/unit/project_ai_instruction_packet.test.js

const assert = require("assert");
const crypto = require("crypto");

const {
    createAIInstructionPacket,
    serializeAIInstructionPacket,
    parseAIInstructionPacket,
    hashAIInstructionPacket,
    cloneAIInstructionPacket
} = require("../../compiler/project/ai_instruction_packet");

const snapshotHash =
    crypto
        .createHash("sha256")
        .update("project-snapshot-test", "utf8")
        .digest("hex");

const task = {
    type: "AITask",
    schemaVersion: 1,

    snapshotHash,

    intent:
        "Add pistol support to the weapon system.",

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
    ],

    contract: "ShellContract",

    instructionCount: 14
};

try {
    const packet =
        createAIInstructionPacket(task);

    assert.strictEqual(
        packet.type,
        "AIInstructionPacket"
    );

    assert.strictEqual(
        packet.schemaVersion,
        1
    );

    assert.strictEqual(
        packet.snapshotHash,
        snapshotHash
    );

    assert.strictEqual(
        packet.intent,
        task.intent
    );

    assert.strictEqual(
        packet.contract,
        "ShellContract"
    );

    assert.strictEqual(
        packet.instructions.length,
        14
    );

    assert.strictEqual(
        packet.changes.length,
        1
    );

    assert.strictEqual(
        packet.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        packet.changes[0].operation,
        "UPDATE"
    );

    assert.strictEqual(
        packet.changes[0].baseVersion,
        1
    );

    assert.deepStrictEqual(
        packet.changes[0].proposal,
        {
            purpose:
                "Add pistol support to weapon behavior."
        }
    );

    const serialized =
        serializeAIInstructionPacket(packet);

    const parsed =
        parseAIInstructionPacket(
            serialized
        );

    assert.deepStrictEqual(
        parsed,
        packet
    );

    const cloned =
        cloneAIInstructionPacket(packet);

    assert.deepStrictEqual(
        cloned,
        packet
    );

    const hash1 =
        hashAIInstructionPacket(packet);

    const hash2 =
        hashAIInstructionPacket(cloned);

    assert.strictEqual(
        hash1,
        hash2
    );

    assert.match(
        hash1,
        /^[a-f0-9]{64}$/
    );

    const modified = {
        ...packet,
        intent:
            "Add rifle support to the weapon system."
    };

    const modifiedHash =
        hashAIInstructionPacket(modified);

    assert.notStrictEqual(
        modifiedHash,
        hash1
    );

    assert.throws(
        () =>
            createAIInstructionPacket({
                ...task,
                snapshotHash: "invalid"
            })
    );

    assert.throws(
        () =>
            createAIInstructionPacket({
                ...task,
                changes: []
            })
    );

    assert.throws(
        () =>
            createAIInstructionPacket({
                ...task,
                changes: [
                    {
                        shellId: "weapon-system",
                        operation: "UPDATE"
                    }
                ]
            })
    );

    assert.throws(
        () =>
            createAIInstructionPacket({
                ...task,
                changes: [
                    {
                        shellId: "weapon-system",
                        operation: "INVALID",
                        baseVersion: 1
                    }
                ]
            })
    );

    console.log(
        "PROJECT AI INSTRUCTION PACKET OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    packet.type,

                snapshotHash:
                    packet.snapshotHash,

                contract:
                    packet.contract,

                instructionCount:
                    packet.instructions.length,

                changes:
                    packet.changes.map(
                        change => ({
                            shellId:
                                change.shellId,

                            operation:
                                change.operation,

                            baseVersion:
                                change.baseVersion
                        })
                    ),

                hash:
                    hash1
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT AI INSTRUCTION PACKET FAILED"
    );

    console.error(error);

    process.exit(1);
}
