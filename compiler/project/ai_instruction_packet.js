// compiler/project/ai_instruction_packet.js
//
// Deterministic AI Instruction Packet.
//
// Purpose:
// - convert an AITask into a compact, deterministic instruction packet;
// - give an external/weak AI an explicit ShellContract;
// - prevent the AI from inventing project identity/version/path data;
// - preserve snapshotHash as the project integrity anchor;
// - provide a stable JSON representation suitable for hashing/transmission.
//
// IMPORTANT:
// This module does NOT execute AI output.
// It only defines the deterministic contract sent to the AI.

const crypto = require("crypto");

class AIInstructionPacketError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "AIInstructionPacketError";
        this.code = "LS014";
        this.value = value;
    }
}

function assertHash(value, field) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(value)
    ) {
        throw new AIInstructionPacketError(
            `${field} must be a SHA-256 hexadecimal hash.`,
            value
        );
    }
}

function assertAITask(task) {
    if (!task || typeof task !== "object") {
        throw new AIInstructionPacketError(
            "Expected AITask.",
            task
        );
    }

    if (task.type !== "AITask") {
        throw new AIInstructionPacketError(
            "Expected AITask.",
            task
        );
    }

    assertHash(
        task.snapshotHash,
        "AITask.snapshotHash"
    );

    if (
        typeof task.intent !== "string" ||
        task.intent.trim().length === 0
    ) {
        throw new AIInstructionPacketError(
            "AITask.intent must be a non-empty string.",
            task.intent
        );
    }

    if (!Array.isArray(task.changes)) {
        throw new AIInstructionPacketError(
            "AITask.changes must be an array.",
            task.changes
        );
    }

    if (task.changes.length === 0) {
        throw new AIInstructionPacketError(
            "AITask.changes must not be empty."
        );
    }

    for (const change of task.changes) {
        if (!change || typeof change !== "object") {
            throw new AIInstructionPacketError(
                "AITask change must be an object.",
                change
            );
        }

        if (
            typeof change.shellId !== "string" ||
            change.shellId.length === 0
        ) {
            throw new AIInstructionPacketError(
                "AITask change.shellId is required.",
                change
            );
        }

        if (
            change.operation !== "UPDATE" &&
            change.operation !== "CREATE" &&
            change.operation !== "DELETE"
        ) {
            throw new AIInstructionPacketError(
                `Unsupported AI task operation '${change.operation}'.`,
                change
            );
        }

        if (
            change.operation === "UPDATE" &&
            (
                typeof change.baseVersion !== "number" ||
                !Number.isInteger(change.baseVersion)
            )
        ) {
            throw new AIInstructionPacketError(
                "UPDATE change requires integer baseVersion.",
                change
            );
        }
    }
}

const SHELL_CONTRACT = Object.freeze([
    "A Shell is the atomic project evolution unit.",
    "The AI may propose Shell content but does not own project identity.",
    "The AI must not invent shellId values.",
    "The AI must not change an existing Shell path unless explicitly requested by the evolution system.",
    "The AI must not change an existing Shell version.",
    "The AI must not change an existing Shell generation.",
    "The AI must not modify snapshotHash.",
    "The AI must not reference Shell versions that are not present in the supplied context.",
    "The AI must preserve the semantic purpose of the Shell unless the task explicitly changes it.",
    "The AI must express structural changes through valid Luascript AST constructs.",
    "The AI must produce deterministic source semantics.",
    "The AI must not directly emit Roblox-specific deployment files.",
    "The AI must not bypass validation, planning, execution, weaving, compilation, or emission.",
    "If required information is absent, the AI must report the missing information instead of inventing it."
]);

function cloneChange(change) {
    const result = {
        shellId: change.shellId,
        operation: change.operation
    };

    if (change.path !== undefined) {
        result.path = change.path;
    }

    if (change.baseVersion !== undefined) {
        result.baseVersion = change.baseVersion;
    }

    if (change.proposal !== undefined) {
        result.proposal = JSON.parse(
            JSON.stringify(change.proposal)
        );
    }

    return result;
}

function createAIInstructionPacket(task) {
    assertAITask(task);

    const changes = task.changes
        .map(cloneChange)
        .sort((a, b) => {
            if (a.shellId < b.shellId) {
                return -1;
            }

            if (a.shellId > b.shellId) {
                return 1;
            }

            return 0;
        });

    return {
        type: "AIInstructionPacket",
        schemaVersion: 1,

        snapshotHash: task.snapshotHash,

        intent: task.intent,

        contract: "ShellContract",

        instructions: [...SHELL_CONTRACT],

        changes
    };
}

function serializeAIInstructionPacket(packet) {
    if (!packet || typeof packet !== "object") {
        throw new AIInstructionPacketError(
            "Expected AIInstructionPacket.",
            packet
        );
    }

    if (packet.type !== "AIInstructionPacket") {
        throw new AIInstructionPacketError(
            "Expected AIInstructionPacket.",
            packet
        );
    }

    if (packet.schemaVersion !== 1) {
        throw new AIInstructionPacketError(
            "Unsupported AIInstructionPacket schema version.",
            packet.schemaVersion
        );
    }

    assertHash(
        packet.snapshotHash,
        "AIInstructionPacket.snapshotHash"
    );

    if (
        typeof packet.intent !== "string" ||
        packet.intent.trim().length === 0
    ) {
        throw new AIInstructionPacketError(
            "AIInstructionPacket.intent must be a non-empty string."
        );
    }

    if (packet.contract !== "ShellContract") {
        throw new AIInstructionPacketError(
            "AIInstructionPacket.contract must be ShellContract."
        );
    }

    if (!Array.isArray(packet.instructions)) {
        throw new AIInstructionPacketError(
            "AIInstructionPacket.instructions must be an array."
        );
    }

    if (!Array.isArray(packet.changes)) {
        throw new AIInstructionPacketError(
            "AIInstructionPacket.changes must be an array."
        );
    }

    return JSON.stringify(
        packet,
        null,
        2
    );
}

function parseAIInstructionPacket(serialized) {
    if (typeof serialized !== "string") {
        throw new AIInstructionPacketError(
            "Expected serialized AIInstructionPacket string.",
            serialized
        );
    }

    let packet;

    try {
        packet = JSON.parse(serialized);
    } catch (error) {
        throw new AIInstructionPacketError(
            "Invalid serialized AIInstructionPacket JSON."
        );
    }

    serializeAIInstructionPacket(packet);

    return packet;
}

function hashAIInstructionPacket(packet) {
    const serialized =
        serializeAIInstructionPacket(packet);

    return crypto
        .createHash("sha256")
        .update(serialized, "utf8")
        .digest("hex");
}

function cloneAIInstructionPacket(packet) {
    return parseAIInstructionPacket(
        serializeAIInstructionPacket(packet)
    );
}

module.exports = {
    AIInstructionPacketError,
    SHELL_CONTRACT,
    createAIInstructionPacket,
    serializeAIInstructionPacket,
    parseAIInstructionPacket,
    hashAIInstructionPacket,
    cloneAIInstructionPacket
};
