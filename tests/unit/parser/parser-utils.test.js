--- tests/unit/parser/parser-utils.test.js (原始)


+++ tests/unit/parser/parser-utils.test.js (修改后)
// tests/unit/parser/parser-utils.test.js
const assert = require("assert");
const { TokenType } = require("../../../compiler/token");
const utils = require("../../../compiler/parser/parser-utils");
const { ParserError } = require("../../../compiler/parser/parser-error");

// Helper to create tokens
function createToken(type, lexeme, line, column) {
    return {
        type,
        lexeme,
        start: { line, column, offset: line * 10 + column },
        end: { line, column: column + lexeme.length, offset: line * 10 + column + lexeme.length }
    };
}

// locationFrom tests
{
    const token = createToken(TokenType.IDENTIFIER, "test", 5, 10);
    const location = utils.locationFrom(token);

    assert.deepStrictEqual(location, {
        start: { line: 5, column: 10, offset: 60 },
        end: { line: 5, column: 14, offset: 64 }
    });
    console.log("✓ locationFrom: returns location from token");
}

{
    assert.strictEqual(utils.locationFrom(null), null);
    console.log("✓ locationFrom: returns null for null token");
}

{
    const token = { end: { line: 1 } };
    assert.strictEqual(utils.locationFrom(token), null);
    console.log("✓ locationFrom: returns null for token without start");
}

// isAtEnd tests
{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "a", 1, 1),
        createToken(TokenType.EOF, "", 1, 5)
    ];

    assert.strictEqual(utils.isAtEnd(tokens, 0), false);
    console.log("✓ isAtEnd: returns false when not at end");
}

{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "a", 1, 1),
        createToken(TokenType.EOF, "", 1, 5)
    ];

    assert.strictEqual(utils.isAtEnd(tokens, 2), true);
    console.log("✓ isAtEnd: returns true when at end");
}

{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "a", 1, 1),
        createToken(TokenType.EOF, "", 1, 5)
    ];

    assert.strictEqual(utils.isAtEnd(tokens, 10), true);
    console.log("✓ isAtEnd: returns true when past end");
}

// peek tests
{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "first", 1, 1),
        createToken(TokenType.IDENTIFIER, "second", 1, 7)
    ];

    assert.strictEqual(utils.peek(tokens, 0).lexeme, "first");
    assert.strictEqual(utils.peek(tokens, 1).lexeme, "second");
    console.log("✓ peek: returns current token");
}

{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "first", 1, 1),
        createToken(TokenType.EOF, "", 1, 5)
    ];

    const result = utils.peek(tokens, 2);
    assert.strictEqual(result.type, TokenType.EOF);
    console.log("✓ peek: returns EOF when at end");
}

// previous tests
{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "first", 1, 1),
        createToken(TokenType.IDENTIFIER, "second", 1, 7)
    ];

    assert.strictEqual(utils.previous(tokens, 1).lexeme, "first");
    assert.strictEqual(utils.previous(tokens, 2).lexeme, "second");
    console.log("✓ previous: returns previous token");
}

{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "first", 1, 1),
        createToken(TokenType.IDENTIFIER, "second", 1, 7)
    ];

    assert.strictEqual(utils.previous(tokens, 0).lexeme, "first");
    console.log("✓ previous: returns first token when at start");
}

// advance tests
{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "a", 1, 1),
        createToken(TokenType.IDENTIFIER, "b", 1, 3)
    ];
    const ctx = { current: 0 };

    const result = utils.advance(tokens, ctx);

    assert.strictEqual(ctx.current, 1);
    assert.strictEqual(result.lexeme, "a");
    console.log("✓ advance: advances and returns previous token");
}

// check tests
{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];

    assert.strictEqual(utils.check(tokens, 0, TokenType.CLASS), true);
    console.log("✓ check: returns true when type matches");
}

{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];

    assert.strictEqual(utils.check(tokens, 0, TokenType.IDENTIFIER), false);
    console.log("✓ check: returns false when type does not match");
}

{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];

    assert.strictEqual(utils.check(tokens, 2, TokenType.EOF), false);
    console.log("✓ check: returns false when at end");
}

// match tests
{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];
    const ctx = { current: 0 };

    const result = utils.match(tokens, ctx, TokenType.CLASS, TokenType.STRUCT);

    assert.strictEqual(result, true);
    assert.strictEqual(ctx.current, 1);
    console.log("✓ match: matches and advances when type matches");
}

{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];
    const ctx = { current: 0 };

    const result = utils.match(tokens, ctx, TokenType.IDENTIFIER);

    assert.strictEqual(result, false);
    assert.strictEqual(ctx.current, 0);
    console.log("✓ match: does not advance when type does not match");
}

// consume tests
{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];
    const ctx = { current: 0 };

    const result = utils.consume(tokens, ctx, TokenType.CLASS, "Expected class", ParserError);

    assert.strictEqual(result.type, TokenType.CLASS);
    assert.strictEqual(ctx.current, 1);
    console.log("✓ consume: consumes and returns token when type matches");
}

{
    const tokens = [
        createToken(TokenType.CLASS, "class", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];
    const ctx = { current: 0 };

    let threw = false;
    try {
        utils.consume(tokens, ctx, TokenType.IDENTIFIER, "Expected identifier", ParserError);
    } catch (e) {
        threw = true;
        assert.ok(e instanceof ParserError);
    }

    assert.strictEqual(threw, true);
    assert.strictEqual(ctx.current, 0); // Should not advance
    console.log("✓ consume: throws error when type does not match");
}

// skipNewlines tests
{
    const tokens = [
        createToken(TokenType.NEWLINE, "\n", 1, 1),
        createToken(TokenType.NEWLINE, "\n", 2, 1),
        createToken(TokenType.IDENTIFIER, "test", 3, 1),
        createToken(TokenType.EOF, "", 3, 10)
    ];
    const ctx = { current: 0 };

    utils.skipNewlines(tokens, ctx);

    assert.strictEqual(ctx.current, 2);
    assert.strictEqual(tokens[ctx.current].type, TokenType.IDENTIFIER);
    console.log("✓ skipNewlines: skips newline tokens");
}

{
    const tokens = [
        createToken(TokenType.IDENTIFIER, "test", 1, 1),
        createToken(TokenType.EOF, "", 1, 10)
    ];
    const ctx = { current: 0 };

    utils.skipNewlines(tokens, ctx);

    assert.strictEqual(ctx.current, 0);
    console.log("✓ skipNewlines: does nothing when no newlines");
}

console.log("\nAll Parser Utils tests passed!");