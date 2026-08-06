--- tests/unit/parser/parser-error.test.js (原始)


+++ tests/unit/parser/parser-error.test.js (修改后)
// tests/unit/parser/parser-error.test.js
const assert = require("assert");
const { ParserError } = require("../../../compiler/parser");

// Test: creates error with message only
{
    const error = new ParserError("Test error");
    assert.strictEqual(error.name, "ParserError");
    assert.strictEqual(error.code, "LS003");
    assert.strictEqual(error.message, "Test error");
    assert.strictEqual(error.token, null);
    assert.strictEqual(error.line, null);
    assert.strictEqual(error.column, null);
    assert.strictEqual(error.offset, null);
    console.log("✓ ParserError: creates error with message only");
}

// Test: creates error with token
{
    const token = {
        start: { line: 5, column: 10, offset: 50 },
        end: { line: 5, column: 15, offset: 55 }
    };
    const error = new ParserError("Unexpected token", token);

    assert.strictEqual(error.name, "ParserError");
    assert.strictEqual(error.code, "LS003");
    assert.strictEqual(error.message, "Unexpected token");
    assert.strictEqual(error.token, token);
    assert.strictEqual(error.line, 5);
    assert.strictEqual(error.column, 10);
    assert.strictEqual(error.offset, 50);
    console.log("✓ ParserError: creates error with token");
}

// Test: handles null token gracefully
{
    const error = new ParserError("Error", null);
    assert.strictEqual(error.token, null);
    assert.strictEqual(error.line, null);
    assert.strictEqual(error.column, null);
    assert.strictEqual(error.offset, null);
    console.log("✓ ParserError: handles null token gracefully");
}

// Test: handles token without start property
{
    const token = { end: { line: 1, column: 1 } };
    const error = new ParserError("Error", token);
    assert.strictEqual(error.line, null);
    assert.strictEqual(error.column, null);
    assert.strictEqual(error.offset, null);
    console.log("✓ ParserError: handles token without start property");
}

console.log("\nAll Parser Error tests passed!");