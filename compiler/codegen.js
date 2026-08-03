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
            throw new CodegenError("Expected Program AST.");
        }

        this.lines = [];
        this.indentLevel = 0;

        for (const declaration of ast.declarations) {
            this.emitDeclaration(declaration);
        }

        return this.lines.join("\n");
    }

    emitDeclaration(node) {
        switch (node.type) {
            case "ClassDeclaration":
                this.emitClass(node);
                break;

            case "StructDeclaration":
                this.emitStruct(node);
                break;

            case "DecoratorGroup":
                break;

            default:
                throw new CodegenError(
                    `Unsupported declaration: ${node.type}`,
                    node
                );
        }
    }

    emitClass(node) {
        this.write(`local ${node.name} = {}`);
        this.write(`${node.name}.__index = ${node.name}`);
        this.write("");

        for (const member of node.members) {
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
        if (!node.initializer) {
            return;
        }

        const value = this.emitExpression(node.initializer);

        this.write(
            `${classNode.name}.${node.name} = ${value}`
        );
    }

    emitConstructor(classNode, node) {
        const parameters = node.parameters
            .map(parameter => parameter.name)
            .join(", ");

        this.write(
            `function ${classNode.name}.new(${parameters})`
        );

        this.indent();

        this.write(
            `local self = setmetatable({}, ${classNode.name})`
        );

        for (const parameter of node.parameters) {
            this.write(
                `self.${parameter.name} = ${parameter.name}`
            );
        }

        this.emitBody(node.body);

        this.write("return self");

        this.dedent();
        this.write("end");
    }

    emitMethod(classNode, node) {
        const parameters = node.parameters
            .map(parameter => parameter.name)
            .join(", ");

        if (node.visibility === "private") {
            const args = parameters.length > 0
                ? `self, ${parameters}`
                : "self";

            this.write(
                `local function ${node.name}(${args})`
            );
        } else {
            const args = parameters.length > 0
                ? `self, ${parameters}`
                : "self";

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
                if (node.value) {
                    this.write(
                        `return ${this.emitExpression(node.value)}`
                    );
                } else {
                    this.write("return");
                }
                break;

            case "BreakStatement":
                this.write("break");
                break;

            default:
                throw new CodegenError(
                    `Unsupported statement: ${node.type}`,
                    node
                );
        }
    }

    emitVariableDeclaration(node) {
        const prefix = "local";

        let value = "";

        if (node.initializer !== null && node.initializer !== undefined) {
            if (Array.isArray(node.initializer)) {
                value = " = " + node.initializer
                    .map(expression => this.emitExpression(expression))
                    .join(", ");
            } else {
                value = " = " + this.emitExpression(node.initializer);
            }
        }

        this.write(
            `${prefix} ${node.name}${value}`
        );
    }

    emitAssignment(node) {
        this.write(
            `${this.emitExpression(node.target)} = ${this.emitExpression(node.value)}`
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

    emitExpression(node) {
        if (!node) {
            throw new CodegenError(
                "Cannot generate empty expression."
            );
        }

        switch (node.type) {
            case "Literal":
                return this.emitLiteral(node.value);

            case "Identifier":
                return node.name;

            case "UnaryExpression":
                return `${node.operator}${this.emitExpression(node.operand)}`;

            case "BinaryExpression":
                return `${this.emitExpression(node.left)} ${node.operator} ${this.emitExpression(node.right)}`;

            case "CallExpression":
                return this.emitCall(node);

            case "MemberExpression":
                return this.emitMember(node);

            case "SuperCallExpression":
                return `super(${node.arguments.map(argument => this.emitExpression(argument)).join(", ")})`;

            default:
                throw new CodegenError(
                    `Unsupported expression: ${node.type}`,
                    node
                );
        }
    }

    emitCall(node) {
        const callee = this.emitExpression(node.callee);

        const argumentsList = node.arguments
            .map(argument => this.emitExpression(argument))
            .join(", ");

        return `${callee}(${argumentsList})`;
    }

    emitMember(node) {
        const object = this.emitExpression(node.object);

        if (node.method) {
            return `${object}:${node.property}`;
        }

        return `${object}.${node.property}`;
    }

    emitLiteral(value) {
        if (value === null) {
            return "nil";
        }

        if (typeof value === "string") {
            return JSON.stringify(value);
        }

        if (typeof value === "boolean") {
            return value ? "true" : "false";
        }

        return String(value);
    }

    emitType(node) {
        if (!node) {
            return "any";
        }

        if (node.type === "TypeReference") {
            return node.name;
        }

        return "any";
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
