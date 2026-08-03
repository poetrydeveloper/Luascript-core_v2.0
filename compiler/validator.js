// compiler/validator.js

"use strict";

const fs = require("fs");
const path = require("path");

const SPEC_PATH = path.join(
    __dirname,
    "../manifest/luas_syntax_spec.json"
);

class ValidationError extends Error {
    constructor(message, node = null, code = "LS004") {
        super(message);

        this.name = "ValidationError";
        this.code = code;
        this.node = node;
    }
}

class Validator {
    constructor(options = {}) {
        this.options = {
            auraProfile: false,
            ...options
        };

        this.errors = [];
        this.warnings = [];

        this.spec = this.loadSpec();

        this.allowedPrimitives = new Set([
            "number",
            "string",
            "boolean",
            "nil"
        ]);

        this.forbiddenTypes = new Set([
            "any",
            "unknown",
            "void"
        ]);

        this.forbiddenKeywords = new Set([
            "const",
            "let",
            "var",
            "interface",
            "try",
            "catch",
            "finally",
            "throw",
            "import",
            "export",
            "typeof"
        ]);
    }

    loadSpec() {
        if (!fs.existsSync(SPEC_PATH)) {
            return null;
        }

        try {
            return JSON.parse(
                fs.readFileSync(SPEC_PATH, "utf8")
            );
        } catch (error) {
            throw new Error(
                `Cannot load luaScript specification: ${error.message}`
            );
        }
    }

    validate(ast) {
        this.errors = [];
        this.warnings = [];

        if (!ast || typeof ast !== "object") {
            this.addError(
                "Validator expects a valid AST.",
                null,
                "LS004"
            );

            return this.result();
        }

        this.visit(ast);

        return this.result();
    }

    result() {
        return {
            valid: this.errors.length === 0,
            errors: [...this.errors],
            warnings: [...this.warnings]
        };
    }

    addError(message, node = null, code = "LS004") {
        this.errors.push(
            new ValidationError(message, node, code)
        );
    }

    addWarning(message, node = null) {
        this.warnings.push({
            code: "LSW001",
            message,
            node
        });
    }

    visit(node) {
        if (!node || typeof node !== "object") {
            return;
        }

        switch (node.type) {
            case "Program":
                this.validateProgram(node);
                break;

            case "ClassDeclaration":
                this.validateClass(node);
                break;

            case "ConstructorDeclaration":
                this.validateConstructor(node);
                break;

            case "MethodDeclaration":
                this.validateMethod(node);
                break;

            case "StructDeclaration":
                this.validateStruct(node);
                break;

            case "VariableDeclaration":
                this.validateVariable(node);
                break;

            case "Parameter":
                this.validateParameter(node);
                break;

            case "TypeReference":
                this.validateTypeReference(node);
                break;

            default:
                this.visitChildren(node);
                break;
        }
    }

    visitChildren(node) {
        for (const key of Object.keys(node)) {
            if (
                key === "location" ||
                key === "type"
            ) {
                continue;
            }

            const value = node[key];

            if (Array.isArray(value)) {
                for (const child of value) {
                    if (child && typeof child === "object") {
                        this.visit(child);
                    }
                }
            } else if (
                value &&
                typeof value === "object"
            ) {
                this.visit(value);
            }
        }
    }

    validateProgram(node) {
        if (!Array.isArray(node.declarations)) {
            this.addError(
                "Program must contain declarations.",
                node
            );

            return;
        }

        for (const declaration of node.declarations) {
            this.visit(declaration);
        }
    }

    validateClass(node) {
        if (!this.isIdentifier(node.name)) {
            this.addError(
                `Invalid class name '${node.name}'.`,
                node,
                "LS005"
            );
        }

        if (!this.isIdentifier(node.extends)) {
            this.addError(
                `Invalid parent class '${node.extends}'.`,
                node,
                "LS005"
            );
        }

        if (
            node.extends === "MatterSystem" &&
            !this.options.auraProfile
        ) {
            this.addWarning(
                "Class extends MatterSystem while Aura profile is disabled.",
                node
            );
        }

        if (!Array.isArray(node.members)) {
            this.addError(
                "Class must contain members.",
                node
            );

            return;
        }

        for (const member of node.members) {
            this.visit(member);
        }
    }

    validateConstructor(node) {
        if (!Array.isArray(node.parameters)) {
            this.addError(
                "Constructor parameters must be an array.",
                node
            );
        } else {
            for (const parameter of node.parameters) {
                this.validateParameter(parameter);
            }
        }

        this.validateBody(node.body, node);
    }

    validateMethod(node) {
        if (
            node.visibility !== "public" &&
            node.visibility !== "private"
        ) {
            this.addError(
                `Invalid method visibility '${node.visibility}'.`,
                node,
                "LS006"
            );
        }

        if (!this.isIdentifier(node.name)) {
            this.addError(
                `Invalid method name '${node.name}'.`,
                node,
                "LS005"
            );
        }

        if (!Array.isArray(node.parameters)) {
            this.addError(
                "Method parameters must be an array.",
                node
            );
        } else {
            for (const parameter of node.parameters) {
                this.validateParameter(parameter);
            }
        }

        if (node.returnType) {
            this.validateTypeReference(
                node.returnType
            );
        }

        this.validateBody(node.body, node);
    }

    validateStruct(node) {
        if (!this.isIdentifier(node.name)) {
            this.addError(
                `Invalid struct name '${node.name}'.`,
                node,
                "LS005"
            );
        }

        if (!Array.isArray(node.fields)) {
            this.addError(
                "Struct fields must be an array.",
                node
            );

            return;
        }

        for (const field of node.fields) {
            this.visit(field);
        }
    }

    validateVariable(node) {
        if (!this.isIdentifier(node.name)) {
            this.addError(
                `Invalid variable name '${node.name}'.`,
                node,
                "LS005"
            );
        }

        if (node.mutable === true) {
            return;
        }

        if (
            node.kind === "mut" ||
            node.mut === true
        ) {
            return;
        }

        if (
            node.reassigned === true ||
            node.writes > 0
        ) {
            this.addError(
                `Variable '${node.name}' is immutable. Use 'mut' for mutable variables.`,
                node,
                "LS007"
            );
        }
    }

    validateParameter(node) {
        if (!node || !node.name) {
            this.addError(
                "Parameter must have a name.",
                node,
                "LS005"
            );

            return;
        }

        if (node.typeAnnotation) {
            this.validateTypeReference(
                node.typeAnnotation
            );
        }

        if (node.parameterType) {
            this.validateTypeReference(
                node.parameterType
            );
        }
    }

    validateTypeReference(node) {
        if (!node) {
            return;
        }

        const name =
            node.name ||
            node.typeName ||
            node.value;

        if (!name) {
            this.addError(
                "Type reference must have a name.",
                node,
                "LS008"
            );

            return;
        }

        if (this.forbiddenTypes.has(name)) {
            this.addError(
                `Type '${name}' is forbidden in luaScript 2.0.`,
                node,
                "LS009"
            );

            return;
        }

        if (this.allowedPrimitives.has(name)) {
            return;
        }

        if (
            name.includes("<") ||
            name.includes(">") ||
            node.typeArguments ||
            node.genericArguments
        ) {
            this.addError(
                `Generic types are not supported in luaScript 2.0: '${name}'.`,
                node,
                "LS010"
            );

            return;
        }

        if (
            name === "any" ||
            name === "unknown"
        ) {
            this.addError(
                `Unsafe type '${name}' is forbidden.`,
                node,
                "LS009"
            );
        }
    }

    validateBody(body, owner) {
        if (!body) {
            this.addError(
                "Declaration must contain a body.",
                owner,
                "LS011"
            );

            return;
        }

        if (!Array.isArray(body)) {
            this.visit(body);
            return;
        }

        for (const statement of body) {
            this.visit(statement);
        }
    }

    isIdentifier(value) {
        return (
            typeof value === "string" &&
            /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
        );
    }
}

module.exports = {
    Validator,
    ValidationError
};