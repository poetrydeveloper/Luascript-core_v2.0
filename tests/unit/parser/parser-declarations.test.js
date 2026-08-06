--- tests/unit/parser/parser-declarations.test.js (原始)


+++ tests/unit/parser/parser-declarations.test.js (修改后)
// tests/unit/parser/parser-declarations.test.js
const assert = require("assert");
const { Lexer } = require("../../../compiler/lexer");
const { Parser } = require("../../../compiler/parser");

function parse(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

// ClassDeclaration tests
{
    const source = `
class TestClass extends BaseClass do
end
# AURA_END
`;
    const ast = parse(source);

    assert.strictEqual(ast.declarations.length, 1, "Should have 1 declaration");
    const classDecl = ast.declarations[0];

    assert.strictEqual(classDecl.type, "ClassDeclaration");
    assert.strictEqual(classDecl.name, "TestClass");
    assert.strictEqual(classDecl.extends, "BaseClass");
    assert.ok(Array.isArray(classDecl.members));
    assert.strictEqual(classDecl.members.length, 0);

    console.log("✓ ClassDeclaration: parses simple class");
}

{
    const source = `
class TestClass extends BaseClass do
constructor() do
end
end
# AURA_END
`;
    const ast = parse(source);

    const classDecl = ast.declarations[0];
    assert.strictEqual(classDecl.members.length, 1);
    assert.strictEqual(classDecl.members[0].type, "ConstructorDeclaration");

    console.log("✓ ClassDeclaration: parses class with constructor");
}

{
    const source = `
class TestClass extends BaseClass do
public mut health: Number
end
# AURA_END
`;
    const ast = parse(source);

    const classDecl = ast.declarations[0];
    assert.strictEqual(classDecl.members.length, 1);

    const field = classDecl.members[0];
    assert.strictEqual(field.type, "FieldDeclaration");
    assert.strictEqual(field.visibility, "public");
    assert.strictEqual(field.mutable, true);
    assert.strictEqual(field.name, "health");
    assert.strictEqual(field.fieldType.name, "Number");

    console.log("✓ ClassDeclaration: parses class with field");
}

{
    const source = `
class TestClass extends BaseClass do
public getName(): String do
return "test"
end
end
# AURA_END
`;
    const ast = parse(source);

    const classDecl = ast.declarations[0];
    assert.strictEqual(classDecl.members.length, 1);

    const method = classDecl.members[0];
    assert.strictEqual(method.type, "MethodDeclaration");
    assert.strictEqual(method.visibility, "public");
    assert.strictEqual(method.name, "getName");
    assert.strictEqual(method.returnType.name, "String");

    console.log("✓ ClassDeclaration: parses class with method");
}

// StructDeclaration tests
{
    const source = `
struct Point do
x: Number
y: Number
end
# AURA_END
`;
    const ast = parse(source);

    assert.strictEqual(ast.declarations.length, 1);
    const structDecl = ast.declarations[0];

    assert.strictEqual(structDecl.type, "StructDeclaration");
    assert.strictEqual(structDecl.name, "Point");
    assert.strictEqual(structDecl.fields.length, 2);

    assert.strictEqual(structDecl.fields[0].name, "x");
    assert.strictEqual(structDecl.fields[0].fieldType.name, "Number");

    assert.strictEqual(structDecl.fields[1].name, "y");
    assert.strictEqual(structDecl.fields[1].fieldType.name, "Number");

    console.log("✓ StructDeclaration: parses simple struct");
}

// DecoratorDeclaration tests
{
    const source = `
@Service
# AURA_END
`;
    const ast = parse(source);

    assert.strictEqual(ast.declarations.length, 1);
    const decoratorGroup = ast.declarations[0];

    assert.strictEqual(decoratorGroup.type, "DecoratorGroup");
    assert.strictEqual(decoratorGroup.decorators.length, 1);
    assert.strictEqual(decoratorGroup.decorators[0].name, "Service");

    console.log("✓ DecoratorDeclaration: parses simple decorator");
}

{
    const source = `
@Perspective("server")
# AURA_END
`;
    const ast = parse(source);

    const decoratorGroup = ast.declarations[0];
    assert.strictEqual(decoratorGroup.decorators.length, 1);

    const decorator = decoratorGroup.decorators[0];
    assert.strictEqual(decorator.name, "Perspective");
    assert.strictEqual(decorator.arguments.length, 1);
    assert.strictEqual(decorator.arguments[0].value, "server");

    console.log("✓ DecoratorDeclaration: parses decorator with arguments");
}

{
    const source = `
@Service
@Perspective("server")
# AURA_END
`;
    const ast = parse(source);

    const decoratorGroup = ast.declarations[0];
    assert.strictEqual(decoratorGroup.decorators.length, 2);
    assert.strictEqual(decoratorGroup.decorators[0].name, "Service");
    assert.strictEqual(decoratorGroup.decorators[1].name, "Perspective");

    console.log("✓ DecoratorDeclaration: parses multiple decorators");
}

// Combined declarations
{
    const source = `
@Service
class TestSystem extends System do
constructor() do
end
end
# AURA_END
`;
    const ast = parse(source);

    assert.strictEqual(ast.declarations.length, 2);
    assert.strictEqual(ast.declarations[0].type, "DecoratorGroup");
    assert.strictEqual(ast.declarations[1].type, "ClassDeclaration");

    console.log("✓ Combined: parses decorators followed by class");
}

console.log("\nAll Parser Declarations tests passed!");