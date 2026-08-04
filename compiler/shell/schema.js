const { hashAST } = require("../ast/serializer");

class ShellSchemaError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellSchemaError";
        this.code = "LS006";
        this.value = value;
    }
}

/*
 * Shell
 *
 * Shell is the atomic evolution unit of the Aura project tree.
 *
 * It contains:
 *   - identity
 *   - tree position
 *   - lifecycle/version information
 *   - semantic information
 *   - deterministic AST payload
 *
 * The AST itself remains owned by the compiler AST layer.
 * Shell only defines the contract around that AST.
 */

function assertObject(value, message) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new ShellSchemaError(message, value);
    }
}

function assertString(value, field) {
    if (typeof value !== "string" || value.length === 0) {
        throw new ShellSchemaError(
            `Shell field '${field}' must be a non-empty string.`,
            value
        );
    }
}

function assertBoolean(value, field) {
    if (typeof value !== "boolean") {
        throw new ShellSchemaError(
            `Shell field '${field}' must be boolean.`,
            value
        );
    }
}

function assertInteger(value, field) {
    if (!Number.isInteger(value)) {
        throw new ShellSchemaError(
            `Shell field '${field}' must be an integer.`,
            value
        );
    }
}

function assertAST(ast) {
    assertObject(ast, "Shell AST must be an object.");

    if (ast.type !== "Program") {
        throw new ShellSchemaError(
            "Shell AST must be a Program AST.",
            ast
        );
    }
}

function validateIdentity(identity) {
    assertObject(
        identity,
        "Shell identity must be an object."
    );

    assertString(identity.id, "identity.id");
    assertString(identity.hash, "identity.hash");

    if (
        !/^[a-f0-9]{64}$/.test(identity.hash)
    ) {
        throw new ShellSchemaError(
            "Shell identity.hash must be a SHA-256 hexadecimal hash.",
            identity.hash
        );
    }

    assertInteger(identity.version, "identity.version");

    if (identity.version < 1) {
        throw new ShellSchemaError(
            "Shell identity.version must be >= 1.",
            identity.version
        );
    }
}

function validatePosition(position) {
    assertObject(
        position,
        "Shell position must be an object."
    );

    assertString(position.path, "position.path");

    if (
        position.parent !== null &&
        position.parent !== undefined
    ) {
        assertString(position.parent, "position.parent");
    }

    assertInteger(position.order);

    if (position.order < 0) {
        throw new ShellSchemaError(
            "Shell position.order must be >= 0.",
            position.order
        );
    }
}

function validateLifecycle(lifecycle) {
    assertObject(
        lifecycle,
        "Shell lifecycle must be an object."
    );

    assertBoolean(
        lifecycle.actual,
        "lifecycle.actual"
    );

    assertInteger(
        lifecycle.generation,
        "lifecycle.generation"
    );

    if (lifecycle.generation < 1) {
        throw new ShellSchemaError(
            "Shell lifecycle.generation must be >= 1.",
            lifecycle.generation
        );
    }

    assertString(
        lifecycle.createdAt,
        "lifecycle.createdAt"
    );

    if (
        lifecycle.supersedes !== null &&
        lifecycle.supersedes !== undefined
    ) {
        assertString(
            lifecycle.supersedes,
            "lifecycle.supersedes"
        );
    }
}

function validateSemantic(semantic) {
    assertObject(
        semantic,
        "Shell semantic must be an object."
    );

    assertString(
        semantic.name,
        "semantic.name"
    );

    assertString(
        semantic.purpose,
        "semantic.purpose"
    );

    if (!Array.isArray(semantic.tags)) {
        throw new ShellSchemaError(
            "Shell semantic.tags must be an array.",
            semantic.tags
        );
    }

    for (const tag of semantic.tags) {
        assertString(tag, "semantic.tags[]");
    }

    assertString(
        semantic.description,
        "semantic.description"
    );
}

function validateShell(shell) {
    assertObject(
        shell,
        "Expected Shell object."
    );

    if (shell.type !== "Shell") {
        throw new ShellSchemaError(
            "Expected Shell object with type 'Shell'.",
            shell
        );
    }

    if (shell.schemaVersion !== 1) {
        throw new ShellSchemaError(
            "Unsupported Shell schema version.",
            shell.schemaVersion
        );
    }

    validateIdentity(shell.identity);
    validatePosition(shell.position);
    validateLifecycle(shell.lifecycle);
    validateSemantic(shell.semantic);

    assertAST(shell.payload);

    const actualHash = hashAST(shell.payload);

    if (shell.identity.hash !== actualHash) {
        throw new ShellSchemaError(
            "Shell identity.hash does not match payload AST hash.",
            {
                expected: actualHash,
                received: shell.identity.hash
            }
        );
    }

    return true;
}

function createShell({
    id,
    hash,
    version,
    path,
    parent = null,
    order = 0,
    actual = true,
    generation,
    createdAt,
    supersedes = null,
    name,
    purpose,
    tags = [],
    description,
    ast
}) {
    const shell = {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id,
            hash,
            version
        },

        position: {
            path,
            parent,
            order
        },

        lifecycle: {
            actual,
            generation,
            createdAt,
            supersedes
        },

        semantic: {
            name,
            purpose,
            tags,
            description
        },

        payload: ast
    };

    validateShell(shell);

    return shell;
}

module.exports = {
    ShellSchemaError,
    validateShell,
    createShell
};
