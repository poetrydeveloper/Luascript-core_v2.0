// tests/unit/shell_proposal_validator.test.js

const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const {
    createShellProposal
} = require("../../compiler/project/shell_proposal");

const {
    ShellProposalValidator
} = require("../../compiler/project/shell_proposal_validator");

function makeShell() {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",

        schemaVersion: 1,

        identity: {
            id: "weapon-system",

            hash:
                hashAST(payload),

            version: 1
        },

        position: {
            path: "systems.weapon",

            parent: "systems",

            order: 0
        },

        lifecycle: {
            actual: true,

            generation: 1,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes: null
        },

        semantic: {
            name:
                "WeaponSystem",

            purpose:
                "Controls weapon behavior.",

            tags: [
                "system",
                "weapon"
            ],

            description:
                "Weapon system."
        },

        payload
    };
}

function makeProposal(shell) {
    return createShellProposal({
        shellId:
            shell.identity.id,

        operation:
            "UPDATE",

        baseVersion:
            shell.identity.version,

        baseHash:
            shell.identity.hash,

        semantic: {
            name:
                "WeaponSystem",

            purpose:
                "Controls weapon behavior and pistol support.",

            tags: [
                "system",
                "weapon"
            ],

            description:
                "Weapon system with pistol support."
        },

        source:
            "class WeaponSystem\nend"
    });
}

try {
    const repository =
        new ShellRepository();

    const shell =
        repository.create(
            makeShell()
        );

    const proposal =
        makeProposal(shell);

    const validator =
        new ShellProposalValidator(
            repository
        );

    const result =
        validator.validate(
            proposal
        );

    assert.strictEqual(
        result.valid,
        true
    );

    assert.strictEqual(
        result.type,
        "ValidatedShellProposal"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        result.operation,
        "UPDATE"
    );

    assert.strictEqual(
        result.baseVersion,
        1
    );

    assert.strictEqual(
        result.baseHash,
        shell.identity.hash
    );

    assert.strictEqual(
        result.path,
        "systems.weapon"
    );

    assert.strictEqual(
        result.generation,
        1
    );

    assert.throws(
        () =>
            validator.validate(
                createShellProposal({
                    ...proposal,

                    shellId:
                        "unknown-shell"
                })
            )
    );

    assert.throws(
        () =>
            validator.validate(
                createShellProposal({
                    ...proposal,

                    baseVersion:
                        999
                })
            )
    );

    assert.throws(
        () =>
            validator.validate(
                createShellProposal({
                    ...proposal,

                    baseHash:
                        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                })
            )
    );

    assert.throws(
        () =>
            validator.validate({
                ...proposal,

                shellId:
                    "weapon-system",

                baseVersion:
                    1,

                baseHash:
                    shell.identity.hash,

                operation:
                    "INVALID"
            })
    );

    const wrongPathProposal =
        createShellProposal({
            ...proposal
        });

    wrongPathProposal.path =
        "systems.some-other-system";

    const validated =
        validator.validate(
            wrongPathProposal
        );

    assert.strictEqual(
        validated.path,
        "systems.weapon"
    );

    const deleted =
        {
            type:
                "ShellProposal",

            schemaVersion:
                1,

            shellId:
                shell.identity.id,

            operation:
                "DELETE",

            baseVersion:
                shell.identity.version,

            baseHash:
                shell.identity.hash
        };

    const deleteResult =
        validator.validate(
            deleted
        );

    assert.strictEqual(
        deleteResult.valid,
        true
    );

    assert.throws(
        () =>
            validator.validate({
                ...deleted,

                source:
                    "malicious source"
            })
    );

    console.log(
        "SHELL PROPOSAL VALIDATOR OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    result.type,

                shellId:
                    result.shellId,

                operation:
                    result.operation,

                baseVersion:
                    result.baseVersion,

                path:
                    result.path,

                generation:
                    result.generation
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "SHELL PROPOSAL VALIDATOR FAILED"
    );

    console.error(error);

    process.exit(1);
}
