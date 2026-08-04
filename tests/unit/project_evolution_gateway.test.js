// tests/unit/project_evolution_gateway.test.js

const assert = require("assert");

const {
    ProjectEvolutionGateway
} = require(
    "../../compiler/project/evolution_gateway"
);

const HASH =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const calls = [];

const planner = {
    createPlan(request) {
        calls.push("planner");

        return {
            type: "EvolutionPlan",
            schemaVersion: 1,
            snapshotHash: request.snapshotHash,
            intent: request.intent,
            affectedShells: [
                "systems.weapon"
            ],
            changes: [
                {
                    shellId: "weapon-system",
                    operation: "UPDATE",
                    path: "systems.weapon",
                    baseVersion: 1
                }
            ]
        };
    }
};

const executor = {
    execute(plan) {
        calls.push("executor");

        return {
            type: "EvolutionExecution",
            schemaVersion: 1,
            snapshotHash: HASH,

            tree: {
                type: "ProjectTree",
                nodes: new Map()
            },

            plan
        };
    }
};

const weaver = {
    weave(tree) {
        calls.push("weaver");

        assert.strictEqual(
            tree.type,
            "ProjectTree"
        );

        return {
            type: "WovenProject",
            schemaVersion: 1,
            snapshotHash: HASH,
            files: [
                {
                    path: "systems.luau",
                    shellId: "systems",
                    version: 1,
                    generation: 1
                },
                {
                    path: "systems/weapon.luau",
                    shellId: "weapon-system",
                    version: 2,
                    generation: 2
                }
            ]
        };
    }
};

const compiler = {
    compile(woven) {
        calls.push("compiler");

        assert.strictEqual(
            woven.type,
            "WovenProject"
        );

        return {
            type: "CompiledProject",
            schemaVersion: 1,
            snapshotHash: HASH,
            files: [
                {
                    path: "systems.luau",
                    shellId: "systems",
                    version: 1,
                    generation: 1,
                    code:
                        "local Systems = {}\n" +
                        "Systems.__index = Systems\n"
                },
                {
                    path: "systems/weapon.luau",
                    shellId: "weapon-system",
                    version: 2,
                    generation: 2,
                    code:
                        "local WeaponSystem = {}\n" +
                        "WeaponSystem.__index = WeaponSystem\n"
                }
            ]
        };
    }
};

const emitter = {
    emit(compiled) {
        calls.push("emitter");

        assert.strictEqual(
            compiled.type,
            "CompiledProject"
        );

        return {
            type: "EmittedProject",
            schemaVersion: 1,
            snapshotHash: HASH,
            files: [
                {
                    path: "systems.luau",
                    shellId: "systems",
                    version: 1,
                    generation: 1
                },
                {
                    path: "systems/weapon.luau",
                    shellId: "weapon-system",
                    version: 2,
                    generation: 2
                }
            ]
        };
    }
};

try {
    const gateway =
        new ProjectEvolutionGateway({
            planner,
            executor,
            weaver,
            compiler,
            emitter
        });

    const request = {
        type: "EvolutionRequest",
        schemaVersion: 1,
        snapshotHash: HASH,
        intent:
            "Add pistol support to the weapon system.",
        baseShells: [
            {
                shellId: "weapon-system",
                version: 1
            }
        ],
        changes: [
            {
                shellId: "weapon-system",
                operation: "UPDATE",
                baseVersion: 1
            }
        ]
    };

    const result =
        gateway.run(request);

    assert.strictEqual(
        result.type,
        "EvolutionRunResult"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.snapshotBefore,
        HASH
    );

    assert.strictEqual(
        result.snapshotAfter,
        HASH
    );

    assert.strictEqual(
        result.intent,
        request.intent
    );

    assert.strictEqual(
        result.plan.type,
        "EvolutionPlan"
    );

    assert.strictEqual(
        result.execution.type,
        "EvolutionExecution"
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

    assert.deepStrictEqual(
        calls,
        [
            "planner",
            "executor",
            "weaver",
            "compiler",
            "emitter"
        ]
    );

    console.log(
        "PROJECT EVOLUTION GATEWAY OK"
    );

    console.log(
        JSON.stringify(
            {
                type: result.type,
                snapshotBefore:
                    result.snapshotBefore,
                snapshotAfter:
                    result.snapshotAfter,
                intent:
                    result.intent,
                pipeline: calls,
                emittedFiles:
                    result.emitted.files.map(
                        file => file.path
                    )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION GATEWAY FAILED"
    );

    console.error(error);

    process.exit(1);
}
