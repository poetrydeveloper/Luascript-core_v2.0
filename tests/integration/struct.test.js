const { tokenize } = require("../../compiler/lexer");
const { Parser } = require("../../compiler/parser");
const { Validator } = require("../../compiler/validator");
const { CodeGenerator } = require("../../compiler/codegen");

const source = `struct WeaponState do
    nextTimer: number
    isCharging: boolean
    ammoCapacity: number
end

# AURA_END`;

try {
    const tokens = tokenize(source);
    console.log("LEXER OK");
    console.log("Tokens:", tokens.length);

    const ast = new Parser(tokens).parse();
    console.log("PARSER OK");
    console.log("Root:", ast.declarations[0].type);

    new Validator().validate(ast);
    console.log("VALIDATOR OK");

    const output = new CodeGenerator().generate(ast);

    console.log("CODEGEN OK");
    console.log(output);
    console.log("");
    console.log("STRUCT INTEGRATION OK");
} catch (error) {
    console.error("");
    console.error("STRUCT INTEGRATION FAILED");
    console.error(error);
    process.exit(1);
}
