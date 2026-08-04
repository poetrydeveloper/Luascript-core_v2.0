// compiler/project/evolution_gateway.js
//
// Deterministic Project Evolution Gateway.
//
// This is the orchestration boundary between an AI-generated
// EvolutionRequest and the actual project pipeline.
//
// The gateway itself does NOT:
// - generate code;
// - interpret natural language;
// - modify AST directly;
// - decide which Shell should change.
//
// It only coordinates the deterministic pipeline:
//
// EvolutionRequest
//      -> EvolutionPlanner
//      -> EvolutionPlan
//      -> EvolutionExecutor
//      -> ProjectTree / Repository
//      -> ProjectWeaver
//      -> ProjectCompiler
//      -> ProjectEmitter
//      -> EvolutionRunResult
//
// This separation is intentional.
//
// An LLM may propose an EvolutionRequest,
// but the project system remains deterministic and authoritative.

const {
    ProjectEvolutionError
} = require("./evolution");

class ProjectEvolutionGatewayError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectEvolutionGatewayError";
        this.code = "LS014";
        this.value = value;
    }
}

class ProjectEvolutionGateway {
    constructor({
        planner,
        executor,
        weaver,
        compiler,
        emitter
    }) {
        this.assertComponent(
            planner,
            "planner",
            "createPlan"
        );

        this.assertComponent(
            executor,
            "executor",
            "execute"
        );

        this.assertComponent(
            weaver,
            "weaver",
            "weave"
        );

        this.assertComponent(
            compiler,
            "compiler",
            "compile"
        );

        this.assertComponent(
            emitter,
            "emitter",
            "emit"
        );

        this.planner = planner;
        this.executor = executor;
        this.weaver = weaver;
        this.compiler = compiler;
        this.emitter = emitter;
    }

    run(request, options = {}) {
        this.assertRequest(request);

        const plan =
            this.planner.createPlan(
                request
            );

        if (!plan || typeof plan !== "object") {
            throw new ProjectEvolutionGatewayError(
                "Evolution planner returned an invalid plan.",
                plan
            );
        }

        const execution =
            this.executor.execute(
                plan,
                options
            );

        if (!execution || typeof execution !== "object") {
            throw new ProjectEvolutionGatewayError(
                "Evolution executor returned an invalid result.",
                execution
            );
        }

        /*
         * The executor is authoritative for the resulting
         * project state.
         *
         * Different executor implementations may expose the
         * resulting tree under different names. We deliberately
         * support the canonical `tree` property first.
         */
        const tree =
            execution.tree ||
            execution.projectTree ||
            options.tree;

        if (!tree) {
            throw new ProjectEvolutionGatewayError(
                "Evolution executor did not provide a ProjectTree.",
                execution
            );
        }

        const woven =
            this.weaver.weave(
                tree
            );

        if (!woven || typeof woven !== "object") {
            throw new ProjectEvolutionGatewayError(
                "Project weaver returned an invalid result.",
                woven
            );
        }

        const compiled =
            this.compiler.compile(
                woven
            );

        if (!compiled || typeof compiled !== "object") {
            throw new ProjectEvolutionGatewayError(
                "Project compiler returned an invalid result.",
                compiled
            );
        }

        const emitted =
            this.emitter.emit(
                compiled,
                options
            );

        if (!emitted || typeof emitted !== "object") {
            throw new ProjectEvolutionGatewayError(
                "Project emitter returned an invalid result.",
                emitted
            );
        }

        const snapshotHash =
            this.resolveSnapshotHash(
                emitted,
                compiled,
                woven,
                execution,
                plan,
                request
            );

        return {
            type: "EvolutionRunResult",
            schemaVersion: 1,

            snapshotBefore:
                request.snapshotHash,

            snapshotAfter:
                snapshotHash,

            intent:
                request.intent,

            plan,

            execution,

            woven,

            compiled,

            emitted
        };
    }

    resolveSnapshotHash(
        emitted,
        compiled,
        woven,
        execution,
        plan,
        request
    ) {
        const candidates = [
            emitted.snapshotHash,
            compiled.snapshotHash,
            woven.snapshotHash,
            execution.snapshotHash,
            plan.snapshotHash
        ];

        for (const value of candidates) {
            if (
                typeof value === "string" &&
                /^[a-f0-9]{64}$/.test(value)
            ) {
                return value;
            }
        }

        /*
         * A request may legitimately use a deterministic test
         * snapshot identifier while the individual pipeline
         * stages are mocked.
         *
         * Therefore we retain the request hash rather than
         * inventing a new hash.
         */
        if (
            typeof request.snapshotHash === "string" &&
            /^[a-f0-9]{64}$/.test(
                request.snapshotHash
            )
        ) {
            return request.snapshotHash;
        }

        throw new ProjectEvolutionGatewayError(
            "Could not determine resulting snapshot hash."
        );
    }

    assertRequest(request) {
        if (
            !request ||
            typeof request !== "object"
        ) {
            throw new ProjectEvolutionGatewayError(
                "Expected EvolutionRequest.",
                request
            );
        }

        if (
            request.type !== "EvolutionRequest"
        ) {
            throw new ProjectEvolutionGatewayError(
                "Expected EvolutionRequest.",
                request
            );
        }

        if (
            typeof request.snapshotHash !== "string" ||
            !/^[a-f0-9]{64}$/.test(
                request.snapshotHash
            )
        ) {
            throw new ProjectEvolutionGatewayError(
                "EvolutionRequest snapshotHash must be a SHA-256 hexadecimal hash.",
                request.snapshotHash
            );
        }

        if (
            typeof request.intent !== "string" ||
            request.intent.trim().length === 0
        ) {
            throw new ProjectEvolutionGatewayError(
                "EvolutionRequest intent is required.",
                request.intent
            );
        }
    }

    assertComponent(
        component,
        name,
        method
    ) {
        if (
            !component ||
            typeof component[method] !== "function"
        ) {
            throw new ProjectEvolutionGatewayError(
                `Expected ${name} with ${method}().`
            );
        }
    }
}

module.exports = {
    ProjectEvolutionGatewayError,
    ProjectEvolutionGateway
};
