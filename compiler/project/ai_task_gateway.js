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
//        |
//        v
//     AITaskResult
//
// This module does not mutate ProjectTree
// or ShellRepository.
//
// It only coordinates:
//   - AITask -> EvolutionRequest conversion
//   - extraction of proposed Shells
//   - execution through EvolutionFlowGateway
//   - wrapping EvolutionRunResult into AITaskResult
//
// The deterministic evolution pipeline remains
// the only component allowed to mutate project state.

const {
    createEvolutionRequestFromAITask
} = require(
    "./ai_evolution_request"
);

const {
    createAITaskResult,
    validateAITaskResult
} = require(
    "./ai_task_result"
);

const {
    extractProposedShells
} = require(
    "./ai_task_gateway_extract"
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
        typeof value !== "object" ||
        Array.isArray(value)
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

function assertOptions(
    options
) {
    if (
        !options ||
        typeof options !== "object" ||
        Array.isArray(options)
    ) {
        throw new AITaskGatewayError(
            "Options must be an object.",
            options
        );
    }
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
        /*
         * ----------------------------------------------------
         * 1. Validate boundary input.
         * ----------------------------------------------------
         */

        assertTask(
            task
        );

        assertContext(
            context
        );

        assertOptions(
            options
        );

        /*
         * ----------------------------------------------------
         * 2. AITask -> EvolutionRequest.
         * ----------------------------------------------------
         */

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

        /*
         * ----------------------------------------------------
         * 3. Extract Shell proposals.
         * ----------------------------------------------------
         */

        let requestShells;

        try {
            requestShells =
                extractProposedShells(
                    request
                );
        } catch (error) {
            throw new AITaskGatewayError(
                "Proposed Shell extraction failed.",
                error
            );
        }

        const proposedShells =
            mergeProposedShells(
                requestShells,
                options.proposedShells
            );

        /*
         * ----------------------------------------------------
         * 4. Execute deterministic evolution pipeline.
         *
         * The EvolutionFlowGateway remains responsible for:
         *
         *     EvolutionRequest
         *          ->
         *     EvolutionRunResult
         *
         * This gateway does not mutate project state.
         * ----------------------------------------------------
         */

        let evolutionRunResult;

        try {
            evolutionRunResult =
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

        /*
         * ----------------------------------------------------
         * 5. Wrap deterministic result into AITaskResult.
         *
         * This is the AI boundary result.
         *
         *     EvolutionRunResult
         *             |
         *             v
         *        AITaskResult
         * ----------------------------------------------------
         */

        let result;

        try {
            result =
                createAITaskResult({
                    request,
                    proposedShells,
                    evolutionRunResult
                });
        } catch (error) {
            throw new AITaskGatewayError(
                "AITask result creation failed.",
                error
            );
        }

        /*
         * ----------------------------------------------------
         * 6. Validate the final boundary result.
         * ----------------------------------------------------
         */

        try {
            return validateAITaskResult(
                result
            );
        } catch (error) {
            throw new AITaskGatewayError(
                "AITask gateway returned an invalid result.",
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
