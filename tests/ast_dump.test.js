const fs = require("fs");

const { tokenize } = require("../compiler/lexer");
const { Parser } = require("../compiler/parser");

const source = fs.readFileSync(
    "examples/WeaponTimerSystem.luas",
    "utf8"
);

try {
    const tokens = tokenize(source);
    const ast = new Parser(tokens).parse();

    console.log("AST DUMP OK");
    console.log("");
    console.log(JSON.stringify(ast, null, 2));

} catch (error) {
    console.error("");
    console.error("AST DUMP FAILED");
    console.error(error);
    process.exit(1);
}
