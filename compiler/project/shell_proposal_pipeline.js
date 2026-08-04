// compiler/project/shell_proposal_pipeline.js
//
// Shell Proposal Pipeline
//
// Purpose:
//
// Convert an AI-generated ShellProposal into a validated
// candidate Shell without mutating the project.
//
// Pipeline:
//
// ShellProposal
//      |
//      v
// ShellProposalValidator
//      |
//      v
// ShellSourceValidator
//      |
//      v
// ShellSourceBuilder
//      |
//      v
// Candidate Shell
//
// IMPORTANT:
//
// This module does NOT:
//
// - modify ProjectTree
// - modify ShellRepository
// - mark a Shell as actual
// - replace an existing Shell
//
// It only prepares a deterministic candidate.
//
// Mutation belongs to EvolutionExecutor.

const {
    ShellProposalValidator
} = require("./shell_proposal_validator");

const {
    ShellSourceValidator
} = require("./shell_source_validator");

const {
    ShellSourceBuilder
} = require("./shell_source_builder");

class ShellProposalPipelineError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellProposalPipelineError";
        this.code = "LS018";
        this.value = value;
    }
}

class ShellProposalPipeline {
    constructor(repository) {
        if (
            !repository ||
            typeof repository.getVersion !== "function"
        ) {
            throw new ShellProposalPipelineError(
                "Expected ShellRepository."
            );
        }

        this.repository = repository;

        this.proposalValidator =
            new ShellProposalValidator(
                repository
            );

        this.sourceValidator =
            new ShellSourceValidator();

        this.sourceBuilder =
            new ShellSourceBuilder(
                repository
            );
    }

    prepare(proposal) {
        if (
            !proposal ||
            typeof proposal !== "object"
        ) {
            throw new ShellProposalPipelineError(
                "Expected ShellProposal.",
                proposal
            );
        }

        let validatedProposal;

        try {
            validatedProposal =
                this.proposalValidator.validate(
                    proposal
                );
        } catch (error) {
            throw new ShellProposalPipelineError(
                "Shell proposal validation failed.",
                error
            );
        }

        let validatedSource;

        try {
            validatedSource =
                this.sourceValidator.validate(
                    proposal
                );
        } catch (error) {
            throw new ShellProposalPipelineError(
                "Shell source validation failed.",
                error
            );
        }

        let candidate;

        try {
            candidate =
                this.sourceBuilder.build(
                    validatedProposal,
                    validatedSource
                );
        } catch (error) {
            throw new ShellProposalPipelineError(
                "Shell source build failed.",
                error
            );
        }

        if (
            !candidate ||
            candidate.type !== "Shell"
        ) {
            throw new ShellProposalPipelineError(
                "ShellSourceBuilder did not return a Shell.",
                candidate
            );
        }

        if (
            candidate.identity.id !==
            validatedProposal.shellId
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell identity does not match proposal.",
                {
                    expected:
                        validatedProposal.shellId,

                    received:
                        candidate.identity.id
                }
            );
        }

        if (
            candidate.identity.version !==
            validatedProposal.baseVersion + 1
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell version is invalid.",
                {
                    expected:
                        validatedProposal.baseVersion + 1,

                    received:
                        candidate.identity.version
                }
            );
        }

        if (
            candidate.lifecycle.actual !== false
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell must not be actual.",
                candidate.lifecycle.actual
            );
        }

        if (
            candidate.lifecycle.supersedes !==
            validatedProposal.baseHash
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell must supersede proposal base hash.",
                {
                    expected:
                        validatedProposal.baseHash,

                    received:
                        candidate.lifecycle.supersedes
                }
            );
        }

        return {
            type: "PreparedShellProposal",
            schemaVersion: 1,

            shellId:
                validatedProposal.shellId,

            operation:
                validatedProposal.operation,

            baseVersion:
                validatedProposal.baseVersion,

            baseHash:
                validatedProposal.baseHash,

            source:
                validatedSource.source,

            tokens:
                validatedSource.tokens,

            ast:
                validatedSource.ast,

            astValidated:
                validatedSource.astValidated,

            candidate
        };
    }
}

module.exports = {
    ShellProposalPipelineError,
    ShellProposalPipeline
};
