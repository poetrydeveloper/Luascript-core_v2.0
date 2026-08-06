--- compiler/parser/index.js (原始)


+++ compiler/parser/index.js (修改后)
// compiler/parser/index.js
// Public API for luaScript 2.0 Parser

const { Parser, ParserError } = require("./parser");

/**
 * Parse tokens into AST
 * @param {Array} tokens - Array of tokens from lexer
 * @returns {Object} AST Program node
 * @throws {ParserError} On parse errors
 */
function parse(tokens) {
    const parser = new Parser(tokens);
    return parser.parse();
}

module.exports = {
    Parser,
    ParserError,
    parse
};