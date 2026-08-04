// compiler/project/emitter.js
//
// ProjectEmitter
//
// Materializes a CompiledProject into real files.
//
// Responsibility:
// - validate CompiledProject;
// - validate every compiled file;
// - resolve paths safely relative to output directory;
// - create required directories;
// - write deterministic UTF-8 files.
//
// NOT responsible for:
// - AST generation;
// - Shell evolution;
// - ProjectTree changes;
// - version selection;
// - AI planning;
// - compilation.
//
// Pipeline:
//
// WovenProject
//      ↓
// ProjectCompiler
//      ↓
// CompiledProject
//      ↓
// ProjectEmitter
//      ↓
// filesystem

const fs = require("fs");
const path = require("path");

class ProjectEmitterError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectEmitterError";
        this.code = "LS012";
        this.value = value;
    }
}

function assertCompiledProject(project) {
    if (!project || typeof project !== "object") {
        throw new ProjectEmitterError(
            "Expected CompiledProject.",
            project
        );
    }

    if (project.type !== "CompiledProject") {
        throw new ProjectEmitterError(
            "Expected CompiledProject.",
            project
        );
    }

    if (project.schemaVersion !== 1) {
        throw new ProjectEmitterError(
            "Unsupported CompiledProject schema version.",
            project.schemaVersion
        );
    }

    if (
        typeof project.snapshotHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(project.snapshotHash)
    ) {
        throw new ProjectEmitterError(
            "CompiledProject snapshotHash must be a SHA-256 hexadecimal hash.",
            project.snapshotHash
        );
    }

    if (!Array.isArray(project.files)) {
        throw new ProjectEmitterError(
            "CompiledProject.files must be an array.",
            project.files
        );
    }
}

function assertCompiledFile(file) {
    if (!file || typeof file !== "object") {
        throw new ProjectEmitterError(
            "CompiledProject file must be an object.",
            file
        );
    }

    if (
        typeof file.path !== "string" ||
        file.path.length === 0
    ) {
        throw new ProjectEmitterError(
            "CompiledProject file.path is required.",
            file
        );
    }

    if (
        typeof file.shellId !== "string" ||
        file.shellId.length === 0
    ) {
        throw new ProjectEmitterError(
            "CompiledProject file.shellId is required.",
            file
        );
    }

    if (
        typeof file.version !== "number" ||
        !Number.isInteger(file.version)
    ) {
        throw new ProjectEmitterError(
            "CompiledProject file.version must be an integer.",
            file
        );
    }

    if (
        typeof file.generation !== "number" ||
        !Number.isInteger(file.generation)
    ) {
        throw new ProjectEmitterError(
            "CompiledProject file.generation must be an integer.",
            file
        );
    }

    if (typeof file.code !== "string") {
        throw new ProjectEmitterError(
            "CompiledProject file.code must be a string.",
            file
        );
    }
}

function normalizeRelativePath(filePath) {
    const normalized =
        filePath.replace(/\\/g, "/");

    if (
        normalized.length === 0 ||
        normalized.startsWith("/") ||
        /^[A-Za-z]:\//.test(normalized)
    ) {
        throw new ProjectEmitterError(
            "CompiledProject file path must be relative.",
            filePath
        );
    }

    const parts =
        normalized.split("/");

    if (
        parts.includes("..") ||
        parts.includes(".") ||
        parts.some(
            part => part.length === 0
        )
    ) {
        throw new ProjectEmitterError(
            "CompiledProject file path contains unsafe path segments.",
            filePath
        );
    }

    return normalized;
}

function sortFiles(files) {
    return [...files].sort((a, b) => {
        if (a.path < b.path) {
            return -1;
        }

        if (a.path > b.path) {
            return 1;
        }

        if (a.shellId < b.shellId) {
            return -1;
        }

        if (a.shellId > b.shellId) {
            return 1;
        }

        return a.version - b.version;
    });
}

class ProjectEmitter {
    emit(compiledProject, outputDirectory) {
        assertCompiledProject(compiledProject);

        if (
            typeof outputDirectory !== "string" ||
            outputDirectory.length === 0
        ) {
            throw new ProjectEmitterError(
                "Expected output directory.",
                outputDirectory
            );
        }

        const root =
            path.resolve(outputDirectory);

        const emitted = [];

        for (
            const file of sortFiles(
                compiledProject.files
            )
        ) {
            assertCompiledFile(file);

            const relativePath =
                normalizeRelativePath(
                    file.path
                );

            const target =
                path.resolve(
                    root,
                    ...relativePath.split("/")
                );

            if (
                target !== root &&
                !target.startsWith(
                    root + path.sep
                )
            ) {
                throw new ProjectEmitterError(
                    "Resolved file path escapes output directory.",
                    {
                        path: file.path,
                        target
                    }
                );
            }

            fs.mkdirSync(
                path.dirname(target),
                {
                    recursive: true
                }
            );

            fs.writeFileSync(
                target,
                file.code,
                {
                    encoding: "utf8"
                }
            );

            emitted.push({
                path: relativePath,
                shellId: file.shellId,
                version: file.version,
                generation: file.generation
            });
        }

        return {
            type: "EmittedProject",
            schemaVersion: 1,
            snapshotHash:
                compiledProject.snapshotHash,
            outputDirectory: root,
            files: emitted
        };
    }
}

function emitProject(
    compiledProject,
    outputDirectory
) {
    return new ProjectEmitter().emit(
        compiledProject,
        outputDirectory
    );
}

module.exports = {
    ProjectEmitterError,
    ProjectEmitter,
    emitProject,
    assertCompiledProject,
    assertCompiledFile,
    normalizeRelativePath
};
