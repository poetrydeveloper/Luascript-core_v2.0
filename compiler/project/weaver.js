// compiler/project/weaver.js
//
// ProjectState -> deterministic Program AST
//
// Weaver is intentionally simple at this stage:
// 1. Resolve ProjectState through ShellRepository.
// 2. Take payload AST from every resolved Shell.
// 3. Preserve deterministic project order.
// 4. Concatenate declarations into one Program.
// 5. Never mutate source Shells or their AST.
//
// Later this becomes the deterministic "tree -> code" boundary.

const {
    ProjectStateResolver,
    ProjectResolverError
} = require("./resolver");

class ProjectWeaverError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectWeaverError";
        this.code = "LS010";
        this.value = value;
    }
}

class ProjectWeaver {
    constructor(repository, codeGenerator = null) {
        if (
            !repository ||
            typeof repository.getVersion !== "function"
        ) {
            throw new ProjectWeaverError(
                "Expected ShellRepository."
            );
        }

        this.repository = repository;
        this.resolver =
            new ProjectStateResolver(repository);

        this.codeGenerator = codeGenerator;
    }

    resolve(state) {
        try {
            return this.resolver.resolve(state);
        } catch (error) {
            if (error instanceof ProjectResolverError) {
                throw error;
            }

            throw new ProjectWeaverError(
                "Failed to resolve project state.",
                error
            );
        }
    }

    weave(state) {
        const resolved =
            this.resolve(state);

        const declarations = [];

        for (const shell of resolved.shells) {
            this.assertShellPayload(shell);

            for (
                const declaration
                of shell.payload.declarations
            ) {
                declarations.push(
                    declaration
                );
            }
        }

        return {
            type: "Program",
            declarations
        };
    }

    generate(state, codeGenerator = null) {
        const ast =
            this.weave(state);

        const generator =
            codeGenerator ||
            this.codeGenerator;

        if (
            !generator ||
            typeof generator.generate !== "function"
        ) {
            throw new ProjectWeaverError(
                "CodeGenerator is required for code generation."
            );
        }

        return generator.generate(ast);
    }

    assertShellPayload(shell) {
        if (
            !shell ||
            typeof shell !== "object"
        ) {
            throw new ProjectWeaverError(
                "Resolved shell must be an object.",
                shell
            );
        }

        if (shell.type !== "Shell") {
            throw new ProjectWeaverError(
                "Resolved shell must be a Shell.",
                shell
            );
        }

        if (
            !shell.payload ||
            typeof shell.payload !== "object"
        ) {
            throw new ProjectWeaverError(
                `Shell '${shell.identity?.id}' payload is required.`,
                shell
            );
        }

        if (shell.payload.type !== "Program") {
            throw new ProjectWeaverError(
                `Shell '${shell.identity?.id}' payload must be Program AST.`,
                shell.payload
            );
        }

        if (
            !Array.isArray(
                shell.payload.declarations
            )
        ) {
            throw new ProjectWeaverError(
                `Shell '${shell.identity?.id}' payload declarations must be an array.`,
                shell.payload
            );
        }
    }
}

module.exports = {
    ProjectWeaver,
    ProjectWeaverError
};
