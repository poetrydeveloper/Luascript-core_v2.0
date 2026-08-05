// tests/unit/project_evolution_flow_gateway_options.test.js

const assert = require("assert");

const {
    EvolutionFlowGateway
} = require("../../compiler/project/evolution_flow_gateway");

class FakeRepository {
    getVersion() {
        return null;
    }

    save() {}
}

class FakeTree {
    constructor() {
        this.nodes = new Map();
    }

    getShell() {
        return null;
    }

    replaceShell() {}
}

class FakeFlow {
    execute() {
        return {
            type: "EvolutionResult",
            schemaVersion: 1,
            snapshotHash: "a".repeat(64),
            changes: []
        };
    }
}

class FakeResolver {
    resolve() {
        return {
            type: "ResolvedProject",
            schemaVersion: 1,
            snapshotHash: "a".repeat(64),
            shells: []
        };
    }
}

class FakeWeaver {
    weave(resolved) {
        assert.strictEqual(
            resolved.type,
            "ResolvedProject"
        );

        return {
            type: "WovenProject",
            schemaVersion: 1,
            snapshotHash: resolved.snapshotHash,
            files: []
        };
    }
}

class FakeCompiler {
    compile(woven) {
        assert.strictEqual(
            woven.type,
            "WovenProject"
        );

        return {
            type: "CompiledProject",
            schemaVersion: 1,
            snapshotHash: woven.snapshotHash,
            files: []
        };
    }
}

class FakeEmitter {
    emit(compiled) {
        assert.strictEqual(
            compiled.type,
            "CompiledProject"
        );

        return {
            type: "EmittedProject",
            schemaVersion: 1,
            snapshotHash: compiled.snapshotHash,
            files: []
        };
    }
}

function makeRequest() {
    return {
        type: "EvolutionRequest",
        schemaVersion: 1,

        snapshot:
            "a".repeat(64),

        baseShells: [],

        changes: []
    };
}

try {
    const gateway =
        new EvolutionFlowGateway({
            repository:
                new FakeRepository(),

            tree:
                new FakeTree(),

            weaver:
                new FakeWeaver(),

            compiler:
                new FakeCompiler(),

            emitter:
                new FakeEmitter(),

            resolver:
                new FakeResolver()
        });

    /*
     * Replace the real evolution flow only for this
     * boundary test.
     *
     * The purpose of this test is NOT evolution itself.
     * The purpose is to keep the Gateway contract isolated.
     */

    gateway.flow =
        new FakeFlow();

    const result =
        gateway.run(
            makeRequest(),
            []
        );

    assert.ok(
        result
    );

    assert.strictEqual(
        result.type,
        "EvolutionRunResult"
    );

    assert.strictEqual(
        result.execution.type,
        "EvolutionResult"
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

    console.log(
        "PROJECT EVOLUTION FLOW GATEWAY OPTIONS OK"
    );
} catch (error) {
    console.error(
        "PROJECT EVOLUTION FLOW GATEWAY OPTIONS FAILED"
    );

    console.error(error);

    process.exitCode = 1;
}
