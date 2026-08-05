// compiler/project/evolution_flow.js
//
// Evolution Flow.
//
// Coordinates:
//
//   EvolutionRequest
//          |
//          v
//   ProjectTree
//          |
//          v
//   ProjectContext
//          |
//          v
//   EvolutionPlanner
//          |
//          v
//   EvolutionPlan
//          |
//          v
//   EvolutionValidator
//          |
//          v
//   ProjectEvolutionExecutor
//          |
//          v
//   EvolutionResult
//
// This module only coordinates existing components.
// It does not implement planning, validation,
// repository persistence, or evolution mutation.

const {
    createProjectContext
} = require("./context");

const {
    planEvolution
} = require("./evolution_planner");

const {
    validateEvolutionPlan
} = require("./evolution_validator");

const {
    ProjectEvolutionExecutor
} = require("./evolution_executor");

class EvolutionFlowError extends Error {
    constructor(
        message,
        value = null
    ) {
        super(message);

        this.name =
            "EvolutionFlowError";

        this.code =
            "LS020";

        this.value =
            value;
    }
}

function assertRepository(
    repository
) {
    if (
        !repository ||
        typeof repository.getVersion !==
            "function" ||
        typeof repository.save !==
            "function"
    ) {
        throw new EvolutionFlowError(
            "Expected ShellRepository.",
            repository
        );
    }
}

function assertProjectTree(
    tree
) {
    if (
        !tree ||
        typeof tree !== "object" ||
        !(tree.nodes instanceof Map)
    ) {
        throw new EvolutionFlowError(
            "Expected ProjectTree.",
            tree
        );
    }
}

function assertEvolutionRequest(
    request
) {
    if (
        !request ||
        typeof request !== "object"
    ) {
        throw new EvolutionFlowError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.type !==
        "EvolutionRequest"
    ) {
        throw new EvolutionFlowError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.schemaVersion !== 1
    ) {
        throw new EvolutionFlowError(
            "Unsupported EvolutionRequest schema version.",
            request.schemaVersion
        );
    }
}

class EvolutionFlow {
    constructor(
        repository,
        tree
    ) {
        assertRepository(
            repository
        );

        assertProjectTree(
            tree
        );

        this.repository =
            repository;

        this.tree =
            tree;

        this.executor =
            new ProjectEvolutionExecutor(
                repository,
                tree
            );
    }

    execute(
        request,
        proposedShells = []
    ) {
        assertEvolutionRequest(
            request
        );

        let context;

        try {
            context =
                createProjectContext(
                    this.tree
                );
        } catch (error) {
            throw new EvolutionFlowError(
                "Project context creation failed.",
                error
            );
        }

        let plan;

        try {
            plan =
                planEvolution(
                    context,
                    request
                );
        } catch (error) {
            throw new EvolutionFlowError(
                "Evolution planning failed.",
                error
            );
        }

        try {
            validateEvolutionPlan(
                plan
            );
        } catch (error) {
            throw new EvolutionFlowError(
                "Evolution plan validation failed.",
                error
            );
        }

        try {
            return this.executor.execute(
                plan,
                proposedShells
            );
        } catch (error) {
            throw new EvolutionFlowError(
                "Evolution execution failed.",
                error
            );
        }
    }
}

module.exports = {
    EvolutionFlow,
    EvolutionFlowError
};
