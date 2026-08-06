--- tests/unit/parser/parser-utils.test.js (原始)


+++ tests/unit/parser/parser-utils.test.js (修改后)
// tests/unit/parser/parser-utils.test.js
const { TokenType } = require("../../../compiler/token");
const utils = require("../../../compiler/parser/parser-utils");
const { ParserError } = require("../../../compiler/parser/parser-error");

describe("parser-utils", () => {
    const createToken = (type, lexeme, line, column) => ({
        type,
        lexeme,
        start: { line, column, offset: line * 10 + column },
        end: { line, column: column + lexeme.length, offset: line * 10 + column + lexeme.length }
    });

    describe("locationFrom", () => {
        test("returns location from token", () => {
            const token = createToken(TokenType.IDENTIFIER, "test", 5, 10);
            const location = utils.locationFrom(token);

            expect(location).toEqual({
                start: { line: 5, column: 10, offset: 60 },
                end: { line: 5, column: 14, offset: 64 }
            });
        });

        test("returns null for null token", () => {
            expect(utils.locationFrom(null)).toBeNull();
        });

        test("returns null for token without start", () => {
            const token = { end: { line: 1 } };
            expect(utils.locationFrom(token)).toBeNull();
        });
    });

    describe("isAtEnd", () => {
        const tokens = [
            createToken(TokenType.IDENTIFIER, "a", 1, 1),
            createToken(TokenType.EOF, "", 1, 5)
        ];

        test("returns false when not at end", () => {
            expect(utils.isAtEnd(tokens, 0)).toBe(false);
        });

        test("returns true when at end", () => {
            expect(utils.isAtEnd(tokens, 2)).toBe(true);
        });

        test("returns true when past end", () => {
            expect(utils.isAtEnd(tokens, 10)).toBe(true);
        });
    });

    describe("peek", () => {
        const tokens = [
            createToken(TokenType.IDENTIFIER, "first", 1, 1),
            createToken(TokenType.IDENTIFIER, "second", 1, 7)
        ];

        test("returns current token", () => {
            expect(utils.peek(tokens, 0).lexeme).toBe("first");
            expect(utils.peek(tokens, 1).lexeme).toBe("second");
        });

        test("returns EOF when at end", () => {
            const result = utils.peek(tokens, 2);
            expect(result.type).toBe(TokenType.EOF);
        });
    });

    describe("previous", () => {
        const tokens = [
            createToken(TokenType.IDENTIFIER, "first", 1, 1),
            createToken(TokenType.IDENTIFIER, "second", 1, 7)
        ];

        test("returns previous token", () => {
            expect(utils.previous(tokens, 1).lexeme).toBe("first");
            expect(utils.previous(tokens, 2).lexeme).toBe("second");
        });

        test("returns first token when at start", () => {
            expect(utils.previous(tokens, 0).lexeme).toBe("first");
        });
    });

    describe("advance", () => {
        test("advances and returns previous token", () => {
            const tokens = [
                createToken(TokenType.IDENTIFIER, "a", 1, 1),
                createToken(TokenType.IDENTIFIER, "b", 1, 3)
            ];
            const ctx = { current: 0 };

            const result = utils.advance(tokens, ctx);

            expect(ctx.current).toBe(1);
            expect(result.lexeme).toBe("a");
        });
    });

    describe("check", () => {
        const tokens = [
            createToken(TokenType.CLASS, "class", 1, 1),
            createToken(TokenType.EOF, "", 1, 10)
        ];

        test("returns true when type matches", () => {
            expect(utils.check(tokens, 0, TokenType.CLASS)).toBe(true);
        });

        test("returns false when type does not match", () => {
            expect(utils.check(tokens, 0, TokenType.IDENTIFIER)).toBe(false);
        });

        test("returns false when at end", () => {
            expect(utils.check(tokens, 2, TokenType.EOF)).toBe(false);
        });
    });

    describe("match", () => {
        test("matches and advances when type matches", () => {
            const tokens = [
                createToken(TokenType.CLASS, "class", 1, 1),
                createToken(TokenType.EOF, "", 1, 10)
            ];
            const ctx = { current: 0 };

            const result = utils.match(tokens, ctx, TokenType.CLASS, TokenType.STRUCT);

            expect(result).toBe(true);
            expect(ctx.current).toBe(1);
        });

        test("does not advance when type does not match", () => {
            const tokens = [
                createToken(TokenType.CLASS, "class", 1, 1),
                createToken(TokenType.EOF, "", 1, 10)
            ];
            const ctx = { current: 0 };

            const result = utils.match(tokens, ctx, TokenType.IDENTIFIER);

            expect(result).toBe(false);
            expect(ctx.current).toBe(0);
        });
    });

    describe("consume", () => {
        test("consumes and returns token when type matches", () => {
            const tokens = [
                createToken(TokenType.CLASS, "class", 1, 1),
                createToken(TokenType.EOF, "", 1, 10)
            ];
            const ctx = { current: 0 };

            const result = utils.consume(tokens, ctx, TokenType.CLASS, "Expected class", ParserError);

            expect(result.type).toBe(TokenType.CLASS);
            expect(ctx.current).toBe(1);
        });

        test("throws error when type does not match", () => {
            const tokens = [
                createToken(TokenType.CLASS, "class", 1, 1),
                createToken(TokenType.EOF, "", 1, 10)
            ];
            const ctx = { current: 0 };

            expect(() => {
                utils.consume(tokens, ctx, TokenType.IDENTIFIER, "Expected identifier", ParserError);
            }).toThrow(ParserError);

            expect(ctx.current).toBe(0); // Should not advance
        });
    });

    describe("skipNewlines", () => {
        test("skips newline tokens", () => {
            const tokens = [
                createToken(TokenType.NEWLINE, "\n", 1, 1),
                createToken(TokenType.NEWLINE, "\n", 2, 1),
                createToken(TokenType.IDENTIFIER, "test", 3, 1),
                createToken(TokenType.EOF, "", 3, 10)
            ];
            const ctx = { current: 0 };

            utils.skipNewlines(tokens, ctx);

            expect(ctx.current).toBe(2);
            expect(tokens[ctx.current].type).toBe(TokenType.IDENTIFIER);
        });

        test("does nothing when no newlines", () => {
            const tokens = [
                createToken(TokenType.IDENTIFIER, "test", 1, 1),
                createToken(TokenType.EOF, "", 1, 10)
            ];
            const ctx = { current: 0 };

            utils.skipNewlines(tokens, ctx);

            expect(ctx.current).toBe(0);
        });
    });
});