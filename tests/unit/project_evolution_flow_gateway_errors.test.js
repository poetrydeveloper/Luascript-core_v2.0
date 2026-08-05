// tests/unit/project_evolution_flow_gateway_errors.test.js

const assert = require("assert");

const {
    ShellRepository
} = require(
    "../../compiler/shell/repository"
);

const {
    ProjectTree
} = require(
    "../../compiler/project_tree"
);

const {
    createProjectSnapshot,
    hashProjectSnapshot
} = require(
    "../../compiler/project/snapshot"
);

const {
    EvolutionFlowGateway,
    EvolutionFlowGatewayError
} = require(
    "../../compiler/project/evolution_flow_gateway"
);

const {
    hashAST
} = require(
    "../../compiler/ast/serializer"
);

function makeShell() {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: "weapon-system",
            hash: hashAST(payload),
            version: 1
        },

        position: {
            path: "systems.weapon",
            parent: "systems",
            order: 0
        },

        lifecycle: {
            actual: true,
            generation: 1,
            createdAt:
                "2026-08-04T00:00:00.000Z",
            supersedes: null
        },

        semantic: {
            name: "WeaponSystem",
            purpose:
                "Controls weapon behavior.",
            tags: [
                "system",
                "weapon"
            ],
            description:
                "Weapon system."
        },

        payload
    };
}

function makeRequest(tree) {
    const snapshot =
        createProjectSnapshot(tree);

    const snapshotHash =
        hashProjectSnapshot(snapshot);

    const shell =
        tree.getShell(
            "systems.weapon"
        );

    return {
        type:
            "EvolutionRequest",

        schemaVersion:
            1,

        baseSnapshotHash:
            snapshotHash,

        intent:
            "Add pistol support.",

        baseShells: [
            {
                shellId:
                    "weapon-system",

                version:
                    shell.identity.version,

                hash:
                    shell.identity.hash,

                path:
                    "systems.weapon"
            }
        ],

        changes: [
            {
                shellId:
                    "weapon-system",

                operation:
                    "UPDATE",

                path:
                    "systems.weapon",

                baseVersion:
                    shell.identity.version,

                baseHash:
                    shell.identity.hash,

                reason:
                    "Add pistol support."
            }
        ]
    };
}

function makeEnvironment() {
    const repository =
        new ShellRepository();

    const tree =
        new ProjectTree();

    const shell =
        repository.create(
            makeShell()
        );

    tree.addShell(
        shell
    );

    return {
        repository,
        tree,
        request:
            makeRequest(tree)
    };
}

function makeResolver() {
    return {
        resolve(state) {
            return {
                type:
                    "ResolvedProject",

                state
            };
        }
    };
}

function makeWeaver() {
    return {
        weave(resolved) {
            return {
                type:
                    "WovenProject",

                files: [],

                resolved
            };
        }
    };
}

function makeCompiler() {
    return {
        compile(woven) {
            return {
                type:
                    "CompiledProject",

                files: [],

                woven
            };
        }
    };
}

function makeEmitter() {
    return {
        emit(compiled) {
            return {
                type:
                    "EmittedProject",

                files: [],

                compiled
            };
        }
    };
}

function makeProposedShell() {
    const shell =
        makeShell();

    shell.identity.version = 2;
    shell.lifecycle.generation = 2;
    shell.lifecycle.actual = false;
    shell.lifecycle.supersedes =
        shell.identity.hash;

    shell.semantic.purpose =
        "Controls weapon and pistol behavior.";

    return shell;
}

function makeGateway(
    environment,
    overrides = {}
) {
    return new EvolutionFlowGateway({
        repository:
            environment.repository,

        tree:
            environment.tree,

        resolver:
            overrides.resolver ||
            makeResolver(),

        weaver:
            overrides.weaver ||
            makeWeaver(),

        compiler:
            overrides.compiler ||
            makeCompiler(),

        emitter:
            overrides.emitter ||
            makeEmitter()
    });
}

function assertGatewayError(
    callback,
    message
) {
    assert.throws(
        callback,
        error => {
            assert.ok(
                error instanceof
                    EvolutionFlowGatewayError
            );

            assert.strictEqual(
                error.code,
                "LS021"
            );

            assert.strictEqual(
                error.message,
                message
            );

            return true;
        }
    );
}

try {
    //
    // --------------------------------------------------------
    // Resolver failure
    // --------------------------------------------------------
    //

    {
        const environment =
            makeEnvironment();

        const gateway =
            makeGateway(
                environment,
                {
                    resolver: {
                        resolve() {
                            throw new Error(
                                "resolver failure"
                            );
                        }
                    }
                }
            );

        assertGatewayError(
            () =>
                gateway.run(
                    environment.request,
                    [
                        makeProposedShell()
                    ]
                ),
            "Project resolution failed."
        );
    }

    //
    // --------------------------------------------------------
    // Weaver failure
    // --------------------------------------------------------
    //

    {
        const environment =
            makeEnvironment();

        const gateway =
            makeGateway(
                environment,
                {
                    weaver: {
                        weave() {
                            throw new Error(
                                "weaver failure"
                            );
                        }
                    }
                }
            );

        assertGatewayError(
            () =>
                gateway.run(
                    environment.request,
                    [
                        makeProposedShell()
                    ]
                ),
            "Project weaving failed."
        );
    }

    //
    // --------------------------------------------------------
    // Compiler failure
    // --------------------------------------------------------
    //

    {
        const environment =
            makeEnvironment();

        const gateway =
            makeGateway(
                environment,
                {
                    compiler: {
                        compile() {
                            throw new Error(
                                "compiler failure"
                            );
                        }
                    }
                }
            );

        assertGatewayError(
            () =>
                gateway.run(
                    environment.request,
                    [
                        makeProposedShell()
                    ]
                ),
            "Project compilation failed."
        );
    }

    //
    // --------------------------------------------------------
    // Emitter failure
    // --------------------------------------------------------
    //

    {
        const environment =
            makeEnvironment();

        const gateway =
            makeGateway(
                environment,
                {
                    emitter: {
                        emit() {
                            throw new Error(
                                "emitter failure"
                            );
                        }
                    }
                }
            );

        assertGatewayError(
            () =>
                gateway.run(
                    environment.request,
                    [
                        makeProposedShell()
                    ]
                ),
            "Project emission failed."
        );
    }

    //
    // --------------------------------------------------------
    // Invalid resolver result
    // --------------------------------------------------------
    //

    {
        const environment =
            makeEnvironment();

        const gateway =
            makeGateway(
                environment,
                {
                    resolver: {
                        resolve() {
                            return {
                                type:
                                    "InvalidProject"
                            };
                        }
                    }
                }
            );

        assertGatewayError(
            () =>
                gateway.run(
                    environment.request,
                    [
                        makeProposedShell()
                    ]
                ),
            "Project resolver returned an invalid result."
        );
    }

    console.log(
        "PROJECT EVOLUTION FLOW GATEWAY ERRORS OK"
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION FLOW GATEWAY ERRORS FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
