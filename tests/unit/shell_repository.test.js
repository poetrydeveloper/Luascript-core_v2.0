const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const baseShell = {
    type: "Shell",
    schemaVersion: 1,

    identity: {
        id: "weapon-timer-system",
        hash: hashAST({
            type: "Program",
            declarations: []
        }),
        version: 1
    },

    position: {
        path: "systems.weapon.timer",
        parent: "systems.weapon",
        order: 0
    },

    lifecycle: {
        actual: true,
        generation: 1,
        createdAt: "2026-08-04T00:00:00.000Z",
        supersedes: null
    },

    semantic: {
        name: "WeaponTimerSystem",
        purpose: "Updates weapon cooldown state.",
        tags: [
            "system",
            "weapon",
            "cooldown"
        ],
        description: "Weapon cooldown ECS system."
    },

    payload: {
        type: "Program",
        declarations: []
    }
};

try {
    const repository = new ShellRepository();

    const v1 = repository.create(baseShell);

    assert.strictEqual(
        v1.identity.version,
        1
    );

    assert.strictEqual(
        v1.lifecycle.actual,
        true
    );

    const v2Source = repository.getActual(
        "weapon-timer-system"
    );

    v2Source.semantic.purpose =
        "Updates weapon cooldown and charging state.";

    const v2 = repository.save(v2Source);

    assert.strictEqual(
        v2.identity.version,
        2
    );

    assert.strictEqual(
        v2.lifecycle.actual,
        true
    );

    assert.strictEqual(
        v2.lifecycle.supersedes,
        v1.identity.hash
    );

    const old = repository.getVersion(
        "weapon-timer-system",
        1
    );

    assert.strictEqual(
        old.lifecycle.actual,
        false
    );

    const history = repository.listVersions(
        "weapon-timer-system"
    );

    assert.strictEqual(
        history.length,
        2
    );

    const rollback = repository.activate(
        "weapon-timer-system",
        1
    );

    assert.strictEqual(
        rollback.identity.version,
        1
    );

    assert.strictEqual(
        rollback.lifecycle.actual,
        true
    );

    const actual = repository.getActual(
        "weapon-timer-system"
    );

    assert.strictEqual(
        actual.identity.version,
        1
    );

    assert.strictEqual(
        repository.count(
            "weapon-timer-system"
        ),
        2
    );

    console.log("SHELL REPOSITORY OK");

    console.log(
        JSON.stringify(
            {
                actual: actual.identity.version,
                versions: history.map(
                    shell => shell.identity.version
                )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error("SHELL REPOSITORY FAILED");
    console.error(error);
    process.exit(1);
}
