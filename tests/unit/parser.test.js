// tests/unit/parser.test.js

const assert = require("assert");

const { Lexer } = require("../../compiler/lexer");
const { Parser } = require("../../compiler/parser");

function parse(source) {
const lexer = new Lexer(source);
const tokens = lexer.tokenize();

const parser = new Parser(tokens);

return parser.parse();

}

const source = `
class WeaponSystem extends MatterSystem do
end

# AURA_END

`;

const ast = parse(source);

assert.ok(
ast,
"Parser must return an AST."
);

assert.strictEqual(
ast.type,
"Program"
);

assert.ok(
Array.isArray(ast.declarations),
"Program.declarations must be an array."
);

assert.strictEqual(
ast.declarations.length,
1
);

const classNode = ast.declarations[0];

assert.strictEqual(
classNode.type,
"ClassDeclaration"
);

assert.strictEqual(
classNode.name,
"WeaponSystem"
);

assert.strictEqual(
classNode.extends,
"MatterSystem"
);

console.log("PASS: parser smoke test");
