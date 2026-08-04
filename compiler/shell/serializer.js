const crypto = require("crypto");

const {
    validateShell,
    ShellSchemaError
} = require("./schema");

class ShellSerializerError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellSerializerError";
        this.code = "LS007";
        this.value = value;
    }
}

function sortObjectKeys(value) {
    if (Array.isArray(value)) {
        return value.map(sortObjectKeys);
    }

    if (value && typeof value === "object") {
        const result = {};

        for (const key of Object.keys(value).sort()) {
            result[key] = sortObjectKeys(value[key]);
        }

        return result;
    }

    return value;
}

function serializeShell(shell) {
    try {
        validateShell(shell);
    } catch (error) {
        if (error instanceof ShellSchemaError) {
            throw error;
        }

        throw new ShellSerializerError(
            "Shell validation failed.",
            shell
        );
    }

    const normalized = sortObjectKeys(shell);

    return JSON.stringify(
        normalized,
        null,
        2
    );
}

function parseShell(serialized) {
    if (typeof serialized !== "string") {
        throw new ShellSerializerError(
            "Expected serialized Shell string.",
            serialized
        );
    }

    let shell;

    try {
        shell = JSON.parse(serialized);
    } catch (error) {
        throw new ShellSerializerError(
            "Invalid serialized Shell JSON."
        );
    }

    validateShell(shell);

    return shell;
}

function hashShell(shell) {
    const serialized = serializeShell(shell);

    return crypto
        .createHash("sha256")
        .update(serialized, "utf8")
        .digest("hex");
}

function cloneShell(shell) {
    return parseShell(
        serializeShell(shell)
    );
}

function equalShell(left, right) {
    return serializeShell(left) === serializeShell(right);
}

module.exports = {
    ShellSerializerError,
    serializeShell,
    parseShell,
    hashShell,
    cloneShell,
    equalShell
};
