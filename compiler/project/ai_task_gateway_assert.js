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

module.exports = {
    AITaskGatewayError,
    assertObject,
    assertTask,
    assertContext
};
