// compiler/project/ai_evolution.js
//
// AI Evolution Boundary.
//
// This module is the security and contract boundary between
// an external AI/LLM and the deterministic project evolution
// pipeline.
//
// The AI may propose an evolution.
//
// The AI may NOT:
// - mutate ProjectTree;
// - mutate ShellRepository;
// - choose arbitrary project paths without validation;
// - bypass shell versions;
// - bypass snapshot validation;
// - execute code.
//
// The output of this module is a validated EvolutionRequest.
//
// Pipeline:
//
// AIProjectContext
//       +
// AI proposal
//       |
//       v
// AI Evolution Boundary
//       |
//       v
// EvolutionRequest
//       |
//       v
// EvolutionGateway
//
// This module deliberately contains no LLM-specific code.
// It works with plain JavaScript objects and JSON.
//
// Therefore OpenAI, Claude, a local model, a weak model,
// or a completely deterministic test generator can all use
// exactly the same contract.

class AIEvolutionError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "AIEvolutionError";
        this.code = "LS015";
        this.value = value;
    }
}

class AIEvolutionBoundary {
    constructor() {
        this.operationTypes = new Set([
            "ADD",
            "UPDATE",
            "REMOVE"
        ]);
    }

    createRequest(context, proposal) {
        this.assertAIContext(context);
        this.assertProposal(proposal);

        /*
         * The snapshot hash is NOT taken from the proposal.
         *
         * It comes from the project context that was actually
         * supplied to the AI.
         *
         * This prevents the AI from silently changing the
         * project version against which its proposal was made.
         */
        const snapshotHash =
            context.snapshotHash;

        const changes =
            proposal.changes.map(
                change =>
                    this.normalizeChange(
                        context,
                        change
                    )
            );

        if (changes.length === 0) {
            throw new AIEvolutionError(
                "AI proposal contains no changes."
            );
        }

        return {
            type: "EvolutionRequest",
            schemaVersion: 1,

            snapshotHash,

            intent:
                proposal.intent.trim(),

            baseShells:
                this.createBaseShells(
                    changes
                ),

            changes
        };
    }

    normalizeChange(context, change) {
        this.assertChange(change);

        const shell =
            this.findShell(
                context,
                change.shellId
            );

        /*
         * The AI must operate against an actual shell that
         * existed in the supplied project context.
         */
        if (!shell) {
            throw new AIEvolutionError(
                `AI referenced unknown Shell '${change.shellId}'.`,
                change
            );
        }

        /*
         * The version in the AI proposal must match the version
         * visible to the AI.
         *
         * This prevents an old AI context from silently modifying
         * a newer project state.
         */
        if (
            change.baseVersion !==
            shell.version
        ) {
            throw new AIEvolutionError(
                `AI proposal for Shell '${change.shellId}' is based on version ${change.baseVersion}, but the supplied context contains version ${shell.version}.`,
                {
                    shellId:
                        change.shellId,
                    proposedVersion:
                        change.baseVersion,
                    contextVersion:
                        shell.version
                }
            );
        }

        /*
         * The path is resolved from the trusted context,
         * not blindly accepted from the AI.
         *
         * This is important because path is a structural
         * property of the project.
         */
        const path =
            shell.path;

        return {
            shellId:
                shell.id,

            operation:
                change.operation,

            path,

            baseVersion:
                shell.version
        };
    }

    createBaseShells(changes) {
        const unique =
            new Map();

        for (const change of changes) {
            const key =
                change.shellId;

            if (!unique.has(key)) {
                unique.set(
                    key,
                    {
                        shellId:
                            change.shellId,

                        version:
                            change.baseVersion
                    }
                );
            }
        }

        return Array.from(
            unique.values()
        );
    }

    findShell(context, shellId) {
        for (const shell of context.shells) {
            if (
                shell &&
                shell.id === shellId
            ) {
                return shell;
            }
        }

        return null;
    }

    assertAIContext(context) {
        if (
            !context ||
            typeof context !== "object"
        ) {
            throw new AIEvolutionError(
                "Expected AIProjectContext.",
                context
            );
        }

        if (
            context.type !==
            "AIProjectContext"
        ) {
            throw new AIEvolutionError(
                "Expected AIProjectContext.",
                context
            );
        }

        if (
            context.schemaVersion !== 1
        ) {
            throw new AIEvolutionError(
                "Unsupported AIProjectContext schema version.",
                context.schemaVersion
            );
        }

        if (
            typeof context.snapshotHash !==
                "string" ||
            !/^[a-f0-9]{64}$/.test(
                context.snapshotHash
            )
        ) {
            throw new AIEvolutionError(
                "AIProjectContext snapshotHash must be a SHA-256 hexadecimal hash.",
                context.snapshotHash
            );
        }

        if (
            !Array.isArray(
                context.shells
            )
        ) {
            throw new AIEvolutionError(
                "AIProjectContext.shells must be an array.",
                context.shells
            );
        }

        if (
            typeof context.shellCount !==
                "number" ||
            context.shellCount !==
                context.shells.length
        ) {
            throw new AIEvolutionError(
                "AIProjectContext.shellCount does not match shells length.",
                context.shellCount
            );
        }
    }

    assertProposal(proposal) {
        if (
            !proposal ||
            typeof proposal !== "object"
        ) {
            throw new AIEvolutionError(
                "Expected AI evolution proposal.",
                proposal
            );
        }

        if (
            typeof proposal.intent !==
                "string" ||
            proposal.intent.trim()
                .length === 0
        ) {
            throw new AIEvolutionError(
                "AI evolution proposal intent is required.",
                proposal.intent
            );
        }

        if (
            !Array.isArray(
                proposal.changes
            )
        ) {
            throw new AIEvolutionError(
                "AI evolution proposal changes must be an array.",
                proposal.changes
            );
        }
    }

    assertChange(change) {
        if (
            !change ||
            typeof change !== "object"
        ) {
            throw new AIEvolutionError(
                "AI evolution change must be an object.",
                change
            );
        }

        if (
            typeof change.shellId !==
                "string" ||
            change.shellId.trim()
                .length === 0
        ) {
            throw new AIEvolutionError(
                "AI evolution change shellId is required.",
                change
            );
        }

        if (
            !this.operationTypes.has(
                change.operation
            )
        ) {
            throw new AIEvolutionError(
                `Unsupported AI evolution operation '${change.operation}'.`,
                change.operation
            );
        }

        if (
            typeof change.baseVersion !==
                "number" ||
            !Number.isInteger(
                change.baseVersion
            ) ||
            change.baseVersion < 1
        ) {
            throw new AIEvolutionError(
                "AI evolution change baseVersion must be a positive integer.",
                change.baseVersion
            );
        }
    }
}

module.exports = {
    AIEvolutionError,
    AIEvolutionBoundary
};
