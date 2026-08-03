const { tokenize } = require("../../compiler/lexer");
const { Parser } = require("../../compiler/parser");
const { Validator } = require("../../compiler/validator");
const { CodeGenerator } = require("../../compiler/codegen");

const source = `class WeaponTimerSystem extends MatterSystem do

    private safetyCounter: number = 0

    constructor(ctx: AuraContext) do
        self.ctx = ctx
    end

    public updateWeaponCooldowns(deltaTime: number): void do
        local timeDecrement: number = deltaTime
        local nextCooldown: number = math.max(0, timeDecrement)

        if nextCooldown > 0 then
            print("reload")
        end
    end

end

# AURA_END`;

try {
    const tokens = tokenize(source);

    console.log("LEXER OK");
    console.log("Tokens:", tokens.length);

    const parser = new Parser(tokens);
    const ast = parser.parse();

    console.log("PARSER OK");
    console.log("Declarations:", ast.declarations.length);
    console.log("Root:", ast.declarations[0].type);

    const validator = new Validator();
    validator.validate(ast);

    console.log("VALIDATOR OK");

    const codegen = new CodeGenerator();
    const output = codegen.generate(ast);

    console.log("CODEGEN OK");
    console.log("Generated output:");
    console.log(output);

    console.log("");
    console.log("INTEGRATION OK");
} catch (error) {
    console.error("");
    console.error("INTEGRATION FAILED");
    console.error(error);
    process.exit(1);
}
