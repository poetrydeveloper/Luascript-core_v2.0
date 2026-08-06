--- compiler/parser/parser-statements.js (原始)


+++ compiler/parser/parser-statements.js (修改后)
// compiler/parser/parser-statements.js
// Statement parsing for luaScript 2.0 (if, for, local, return)

const { TokenType } = require("../token");

class ParserStatementsMixin {
    constructor() {
        if (new.target === ParserStatementsMixin) {
            throw new TypeError("Cannot construct abstract mixin");
        }
    }

    /**
     * Parse block body until terminators
     */
    blockBody(...terminators) {
        const statements = [];

        this.skipNewlines();

        while (
            !this.isAtEnd() &&
            !terminators.some(type => this.check(type))
        ) {
            statements.push(this.statement());
            this.skipNewlines();
        }

        return statements;
    }

    /**
     * Parse single statement
     */
    statement() {
        if (this.check(TokenType.LOCAL)) {
            return this.localDeclaration();
        }

        if (this.check(TokenType.RETURN)) {
            return this.returnStatement();
        }

        if (this.check(TokenType.IF)) {
            return this.ifStatement();
        }

        if (this.check(TokenType.FOR)) {
            return this.forStatement();
        }

        if (this.check(TokenType.BREAK)) {
            const token = this.advance();
            return {
                type: "BreakStatement",
                location: this.locationFrom(token)
            };
        }

        if (this.check(TokenType.SUPER)) {
            return {
                type: "ExpressionStatement",
                expression: this.superCall()
            };
        }

        return this.expressionStatement();
    }

    /**
     * Parse local declaration: local mut name: Type = value
     */
    localDeclaration() {
        const token = this.consume(
            TokenType.LOCAL,
            "Expected 'local'."
        );

        const mutable = this.match(TokenType.MUT);

        const declarations = [];

        do {
            const name = this.consume(
                TokenType.IDENTIFIER,
                "Expected variable name after 'local'."
            );

            let variableType = null;

            if (this.match(TokenType.COLON)) {
                variableType = this.typeReference();
            }

            declarations.push({
                name: name.lexeme,
                mutable,
                variableType
            });
        } while (this.match(TokenType.COMMA));

        let initializer = null;

        if (this.match(TokenType.ASSIGN)) {
            const values = [];

            do {
                values.push(this.expression());
            } while (this.match(TokenType.COMMA));

            initializer = values;
        }

        return {
            type: "VariableDeclaration",
            declarations,
            initializer,
            location: this.locationFrom(token)
        };
    }

    /**
     * Parse return statement: return value
     */
    returnStatement() {
        const token = this.consume(
            TokenType.RETURN,
            "Expected 'return'."
        );

        let value = null;

        if (
            !this.check(TokenType.NEWLINE) &&
            !this.check(TokenType.END) &&
            !this.check(TokenType.ELSE) &&
            !this.check(TokenType.ELSEIF) &&
            !this.check(TokenType.EOF)
        ) {
            value = this.expression();
        }

        return {
            type: "ReturnStatement",
            value,
            location: this.locationFrom(token)
        };
    }

    /**
     * Parse if statement: if condition then ... elseif ... else ... end
     */
    ifStatement() {
        const token = this.consume(
            TokenType.IF,
            "Expected 'if'."
        );

        const condition = this.expression();

        this.consume(
            TokenType.THEN,
            "Expected 'then' after if condition."
        );

        const consequent = this.blockBody(
            TokenType.ELSEIF,
            TokenType.ELSE,
            TokenType.END
        );

        this.skipNewlines();

        const elseIfClauses = [];

        while (this.match(TokenType.ELSEIF)) {
            const elseifToken = this.previous();

            const elseifCondition = this.expression();

            this.consume(
                TokenType.THEN,
                "Expected 'then' after elseif condition."
            );

            const elseifBody = this.blockBody(
                TokenType.ELSEIF,
                TokenType.ELSE,
                TokenType.END
            );

            elseIfClauses.push({
                type: "ElseIfClause",
                condition: elseifCondition,
                consequent: elseifBody,
                location: this.locationFrom(elseifToken)
            });

            this.skipNewlines();
        }

        let alternate = null;

        if (this.match(TokenType.ELSE)) {
            alternate = this.blockBody(TokenType.END);
        }

        this.consume(
            TokenType.END,
            "Expected 'end' after if statement."
        );

        return {
            type: "IfStatement",
            condition,
            consequent,
            elseIfClauses,
            alternate,
            location: this.locationFrom(token)
        };
    }

    /**
     * Parse for-in statement: for var: Type in iterable do ... end
     */
    forStatement() {
        const token = this.consume(
            TokenType.FOR,
            "Expected 'for'."
        );

        const variables = [];

        do {
            const name = this.consume(
                TokenType.IDENTIFIER,
                "Expected iterator variable."
            );

            let variableType = null;

            if (this.match(TokenType.COLON)) {
                variableType = this.typeReference();
            }

            variables.push({
                name: name.lexeme,
                variableType
            });
        } while (this.match(TokenType.COMMA));

        this.consume(
            TokenType.IN,
            "Expected 'in' in for loop."
        );

        const iterable = this.expression();

        this.consume(
            TokenType.DO,
            "Expected 'do' after for loop."
        );

        const body = this.blockBody(TokenType.END);

        this.consume(
            TokenType.END,
            "Expected 'end' after for loop body."
        );

        return {
            type: "ForInStatement",
            variables,
            iterable,
            body,
            location: this.locationFrom(token)
        };
    }

    /**
     * Parse expression statement or assignment
     */
    expressionStatement() {
        const expression = this.expression();

        // Check for assignment: expr = value
        if (this.match(TokenType.ASSIGN)) {
            const value = this.expression();
            return {
                type: "AssignmentStatement",
                target: expression,
                value,
                location: this.locationFrom(this.previous())
            };
        }

        return {
            type: "ExpressionStatement",
            expression,
            location: this.locationFrom(this.previous())
        };
    }
}

module.exports = { ParserStatementsMixin };