// compiler/project/shell_proposal_applier.js
//
// Applies a PreparedShellProposal to the project evolution layer.
//
// Important:
//
// This module is the bridge between:
//
//     AI source proposal
//             |
//             v
//     ShellProposalPipeline
//             |
//             v
//     PreparedShellProposal
//             |
//             v
//     ShellProposalApplier
//             |
//             v
//     EvolutionExecutor
//
// The pipeline prepares a candidate Shell.
// This module is responsible for turning that candidate
// into an Evolution change.
//
// It does NOT directly modify ProjectTree.
//
// Actual mutation remains the responsibility of
// EvolutionExecutor / Repository.

class ShellProposalApplierError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellProposalApplierError";
        this.code = "LS019";
        this.value = value;
    }
}

function assertPreparedProposal(prepared) {
    if (!prepared || typeof prepared !== "object") {
        throw new ShellProposalApplierError(
            "Expected PreparedShellProposal.",
            prepared
        );
    }

    if (prepared.type !== "PreparedShellProposal") {
        throw new ShellProposalApplierError(
            "Expected PreparedShellProposal.",
            prepared.type
        );
    }

    if (prepared.schemaVersion !== 1) {
        throw new ShellProposalApplierError(
            "Unsupported PreparedShellProposal schema version.",
            prepared.schemaVersion
        );
    }

    if (!prepared.candidate) {
        throw new ShellProposalApplierError(
            "PreparedShellProposal must contain candidate Shell."
        );
    }

    if (prepared.candidate.type !== "Shell") {
        throw new ShellProposalApplierError(
            "Prepared candidate must be a Shell.",
            prepared.candidate.type
        );
    }
}

class ShellProposalApplier {
    constructor(evolutionExecutor) {
        if (
            !evolutionExecutor ||
            typeof evolutionExecutor.execute !== "function"
        ) {
            throw new ShellProposalApplierError(
                "Expected EvolutionExecutor."
            );
        }

        this.executor = evolutionExecutor;
    }

    apply(preparedProposal, evolutionPlan) {
        assertPreparedProposal(
            preparedProposal
        );

        if (
            !evolutionPlan ||
            typeof evolutionPlan !== "object"
        ) {
            throw new ShellProposalApplierError(
                "Expected EvolutionPlan.",
                evolutionPlan
            );
        }

        if (
            preparedProposal.shellId === undefined ||
            preparedProposal.shellId === null
        ) {
            throw new ShellProposalApplierError(
                "Prepared proposal has no shellId."
            );
        }

        const matchingChange =
            Array.isArray(evolutionPlan.changes)
                ? evolutionPlan.changes.find(
                    change =>
                        change.shellId ===
                        preparedProposal.shellId
                )
                : null;

        if (!matchingChange) {
            throw new ShellProposalApplierError(
                "EvolutionPlan does not contain matching Shell change.",
                preparedProposal.shellId
            );
        }

        if (
            matchingChange.operation !==
            preparedProposal.operation
        ) {
            throw new ShellProposalApplierError(
                "Proposal operation does not match EvolutionPlan.",
                {
                    proposal:
                        preparedProposal.operation,

                    plan:
                        matchingChange.operation
                }
            );
        }

        if (
            matchingChange.baseVersion !==
            preparedProposal.baseVersion
        ) {
            throw new ShellProposalApplierError(
                "Proposal baseVersion does not match EvolutionPlan.",
                {
                    proposal:
                        preparedProposal.baseVersion,

                    plan:
                        matchingChange.baseVersion
                }
            );
        }

        /*
         * The candidate Shell itself is supplied to
         * the executor as the proposed next state.
         *
         * The executor remains responsible for:
         *
         * - stale snapshot detection
         * - stale version detection
         * - repository mutation
         * - actual=true transition
         * - version/generation integrity
         */
        return this.executor.execute(
            evolutionPlan,
            preparedProposal.candidate
        );
    }
}

module.exports = {
    ShellProposalApplierError,
    ShellProposalApplier,
    assertPreparedProposal
};
