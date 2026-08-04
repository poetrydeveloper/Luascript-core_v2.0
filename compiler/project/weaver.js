// compiler/project/weaver.js
//
// Project Weaver
//
// Responsibility:
// - consume a ResolvedProject;
// - deterministically traverse its Shells;
// - compile each Shell payload through CodeGenerator;
// - map Shell paths to Luau source files;
// - produce a deterministic in-memory project artifact.
//
// Weaver does NOT:
// - modify ShellRepository;
// - modify ProjectTree;
// - create new Shell versions;
// - decide what the AI meant;
// - perform semantic planning.
//
// Evolution happens before Weaver.
// Weaver is the deterministic materialization step.

const {
    CodeGenerator
} = require("../codegen");

class ProjectWeaverError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectWeaverError";
        this.code = "LS011";
        this.value = value;
    }
}

function assertResolvedProject(project) {
    if (!project || typeof project !== "object") {
        throw new ProjectWeaverError(
            "Expected ResolvedProject.",
            project
        );
    }

    if (project.type !== "ResolvedProject") {
        throw new ProjectWeaverError(
            "Expected ResolvedProject.",
            project
        );
    }

    if (project.schemaVersion !== 1) {
        throw new ProjectWeaverError(
            "Unsupported ResolvedProject schema version.",
            project.schemaVersion
        );
    }

    if (!Array.isArray(project.shells)) {
        throw new ProjectWeaverError(
            "ResolvedProject.shells must be an array.",
            project.shells
        );
    }

    if (
        typeof project.snapshotHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(project.snapshotHash)
    ) {
        throw new ProjectWeaverError(
            "ResolvedProject snapshotHash must be a SHA-256 hexadecimal hash.",
            project.snapshotHash
        );
    }
}

function shellPathToFilePath(path) {
    if (typeof path !== "string" || path.length === 0) {
        throw new ProjectWeaverError(
            "Shell path must be a non-empty string.",
            path
        );
    }

    return `${path.replace(/\./g, "/")}.luau`;
}

function compareShells(a, b) {
    const pathA = a.position.path;
    const pathB = b.position.path;

    if (pathA < pathB) {
        return -1;
    }

    if (pathA > pathB) {
        return 1;
    }

    return (
        a.identity.version -
        b.identity.version
    );
}

class ProjectWeaver {
    constructor(codeGenerator = null) {
        this.codeGenerator =
            codeGenerator || new CodeGenerator();
    }

    weave(project) {
        assertResolvedProject(project);

        const shells =
            [...project.shells]
                .sort(compareShells);

        const files = [];

        for (const shell of shells) {
            files.push(
                this.weaveShell(shell)
            );
        }

        return {
            type: "WovenProject",
            schemaVersion: 1,
            snapshotHash: project.snapshotHash,
            files
        };
    }

    weaveShell(shell) {
        if (!shell || typeof shell !== "object") {
            throw new ProjectWeaverError(
                "Expected Shell object.",
                shell
            );
        }

        if (shell.type !== "Shell") {
            throw new ProjectWeaverError(
                "Expected Shell object.",
                shell
            );
        }

        if (
            !shell.position ||
            typeof shell.position.path !== "string"
        ) {
            throw new ProjectWeaverError(
                "Shell position.path is required.",
                shell
            );
        }

        if (!shell.payload) {
            throw new ProjectWeaverError(
                "Shell payload is required.",
                shell
            );
        }

        let source;

        try {
            source =
                this.codeGenerator.generate(
                    shell.payload
                );
        } catch (error) {
            throw new ProjectWeaverError(
                `Failed to weave Shell '${shell.identity?.id || shell.position.path}'.`,
                {
                    shellId:
                        shell.identity?.id || null,
                    path:
                        shell.position.path,
                    cause: error
                }
            );
        }

        return {
            path:
                shellPathToFilePath(
                    shell.position.path
                ),

            shellId:
                shell.identity.id,

            version:
                shell.identity.version,

            generation:
                shell.lifecycle.generation,

            hash:
                shell.identity.hash,

            source
        };
    }
}

module.exports = {
    ProjectWeaverError,
    ProjectWeaver,
    assertResolvedProject,
    shellPathToFilePath
};
