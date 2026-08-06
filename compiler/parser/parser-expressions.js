--- compiler/parser/parser-expressions.js (原始)


+++ compiler/parser/parser-expressions.js (修改后)
// compiler/parser/parser-expressions.js
// Expression parsing for luaScript 2.0 (precedence climbing)

const { TokenType } = require("../token");

class ParserExpressionsMixin {
    constructor() {
        if (new.target === ParserExpressionsMixin) {
            throw new TypeError("Cannot construct abstract mixin");
        }
    }

    /**
     * Parse expression with precedence climbing
     */
    expression() {
        return this.logicalOr();
    }

    /**
     * logical_or = logical_and ( 'or' logical_and )*
     */
    logicalOr() {
        let expr = this.logicalAnd();

        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.logicalAnd();
            expr = {
                type: "BinaryExpression",
                operator: "or",
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * logical_and = equality ( 'and' equality )*
     */
    logicalAnd() {
        let expr = this.equality();

        while (this.match(TokenType.AND)) {
            const operator = this.previous();
            const right = this.equality();
            expr = {
                type: "BinaryExpression",
                operator: "and",
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * equality = comparison ( ( '==' | '~=' ) comparison )*
     */
    equality() {
        let expr = this.comparison();

        while (this.match(TokenType.EQ_EQ, TokenType.TILDE_EQ)) {
            const operator = this.previous();
            const op = operator.type === TokenType.EQ_EQ ? "==" : "~=";
            const right = this.comparison();
            expr = {
                type: "BinaryExpression",
                operator: op,
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * comparison = term ( ( '>' | '<' | '>=' | '<=' ) term )*
     */
    comparison() {
        let expr = this.term();

        while (
            this.match(
                TokenType.GREATER,
                TokenType.LESS,
                TokenType.GREATER_EQ,
                TokenType.LESS_EQ
            )
        ) {
            const operator = this.previous();
            const op = operator.lexeme;
            const right = this.term();
            expr = {
                type: "BinaryExpression",
                operator: op,
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * term = factor ( ( '-' | '+' ) factor )*
     */
    term() {
        let expr = this.factor();

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous();
            const op = operator.lexeme;
            const right = this.factor();
            expr = {
                type: "BinaryExpression",
                operator: op,
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * factor = power ( ( '*' | '/' | '%' ) power )*
     */
    factor() {
        let expr = this.power();

        while (
            this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)
        ) {
            const operator = this.previous();
            const op = operator.lexeme;
            const right = this.power();
            expr = {
                type: "BinaryExpression",
                operator: op,
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * power = unary ( '^' power )*  (right associative)
     */
    power() {
        let expr = this.unary();

        if (this.match(TokenType.CARET)) {
            const operator = this.previous();
            const right = this.power(); // Right associative
            expr = {
                type: "BinaryExpression",
                operator: "^",
                left: expr,
                right,
                location: this.locationFrom(operator)
            };
        }

        return expr;
    }

    /**
     * unary = ( '-' | 'not' | '#' ) unary | call
     */
    unary() {
        if (
            this.match(TokenType.MINUS, TokenType.NOT, TokenType.HASH)
        ) {
            const operator = this.previous();
            const operand = this.unary();
            return {
                type: "UnaryExpression",
                operator: operator.lexeme,
                operand,
                location: this.locationFrom(operator)
            };
        }

        return this.call();
    }

    /**
     * call = primary ( '.' IDENTIFIER '(' args ')' | ':' IDENTIFIER '(' args ')' | '[' expr ']' )*
     */
    call() {
        let expr = this.primary();

        while (true) {
            if (this.match(TokenType.DOT)) {
                const name = this.consume(
                    TokenType.IDENTIFIER,
                    "Expected property name after '.'."
                );
                expr = {
                    type: "MemberExpression",
                    object: expr,
                    property: name.lexeme,
                    computed: false,
                    location: this.locationFrom(name)
                };
            } else if (this.match(TokenType.LEFT_BRACKET)) {
                const index = this.expression();
                this.consume(
                    TokenType.RIGHT_BRACKET,
                    "Expected ']' after index expression."
                );
                expr = {
                    type: "MemberExpression",
                    object: expr,
                    property: index,
                    computed: true,
                    location: this.locationFrom(this.previous())
                };
            } else if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else if (this.match(TokenType.COLON)) {
                const name = this.consume(
                    TokenType.IDENTIFIER,
                    "Expected method name after ':'."
                );
                this.consume(
                    TokenType.LEFT_PAREN,
                    "Expected '(' after method name."
                );
                const callExpr = this.finishCall({
                    type: "MemberExpression",
                    object: expr,
                    property: name.lexeme,
                    computed: false,
                    location: this.locationFrom(name)
                });
                // Mark as method call
                callExpr.isMethodCall = true;
                expr = callExpr;
            } else {
                break;
            }
        }

        return expr;
    }

    /**
     * Finish call expression: (args)
     */
    finishCall(callee) {
        const argumentsList = [];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                argumentsList.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }

        const closeParen = this.consume(
            TokenType.RIGHT_PAREN,
            "Expected ')' after arguments."
        );

        return {
            type: "CallExpression",
            callee,
            arguments: argumentsList,
            location: this.locationFrom(closeParen)
        };
    }

    /**
     * primary = NUMBER | STRING | true | false | nil | self | IDENTIFIER | '(' expr ')' | table | super
     */
    primary() {
        if (this.match(TokenType.NUMBER)) {
            const token = this.previous();
            return {
                type: "NumericLiteral",
                value: parseFloat(token.lexeme),
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.STRING)) {
            const token = this.previous();
            // Remove quotes
            const value = token.lexeme.slice(1, -1);
            return {
                type: "StringLiteral",
                value,
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.TRUE)) {
            const token = this.previous();
            return {
                type: "BooleanLiteral",
                value: true,
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.FALSE)) {
            const token = this.previous();
            return {
                type: "BooleanLiteral",
                value: false,
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.NIL)) {
            const token = this.previous();
            return {
                type: "NilLiteral",
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.SELF)) {
            const token = this.previous();
            return {
                type: "SelfExpression",
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.IDENTIFIER)) {
            const token = this.previous();
            return {
                type: "Identifier",
                name: token.lexeme,
                location: this.locationFrom(token)
            };
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression();
            this.consume(
                TokenType.RIGHT_PAREN,
                "Expected ')' after expression."
            );
            return {
                type: "ParenthesizedExpression",
                expression: expr,
                location: this.locationFrom(this.previous())
            };
        }

        if (this.match(TokenType.LEFT_BRACE)) {
            return this.tableLiteral();
        }

        if (this.match(TokenType.SUPER)) {
            return this.superCall();
        }

        throw this.error(
            this.peek(),
            "Expected expression."
        );
    }

    /**
     * table literal: { field = value, ... } or { key = value, ... }
     */
    tableLiteral() {
        const fields = [];
        const openBrace = this.previous();

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            this.skipNewlines();

            if (this.check(TokenType.RIGHT_BRACE)) {
                break;
            }

            // field = value OR [expr] = value OR value
            if (this.check(TokenType.IDENTIFIER)) {
                const lookahead = this.tokens[this.current + 1];
                if (lookahead && lookahead.type === TokenType.ASSIGN) {
                    // field = value
                    const name = this.advance();
                    this.consume(
                        TokenType.ASSIGN,
                        "Expected '=' after field name."
                    );
                    const value = this.expression();
                    fields.push({
                        type: "TableField",
                        kind: "named",
                        key: name.lexeme,
                        value
                    });
                } else {
                    // value (array element)
                    fields.push({
                        type: "TableField",
                        kind: "array",
                        value: this.expression()
                    });
                }
            } else if (this.match(TokenType.LEFT_BRACKET)) {
                // [expr] = value
                const key = this.expression();
                this.consume(
                    TokenType.RIGHT_BRACKET,
                    "Expected ']' after key."
                );
                this.consume(
                    TokenType.ASSIGN,
                    "Expected '=' after key."
                );
                const value = this.expression();
                fields.push({
                    type: "TableField",
                    kind: "indexed",
                    key,
                    value
                });
            } else {
                // value (array element)
                fields.push({
                    type: "TableField",
                    kind: "array",
                    value: this.expression()
                });
            }

            // Comma or newline separator
            if (!this.match(TokenType.COMMA) && !this.match(TokenType.NEWLINE)) {
                break;
            }
        }

        this.consume(
            TokenType.RIGHT_BRACE,
            "Expected '}' after table literal."
        );

        return {
            type: "TableLiteral",
            fields,
            location: {
                start: this.locationFrom(openBrace)?.start,
                end: this.locationFrom(this.previous())?.end
            }
        };
    }

    /**
     * super(...) call
     */
    superCall() {
        const token = this.consume(
            TokenType.SUPER,
            "Expected 'super'."
        );

        this.consume(
            TokenType.LEFT_PAREN,
            "Expected '(' after 'super'."
        );

        const argumentsList = [];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                argumentsList.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }

        this.consume(
            TokenType.RIGHT_PAREN,
            "Expected ')' after super arguments."
        );

        return {
            type: "SuperCall",
            arguments: argumentsList,
            location: this.locationFrom(token)
        };
    }
}

module.exports = { ParserExpressionsMixin };