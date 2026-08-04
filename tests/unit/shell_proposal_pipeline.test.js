// tests/unit/shell_proposal_pipeline.test.js

const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    ShellProposalPipeline
} = require(
    "../../compiler/project/shell_proposal_pipeline"
);

function makeBaseShell() {
    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: "weapon-system",
            hash:
                "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164",
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
            createdAt: "2026-08-04T00:00:00.000Z",
            supersedes: null
        },

        semantic: {
            name: "WeaponSystem",
            purpose: "Controls weapon behavior.",
            tags: [
                "system",
                "weapon"
            ],
            description:
                "Weapon system."
        },

        payload: {
            type: "Program",
            declarations: []
        }
    };
}

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
    const repository =
        new ShellRepository();

    const baseShell =
        makeBaseShell();

    repository.create(
        baseShell
    );

    const pipeline =
        new ShellProposalPipeline(
            repository
        );

    const proposal =
        makeProposal();

    const result =
        pipeline.prepare(
            proposal
        );

    assert.strictEqual(
        result.type,
        "PreparedShellProposal"
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
        proposal.baseHash
    );

    assert.strictEqual(
        result.source,
        proposal.source
    );

    assert.ok(
        Array.isArray(
            result.tokens
        )
    );

    assert.ok(
        result.tokens.length > 0
    );

    assert.strictEqual(
        result.ast.type,
        "Program"
    );

    assert.strictEqual(
        result.candidate.type,
        "Shell"
    );

    assert.strictEqual(
        result.candidate.identity.id,
        "weapon-system"
    );

    assert.strictEqual(
        result.candidate.identity.version,
        2
    );

    assert.strictEqual(
        result.candidate.lifecycle.generation,
        2
    );

    assert.strictEqual(
        result.candidate.lifecycle.actual,
        false
    );

    assert.strictEqual(
        result.candidate.lifecycle.supersedes,
        proposal.baseHash
    );

    assert.strictEqual(
        result.candidate.position.path,
        "systems.weapon"
    );

    /*
     * IMPORTANT:
     *
     * Pipeline preparation must not mutate
     * the repository.
     *
     * Version 2 must therefore not exist
     * as an actual repository version yet.
     */

    const version1 =
        repository.getVersion(
            "weapon-system",
            1
        );

    assert.ok(
        version1
    );

    assert.strictEqual(
        version1.identity.version,
        1
    );

    const version2 =
        repository.getVersion(
            "weapon-system",
            2
        );

    assert.strictEqual(
        version2,
        null
    );

    /*
     * Invalid source must be rejected.
     */

    assert.throws(
        () =>
            pipeline.prepare({
                ...proposal,

                source:
`class WeaponSystem
end`
            })
    );

    /*
     * Wrong base version must be rejected.
     */

    assert.throws(
        () =>
            pipeline.prepare({
                ...proposal,

                baseVersion: 99
            })
    );

    /*
     * DELETE proposals do not go through
     * source construction.
     */

    assert.throws(
        () =>
            pipeline.prepare({
                ...proposal,

                operation: "DELETE"
            })
    );

    console.log(
        "SHELL PROPOSAL PIPELINE OK"
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

                candidate: {
                    id:
                        result.candidate.identity.id,

                    version:
                        result.candidate.identity.version,

                    generation:
                        result.candidate.lifecycle.generation,

                    actual:
                        result.candidate.lifecycle.actual,

                    path:
                        result.candidate.position.path,

                    supersedes:
                        result.candidate.lifecycle.supersedes
                }
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "SHELL PROPOSAL PIPELINE FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
