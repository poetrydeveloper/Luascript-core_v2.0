--- compiler/parser/parser.js (原始)


+++ compiler/parser/parser.js (修改后)
// compiler/parser/parser.js
// Main Parser class for luaScript 2.0
// Composed from mixins for modularity

const { TokenType } = require("../token");
const { ParserError } = require("./parser-error");
const {
    locationFrom,
    skipNewlines,
    isAtEnd,
    peek,
    previous,
    advance,
    check,
    match,
    consume
} = require("./parser-utils");
const { ParserDeclarationsMixin } = require("./parser-declarations");
const { ParserStatementsMixin } = require("./parser-statements");
const { ParserExpressionsMixin } = require("./parser-expressions");
const { ParserTypesMixin } = require("./parser-types");

// Compose all mixins into base Parser class
class ParserBase {
    constructor(tokens) {
        if (!Array.isArray(tokens)) {
            throw new TypeError(
                "Parser expects an array of tokens."
            );
        }

        this.tokens = tokens;
        this.current = 0;
    }

    // Delegate to utils with bound context
    locationFrom(token) {
        return locationFrom(token);
    }

    skipNewlines() {
        skipNewlines(this.tokens, this);
    }

    isAtEnd() {
        return isAtEnd(this.tokens, this.current);
    }

    peek() {
        return peek(this.tokens, this.current);
    }

    previous() {
        return previous(this.tokens, this.current);
    }

    advance() {
        return advance(this.tokens, this);
    }

    check(type) {
        return check(this.tokens, this.current, type);
    }

    match(...types) {
        return match(this.tokens, this, ...types);
    }

    consume(type, message) {
        return consume(this.tokens, this, type, message, ParserError);
    }

    error(token, message) {
        return new ParserError(message, token);
    }
}

// Apply mixins
class Parser extends ParserBase {}

Object.assign(Parser.prototype, ParserDeclarationsMixin.prototype);
Object.assign(Parser.prototype, ParserStatementsMixin.prototype);
Object.assign(Parser.prototype, ParserExpressionsMixin.prototype);
Object.assign(Parser.prototype, ParserTypesMixin.prototype);

/**
 * Parse program: declarations + termination
 */
Parser.prototype.parse = function() {
    const declarations = [];

    this.skipNewlines();

    while (
        !this.check(TokenType.TERMINATION) &&
        !this.isAtEnd()
    ) {
        declarations.push(this.declaration());
        this.skipNewlines();
    }

    this.consume(
        TokenType.TERMINATION,
        "Expected '# AURA_END' at end of file."
    );

    this.skipNewlines();

    this.consume(
        TokenType.EOF,
        "Expected end of file."
    );

    return {
        type: "Program",
        declarations
    };
};

module.exports = { Parser, ParserError };