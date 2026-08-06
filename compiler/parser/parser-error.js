--- compiler/parser/parser-error.js (原始)


+++ compiler/parser/parser-error.js (修改后)
// compiler/parser/parser-error.js
// ParserError class for luaScript 2.0

class ParserError extends Error {
    constructor(message, token = null) {
        super(message);
        this.name = "ParserError";
        this.code = "LS003";
        this.token = token;

        this.line = token?.start?.line ?? null;
        this.column = token?.start?.column ?? null;
        this.offset = token?.start?.offset ?? null;
    }
}

module.exports = { ParserError };