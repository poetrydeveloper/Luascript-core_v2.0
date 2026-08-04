const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    hashAST
} = require("../../compiler/ast/serializer");

function createShell(payload) {
    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: "weapon-timer-system",
            hash: hashAST(payload),
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

        payload
    };
}

try {
    const repository = new ShellRepository();

    const payloadV1 = {
        type: "Program",
        declarations: [
            {
                type: "ClassDeclaration",
                name: "WeaponTimerSystem",
                extends: "MatterSystem",
                members: []
            }
        ]
    };

    const v1Source = createShell(payloadV1);

    const v1 = repository.create(v1Source);

    assert.strictEqual(
        v1.identity.version,
        1
    );

    assert.strictEqual(
        v1.lifecycle.generation,
        1
    );

    assert.strictEqual(
        v1.lifecycle.actual,
        true
    );

    assert.strictEqual(
        v1.identity.hash,
        hashAST(payloadV1)
    );

    const payloadV2 = {
        type: "Program",
        declarations: [
            {
                type: "ClassDeclaration",
                name: "WeaponTimerSystem",
                extends: "MatterSystem",
                members: [
                    {
                        type: "FieldDeclaration",
                        visibility: "private",
                        mutable: false,
                        name: "safetyCounter",
                        fieldType: {
                            type: "TypeReference",
                            name: "number"
                        },
                        initializer: {
                            type: "Literal",
                            value: 0
                        }
                    }
                ]
            }
        ]
    };

    const v2Source = repository.getActual(
        "weapon-timer-system"
    );

    v2Source.payload = payloadV2;

    const v2 = repository.save(v2Source);

    assert.strictEqual(
        v2.identity.version,
        2
    );

    assert.strictEqual(
        v2.lifecycle.generation,
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

    assert.strictEqual(
        v2.identity.hash,
        hashAST(payloadV2)
    );

    assert.notStrictEqual(
        v2.identity.hash,
        v1.identity.hash
    );

    const oldV1 = repository.getVersion(
        "weapon-timer-system",
        1
    );

    assert.ok(oldV1);

    assert.strictEqual(
        oldV1.identity.version,
        1
    );

    assert.strictEqual(
        oldV1.identity.hash,
        v1.identity.hash
    );

    assert.strictEqual(
        oldV1.lifecycle.actual,
        false
    );

    const actualV2 = repository.getActual(
        "weapon-timer-system"
    );

    assert.strictEqual(
        actualV2.identity.version,
        2
    );

    assert.strictEqual(
        actualV2.identity.hash,
        v2.identity.hash
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

    const actualAfterRollback = repository.getActual(
        "weapon-timer-system"
    );

    assert.strictEqual(
        actualAfterRollback.identity.version,
        1
    );

    assert.strictEqual(
        actualAfterRollback.identity.hash,
        v1.identity.hash
    );

    assert.strictEqual(
        repository.count(
            "weapon-timer-system"
        ),
        2
    );

    console.log("SHELL EVOLUTION OK");

    console.log(
        JSON.stringify(
            {
                v1: {
                    version: v1.identity.version,
                    generation: v1.lifecycle.generation,
                    hash: v1.identity.hash,
                    actual: v1.lifecycle.actual
                },
                v2: {
                    version: v2.identity.version,
                    generation: v2.lifecycle.generation,
                    hash: v2.identity.hash,
                    supersedes: v2.lifecycle.supersedes,
                    actual: v2.lifecycle.actual
                },
                rollback: {
                    actualVersion:
                        actualAfterRollback.identity.version,
                    actualHash:
                        actualAfterRollback.identity.hash
                }
            },
            null,
            2
        )
    );

} catch (error) {
    console.error("SHELL EVOLUTION FAILED");
    console.error(error);
    process.exit(1);
}
