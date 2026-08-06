--- compiler/parser/parser-types.js (原始)


+++ compiler/parser/parser-types.js (修改后)
// compiler/parser/parser-types.js
// Type reference parsing for luaScript 2.0

const { TokenType } = require("../token");

class ParserTypesMixin {
    constructor() {
        if (new.target === ParserTypesMixin) {
            throw new TypeError("Cannot construct abstract mixin");
        }
    }

    /**
     * Parse type reference: Identifier
     */
    typeReference() {
        const token = this.consume(
            TokenType.IDENTIFIER,
            "Expected type name."
        );

        return {
            type: "TypeReference",
            name: token.lexeme
        };
    }

    /**
     * Parse parameter list: (param: Type, ...)
     */
    parameterList() {
        this.consume(TokenType.LEFT_PAREN, "Expected '('.");

        const parameters = [];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                parameters.push(this.parameter());
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RIGHT_PAREN, "Expected ')'.");

        return parameters;
    }

    /**
     * Parse single parameter: name: Type
     */
    parameter() {
        const name = this.consume(
            TokenType.IDENTIFIER,
            "Expected parameter name."
        );

        let parameterType = null;

        if (this.match(TokenType.COLON)) {
            parameterType = this.typeReference();
        }

        return {
            type: "Parameter",
            name: name.lexeme,
            parameterType
        };
    }
}

module.exports = { ParserTypesMixin };