const crypto = require("crypto");

class ASTSerializerError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ASTSerializerError";
        this.code = "LS005";
        this.value = value;
    }
}

function assertAST(ast) {
    if (!ast || typeof ast !== "object") {
        throw new ASTSerializerError(
            "Expected AST object.",
            ast
        );
    }

    if (ast.type !== "Program") {
        throw new ASTSerializerError(
            "Expected Program AST.",
            ast
        );
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

function serializeAST(ast) {
    assertAST(ast);

    const normalized = sortObjectKeys(ast);

    return JSON.stringify(normalized, null, 2);
}

function parseAST(serialized) {
    if (typeof serialized !== "string") {
        throw new ASTSerializerError(
            "Expected serialized AST string.",
            serialized
        );
    }

    let ast;

    try {
        ast = JSON.parse(serialized);
    } catch (error) {
        throw new ASTSerializerError(
            "Invalid serialized AST JSON."
        );
    }

    assertAST(ast);

    return ast;
}

function hashAST(ast) {
    const serialized = serializeAST(ast);

    return crypto
        .createHash("sha256")
        .update(serialized, "utf8")
        .digest("hex");
}

function cloneAST(ast) {
    return parseAST(
        serializeAST(ast)
    );
}

function equalAST(left, right) {
    return serializeAST(left) === serializeAST(right);
}

module.exports = {
    ASTSerializerError,
    serializeAST,
    parseAST,
    hashAST,
    cloneAST,
    equalAST
};
