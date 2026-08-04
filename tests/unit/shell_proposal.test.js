// tests/unit/shell_proposal.test.js

const assert = require("assert");

const crypto = require("crypto");

const {
    createShellProposal,
    serializeShellProposal,
    parseShellProposal,
    hashShellProposal,
    cloneShellProposal
} = require("../../compiler/project/shell_proposal");

const baseHash =
    crypto
        .createHash("sha256")
        .update("base-shell")
        .digest("hex");

const proposalInput = {
    shellId: "weapon-system",

    operation: "UPDATE",

    baseVersion: 1,

    baseHash,

    semantic: {
        name: "WeaponSystem",

        purpose:
            "Controls weapon behavior and pistol support.",

        tags: [
            "system",
            "weapon"
        ],

        description:
            "Weapon system responsible for weapon behavior."
    },

    source: `
class WeaponSystem
    function fire(weapon)
        return weapon
    end
end
`.trim()
};

try {
    const proposal =
        createShellProposal(
            proposalInput
        );

    assert.strictEqual(
        proposal.type,
        "ShellProposal"
    );

    assert.strictEqual(
        proposal.schemaVersion,
        1
    );

    assert.strictEqual(
        proposal.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        proposal.operation,
        "UPDATE"
    );

    assert.strictEqual(
        proposal.baseVersion,
        1
    );

    assert.strictEqual(
        proposal.baseHash,
        baseHash
    );

    assert.strictEqual(
        proposal.semantic.name,
        "WeaponSystem"
    );

    assert.strictEqual(
        proposal.semantic.tags.length,
        2
    );

    assert.ok(
        proposal.source.includes(
            "WeaponSystem"
        )
    );

    const serialized =
        serializeShellProposal(
            proposal
        );

    const parsed =
        parseShellProposal(
            serialized
        );

    assert.deepStrictEqual(
        parsed,
        proposal
    );

    const cloned =
        cloneShellProposal(
            proposal
        );

    assert.deepStrictEqual(
        cloned,
        proposal
    );

    const hash1 =
        hashShellProposal(
            proposal
        );

    const hash2 =
        hashShellProposal(
            cloned
        );

    assert.strictEqual(
        hash1,
        hash2
    );

    assert.match(
        hash1,
        /^[a-f0-9]{64}$/
    );

    const modified =
        createShellProposal({
            ...proposalInput,

            source:
                proposalInput.source +
                "\n-- modified"
        });

    assert.notStrictEqual(
        hashShellProposal(
            modified
        ),
        hash1
    );

    assert.throws(
        () =>
            createShellProposal({
                ...proposalInput,

                shellId: ""
            })
    );

    assert.throws(
        () =>
            createShellProposal({
                ...proposalInput,

                baseVersion: 0
            })
    );

    assert.throws(
        () =>
            createShellProposal({
                ...proposalInput,

                baseHash: "invalid"
            })
    );

    assert.throws(
        () =>
            createShellProposal({
                ...proposalInput,

                operation: "INVALID"
            })
    );

    assert.throws(
        () =>
            createShellProposal({
                ...proposalInput,

                source: ""
            })
    );

    assert.throws(
        () =>
            createShellProposal({
                ...proposalInput,

                semantic: {
                    ...proposalInput.semantic,

                    description: ""
                }
            })
    );

    console.log(
        "SHELL PROPOSAL OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    proposal.type,

                shellId:
                    proposal.shellId,

                operation:
                    proposal.operation,

                baseVersion:
                    proposal.baseVersion,

                baseHash:
                    proposal.baseHash,

                proposalHash:
                    hash1
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "SHELL PROPOSAL FAILED"
    );

    console.error(error);

    process.exit(1);
}
