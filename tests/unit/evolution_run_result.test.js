// tests/unit/evolution_run_result.test.js

const assert = require("assert");

const {
    createEvolutionRunResult,
    validateEvolutionRunResult,
    cloneEvolutionRunResult,
    EvolutionRunResultError
} = require(
    "../../compiler/project/evolution_run_result"
);

function makeResult() {
    return createEvolutionRunResult({
        request: {
            type:
                "EvolutionRequest",
            schemaVersion:
                1
        },

        execution: {
            type:
                "EvolutionResult",
            schemaVersion:
                1,
            changes: []
        },

        state: {
            type:
                "ProjectState",
            schemaVersion:
                1
        },

        resolved: {
            type:
                "ResolvedProject",
            schemaVersion:
                1
        },

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
}

try {
    const result =
        makeResult();

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

    const validated =
        validateEvolutionRunResult(
            result
        );

    assert.strictEqual(
        validated,
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
            validateEvolutionRunResult({
                type:
                    "EvolutionRunResult",
                schemaVersion:
                    2
            }),
        error =>
            error instanceof
                EvolutionRunResultError &&
            error.code ===
                "LS022"
    );

    assert.throws(
        () =>
            createEvolutionRunResult({
                request: {},
                execution: {
                    type:
                        "EvolutionResult"
                },
                state: {
                    type:
                        "ProjectState"
                },
                resolved: {
                    type:
                        "ResolvedProject"
                },
                woven: {},
                compiled: {},
                emitted: {}
            }),
        error =>
            error instanceof
                EvolutionRunResultError &&
            error.code ===
                "LS022"
    );

    console.log(
        "EVOLUTION RUN RESULT OK"
    );
} catch (error) {
    console.error(
        "EVOLUTION RUN RESULT FAILED"
    );

    console.error(
        error
    );

    process.exitCode = 1;
}
