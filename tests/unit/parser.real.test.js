const { tokenize } = require("../../compiler/lexer");
const { Parser } = require("../../compiler/parser");

const source = `
class WeaponTimerSystem extends MatterSystem do
    private safetyCounter: number = 0

    constructor(ctx: AuraContext) do
        super()
    end

    public updateWeaponCooldowns(deltaTime: number): void do
        self.safetyCounter = self.safetyCounter + 1

        if self.safetyCounter > 2000 then
            self.safetyCounter = 0
            warn("Safety triggered")
        elseif self.safetyCounter > 1000 then
            print("Warning")
        else
            print("Normal")
        end
    end
end

# AURA_END
`;

try {
    const tokens = tokenize(source);
    const ast = new Parser(tokens).parse();

    console.log("REAL LUA SCRIPT PARSE OK");
    console.log("Declarations:", ast.declarations.length);
    console.log("Root:", ast.declarations[0].type);
    console.log("Class:", ast.declarations[0].name);
    console.log(
        "Members:",
        ast.declarations[0].members.length
    );
} catch (error) {
    console.error("PARSER FAILED");
    console.error(error);
    process.exit(1);
}
