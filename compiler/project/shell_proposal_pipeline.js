// compiler/project/shell_proposal_pipeline.js
//
// Shell Proposal Pipeline
//
// Purpose:
//
// Convert an AI-generated ShellProposal into a validated
// PreparedShellProposal without mutating the project.
//
// Pipeline:
//
// ShellProposal
//      |
//      v
// ShellProposalValidator
//      |
//      v
// ValidatedShellProposal
//      |
//      v
// ShellSourceValidator
//      |
//      v
// ValidatedShellSource
//      |
//      v
// ShellSourceBuilder
//      |
//      v
// PreparedShellProposal
//      |
//      v
// ShellProposalApplier
//      |
//      v
// ProjectEvolutionExecutor
//
// IMPORTANT:
//
// This pipeline does NOT:
// - mutate ShellRepository
// - mutate ProjectTree
// - commit a Shell
// - mark a candidate as actual
// - replace an existing Shell
//
// Mutation belongs to ProjectEvolutionExecutor.

const {
    ShellProposalValidator
} = require(
    "./shell_proposal_validator"
);

const {
    ShellSourceValidator
} = require(
    "./shell_source_validator"
);

const {
    ShellSourceBuilder
} = require(
    "./shell_source_builder"
);

class ShellProposalPipelineError extends Error {
    constructor(
        message,
        value = null
    ) {
        super(message);

        this.name =
            "ShellProposalPipelineError";

        this.code =
            "LS018";

        this.value =
            value;
    }
}


/*
 * ------------------------------------------------------------
 * Shell Proposal Pipeline
 * ------------------------------------------------------------
 */

class ShellProposalPipeline {
    constructor(repository) {
        if (
            !repository ||
            typeof repository.getVersion !==
                "function"
        ) {
            throw new ShellProposalPipelineError(
                "Expected ShellRepository."
            );
        }

        this.repository =
            repository;

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

    /*
     * --------------------------------------------------------
     * Prepare
     *
     * ShellProposal
     *      ->
     * PreparedShellProposal
     *
     * No mutation happens here.
     * --------------------------------------------------------
     */

    prepare(proposal) {
        if (
            !proposal ||
            typeof proposal !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "Expected ShellProposal.",
                proposal
            );
        }

        /*
         * ----------------------------------------------------
         * Stage 1
         *
         * Validate proposal structure and
         * repository/version constraints.
         * ----------------------------------------------------
         */

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

        /*
         * ----------------------------------------------------
         * Stage 2
         *
         * Validate real Luascript source.
         *
         * This stage performs:
         *
         *   source
         *      ->
         *   lexer
         *      ->
         *   parser
         *      ->
         *   AST
         *
         * The source validator does not mutate
         * the repository.
         * ----------------------------------------------------
         */

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

        /*
         * ----------------------------------------------------
         * Stage 3
         *
         * Build candidate.
         *
         * ShellSourceBuilder returns:
         *
         *   PreparedShellProposal
         *
         * NOT:
         *
         *   Shell
         *
         * The actual candidate Shell is available as:
         *
         *   prepared.candidate
         *
         * The builder must not commit anything.
         * ----------------------------------------------------
         */

        let prepared;

        try {
            prepared =
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

        /*
         * ----------------------------------------------------
         * Stage 3 contract validation
         * ----------------------------------------------------
         */

        if (
            !prepared ||
            typeof prepared !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "ShellSourceBuilder returned an invalid result.",
                prepared
            );
        }

        if (
            prepared.type !==
                "PreparedShellProposal"
        ) {
            throw new ShellProposalPipelineError(
                "ShellSourceBuilder did not return a PreparedShellProposal.",
                prepared
            );
        }

        if (
            prepared.schemaVersion !==
                1
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal schemaVersion must be 1.",
                prepared
            );
        }

        /*
         * ----------------------------------------------------
         * Prepared proposal metadata
         * ----------------------------------------------------
         */

        if (
            prepared.shellId !==
                validatedProposal.shellId
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal shellId does not match proposal.",
                {
                    expected:
                        validatedProposal.shellId,

                    actual:
                        prepared.shellId
                }
            );
        }

        if (
            prepared.operation !==
                validatedProposal.operation
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal operation does not match proposal.",
                {
                    expected:
                        validatedProposal.operation,

                    actual:
                        prepared.operation
                }
            );
        }

        if (
            prepared.baseVersion !==
                validatedProposal.baseVersion
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal baseVersion does not match proposal.",
                {
                    expected:
                        validatedProposal.baseVersion,

                    actual:
                        prepared.baseVersion
                }
            );
        }

        if (
            prepared.baseHash !==
                validatedProposal.baseHash
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal baseHash does not match proposal.",
                {
                    expected:
                        validatedProposal.baseHash,

                    actual:
                        prepared.baseHash
                }
            );
        }

        /*
         * ----------------------------------------------------
         * Candidate contract
         * ----------------------------------------------------
         */

        const candidate =
            prepared.candidate;

        if (
            !candidate ||
            typeof candidate !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal must contain a candidate Shell.",
                prepared
            );
        }

        if (
            candidate.type !==
                "Shell"
        ) {
            throw new ShellProposalPipelineError(
                "PreparedShellProposal candidate must be a Shell.",
                candidate
            );
        }

        /*
         * ----------------------------------------------------
         * Candidate identity
         * ----------------------------------------------------
         */

        if (
            !candidate.identity ||
            typeof candidate.identity !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell identity is required.",
                candidate
            );
        }

        if (
            candidate.identity.id !==
                validatedProposal.shellId
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell identity.id does not match proposal.",
                {
                    expected:
                        validatedProposal.shellId,

                    actual:
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

                    actual:
                        candidate.identity.version
                }
            );
        }

        /*
         * ----------------------------------------------------
         * Candidate lifecycle
         * ----------------------------------------------------
         */

        if (
            !candidate.lifecycle ||
            typeof candidate.lifecycle !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell lifecycle is required.",
                candidate
            );
        }

        /*
         * Candidate is prepared only.
         *
         * It must NOT be actual before
         * EvolutionExecutor commits it.
         */

        if (
            candidate.lifecycle.actual !==
                false
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell must have lifecycle.actual === false.",
                candidate.lifecycle
            );
        }

        if (
            candidate.lifecycle.supersedes !==
                validatedProposal.baseHash
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell must supersede proposal baseHash.",
                {
                    expected:
                        validatedProposal.baseHash,

                    actual:
                        candidate.lifecycle.supersedes
                }
            );
        }

        /*
         * ----------------------------------------------------
         * Candidate position
         * ----------------------------------------------------
         */

        if (
            !candidate.position ||
            typeof candidate.position !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell position is required.",
                candidate
            );
        }

        if (
            typeof candidate.position.path !==
                "string"
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell position.path is required.",
                candidate.position
            );
        }

        /*
         * ----------------------------------------------------
         * Candidate semantic
         * ----------------------------------------------------
         */

        if (
            !candidate.semantic ||
            typeof candidate.semantic !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell semantic is required.",
                candidate
            );
        }

        /*
         * ----------------------------------------------------
         * Candidate payload
         * ----------------------------------------------------
         */

        if (
            !candidate.payload ||
            typeof candidate.payload !==
                "object"
        ) {
            throw new ShellProposalPipelineError(
                "Candidate Shell payload is required.",
                candidate
            );
        }

        /*
         * ----------------------------------------------------
         * IMPORTANT
         *
         * Return PreparedShellProposal unchanged.
         *
         * Do NOT:
         *
         * repository.create(...)
         * repository.save(...)
         * tree.addShell(...)
         * tree.replaceShell(...)
         *
         * Those operations belong exclusively to
         * ProjectEvolutionExecutor.
         * ----------------------------------------------------
         */

        return prepared;
    }
}


/*
 * ------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------
 */

module.exports = {
    ShellProposalPipeline,
    ShellProposalPipelineError
};