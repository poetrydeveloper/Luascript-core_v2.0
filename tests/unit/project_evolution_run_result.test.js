// tests/unit/project_evolution_run_result.test.js

const assert = require("assert");

const {
    EvolutionRunResultError,
    createEvolutionRunResult,
    validateEvolutionRunResult,
    cloneEvolutionRunResult
} = require(
    "../../compiler/project/evolution_run_result"
);

function makeRequest() {
    return {
        type:
            "EvolutionRequest",

        schemaVersion:
            1
    };
}

function makeExecution() {
    return {
        type:
            "EvolutionResult",

        schemaVersion:
            1,

        changes: []
    };
}

function makeState() {
    return {
        type:
            "ProjectState",

        schemaVersion:
            1,

        snapshotHash:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        nodes: []
    };
}

function makeResolved() {
    return {
        type:
            "ResolvedProject",

        schemaVersion:
            1,

        snapshotHash:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        shells: []
    };
}

function run() {
    const result =
        createEvolutionRunResult({
            request:
                makeRequest(),

            execution:
                makeExecution(),

            state:
                makeState(),

            resolved:
                makeResolved(),

            woven: {
                type:
                    "WovenProject"
            },

            compiled: {
                type:
                    "CompiledProject"
            },

            emitted: {
                type:
                    "EmittedProject"
            }
        });

    assert.strictEqual(
        result.type,
        "EvolutionRunResult"
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
        result.execution.type,
        "EvolutionResult"
    );

    assert.strictEqual(
        result.state.type,
        "ProjectState"
    );

    assert.strictEqual(
        result.resolved.type,
        "ResolvedProject"
    );

    assert.strictEqual(
        result.woven.type,
        "WovenProject"
    );

    assert.strictEqual(
        result.compiled.type,
        "CompiledProject"
    );

    assert.strictEqual(
        result.emitted.type,
        "EmittedProject"
    );

    assert.strictEqual(
        validateEvolutionRunResult(
            result
        ),
        result
    );

    const clone =
        cloneEvolutionRunResult(
            result
        );

    assert.notStrictEqual(
        clone,
        result
    );

    assert.deepStrictEqual(
        clone,
        result
    );

    assert.throws(
        () =>
            createEvolutionRunResult({
                request:
                    makeRequest(),

                execution: {
                    type:
                        "WrongResult"
                },

                state:
                    makeState(),

                resolved:
                    makeResolved(),

                woven: {},

                compiled: {},

                emitted: {}
            }),
        error =>
            error instanceof
            EvolutionRunResultError
    );

    assert.throws(
        () =>
            validateEvolutionRunResult({
                type:
                    "EvolutionRunResult",

                schemaVersion:
                    99
            }),
        error =>
            error instanceof
            EvolutionRunResultError
    );

    assert.throws(
        () =>
            validateEvolutionRunResult({
                type:
                    "EvolutionRunResult",

                schemaVersion:
                    1,

                request:
                    makeRequest(),

                execution:
                    makeExecution(),

                state:
                    makeState(),

                resolved:
                    {
                        type:
                            "WrongProject"
                    },

                woven: {},

                compiled: {},

                emitted: {}
            }),
        error =>
            error instanceof
            EvolutionRunResultError
    );

    console.log(
        "PROJECT EVOLUTION RUN RESULT OK"
    );
}

try {
    run();
} catch (error) {
    console.error(
        "PROJECT EVOLUTION RUN RESULT FAILED"
    );

    console.error(
        error
    );

    process.exitCode =
        1;
}
