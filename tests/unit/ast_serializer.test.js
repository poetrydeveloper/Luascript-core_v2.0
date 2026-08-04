const assert = require("assert");
const fs = require("fs");

const { tokenize } = require("../../compiler/lexer");
const { Parser } = require("../../compiler/parser");

const {
    serializeAST,
    parseAST,
    hashAST,
    cloneAST,
    equalAST
} = require("../../compiler/ast/serializer");

const source = fs.readFileSync(
    "examples/WeaponTimerSystem.luas",
    "utf8"
);

try {
    const tokens = tokenize(source);
    const ast = new Parser(tokens).parse();

    const serialized = serializeAST(ast);

    assert.ok(
        serialized.length > 0,
        "Serialized AST must not be empty."
    );

    const restored = parseAST(serialized);

    assert.strictEqual(
        restored.type,
        "Program"
    );

    assert.ok(
        equalAST(ast, restored),
        "Restored AST must equal original AST."
    );

    const cloned = cloneAST(ast);

    assert.ok(
        equalAST(ast, cloned),
        "Cloned AST must equal original AST."
    );

    const hash1 = hashAST(ast);
    const hash2 = hashAST(restored);

    assert.strictEqual(
        hash1,
        hash2,
        "Equal ASTs must have equal hashes."
    );

    assert.strictEqual(
        hash1.length,
        64,
        "AST hash must be SHA-256."
    );

    console.log("AST SERIALIZER OK");
    console.log("AST HASH:", hash1);

} catch (error) {
    console.error("AST SERIALIZER FAILED");
    console.error(error);
    process.exit(1);
}
