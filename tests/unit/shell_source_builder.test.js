// tests/unit/shell_source_builder.test.js

const assert = require("assert");

const {
    ShellSourceBuilder
} = require("../../compiler/project/shell_source_builder");

const {
    ShellSourceValidator
} = require("../../compiler/project/shell_source_validator");

function makeProposal() {
    return {
        type: "ShellProposal",
        schemaVersion: 1,

        shellId: "weapon-system",

        operation: "UPDATE",

        baseVersion: 1,

        baseHash:
            "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164",

        source:
`class WeaponSystem extends System do
end
# AURA_END`
    };
}

try {
    const sourceValidator =
        new ShellSourceValidator();

    const builder =
        new ShellSourceBuilder();

    const proposal =
        makeProposal();

    const validated =
        sourceValidator.validate(
            proposal
        );

    const shell =
        builder.build(
            validated,
            {
                path: "systems.weapon",
                parent: "systems",
                order: 0,

                version: 2,
                generation: 2,

                baseShell: {
                    identity: {
                        hash: proposal.baseHash
                    }
                },

                purpose:
                    "Controls weapon behavior.",

                tags: [
                    "system",
                    "weapon"
                ],

                description:
                    "Weapon system generated from Luascript.",

                createdAt:
                    "2026-08-04T00:00:00.000Z"
            }
        );

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
        "weapon-system"
    );

    assert.strictEqual(
        shell.identity.version,
        2
    );

    assert.strictEqual(
        shell.position.path,
        "systems.weapon"
    );

    assert.strictEqual(
        shell.position.parent,
        "systems"
    );

    assert.strictEqual(
        shell.lifecycle.generation,
        2
    );

    assert.strictEqual(
        shell.lifecycle.actual,
        false
    );

    assert.strictEqual(
        shell.lifecycle.supersedes,
        proposal.baseHash
    );

    assert.strictEqual(
        shell.semantic.name,
        "WeaponSystem"
    );

    assert.strictEqual(
        shell.payload.type,
        "Program"
    );

    assert.ok(
        typeof shell.identity.hash === "string"
    );

    assert.strictEqual(
        shell.identity.hash.length,
        64
    );

    const shellAgain =
        builder.build(
            validated,
            {
                path: "systems.weapon",
                parent: "systems",
                order: 0,

                version: 2,
                generation: 2,

                baseShell: {
                    identity: {
                        hash: proposal.baseHash
                    }
                },

                purpose:
                    "Controls weapon behavior.",

                tags: [
                    "system",
                    "weapon"
                ],

                description:
                    "Weapon system generated from Luascript.",

                createdAt:
                    "2026-08-04T00:00:00.000Z"
            }
        );

    assert.strictEqual(
        shell.identity.hash,
        shellAgain.identity.hash
    );

    console.log(
        "SHELL SOURCE BUILDER OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    shell.type,

                id:
                    shell.identity.id,

                version:
                    shell.identity.version,

                generation:
                    shell.lifecycle.generation,

                actual:
                    shell.lifecycle.actual,

                path:
                    shell.position.path,

                parent:
                    shell.position.parent,

                name:
                    shell.semantic.name,

                hash:
                    shell.identity.hash,

                supersedes:
                    shell.lifecycle.supersedes
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "SHELL SOURCE BUILDER FAILED"
    );

    console.error(error);

    process.exit(1);
}
