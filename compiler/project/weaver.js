// compiler/project/weaver.js
//
// Project Weaver
//
// Responsibility:
//
// - consume a ResolvedProject;
// - deterministically traverse its Shells;
// - map Shell paths to Luau source files;
// - preserve the Shell payload;
// - produce a deterministic WovenProject.
//
// Weaver does NOT:
//
// - generate source code;
// - compile AST;
// - write files;
// - modify ShellRepository;
// - modify ProjectTree;
// - create Shell versions;
// - perform AI planning.
//
// Pipeline:
//
// ResolvedProject
//      |
//      v
// ProjectWeaver
//      |
//      v
// WovenProject
//      |
//      v
// ProjectCompiler
//      |
//      v
// CompiledProject
//      |
//      v
// ProjectEmitter
//      |
//      v
// filesystem

class ProjectWeaverError extends Error {
    constructor(message, value = null) {
        super(message);

        this.name =
            "ProjectWeaverError";

        this.code =
            "LS011";

        this.value =
            value;
    }
}

function assertResolvedProject(project) {
    if (
        !project ||
        typeof project !== "object"
    ) {
        throw new ProjectWeaverError(
            "Expected ResolvedProject.",
            project
        );
    }

    if (
        project.type !==
        "ResolvedProject"
    ) {
        throw new ProjectWeaverError(
            "Expected ResolvedProject.",
            project
        );
    }

    if (
        project.schemaVersion !== 1
    ) {
        throw new ProjectWeaverError(
            "Unsupported ResolvedProject schema version.",
            project.schemaVersion
        );
    }

    if (
        !Array.isArray(
            project.shells
        )
    ) {
        throw new ProjectWeaverError(
            "ResolvedProject.shells must be an array.",
            project.shells
        );
    }

    if (
        typeof project.snapshotHash !==
            "string" ||
        !/^[a-f0-9]{64}$/.test(
            project.snapshotHash
        )
    ) {
        throw new ProjectWeaverError(
            "ResolvedProject snapshotHash must be a SHA-256 hexadecimal hash.",
            project.snapshotHash
        );
    }
}

function shellPathToFilePath(
    shellPath
) {
    if (
        typeof shellPath !== "string" ||
        shellPath.length === 0
    ) {
        throw new ProjectWeaverError(
            "Shell path must be a non-empty string.",
            shellPath
        );
    }

    return (
        shellPath
            .replace(/\./g, "/") +
        ".luau"
    );
}

function compareShells(
    a,
    b
) {
    const pathA =
        a.position.path;

    const pathB =
        b.position.path;

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

function assertShell(
    shell
) {
    if (
        !shell ||
        typeof shell !== "object"
    ) {
        throw new ProjectWeaverError(
            "Expected Shell object.",
            shell
        );
    }

    if (
        shell.type !== "Shell"
    ) {
        throw new ProjectWeaverError(
            "Expected Shell object.",
            shell
        );
    }

    if (
        !shell.identity ||
        typeof shell.identity.id !==
            "string" ||
        typeof shell.identity.version !==
            "number" ||
        typeof shell.identity.hash !==
            "string"
    ) {
        throw new ProjectWeaverError(
            "Shell identity is invalid.",
            shell
        );
    }

    if (
        !shell.position ||
        typeof shell.position.path !==
            "string"
    ) {
        throw new ProjectWeaverError(
            "Shell position.path is required.",
            shell
        );
    }

    if (
        !shell.lifecycle ||
        typeof shell.lifecycle.generation !==
            "number"
    ) {
        throw new ProjectWeaverError(
            "Shell lifecycle.generation is required.",
            shell
        );
    }

    if (
        !shell.payload ||
        typeof shell.payload !==
            "object"
    ) {
        throw new ProjectWeaverError(
            "Shell payload is required.",
            shell
        );
    }

    if (
        shell.payload.type !==
        "Program"
    ) {
        throw new ProjectWeaverError(
            "Shell payload must be a Program AST.",
            shell.payload
        );
    }
}

class ProjectWeaver {
    weave(
        project
    ) {
        assertResolvedProject(
            project
        );

        const shells =
            [...project.shells]
                .sort(compareShells);

        const files = [];

        for (
            const shell of shells
        ) {
            files.push(
                this.weaveShell(
                    shell
                )
            );
        }

        return {
            type:
                "WovenProject",

            schemaVersion:
                1,

            snapshotHash:
                project.snapshotHash,

            files
        };
    }

    weaveShell(
        shell
    ) {
        assertShell(
            shell
        );

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

            payload:
                shell.payload
        };
    }
}

module.exports = {
    ProjectWeaverError,
    ProjectWeaver,
    assertResolvedProject,
    shellPathToFilePath
};
