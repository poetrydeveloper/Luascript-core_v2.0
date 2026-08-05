// tests/unit/project_evolution_run_result.test.js

const assert = require("assert");

const {
    createEvolutionRunResult,
    validateEvolutionRunResult,
    EvolutionRunResultError
} = require(
    "../../compiler/project/evolution_run_result"
);

function makeInput() {
    return {
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
                1
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
                "WovenProject",

            schemaVersion:
                1
        },

        compiled: {
            type:
                "CompiledProject",

            schemaVersion:
                1
        },

        emitted: {
            type:
                "EmittedProject",

            schemaVersion:
                1
        }
    };
}

try {
    const result =
        createEvolutionRunResult(
            makeInput()
        );

    assert.strictEqual(
        result.type,
        "EvolutionRunResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        validateEvolutionRunResult(
            result
        ),
        result
    );

    const brokenResolved =
        {
            ...result,
            resolved: {
                type:
                    "ProjectTree"
            }
        };

    assert.throws(
        () =>
            validateEvolutionRunResult(
                brokenResolved
            ),
        error =>
            error instanceof
                EvolutionRunResultError &&
            error.code === "LS022"
    );

    const brokenCompiled =
        {
            ...result,
            compiled: null
        };

    assert.throws(
        () =>
            validateEvolutionRunResult(
                brokenCompiled
            ),
        EvolutionRunResultError
    );

    console.log(
        "PROJECT EVOLUTION RUN RESULT OK"
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION RUN RESULT FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
