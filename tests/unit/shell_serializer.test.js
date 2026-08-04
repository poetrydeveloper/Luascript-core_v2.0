const assert = require("assert");

const {
    createShell
} = require("../../compiler/shell/schema");

const {
    serializeShell,
    parseShell,
    hashShell,
    cloneShell,
    equalShell
} = require("../../compiler/shell/serializer");

const ast = {
    type: "Program",
    declarations: []
};

try {
    const shell = createShell({
        id: "weapon-timer-system",

        hash: require("../../compiler/ast/serializer")
            .hashAST(ast),

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

    const serialized = serializeShell(shell);

    assert.ok(
        serialized.length > 0,
        "Serialized Shell must not be empty."
    );

    const restored = parseShell(serialized);

    assert.ok(
        equalShell(shell, restored),
        "Restored Shell must equal original Shell."
    );

    const cloned = cloneShell(shell);

    assert.ok(
        equalShell(shell, cloned),
        "Cloned Shell must equal original Shell."
    );

    const hash1 = hashShell(shell);
    const hash2 = hashShell(restored);

    assert.strictEqual(
        hash1,
        hash2,
        "Equal Shells must have equal hashes."
    );

    assert.strictEqual(
        hash1.length,
        64,
        "Shell hash must be SHA-256."
    );

    console.log("SHELL SERIALIZER OK");
    console.log("SHELL HASH:", hash1);

} catch (error) {
    console.error("SHELL SERIALIZER FAILED");
    console.error(error);
    process.exit(1);
}
