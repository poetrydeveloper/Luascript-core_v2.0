// compiler/project/evolution_flow_gateway.js
//
// Evolution Flow Gateway.
//
// Boundary between the deterministic EvolutionFlow
// and the final project pipeline.
//
// Pipeline:
//
// EvolutionRequest
//      |
//      v
// EvolutionFlow
//      |
//      v
// EvolutionResult
//      |
//      v
// ProjectWeaver
//      |
//      v
// ProjectCompiler
//      |
//      v
// ProjectEmitter
//      |
//      v
// EvolutionRunResult
//
// This module does not implement:
// - planning;
// - validation;
// - repository mutation;
// - tree mutation;
// - weaving;
// - compilation;
// - emission.
//
// It only coordinates existing components.

const {
    EvolutionFlow
} = require("./evolution_flow");

class EvolutionFlowGatewayError extends Error {
    constructor(
        message,
        value = null
    ) {
        super(message);

        this.name =
            "EvolutionFlowGatewayError";

        this.code =
            "LS021";

        this.value =
            value;
    }
}

function assertComponent(
    component,
    name,
    method
) {
    if (
        !component ||
        typeof component[method] !== "function"
    ) {
        throw new EvolutionFlowGatewayError(
            `Expected ${name} with ${method}().`,
            component
        );
    }
}

function assertRequest(
    request
) {
    if (
        !request ||
        typeof request !== "object"
    ) {
        throw new EvolutionFlowGatewayError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.type !==
        "EvolutionRequest"
    ) {
        throw new EvolutionFlowGatewayError(
            "Expected EvolutionRequest.",
            request
        );
    }

    if (
        request.schemaVersion !== 1
    ) {
        throw new EvolutionFlowGatewayError(
            "Unsupported EvolutionRequest schema version.",
            request.schemaVersion
        );
    }
}

class EvolutionFlowGateway {
    constructor({
        repository,
        tree,
        weaver,
        compiler,
        emitter
    }) {
        if (
            !repository ||
            typeof repository.getVersion !==
                "function" ||
            typeof repository.save !==
                "function"
        ) {
            throw new EvolutionFlowGatewayError(
                "Expected ShellRepository.",
                repository
            );
        }

        if (
            !tree ||
            typeof tree.getShell !==
                "function" ||
            typeof tree.replaceShell !==
                "function"
        ) {
            throw new EvolutionFlowGatewayError(
                "Expected ProjectTree.",
                tree
            );
        }

        assertComponent(
            weaver,
            "weaver",
            "weave"
        );

        assertComponent(
            compiler,
            "compiler",
            "compile"
        );

        assertComponent(
            emitter,
            "emitter",
            "emit"
        );

        this.repository =
            repository;

        this.tree =
            tree;

        this.weaver =
            weaver;

        this.compiler =
            compiler;

        this.emitter =
            emitter;

        this.flow =
            new EvolutionFlow(
                repository,
                tree
            );
    }

    run(
        request,
        proposedShells = [],
        options = {}
    ) {
        assertRequest(
            request
        );

        let execution;

        try {
            execution =
                this.flow.execute(
                    request,
                    proposedShells
                );
        } catch (error) {
            throw new EvolutionFlowGatewayError(
                "Evolution flow failed.",
                error
            );
        }

        if (
            !execution ||
            typeof execution !==
                "object"
        ) {
            throw new EvolutionFlowGatewayError(
                "Evolution flow returned an invalid result.",
                execution
            );
        }

        let woven;

        try {
            woven =
                this.weaver.weave(
                    this.tree
                );
        } catch (error) {
            throw new EvolutionFlowGatewayError(
                "Project weaving failed.",
                error
            );
        }

        if (
            !woven ||
            typeof woven !==
                "object"
        ) {
            throw new EvolutionFlowGatewayError(
                "Project weaver returned an invalid result.",
                woven
            );
        }

        let compiled;

        try {
            compiled =
                this.compiler.compile(
                    woven
                );
        } catch (error) {
            throw new EvolutionFlowGatewayError(
                "Project compilation failed.",
                error
            );
        }

        if (
            !compiled ||
            typeof compiled !==
                "object"
        ) {
            throw new EvolutionFlowGatewayError(
                "Project compiler returned an invalid result.",
                compiled
            );
        }

        let emitted;

        try {
            emitted =
                this.emitter.emit(
                    compiled,
                    options
                );
        } catch (error) {
            throw new EvolutionFlowGatewayError(
                "Project emission failed.",
                error
            );
        }

        if (
            !emitted ||
            typeof emitted !==
                "object"
        ) {
            throw new EvolutionFlowGatewayError(
                "Project emitter returned an invalid result.",
                emitted
            );
        }

        return {
            type:
                "EvolutionRunResult",

            schemaVersion:
                1,

            request,

            execution,

            woven,

            compiled,

            emitted
        };
    }
}

module.exports = {
    EvolutionFlowGatewayError,
    EvolutionFlowGateway
};
