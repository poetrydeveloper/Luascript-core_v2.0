// compiler/project/shell_proposal_validator.js
//
// Shell Proposal Validator.
//
// Validates an AI-produced ShellProposal against the current
// ShellRepository.
//
// The validator does NOT mutate the repository.
//
// Pipeline:
//
// AI
//  |
//  v
// ShellProposal
//  |
//  v
// ShellProposalValidator
//  |
//  +--> reject
//  |
//  +--> accept
//          |
//          v
//     EvolutionExecutor
//
// Security properties:
// - shellId must exist;
// - operation must be allowed;
// - baseVersion must match actual repository version;
// - baseHash must match actual repository hash;
// - UPDATE must preserve shell identity;
// - source must be present;
// - semantic data must be valid;
// - proposal cannot silently target another Shell.
//
// Luascript syntax validation itself belongs to the language/parser
// validation pipeline. This validator only guarantees that source is
// present and structurally attached to the correct Shell proposal.

const {
    assertShellProposal
} = require("./shell_proposal");

class ShellProposalValidatorError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellProposalValidatorError";
        this.code = "LS016";
        this.value = value;
    }
}

function assertRepository(repository) {
    if (
        !repository ||
        typeof repository.getVersion !== "function"
    ) {
        throw new ShellProposalValidatorError(
            "Expected ShellRepository."
        );
    }
}

function validateShellProposal(
    repository,
    proposal
) {
    assertRepository(repository);

    try {
        assertShellProposal(proposal);
    } catch (error) {
        throw new ShellProposalValidatorError(
            error.message,
            error.value
        );
    }

    const shell =
        repository.getVersion(
            proposal.shellId,
            proposal.baseVersion
        );

    if (!shell) {
        throw new ShellProposalValidatorError(
            `Shell '${proposal.shellId}' version ${proposal.baseVersion} was not found.`,
            proposal
        );
    }

    if (
        !shell.identity ||
        shell.identity.id !== proposal.shellId
    ) {
        throw new ShellProposalValidatorError(
            "Shell identity mismatch.",
            {
                expected:
                    proposal.shellId,

                received:
                    shell.identity &&
                    shell.identity.id
            }
        );
    }

    if (
        shell.identity.version !==
        proposal.baseVersion
    ) {
        throw new ShellProposalValidatorError(
            `Shell '${proposal.shellId}' version mismatch.`,
            {
                expected:
                    proposal.baseVersion,

                received:
                    shell.identity.version
            }
        );
    }

    if (
        shell.identity.hash !==
        proposal.baseHash
    ) {
        throw new ShellProposalValidatorError(
            `Shell '${proposal.shellId}' base hash mismatch.`,
            {
                expected:
                    proposal.baseHash,

                received:
                    shell.identity.hash
            }
        );
    }

    if (
        proposal.operation === "UPDATE" ||
        proposal.operation === "DELETE"
    ) {
        if (
            !shell.lifecycle ||
            shell.lifecycle.actual !== true
        ) {
            throw new ShellProposalValidatorError(
                `Shell '${proposal.shellId}' is not actual.`,
                shell.lifecycle
            );
        }
    }

    if (
        proposal.operation === "UPDATE"
    ) {
        if (
            !proposal.source ||
            proposal.source.trim().length === 0
        ) {
            throw new ShellProposalValidatorError(
                "UPDATE proposal requires source."
            );
        }

        if (
            !proposal.semantic ||
            typeof proposal.semantic !== "object"
        ) {
            throw new ShellProposalValidatorError(
                "UPDATE proposal requires semantic data."
            );
        }
    }

    if (
        proposal.operation === "DELETE"
    ) {
        if (
            proposal.source !== undefined &&
            proposal.source !== null
        ) {
            throw new ShellProposalValidatorError(
                "DELETE proposal must not contain source.",
                proposal.source
            );
        }

        if (
            proposal.semantic !== undefined
        ) {
            throw new ShellProposalValidatorError(
                "DELETE proposal must not contain semantic data.",
                proposal.semantic
            );
        }
    }

    return {
        valid: true,

        type: "ValidatedShellProposal",

        schemaVersion: 1,

        shellId:
            shell.identity.id,

        operation:
            proposal.operation,

        baseVersion:
            shell.identity.version,

        baseHash:
            shell.identity.hash,

        path:
            shell.position.path,

        generation:
            shell.lifecycle.generation,

        proposal
    };
}

class ShellProposalValidator {
    constructor(repository) {
        assertRepository(repository);

        this.repository =
            repository;
    }

    validate(proposal) {
        return validateShellProposal(
            this.repository,
            proposal
        );
    }
}

module.exports = {
    ShellProposalValidatorError,
    ShellProposalValidator,
    validateShellProposal
};
