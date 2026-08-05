// tests/unit/ai_task_result.test.js

const assert =
    require("assert");

const {
    AITaskResultError,
    createAITaskResult,
    validateAITaskResult,
    serializeAITaskResult,
    parseAITaskResult,
    cloneAITaskResult
} = require(
    "../../compiler/project/ai_task_result"
);

function makeRequest() {
    return {
        type:
            "EvolutionRequest",

        schemaVersion:
            1
    };
}

function makeRunResult() {
    return {
        type:
            "EvolutionRunResult",

        schemaVersion:
            1
    };
}

function makeShell() {
    return {
        type:
            "Shell",

        schemaVersion:
            1,

        identity: {
            id:
                "weapon-system"
        }
    };
}

function makeResult() {
    return createAITaskResult({
        request:
            makeRequest(),

        proposedShells: [
            makeShell()
        ],

        evolutionRunResult:
            makeRunResult()
    });
}

try {
    /*
     * --------------------------------------------------------
     * CREATE
     * --------------------------------------------------------
     */

    const result =
        makeResult();

    assert.strictEqual(
        result.type,
        "AITaskResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.request.type,
        "EvolutionRequest"
    );

    assert.strictEqual(
        result.proposedShells.length,
        1
    );

    assert.strictEqual(
        result.proposedShells[0].type,
        "Shell"
    );

    assert.strictEqual(
        result.evolutionRunResult.type,
        "EvolutionRunResult"
    );

    /*
     * --------------------------------------------------------
     * VALIDATE
     * --------------------------------------------------------
     */

    assert.strictEqual(
        validateAITaskResult(result),
        result
    );

    /*
     * --------------------------------------------------------
     * SERIALIZE / PARSE
     * --------------------------------------------------------
     */

    const serialized =
        serializeAITaskResult(
            result
        );

    assert.strictEqual(
        typeof serialized,
        "string"
    );

    const parsed =
        parseAITaskResult(
            serialized
        );

    assert.deepStrictEqual(
        parsed,
        result
    );

    /*
     * --------------------------------------------------------
     * CLONE
     * --------------------------------------------------------
     */

    const cloned =
        cloneAITaskResult(
            result
        );

    assert.deepStrictEqual(
        cloned,
        result
    );

    assert.notStrictEqual(
        cloned,
        result
    );

    /*
     * --------------------------------------------------------
     * INVALID TYPE
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            validateAITaskResult({
                type:
                    "Wrong",

                schemaVersion:
                    1
            }),
        error =>
            error instanceof
                AITaskResultError
    );

    /*
     * --------------------------------------------------------
     * INVALID REQUEST
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            createAITaskResult({
                request: {
                    type:
                        "Wrong",

                    schemaVersion:
                        1
                },

                proposedShells: [],

                evolutionRunResult:
                    makeRunResult()
            }),
        error =>
            error instanceof
                AITaskResultError
    );

    /*
     * --------------------------------------------------------
     * INVALID SHELL ARRAY
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            createAITaskResult({
                request:
                    makeRequest(),

                proposedShells:
                    {},

                evolutionRunResult:
                    makeRunResult()
            }),
        error =>
            error instanceof
                AITaskResultError
    );

    /*
     * --------------------------------------------------------
     * INVALID SHELL
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            createAITaskResult({
                request:
                    makeRequest(),

                proposedShells: [
                    {
                        type:
                            "NotShell",

                        schemaVersion:
                            1
                    }
                ],

                evolutionRunResult:
                    makeRunResult()
            }),
        error =>
            error instanceof
                AITaskResultError
    );

    /*
     * --------------------------------------------------------
     * INVALID RUN RESULT
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            createAITaskResult({
                request:
                    makeRequest(),

                proposedShells: [],

                evolutionRunResult: {
                    type:
                        "Wrong",

                    schemaVersion:
                        1
                }
            }),
        error =>
            error instanceof
                AITaskResultError
    );

    /*
     * --------------------------------------------------------
     * INVALID SERIALIZED JSON
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            parseAITaskResult(
                "{broken"
            ),
        error =>
            error instanceof
                AITaskResultError
    );

    /*
     * --------------------------------------------------------
     * INVALID SERIALIZED TYPE
     * --------------------------------------------------------
     */

    assert.throws(
        () =>
            parseAITaskResult(
                JSON.stringify({
                    type:
                        "Wrong",

                    schemaVersion:
                        1
                })
            ),
        error =>
            error instanceof
                AITaskResultError
    );

    console.log(
        "AI TASK RESULT OK"
    );
} catch (error) {
    console.error(
        "AI TASK RESULT FAILED"
    );

    console.error(
        error
    );

    process.exitCode =
        1;
}
