const fs = require("fs");

const { tokenize } = require("../../compiler/lexer");
const { Parser } = require("../../compiler/parser");
const { Validator } = require("../../compiler/validator");
const { CodeGenerator } = require("../../compiler/codegen");

const source = fs.readFileSync(
    "examples/WeaponTimerSystem.luas",
    "utf8"
);

try {
    const tokens = tokenize(source);

    console.log("LEXER OK");
    console.log("Tokens:", tokens.length);

    const ast = new Parser(tokens).parse();

    console.log("PARSER OK");
    console.log("Declarations:", ast.declarations.length);
    console.log("Root:", ast.declarations[0].type);

    new Validator().validate(ast);

    console.log("VALIDATOR OK");

    const output = new CodeGenerator().generate(ast);

    console.log("CODEGEN OK");
    console.log("");
    console.log("===== GENERATED LUA =====");
    console.log(output);
    console.log("=========================");
    console.log("");
    console.log("WEAPON TIMER INTEGRATION OK");
} catch (error) {
    console.error("");
    console.error("WEAPON TIMER INTEGRATION FAILED");
    console.error(error);
    process.exit(1);
}
