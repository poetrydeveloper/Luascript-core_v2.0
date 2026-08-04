// compiler/project/shell_proposal.js
//
// Shell Proposal.
//
// Represents a proposed evolution of one Shell produced by an AI.
//
// IMPORTANT:
// - AI proposes.
// - Validator decides whether proposal is structurally valid.
// - Executor applies accepted proposal.
// - AI never owns shell identity, version, generation or snapshot.
//
// A proposal may contain:
// - existing shell identity;
// - base version;
// - operation;
// - semantic changes;
// - Luascript source.
//
// The proposal itself does NOT mutate ProjectTree.

const crypto = require("crypto");

class ShellProposalError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellProposalError";
        this.code = "LS015";
        this.value = value;
    }
}

function assertHash(value, field) {
    if (
        typeof value !== "string" ||
        !/^[a-f0-9]{64}$/.test(value)
    ) {
        throw new ShellProposalError(
            `${field} must be a SHA-256 hexadecimal hash.`,
            value
        );
    }
}

function assertNonEmptyString(value, field) {
    if (
        typeof value !== "string" ||
        value.trim().length === 0
    ) {
        throw new ShellProposalError(
            `${field} must be a non-empty string.`,
            value
        );
    }
}

function assertInteger(value, field) {
    if (
        typeof value !== "number" ||
        !Number.isInteger(value)
    ) {
        throw new ShellProposalError(
            `${field} must be an integer.`,
            value
        );
    }
}

function assertOperation(operation) {
    if (
        operation !== "CREATE" &&
        operation !== "UPDATE" &&
        operation !== "DELETE"
    ) {
        throw new ShellProposalError(
            `Unsupported ShellProposal operation '${operation}'.`,
            operation
        );
    }
}

function assertShellProposal(proposal) {
    if (!proposal || typeof proposal !== "object") {
        throw new ShellProposalError(
            "Expected ShellProposal.",
            proposal
        );
    }

    if (proposal.type !== "ShellProposal") {
        throw new ShellProposalError(
            "Expected ShellProposal.",
            proposal
        );
    }

    if (proposal.schemaVersion !== 1) {
        throw new ShellProposalError(
            "Unsupported ShellProposal schema version.",
            proposal.schemaVersion
        );
    }

    assertNonEmptyString(
        proposal.shellId,
        "ShellProposal.shellId"
    );

    assertOperation(
        proposal.operation
    );

    assertInteger(
        proposal.baseVersion,
        "ShellProposal.baseVersion"
    );

    if (proposal.baseVersion < 1) {
        throw new ShellProposalError(
            "ShellProposal.baseVersion must be >= 1.",
            proposal.baseVersion
        );
    }

    assertHash(
        proposal.baseHash,
        "ShellProposal.baseHash"
    );

    if (
        proposal.operation !== "DELETE"
    ) {
        if (
            !proposal.semantic ||
            typeof proposal.semantic !== "object"
        ) {
            throw new ShellProposalError(
                "ShellProposal.semantic is required.",
                proposal.semantic
            );
        }

        assertNonEmptyString(
            proposal.semantic.name,
            "ShellProposal.semantic.name"
        );

        assertNonEmptyString(
            proposal.semantic.purpose,
            "ShellProposal.semantic.purpose"
        );

        if (!Array.isArray(proposal.semantic.tags)) {
            throw new ShellProposalError(
                "ShellProposal.semantic.tags must be an array.",
                proposal.semantic.tags
            );
        }

        for (const tag of proposal.semantic.tags) {
            assertNonEmptyString(
                tag,
                "ShellProposal.semantic.tags item"
            );
        }

        assertNonEmptyString(
            proposal.semantic.description,
            "ShellProposal.semantic.description"
        );

        assertNonEmptyString(
            proposal.source,
            "ShellProposal.source"
        );
    }
}

function createShellProposal(input) {
    if (!input || typeof input !== "object") {
        throw new ShellProposalError(
            "Expected proposal input.",
            input
        );
    }

    const proposal = {
        type: "ShellProposal",
        schemaVersion: 1,

        shellId: input.shellId,

        operation:
            input.operation || "UPDATE",

        baseVersion:
            input.baseVersion,

        baseHash:
            input.baseHash,

        semantic:
            input.semantic
                ? {
                    name:
                        input.semantic.name,

                    purpose:
                        input.semantic.purpose,

                    tags:
                        Array.isArray(
                            input.semantic.tags
                        )
                            ? [
                                ...input.semantic.tags
                            ]
                            : [],

                    description:
                        input.semantic.description
                }
                : undefined,

        source:
            input.source
    };

    assertShellProposal(proposal);

    return proposal;
}

function serializeShellProposal(proposal) {
    assertShellProposal(proposal);

    return JSON.stringify(
        proposal,
        null,
        2
    );
}

function parseShellProposal(serialized) {
    if (typeof serialized !== "string") {
        throw new ShellProposalError(
            "Expected serialized ShellProposal string.",
            serialized
        );
    }

    let proposal;

    try {
        proposal = JSON.parse(serialized);
    } catch (error) {
        throw new ShellProposalError(
            "Invalid serialized ShellProposal JSON."
        );
    }

    assertShellProposal(proposal);

    return proposal;
}

function hashShellProposal(proposal) {
    const serialized =
        serializeShellProposal(proposal);

    return crypto
        .createHash("sha256")
        .update(serialized, "utf8")
        .digest("hex");
}

function cloneShellProposal(proposal) {
    return parseShellProposal(
        serializeShellProposal(proposal)
    );
}

module.exports = {
    ShellProposalError,
    assertShellProposal,
    createShellProposal,
    serializeShellProposal,
    parseShellProposal,
    hashShellProposal,
    cloneShellProposal
};
