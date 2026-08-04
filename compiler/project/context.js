// compiler/project/context.js
//
// Compact Project Context for AI.
//
// Purpose:
// - expose the current project structure compactly;
// - avoid sending full ASTs of every Shell to an AI;
// - provide enough semantic information for planning an evolution;
// - keep the project snapshot hash as the integrity anchor.
//
// Full AST/payloads are intentionally NOT included here.
// They can be requested separately for the Shells relevant to a task.

const {
    createProjectSnapshot,
    hashProjectSnapshot
} = require("./snapshot");

class ProjectContextError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectContextError";
        this.code = "LS010";
        this.value = value;
    }
}

function assertProjectTree(tree) {
    if (!tree || typeof tree !== "object") {
        throw new ProjectContextError(
            "Expected ProjectTree object.",
            tree
        );
    }

    if (!(tree.nodes instanceof Map)) {
        throw new ProjectContextError(
            "ProjectTree.nodes must be a Map.",
            tree
        );
    }
}

function compactShell(shell) {
    if (!shell || typeof shell !== "object") {
        throw new ProjectContextError(
            "Expected Shell object.",
            shell
        );
    }

    return {
        id: shell.identity.id,
        path: shell.position.path,
        parent: shell.position.parent,
        order: shell.position.order,

        version: shell.identity.version,
        generation: shell.lifecycle.generation,
        hash: shell.identity.hash,
        actual: shell.lifecycle.actual === true,

        semantic: {
            name: shell.semantic.name,
            purpose: shell.semantic.purpose,
            tags: [...(shell.semantic.tags || [])],
            description: shell.semantic.description
        }
    };
}

function createProjectContext(tree) {
    assertProjectTree(tree);

    const snapshot = createProjectSnapshot(tree);
    const snapshotHash = hashProjectSnapshot(snapshot);

    const shells = [];

    for (const shell of tree.nodes.values()) {
        if (!shell || typeof shell !== "object") {
            continue;
        }

        if (
            !shell.lifecycle ||
            shell.lifecycle.actual !== true
        ) {
            continue;
        }

        shells.push(
            compactShell(shell)
        );
    }

    shells.sort((a, b) => {
        if (a.path < b.path) {
            return -1;
        }

        if (a.path > b.path) {
            return 1;
        }

        return a.order - b.order;
    });

    const roots = shells
        .filter(shell => !shell.parent)
        .map(shell => shell.path);

    return {
        type: "ProjectContext",
        schemaVersion: 1,

        project: {
            snapshotHash,
            shellCount: shells.length,
            rootCount: roots.length
        },

        tree: {
            roots,
            paths: shells.map(
                shell => shell.path
            )
        },

        shells
    };
}

function serializeProjectContext(context) {
    if (
        !context ||
        typeof context !== "object"
    ) {
        throw new ProjectContextError(
            "Expected ProjectContext.",
            context
        );
    }

    if (context.type !== "ProjectContext") {
        throw new ProjectContextError(
            "Expected ProjectContext.",
            context
        );
    }

    if (context.schemaVersion !== 1) {
        throw new ProjectContextError(
            "Unsupported ProjectContext schema version.",
            context.schemaVersion
        );
    }

    return JSON.stringify(
        context,
        null,
        2
    );
}

function cloneProjectContext(context) {
    return JSON.parse(
        serializeProjectContext(context)
    );
}

module.exports = {
    ProjectContextError,
    compactShell,
    createProjectContext,
    serializeProjectContext,
    cloneProjectContext
};
