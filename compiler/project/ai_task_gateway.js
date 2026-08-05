// compiler/project/ai_task_gateway.js
//
// AI Task Gateway.
//
// Boundary:
//
//     AITask
//        |
//        v
//     EvolutionRequest
//        |
//        v
//     proposed Shells
//        |
//        v
// EvolutionFlowGateway
//        |
//        v
// EvolutionRunResult
//
// This module does not mutate ProjectTree
// or ShellRepository.
//
// It only coordinates:
//   - AITask -> EvolutionRequest conversion
//   - extraction of proposed Shells
//   - execution through EvolutionFlowGateway
//
// The deterministic evolution pipeline remains
// the only component allowed to mutate project state.

const {
    createEvolutionRequestFromAITask
} = require(
    "./ai_evolution_request"
);

const {
    validateEvolutionRunResult
} = require(
    "./evolution_run_result"
);

class AITaskGatewayError extends Error {
    constructor(
        message,
        value = null
    ) {
        super(message);

        this.name =
            "AITaskGatewayError";

        this.code =
            "LS022";

        this.value =
            value;
    }
}

function assertObject(
    value,
    message
) {
    if (
        !value ||
        typeof value !== "object"
    ) {
        throw new AITaskGatewayError(
            message,
            value
        );
    }
}

function assertTask(
    task
) {
    assertObject(
        task,
        "Expected AITask."
    );

    if (
        task.type !==
        "AITask"
    ) {
        throw new AITaskGatewayError(
            "Expected AITask.",
            task
        );
    }

    if (
        task.schemaVersion !== 1
    ) {
        throw new AITaskGatewayError(
            "Unsupported AITask schema version.",
            task.schemaVersion
        );
    }
}

function assertContext(
    context
) {
    assertObject(
        context,
        "Expected ProjectContext."
    );

    if (
        context.type !==
        "ProjectContext"
    ) {
        throw new AITaskGatewayError(
            "Expected ProjectContext.",
            context
        );
    }

    if (
        context.schemaVersion !== 1
    ) {
        throw new AITaskGatewayError(
            "Unsupported ProjectContext schema version.",
            context.schemaVersion
        );
    }
}

function extractProposedShells(
    request
) {
    if (
        !request ||
        !Array.isArray(
            request.changes
        )
    ) {
        throw new AITaskGatewayError(
            "EvolutionRequest.changes must be an array.",
            request
        );
    }

    const shells = [];

    for (
        const change of request.changes
    ) {
        if (
            !change ||
            typeof change !== "object"
        ) {
            continue;
        }

        if (
            change.shell &&
            typeof change.shell === "object"
        ) {
            shells.push(
                change.shell
            );
        }
    }

    return shells;
}

class AITaskGateway {
    constructor(
        flowGateway
    ) {
        assertObject(
            flowGateway,
            "Expected EvolutionFlowGateway."
        );

        if (
            typeof flowGateway.run !==
            "function"
        ) {
            throw new AITaskGatewayError(
                "Expected EvolutionFlowGateway with run().",
                flowGateway
            );
        }

        this.flowGateway =
            flowGateway;
    }

    run(
        task,
        context,
        options = {}
    ) {
        assertTask(
            task
        );

        assertContext(
            context
        );

        if (
            !options ||
            typeof options !== "object"
        ) {
            throw new AITaskGatewayError(
                "Options must be an object.",
                options
            );
        }

        let request;

        try {
            request =
                createEvolutionRequestFromAITask(
                    context,
                    task
                );
        } catch (error) {
            throw new AITaskGatewayError(
                "AITask conversion failed.",
                error
            );
        }

        const proposedShells =
            extractProposedShells(
                request
            );

        if (
            Array.isArray(
                options.proposedShells
            )
        ) {
            proposedShells.push(
                ...options.proposedShells
            );
        }

        let result;

        try {
            result =
                this.flowGateway.run(
                    request,
                    proposedShells,
                    options.flowOptions || {}
                );
        } catch (error) {
            throw new AITaskGatewayError(
                "Evolution flow gateway failed.",
                error
            );
        }

        try {
            return validateEvolutionRunResult(
                result
            );
        } catch (error) {
            throw new AITaskGatewayError(
                "Evolution gateway returned an invalid result.",
                error
            );
        }
    }
}

module.exports = {
    AITaskGateway,
    AITaskGatewayError,
    extractProposedShells
};
