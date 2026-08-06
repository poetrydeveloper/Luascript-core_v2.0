--- tests/unit/parser/parser-error.test.js (原始)


+++ tests/unit/parser/parser-error.test.js (修改后)
// tests/unit/parser/parser-error.test.js
const { ParserError } = require("../../../compiler/parser");

describe("ParserError", () => {
    test("creates error with message only", () => {
        const error = new ParserError("Test error");
        expect(error.name).toBe("ParserError");
        expect(error.code).toBe("LS003");
        expect(error.message).toBe("Test error");
        expect(error.token).toBeNull();
        expect(error.line).toBeNull();
        expect(error.column).toBeNull();
        expect(error.offset).toBeNull();
    });

    test("creates error with token", () => {
        const token = {
            start: { line: 5, column: 10, offset: 50 },
            end: { line: 5, column: 15, offset: 55 }
        };
        const error = new ParserError("Unexpected token", token);

        expect(error.name).toBe("ParserError");
        expect(error.code).toBe("LS003");
        expect(error.message).toBe("Unexpected token");
        expect(error.token).toBe(token);
        expect(error.line).toBe(5);
        expect(error.column).toBe(10);
        expect(error.offset).toBe(50);
    });

    test("handles null token gracefully", () => {
        const error = new ParserError("Error", null);
        expect(error.token).toBeNull();
        expect(error.line).toBeNull();
        expect(error.column).toBeNull();
        expect(error.offset).toBeNull();
    });

    test("handles token without start property", () => {
        const token = { end: { line: 1, column: 1 } };
        const error = new ParserError("Error", token);
        expect(error.line).toBeNull();
        expect(error.column).toBeNull();
        expect(error.offset).toBeNull();
    });
});