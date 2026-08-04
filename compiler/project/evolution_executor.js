// compiler/project/evolution_executor.js
//
// Deterministic Project Evolution Executor.
//
// Pipeline:
//
//   EvolutionPlan
//        +
//   proposed Shells
//        |
//        v
//   validate base versions
//        |
//        v
//   validate proposed shells
//        |
//        v
//   commit repository versions
//        |
//        v
//   update ProjectTree
//
// Important:
// - The executor does NOT invent code.
// - The executor does NOT use AI.
// - The executor does NOT decide what the evolution should be.
// - It only validates and applies an already prepared evolution.
// - Validation happens before mutation whenever possible.
// - Repository history remains immutable.
// - Every UPDATE creates a new Shell version.

class ProjectEvolutionExecutorError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectEvolutionExecutorError";
        this.code = "LS011";
        this.value = value;
    }
}

class ProjectEvolutionExecutor {
    constructor(repository, tree) {
        if (
            !repository ||
            typeof repository.getVersion !== "function" ||
            typeof repository.save !== "function"
        ) {
            throw new ProjectEvolutionExecutorError(
                "Expected ShellRepository."
            );
        }

        if (
            !tree ||
            typeof tree.getShell !== "function" ||
            typeof tree.upsertShell !== "function"
        ) {
            throw new ProjectEvolutionExecutorError(
                "Expected ProjectTree."
            );
        }

        this.repository = repository;
        this.tree = tree;
    }

    execute(plan, proposedShells) {
        this.assertPlan(plan);

        if (!Array.isArray(proposedShells)) {
            throw new ProjectEvolutionExecutorError(
                "proposedShells must be an array.",
                proposedShells
            );
        }

        const shellMap = new Map();

        for (const shell of proposedShells) {
            this.assertShell(shell);

            const id = shell.identity.id;

            if (shellMap.has(id)) {
                throw new ProjectEvolutionExecutorError(
                    `Duplicate proposed Shell '${id}'.`,
                    shell
                );
            }

            shellMap.set(id, shell);
        }

        const prepared = [];

        //
        // --------------------------------------------------------
        // PHASE 1: VALIDATE EVERYTHING
        // --------------------------------------------------------
        //

        for (const change of plan.changes) {
            if (change.operation !== "UPDATE") {
                throw new ProjectEvolutionExecutorError(
                    `Unsupported evolution operation '${change.operation}'.`,
                    change
                );
            }

            const proposed =
                shellMap.get(change.shellId);

            if (!proposed) {
                throw new ProjectEvolutionExecutorError(
                    `No proposed Shell supplied for '${change.shellId}'.`,
                    change
                );
            }

            const current =
                this.repository.getVersion(
                    change.shellId,
                    change.baseVersion
                );

            if (!current) {
                throw new ProjectEvolutionExecutorError(
                    `Base Shell '${change.shellId}' version ${change.baseVersion} was not found.`,
                    change
                );
            }

            const treeShell =
                this.tree.getShell(
                    change.path
                );

            if (!treeShell) {
                throw new ProjectEvolutionExecutorError(
                    `Shell path '${change.path}' is not present in ProjectTree.`,
                    change
                );
            }

            if (
                treeShell.identity.id !==
                change.shellId
            ) {
                throw new ProjectEvolutionExecutorError(
                    `ProjectTree shell identity mismatch for '${change.path}'.`,
                    {
                        expected: change.shellId,
                        received: treeShell.identity.id
                    }
                );
            }

            if (
                treeShell.identity.version !==
                change.baseVersion
            ) {
                throw new ProjectEvolutionExecutorError(
                    `ProjectTree version mismatch for '${change.shellId}'.`,
                    {
                        expected: change.baseVersion,
                        received: treeShell.identity.version
                    }
                );
            }

            if (
                proposed.identity.id !==
                change.shellId
            ) {
                throw new ProjectEvolutionExecutorError(
                    `Proposed Shell identity mismatch.`,
                    {
                        expected: change.shellId,
                        received: proposed.identity.id
                    }
                );
            }

            if (
                proposed.position.path !==
                change.path
            ) {
                throw new ProjectEvolutionExecutorError(
                    `Proposed Shell path mismatch.`,
                    {
                        expected: change.path,
                        received: proposed.position.path
                    }
                );
            }

            prepared.push({
                change,
                current,
                proposed
            });
        }

        //
        // --------------------------------------------------------
        // PHASE 2: COMMIT
        // --------------------------------------------------------
        //
        // We only reach this point after all requested changes
        // have passed validation.
        //

        const results = [];

        for (const item of prepared) {
            const saved =
                this.repository.save(
                    item.proposed
                );

            this.tree.replaceShell(saved);

            results.push({
                shellId:
                    saved.identity.id,

                path:
                    saved.position.path,

                version:
                    saved.identity.version,

                generation:
                    saved.lifecycle.generation,

                hash:
                    saved.identity.hash,

                supersedes:
                    saved.lifecycle.supersedes
            });
        }

        return {
            type: "EvolutionResult",
            schemaVersion: 1,

            snapshotHash:
                plan.snapshotHash,

            intent:
                plan.intent,

            changes:
                results
        };
    }

    assertPlan(plan) {
        if (!plan || typeof plan !== "object") {
            throw new ProjectEvolutionExecutorError(
                "Expected EvolutionPlan.",
                plan
            );
        }

        if (plan.type !== "EvolutionPlan") {
            throw new ProjectEvolutionExecutorError(
                "Expected EvolutionPlan.",
                plan
            );
        }

        if (plan.schemaVersion !== 1) {
            throw new ProjectEvolutionExecutorError(
                "Unsupported EvolutionPlan schema version.",
                plan.schemaVersion
            );
        }

        if (
            typeof plan.snapshotHash !== "string" ||
            !/^[a-f0-9]{64}$/.test(plan.snapshotHash)
        ) {
            throw new ProjectEvolutionExecutorError(
                "EvolutionPlan snapshotHash must be a SHA-256 hexadecimal hash.",
                plan.snapshotHash
            );
        }

        if (
            typeof plan.intent !== "string" ||
            plan.intent.length === 0
        ) {
            throw new ProjectEvolutionExecutorError(
                "EvolutionPlan intent is required.",
                plan.intent
            );
        }

        if (!Array.isArray(plan.changes)) {
            throw new ProjectEvolutionExecutorError(
                "EvolutionPlan.changes must be an array.",
                plan.changes
            );
        }

        for (const change of plan.changes) {
            if (!change || typeof change !== "object") {
                throw new ProjectEvolutionExecutorError(
                    "EvolutionPlan change must be an object.",
                    change
                );
            }

            if (
                typeof change.shellId !== "string" ||
                change.shellId.length === 0
            ) {
                throw new ProjectEvolutionExecutorError(
                    "EvolutionPlan change.shellId is required.",
                    change
                );
            }

            if (
                change.operation !== "UPDATE"
            ) {
                throw new ProjectEvolutionExecutorError(
                    `Unsupported evolution operation '${change.operation}'.`,
                    change
                );
            }

            if (
                !Number.isInteger(
                    change.baseVersion
                )
            ) {
                throw new ProjectEvolutionExecutorError(
                    "EvolutionPlan change.baseVersion must be an integer.",
                    change
                );
            }

            if (
                typeof change.path !== "string" ||
                change.path.length === 0
            ) {
                throw new ProjectEvolutionExecutorError(
                    "EvolutionPlan change.path is required.",
                    change
                );
            }
        }
    }

    assertShell(shell) {
        if (!shell || typeof shell !== "object") {
            throw new ProjectEvolutionExecutorError(
                "Expected proposed Shell.",
                shell
            );
        }

        if (shell.type !== "Shell") {
            throw new ProjectEvolutionExecutorError(
                "Expected proposed Shell.",
                shell
            );
        }

        if (
            !shell.identity ||
            typeof shell.identity.id !== "string"
        ) {
            throw new ProjectEvolutionExecutorError(
                "Proposed Shell identity.id is required.",
                shell
            );
        }

        if (
            !shell.position ||
            typeof shell.position.path !== "string"
        ) {
            throw new ProjectEvolutionExecutorError(
                "Proposed Shell position.path is required.",
                shell
            );
        }
    }
}

module.exports = {
    ProjectEvolutionExecutor,
    ProjectEvolutionExecutorError
};
