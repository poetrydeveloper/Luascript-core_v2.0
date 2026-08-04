// compiler/project/compiler.js
//
// ProjectCompiler
//
// Pipeline:
//
// ProjectTree
//     ↓
// ProjectContext
//     ↓
// EvolutionRequest
//     ↓
// EvolutionPlan
//     ↓
// EvolutionExecutor
//     ↓
// ProjectWeaver
//     ↓
// WovenProject
//     ↓
// ProjectCompiler
//     ↓
// CompiledProject
//
// ProjectCompiler is responsible only for deterministic compilation.
// It does NOT write files to disk.
//
// Each WovenProject file contains a Shell payload.
// The payload is passed to the existing CodeGenerator.
//
// Integrity anchor:
// - snapshotHash is preserved from WovenProject.
// - compilation never invents or changes project identity.

const {
    CodeGenerator,
    CodegenError
} = require("../codegen");

class ProjectCompilerError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectCompilerError";
        this.code = "LS011";
        this.value = value;
    }
}

function assertWovenProject(project) {
    if (!project || typeof project !== "object") {
        throw new ProjectCompilerError(
            "Expected WovenProject.",
            project
        );
    }

    if (project.type !== "WovenProject") {
        throw new ProjectCompilerError(
            "Expected WovenProject.",
            project
        );
    }

    if (project.schemaVersion !== 1) {
        throw new ProjectCompilerError(
            "Unsupported WovenProject schema version.",
            project.schemaVersion
        );
    }

    if (
        typeof project.snapshotHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(project.snapshotHash)
    ) {
        throw new ProjectCompilerError(
            "WovenProject snapshotHash must be a SHA-256 hexadecimal hash.",
            project.snapshotHash
        );
    }

    if (!Array.isArray(project.files)) {
        throw new ProjectCompilerError(
            "WovenProject.files must be an array.",
            project.files
        );
    }
}

function assertWovenFile(file) {
    if (!file || typeof file !== "object") {
        throw new ProjectCompilerError(
            "WovenProject file must be an object.",
            file
        );
    }

    if (typeof file.path !== "string" || file.path.length === 0) {
        throw new ProjectCompilerError(
            "WovenProject file.path is required.",
            file
        );
    }

    if (
        typeof file.shellId !== "string" ||
        file.shellId.length === 0
    ) {
        throw new ProjectCompilerError(
            "WovenProject file.shellId is required.",
            file
        );
    }

    if (
        typeof file.version !== "number" ||
        !Number.isInteger(file.version)
    ) {
        throw new ProjectCompilerError(
            "WovenProject file.version must be an integer.",
            file
        );
    }

    if (
        typeof file.generation !== "number" ||
        !Number.isInteger(file.generation)
    ) {
        throw new ProjectCompilerError(
            "WovenProject file.generation must be an integer.",
            file
        );
    }

    if (!file.payload || typeof file.payload !== "object") {
        throw new ProjectCompilerError(
            "WovenProject file.payload is required.",
            file
        );
    }

    if (file.payload.type !== "Program") {
        throw new ProjectCompilerError(
            "WovenProject file.payload must be a Program AST.",
            file.payload
        );
    }
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

class ProjectCompiler {
    constructor(codeGenerator = null) {
        this.codeGenerator =
            codeGenerator || new CodeGenerator();
    }

    compile(wovenProject) {
        assertWovenProject(wovenProject);

        const compiledFiles = [];

        for (const file of sortFiles(wovenProject.files)) {
            assertWovenFile(file);

            let code;

            try {
                code = this.codeGenerator.generate(
                    file.payload
                );
            } catch (error) {
                if (error instanceof CodegenError) {
                    throw new ProjectCompilerError(
                        `Failed to compile '${file.path}': ${error.message}`,
                        {
                            path: file.path,
                            shellId: file.shellId,
                            version: file.version,
                            generation: file.generation,
                            node: error.node
                        }
                    );
                }

                throw error;
            }

            if (typeof code !== "string") {
                throw new ProjectCompilerError(
                    `Code generator returned invalid output for '${file.path}'.`,
                    code
                );
            }

            compiledFiles.push({
                path: file.path,
                shellId: file.shellId,
                version: file.version,
                generation: file.generation,
                code
            });
        }

        return {
            type: "CompiledProject",
            schemaVersion: 1,
            snapshotHash: wovenProject.snapshotHash,
            files: compiledFiles
        };
    }
}

function compileProject(wovenProject) {
    return new ProjectCompiler().compile(
        wovenProject
    );
}

module.exports = {
    ProjectCompilerError,
    ProjectCompiler,
    compileProject,
    assertWovenProject,
    assertWovenFile
};
