const {
    cloneProjectContext
} = require("./context");

class ProjectContextSerializerError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectContextSerializerError";
        this.code = "LS010";
        this.value = value;
    }
}

function assertProjectContext(context) {
    if (!context || typeof context !== "object") {
        throw new ProjectContextSerializerError(
            "Expected ProjectContext.",
            context
        );
    }

    if (context.type !== "ProjectContext") {
        throw new ProjectContextSerializerError(
            "Expected ProjectContext.",
            context
        );
    }

    if (context.schemaVersion !== 1) {
        throw new ProjectContextSerializerError(
            "Unsupported ProjectContext schema version.",
            context.schemaVersion
        );
    }

    if (!context.project || typeof context.project !== "object") {
        throw new ProjectContextSerializerError(
            "ProjectContext.project is required.",
            context.project
        );
    }

    if (
        typeof context.project.snapshotHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(
            context.project.snapshotHash
        )
    ) {
        throw new ProjectContextSerializerError(
            "ProjectContext.project.snapshotHash must be a SHA-256 hexadecimal hash.",
            context.project.snapshotHash
        );
    }

    if (!Array.isArray(context.shells)) {
        throw new ProjectContextSerializerError(
            "ProjectContext.shells must be an array.",
            context.shells
        );
    }
}

function compactShell(shell) {
    return {
        id: shell.id,
        path: shell.path,
        parent: shell.parent,
        order: shell.order,
        version: shell.version,
        generation: shell.generation,
        hash: shell.hash,
        actual: shell.actual,

        name:
            shell.semantic &&
            typeof shell.semantic.name === "string"
                ? shell.semantic.name
                : "",

        purpose:
            shell.semantic &&
            typeof shell.semantic.purpose === "string"
                ? shell.semantic.purpose
                : "",

        tags:
            shell.semantic &&
            Array.isArray(shell.semantic.tags)
                ? [...shell.semantic.tags]
                : [],

        description:
            shell.semantic &&
            typeof shell.semantic.description === "string"
                ? shell.semantic.description
                : ""
    };
}

function sortShells(shells) {
    return [...shells].sort((a, b) => {
        if (a.path < b.path) {
            return -1;
        }

        if (a.path > b.path) {
            return 1;
        }

        if (a.order < b.order) {
            return -1;
        }

        if (a.order > b.order) {
            return 1;
        }

        if (a.id < b.id) {
            return -1;
        }

        if (a.id > b.id) {
            return 1;
        }

        return 0;
    });
}

function createAIProjectContext(context) {
    assertProjectContext(context);

    const cloned =
        cloneProjectContext(context);

    const shells =
        sortShells(
            cloned.shells.map(
                compactShell
            )
        );

    return {
        type: "AIProjectContext",
        schemaVersion: 1,

        project: {
            snapshotHash:
                cloned.project.snapshotHash,

            shellCount:
                shells.length,

            rootCount:
                Array.isArray(cloned.tree?.roots)
                    ? cloned.tree.roots.length
                    : 0
        },

        tree: {
            roots:
                Array.isArray(cloned.tree?.roots)
                    ? [...cloned.tree.roots]
                    : [],

            paths:
                shells.map(
                    shell => shell.path
                )
        },

        shellCount: shells.length,

        shells
    };
}

function serializeAIProjectContext(context) {
    const aiContext =
        createAIProjectContext(context);

    return JSON.stringify(
        aiContext,
        null,
        2
    );
}

function assertAIProjectContext(context) {
    if (!context || typeof context !== "object") {
        throw new ProjectContextSerializerError(
            "Expected AIProjectContext.",
            context
        );
    }

    if (context.type !== "AIProjectContext") {
        throw new ProjectContextSerializerError(
            "Expected AIProjectContext.",
            context
        );
    }

    if (context.schemaVersion !== 1) {
        throw new ProjectContextSerializerError(
            "Unsupported AIProjectContext schema version.",
            context.schemaVersion
        );
    }

    if (!context.project || typeof context.project !== "object") {
        throw new ProjectContextSerializerError(
            "AIProjectContext.project is required.",
            context.project
        );
    }

    if (
        typeof context.project.snapshotHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(
            context.project.snapshotHash
        )
    ) {
        throw new ProjectContextSerializerError(
            "AIProjectContext.project.snapshotHash must be a SHA-256 hexadecimal hash.",
            context.project.snapshotHash
        );
    }

    if (!Array.isArray(context.shells)) {
        throw new ProjectContextSerializerError(
            "AIProjectContext.shells must be an array.",
            context.shells
        );
    }

    if (
        typeof context.shellCount !== "number" ||
        !Number.isInteger(context.shellCount)
    ) {
        throw new ProjectContextSerializerError(
            "AIProjectContext.shellCount must be an integer.",
            context.shellCount
        );
    }

    if (
        context.shellCount !==
        context.shells.length
    ) {
        throw new ProjectContextSerializerError(
            "AIProjectContext.shellCount does not match shells length.",
            context.shellCount
        );
    }

    for (const shell of context.shells) {
        if (!shell || typeof shell !== "object") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell must be an object.",
                shell
            );
        }

        if (typeof shell.id !== "string") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.id is required.",
                shell
            );
        }

        if (typeof shell.path !== "string") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.path is required.",
                shell
            );
        }

        if (
            typeof shell.version !== "number" ||
            !Number.isInteger(shell.version)
        ) {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.version must be an integer.",
                shell.version
            );
        }

        if (
            typeof shell.generation !== "number" ||
            !Number.isInteger(shell.generation)
        ) {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.generation must be an integer.",
                shell.generation
            );
        }

        if (typeof shell.actual !== "boolean") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.actual must be boolean.",
                shell.actual
            );
        }

        if (
            typeof shell.order !== "number" ||
            !Number.isInteger(shell.order)
        ) {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.order must be an integer.",
                shell.order
            );
        }

        if (
            shell.parent !== null &&
            typeof shell.parent !== "string"
        ) {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.parent must be string or null.",
                shell.parent
            );
        }

        if (typeof shell.name !== "string") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.name must be a string.",
                shell.name
            );
        }

        if (typeof shell.purpose !== "string") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.purpose must be a string.",
                shell.purpose
            );
        }

        if (typeof shell.description !== "string") {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.description must be a string.",
                shell.description
            );
        }

        if (!Array.isArray(shell.tags)) {
            throw new ProjectContextSerializerError(
                "AIProjectContext shell.tags must be an array.",
                shell.tags
            );
        }
    }
}

function parseAIProjectContext(serialized) {
    if (typeof serialized !== "string") {
        throw new ProjectContextSerializerError(
            "Expected serialized AIProjectContext string.",
            serialized
        );
    }

    let context;

    try {
        context = JSON.parse(serialized);
    } catch (error) {
        throw new ProjectContextSerializerError(
            "Invalid serialized AIProjectContext JSON."
        );
    }

    assertAIProjectContext(context);

    return context;
}

function cloneAIProjectContext(context) {
    return parseAIProjectContext(
        serializeAIProjectContext(context)
    );
}

module.exports = {
    ProjectContextSerializerError,
    createAIProjectContext,
    serializeAIProjectContext,
    parseAIProjectContext,
    cloneAIProjectContext
};
