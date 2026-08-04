const assert = require("assert");

const {
    validateShell,
    createShell
} = require("../../compiler/shell/schema");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const ast = {
    type: "Program",
    declarations: []
};

try {
    const shell = createShell({
        id: "weapon-timer-system",
        hash: hashAST(ast),
        version: 1,

        path: "systems.weapon.timer",
        parent: "systems.weapon",
        order: 0,

        actual: true,
        generation: 1,
        createdAt: "2026-08-04T00:00:00.000Z",
        supersedes: null,

        name: "WeaponTimerSystem",
        purpose: "Updates weapon cooldown state.",
        tags: [
            "system",
            "weapon",
            "cooldown"
        ],
        description: "Weapon cooldown ECS system.",

        ast
    });

    assert.strictEqual(
        shell.type,
        "Shell"
    );

    assert.strictEqual(
        shell.schemaVersion,
        1
    );

    assert.strictEqual(
        shell.identity.id,
        "weapon-timer-system"
    );

    assert.strictEqual(
        shell.lifecycle.actual,
        true
    );

    assert.strictEqual(
        shell.lifecycle.generation,
        1
    );

    assert.strictEqual(
        shell.payload.type,
        "Program"
    );

    assert.strictEqual(
        validateShell(shell),
        true
    );

    console.log("SHELL SCHEMA OK");
    console.log(
        JSON.stringify(shell, null, 2)
    );

} catch (error) {
    console.error("SHELL SCHEMA FAILED");
    console.error(error);
    process.exit(1);
}
