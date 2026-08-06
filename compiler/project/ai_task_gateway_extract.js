const {
    AITaskGatewayError
} = require(
    "./ai_task_gateway_assert"
);

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

module.exports = {
    extractProposedShells
};
