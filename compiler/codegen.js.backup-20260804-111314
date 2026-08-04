// compiler/codegen.js

class CodegenError extends Error {
    constructor(message, node = null) {
        super(message);
        this.name = "CodegenError";
        this.code = "LS004";
        this.node = node;
    }
}

class CodeGenerator {
    constructor() {
        this.lines = [];
        this.indentLevel = 0;
    }

    generate(ast) {
        if (!ast || ast.type !== "Program") {
            throw new CodegenError("Expected Program AST.", ast);
        }

        this.lines = [];
        this.indentLevel = 0;

        for (const declaration of ast.declarations || []) {
            this.emitDeclaration(declaration);
        }

        return this.lines.join("\n");
    }

    emitDeclaration(node) {
        if (!node) {
            return;
        }

        switch (node.type) {
            case "ClassDeclaration":
                this.emitClass(node);
                break;

            case "StructDeclaration":
                this.emitStruct(node);
                break;

            case "DecoratorGroup":
                this.emitDecoratorGroup(node);
                break;

            default:
                throw new CodegenError(
                    `Unsupported declaration: ${node.type}`,
                    node
                );
        }
    }

    emitDecoratorGroup(node) {
        for (const decorator of node.decorators || []) {
            this.write(`-- @${decorator.name}`);
        }
    }

    emitClass(node) {
        this.write(`local ${node.name} = {}`);
        this.write(`${node.name}.__index = ${node.name}`);
        this.write("");

        for (const member of node.members || []) {
            switch (member.type) {
                case "FieldDeclaration":
                    this.emitField(node, member);
                    break;

                case "ConstructorDeclaration":
                    this.emitConstructor(node, member);
                    break;

                case "MethodDeclaration":
                    this.emitMethod(node, member);
                    break;

                default:
                    throw new CodegenError(
                        `Unsupported class member: ${member.type}`,
                        member
                    );
            }

            this.write("");
        }
    }

    emitField(classNode, node) {
        const name = node.name;

        if (!name) {
            throw new CodegenError(
                "FieldDeclaration has no name.",
                node
            );
        }

        if (
            node.initializer === null ||
            node.initializer === undefined
        ) {
            return;
        }

        const value = this.emitExpression(node.initializer);

        this.write(
            `${classNode.name}.${name} = ${value}`
        );
    }

    emitConstructor(classNode, node) {
        const parameters = (node.parameters || [])
            .map(parameter => parameter.name)
            .join(", ");

        this.write(
            `function ${classNode.name}.new(${parameters})`
        );

        this.indent();

        this.write(
            `local self = setmetatable({}, ${classNode.name})`
        );

        this.emitBody(node.body);

        this.write("return self");

        this.dedent();

        this.write("end");
    }

    emitMethod(classNode, node) {
        const parameters = (node.parameters || [])
            .map(parameter => parameter.name)
            .join(", ");

        const args = parameters.length > 0
            ? `self, ${parameters}`
            : "self";

        if (node.visibility === "private") {
            this.write(
                `local function ${node.name}(${args})`
            );
        } else {
            this.write(
                `function ${classNode.name}.${node.name}(${args})`
            );
        }

        this.indent();

        this.emitBody(node.body);

        this.dedent();

        this.write("end");
    }

    emitStruct(node) {
        this.write(`type ${node.name} = {`);

        this.indent();

        for (const field of node.fields || []) {
            const fieldType = this.emitType(field.fieldType);

            this.write(
                `${field.name}: ${fieldType},`
            );
        }

        this.dedent();

        this.write("}");
    }

    emitBody(body) {
        if (!body) {
            return;
        }

        for (const statement of body) {
            this.emitStatement(statement);
        }
    }

    emitStatement(node) {
        if (!node) {
            return;
        }

        switch (node.type) {
            case "ExpressionStatement":
                this.write(
                    this.emitExpression(node.expression)
                );
                break;

            case "VariableDeclaration":
                this.emitVariableDeclaration(node);
                break;

            case "AssignmentStatement":
                this.emitAssignment(node);
                break;

            case "IfStatement":
                this.emitIf(node);
                break;

            case "ReturnStatement":
                this.emitReturn(node);
                break;

            case "BreakStatement":
                this.write("break");
                break;

            case "WhileStatement":
                this.emitWhile(node);
                break;

            case "ForStatement":
                this.emitFor(node);
                break;

            default:
                throw new CodegenError(
                    `Unsupported statement: ${node.type}`,
                    node
                );
        }
    }

    emitVariableDeclaration(node) {
        const declarations = node.declarations || [];

        if (declarations.length === 0) {
            throw new CodegenError(
                "VariableDeclaration contains no declarations.",
                node
            );
        }

        const names = declarations
            .map(declaration => declaration.name)
            .join(", ");

        let output = `local ${names}`;

        if (
            node.initializer !== null &&
            node.initializer !== undefined
        ) {
            const initializers = Array.isArray(node.initializer)
                ? node.initializer
                : [node.initializer];

            const values = initializers
                .map(expression => this.emitExpression(expression))
                .join(", ");

            output += ` = ${values}`;
        }

        this.write(output);
    }

    emitAssignment(node) {
        const target = this.emitExpression(node.target);
        const value = this.emitExpression(node.value);

        this.write(
            `${target} = ${value}`
        );
    }

    emitIf(node) {
        this.write(
            `if ${this.emitExpression(node.condition)} then`
        );

        this.indent();

        this.emitBody(node.thenBranch);

        this.dedent();

        if (node.elseBranch) {
            this.write("else");

            this.indent();

            this.emitBody(node.elseBranch);

            this.dedent();
        }

        this.write("end");
    }

    emitWhile(node) {
        this.write(
            `while ${this.emitExpression(node.condition)} do`
        );

        this.indent();

        this.emitBody(node.body);

        this.dedent();

        this.write("end");
    }

    emitFor(node) {
        if (node.kind === "numeric") {
            const initializer = this.emitExpression(node.initializer);
            const limit = this.emitExpression(node.limit);

            let line = `for ${node.variable} = ${initializer}, ${limit}`;

            if (node.step) {
                line += `, ${this.emitExpression(node.step)}`;
            }

            line += " do";

            this.write(line);

            this.indent();

            this.emitBody(node.body);

            this.dedent();

            this.write("end");

            return;
        }

        if (
            node.kind === "generic" ||
            node.kind === "in"
        ) {
            const variable = node.variable || node.name;

            const iterable =
                node.iterable ||
                node.expression ||
                node.collection;

            if (!variable || !iterable) {
                throw new CodegenError(
                    "Invalid generic for statement.",
                    node
                );
            }

            this.write(
                `for ${variable} in ${this.emitExpression(iterable)} do`
            );

            this.indent();

            this.emitBody(node.body);

            this.dedent();

            this.write("end");

            return;
        }

        throw new CodegenError(
            "Unsupported for-loop form.",
            node
        );
    }

    emitReturn(node) {
        if (
            node.value === null ||
            node.value === undefined
        ) {
            this.write("return");
            return;
        }

        this.write(
            `return ${this.emitExpression(node.value)}`
        );
    }

    emitExpression(node) {
        if (!node) {
            throw new CodegenError(
                "Cannot generate empty expression.",
                node
            );
        }

        switch (node.type) {
            case "Literal":
                return this.emitLiteral(node.value);

            case "Identifier":
                return node.name;

            case "UnaryExpression":
                return this.emitUnary(node);

            case "BinaryExpression":
                return this.emitBinary(node);

            case "CallExpression":
                return this.emitCall(node);

            case "MemberExpression":
                return this.emitMember(node);

            case "SuperCallExpression":
                return this.emitSuperCall(node);

            case "ArrayExpression":
                return this.emitArray(node);

            case "ObjectExpression":
                return this.emitObject(node);

            default:
                throw new CodegenError(
                    `Unsupported expression: ${node.type}`,
                    node
                );
        }
    }

    emitUnary(node) {
        const operand = this.emitExpression(node.operand);

        return `${node.operator}${operand}`;
    }

    emitBinary(node) {
        const left = this.emitExpression(node.left);
        const right = this.emitExpression(node.right);

        const operator = this.mapOperator(node.operator);

        return `${left} ${operator} ${right}`;
    }

    mapOperator(operator) {
        switch (operator) {
            case "==":
                return "==";

            case "!=":
                return "~=";

            case "&&":
                return "and";

            case "||":
                return "or";

            default:
                return operator;
        }
    }

    emitCall(node) {
        const callee = this.emitExpression(node.callee);

        const argumentsList = (node.arguments || [])
            .map(argument => this.emitExpression(argument))
            .join(", ");

        return `${callee}(${argumentsList})`;
    }

    emitMember(node) {
        const object = this.emitExpression(node.object);

        if (node.computed) {
            return `${object}[${this.emitExpression(node.property)}]`;
        }

        if (node.method) {
            return `${object}:${node.property}`;
        }

        return `${object}.${node.property}`;
    }

    emitSuperCall(node) {
        const argumentsList = (node.arguments || [])
            .map(argument => this.emitExpression(argument))
            .join(", ");

        return `super(${argumentsList})`;
    }

    emitArray(node) {
        const elements = (node.elements || [])
            .map(element => this.emitExpression(element))
            .join(", ");

        return `{${elements}}`;
    }

    emitObject(node) {
        const properties = (node.properties || [])
            .map(property => {
                const key = property.name || property.key;

                return `${key} = ${this.emitExpression(property.value)}`;
            })
            .join(", ");

        return `{${properties}}`;
    }

    emitLiteral(value) {
        if (value === null) {
            return "nil";
        }

        if (value === undefined) {
            return "nil";
        }

        if (typeof value === "string") {
            return JSON.stringify(value);
        }

        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }

        if (typeof value === "number") {
            if (!Number.isFinite(value)) {
                throw new CodegenError(
                    "Cannot generate non-finite numeric literal."
                );
            }

            return String(value);
        }

        throw new CodegenError(
            `Unsupported literal value: ${typeof value}`,
            value
        );
    }

    emitType(node) {
        if (!node) {
            return "any";
        }

        if (typeof node === "string") {
            return this.mapType(node);
        }

        if (node.type === "TypeReference") {
            return this.mapType(node.name);
        }

        return "any";
    }

    mapType(typeName) {
        switch (typeName) {
            case "number":
            case "string":
            case "boolean":
            case "any":
            case "nil":
                return typeName;

            case "void":
                return "()";

            case "Vector3":
                return "Vector3";

            case "CFrame":
                return "CFrame";

            default:
                return typeName;
        }
    }

    write(line) {
        const indentation = "    ".repeat(this.indentLevel);

        this.lines.push(
            indentation + line
        );
    }

    indent() {
        this.indentLevel++;
    }

    dedent() {
        if (this.indentLevel > 0) {
            this.indentLevel--;
        }
    }
}

module.exports = {
    CodeGenerator,
    CodegenError
};