--- compiler/parser/parser-declarations.js (原始)


+++ compiler/parser/parser-declarations.js (修改后)
// compiler/parser/parser-declarations.js
// Class, struct, and decorator parsing for luaScript 2.0

const { TokenType } = require("../token");

class ParserDeclarationsMixin {
    constructor() {
        if (new.target === ParserDeclarationsMixin) {
            throw new TypeError("Cannot construct abstract mixin");
        }
    }

    /**
     * Parse top-level declaration
     */
    declaration() {
        this.skipNewlines();

        if (this.check(TokenType.CLASS)) {
            return this.classDeclaration();
        }

        if (this.check(TokenType.STRUCT)) {
            return this.structDeclaration();
        }

        if (this.check(TokenType.AT)) {
            return this.decoratorDeclaration();
        }

        throw this.error(
            this.peek(),
            "Expected class, struct, or decorator declaration."
        );
    }

    /**
     * Parse decorator: @DecoratorName(args)
     */
    decoratorDeclaration() {
        const decorators = [];

        while (this.match(TokenType.AT)) {
            const name = this.consume(
                TokenType.IDENTIFIER,
                "Expected decorator name after '@'."
            );

            const argumentsList = [];

            if (this.match(TokenType.LEFT_PAREN)) {
                if (!this.check(TokenType.RIGHT_PAREN)) {
                    do {
                        argumentsList.push(this.expression());
                    } while (this.match(TokenType.COMMA));
                }

                this.consume(
                    TokenType.RIGHT_PAREN,
                    "Expected ')' after decorator arguments."
                );
            }

            decorators.push({
                type: "Decorator",
                name: name.lexeme,
                arguments: argumentsList
            });

            this.skipNewlines();
        }

        return {
            type: "DecoratorGroup",
            decorators
        };
    }

    /**
     * Parse class: class Name extends Parent do ... end
     */
    classDeclaration() {
        const classToken = this.consume(
            TokenType.CLASS,
            "Expected 'class'."
        );

        const name = this.consume(
            TokenType.IDENTIFIER,
            "Expected class name."
        );

        this.consume(
            TokenType.EXTENDS,
            "Expected 'extends' after class name."
        );

        const parent = this.consume(
            TokenType.IDENTIFIER,
            "Expected parent class name."
        );

        this.consume(
            TokenType.DO,
            "Expected 'do' after class declaration."
        );

        this.skipNewlines();

        const members = [];

        while (
            !this.check(TokenType.END) &&
            !this.isAtEnd()
        ) {
            members.push(this.classMember());
            this.skipNewlines();
        }

        this.consume(
            TokenType.END,
            "Expected 'end' after class body."
        );

        return {
            type: "ClassDeclaration",
            name: name.lexeme,
            extends: parent.lexeme,
            members,
            location: this.locationFrom(classToken)
        };
    }

    /**
     * Parse class member: field, method, or constructor
     */
    classMember() {
        if (this.check(TokenType.CONSTRUCTOR)) {
            return this.constructorDeclaration();
        }

        if (
            this.check(TokenType.PUBLIC) ||
            this.check(TokenType.PRIVATE)
        ) {
            const visibilityIndex = this.current;
            const first = this.tokens[visibilityIndex + 1];
            const second = this.tokens[visibilityIndex + 2];

            // public mut field: Type
            // private mut field: Type
            if (
                first &&
                first.type === TokenType.MUT &&
                second &&
                second.type === TokenType.IDENTIFIER
            ) {
                return this.fieldDeclaration();
            }

            // public field: Type
            // private field: Type
            if (
                first &&
                first.type === TokenType.IDENTIFIER &&
                second &&
                second.type === TokenType.COLON
            ) {
                return this.fieldDeclaration();
            }

            // Otherwise this is a method.
            return this.methodDeclaration();
        }

        throw this.error(
            this.peek(),
            "Expected constructor, field, or method in class body."
        );
    }

    /**
     * Parse field: public mut name: Type = value
     */
    fieldDeclaration() {
        const visibilityToken = this.advance();

        const visibility =
            visibilityToken.type === TokenType.PUBLIC
                ? "public"
                : "private";

        const mutable = this.match(TokenType.MUT);

        const name = this.consume(
            TokenType.IDENTIFIER,
            `Expected field name after '${visibility}'.`
        );

        this.consume(
            TokenType.COLON,
            "Expected ':' after field name."
        );

        const fieldType = this.typeReference();

        let initializer = null;

        if (this.match(TokenType.ASSIGN)) {
            initializer = this.expression();
        }

        return {
            type: "FieldDeclaration",
            visibility,
            mutable,
            name: name.lexeme,
            fieldType,
            initializer,
            location: this.locationFrom(visibilityToken)
        };
    }

    /**
     * Parse constructor: constructor(params) do ... end
     */
    constructorDeclaration() {
        const constructorToken = this.consume(
            TokenType.CONSTRUCTOR,
            "Expected 'constructor'."
        );

        const parameters = this.parameterList();

        this.consume(
            TokenType.DO,
            "Expected 'do' after constructor declaration."
        );

        const body = this.blockBody(TokenType.END);

        this.consume(
            TokenType.END,
            "Expected 'end' after constructor body."
        );

        return {
            type: "ConstructorDeclaration",
            parameters,
            body,
            location: this.locationFrom(constructorToken)
        };
    }

    /**
     * Parse method: public name(params): ReturnType do ... end
     */
    methodDeclaration() {
        const visibilityToken = this.advance();

        const visibility =
            visibilityToken.type === TokenType.PUBLIC
                ? "public"
                : "private";

        const name = this.consume(
            TokenType.IDENTIFIER,
            `Expected method name after '${visibility}'.`
        );

        const parameters = this.parameterList();

        let returnType = null;

        if (this.match(TokenType.COLON)) {
            returnType = this.typeReference();
        }

        this.consume(
            TokenType.DO,
            "Expected 'do' after method declaration."
        );

        const body = this.blockBody(TokenType.END);

        this.consume(
            TokenType.END,
            "Expected 'end' after method body."
        );

        return {
            type: "MethodDeclaration",
            visibility,
            name: name.lexeme,
            parameters,
            returnType,
            body,
            location: this.locationFrom(visibilityToken)
        };
    }

    /**
     * Parse struct: struct Name do ... end
     */
    structDeclaration() {
        const structToken = this.consume(
            TokenType.STRUCT,
            "Expected 'struct'."
        );

        const name = this.consume(
            TokenType.IDENTIFIER,
            "Expected struct name."
        );

        this.consume(
            TokenType.DO,
            "Expected 'do' after struct declaration."
        );

        this.skipNewlines();

        const fields = [];

        while (
            !this.check(TokenType.END) &&
            !this.isAtEnd()
        ) {
            fields.push(this.structField());
            this.skipNewlines();
        }

        this.consume(
            TokenType.END,
            "Expected 'end' after struct body."
        );

        return {
            type: "StructDeclaration",
            name: name.lexeme,
            fields,
            location: this.locationFrom(structToken)
        };
    }

    /**
     * Parse struct field: name: Type
     */
    structField() {
        const name = this.consume(
            TokenType.IDENTIFIER,
            "Expected field name."
        );

        this.consume(
            TokenType.COLON,
            "Expected ':' after field name."
        );

        const fieldType = this.typeReference();

        return {
            type: "StructField",
            name: name.lexeme,
            fieldType
        };
    }
}

module.exports = { ParserDeclarationsMixin };