// tests/unit/shell_source_builder.test.js

const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    ShellProposalValidator
} = require("../../compiler/project/shell_proposal_validator");

const {
    ShellSourceValidator
} = require("../../compiler/project/shell_source_validator");

const {
    ShellSourceBuilder
} = require("../../compiler/project/shell_source_builder");


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

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes: null
        },

        semantic: {
            name: "WeaponSystem",

            purpose:
                "Controls weapon behavior.",

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

        semantic: {
            name: "weapon-system",

            purpose:
                "Add pistol support to weapon behavior.",

            tags: [
                "weapon",
                "pistol"
            ],

            description:
                "Weapon system supporting pistol behavior."
        },

        source:
`class WeaponSystem extends System do
end
# AURA_END`
    };
}


try {
    /*
     * --------------------------------------------------------
     * Repository
     * --------------------------------------------------------
     */

    const repository =
        new ShellRepository();


    /*
     * --------------------------------------------------------
     * Existing Shell v1
     *
     * The builder and proposal validator both depend
     * on the real repository state.
     * --------------------------------------------------------
     */

    const baseShell =
        makeBaseShell();

    repository.create(
        baseShell
    );


    /*
     * --------------------------------------------------------
     * Proposal
     * --------------------------------------------------------
     */

    const proposal =
        makeProposal();


    /*
     * --------------------------------------------------------
     * Stage 1
     *
     * ShellProposal
     *      ->
     * ValidatedShellProposal
     * --------------------------------------------------------
     */

    const proposalValidator =
        new ShellProposalValidator(
            repository
        );

    const validatedProposal =
        proposalValidator.validate(
            proposal
        );

    assert.strictEqual(
        validatedProposal.type,
        "ValidatedShellProposal"
    );

    assert.strictEqual(
        validatedProposal.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        validatedProposal.operation,
        "UPDATE"
    );

    assert.strictEqual(
        validatedProposal.baseVersion,
        1
    );

    assert.strictEqual(
        validatedProposal.baseHash,
        proposal.baseHash
    );


    /*
     * --------------------------------------------------------
     * Stage 2
     *
     * Shell source
     *      ->
     * ValidatedShellSource
     * --------------------------------------------------------
     */

    const sourceValidator =
        new ShellSourceValidator();

    const validatedSource =
        sourceValidator.validate(
            proposal
        );

    assert.strictEqual(
        validatedSource.type,
        "ValidatedShellSource"
    );

    assert.strictEqual(
        validatedSource.schemaVersion,
        1
    );

    assert.strictEqual(
        validatedSource.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        validatedSource.operation,
        "UPDATE"
    );

    assert.strictEqual(
        validatedSource.baseVersion,
        1
    );

    assert.strictEqual(
        validatedSource.baseHash,
        proposal.baseHash
    );

    assert.strictEqual(
        validatedSource.ast.type,
        "Program"
    );


    /*
     * --------------------------------------------------------
     * Stage 3
     *
     * ValidatedShellProposal
     * +
     * ValidatedShellSource
     *      ->
     * PreparedShellProposal
     * --------------------------------------------------------
     */

    const builder =
        new ShellSourceBuilder(
            repository
        );

    const prepared =
        builder.build(
            validatedProposal,
            validatedSource
        );


    /*
     * --------------------------------------------------------
     * Prepared proposal contract
     * --------------------------------------------------------
     */

    assert.strictEqual(
        prepared.type,
        "PreparedShellProposal"
    );

    assert.strictEqual(
        prepared.schemaVersion,
        1
    );

    assert.strictEqual(
        prepared.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        prepared.operation,
        "UPDATE"
    );

    assert.strictEqual(
        prepared.baseVersion,
        1
    );

    assert.strictEqual(
        prepared.baseHash,
        proposal.baseHash
    );

    assert.strictEqual(
        prepared.path,
        "systems.weapon"
    );

    assert.strictEqual(
        prepared.generation,
        2
    );


    /*
     * --------------------------------------------------------
     * Candidate Shell
     * --------------------------------------------------------
     */

    assert.ok(
        prepared.candidate
    );

    assert.strictEqual(
        prepared.candidate.type,
        "Shell"
    );

    assert.strictEqual(
        prepared.candidate.schemaVersion,
        1
    );

    assert.strictEqual(
        prepared.candidate.identity.id,
        "weapon-system"
    );

    assert.strictEqual(
        prepared.candidate.identity.version,
        2
    );

    assert.strictEqual(
        prepared.candidate.position.path,
        "systems.weapon"
    );

    assert.strictEqual(
        prepared.candidate.position.parent,
        "systems"
    );

    assert.strictEqual(
        prepared.candidate.position.order,
        0
    );

    assert.strictEqual(
        prepared.candidate.lifecycle.generation,
        2
    );

    assert.strictEqual(
        prepared.candidate.lifecycle.actual,
        false
    );

    assert.strictEqual(
        prepared.candidate.lifecycle.supersedes,
        proposal.baseHash
    );


    /*
     * --------------------------------------------------------
     * Semantic metadata
     * --------------------------------------------------------
     */

    assert.strictEqual(
        prepared.candidate.semantic.name,
        "weapon-system"
    );

    assert.strictEqual(
        prepared.candidate.semantic.purpose,
        proposal.semantic.purpose
    );

    assert.deepStrictEqual(
        prepared.candidate.semantic.tags,
        proposal.semantic.tags
    );

    assert.strictEqual(
        prepared.candidate.semantic.description,
        proposal.semantic.description
    );


    /*
     * --------------------------------------------------------
     * Payload
     * --------------------------------------------------------
     */

    assert.strictEqual(
        prepared.candidate.payload.type,
        "Program"
    );

    assert.ok(
        Array.isArray(
            prepared.candidate.payload.declarations
        )
    );

    assert.strictEqual(
        prepared.candidate.payload.declarations.length,
        1
    );


    /*
     * --------------------------------------------------------
     * Hash
     * --------------------------------------------------------
     */

    assert.strictEqual(
        typeof prepared.candidate.identity.hash,
        "string"
    );

    assert.strictEqual(
        prepared.candidate.identity.hash.length,
        64
    );


    /*
     * --------------------------------------------------------
     * Deterministic AST hash
     *
     * Building the same AST twice must produce
     * the same identity hash.
     * --------------------------------------------------------
     */

    const preparedAgain =
        builder.build(
            validatedProposal,
            validatedSource
        );

    assert.strictEqual(
        prepared.candidate.identity.hash,
        preparedAgain.candidate.identity.hash
    );


    /*
     * --------------------------------------------------------
     * Repository must remain unchanged
     *
     * Builder only prepares a candidate.
     * --------------------------------------------------------
     */

    const stored =
        repository.get(
            "weapon-system"
        );

    assert.strictEqual(
        stored.identity.version,
        1
    );

    assert.strictEqual(
        stored.lifecycle.actual,
        true
    );


    console.log(
        "SHELL SOURCE BUILDER OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    prepared.type,

                shellId:
                    prepared.shellId,

                operation:
                    prepared.operation,

                baseVersion:
                    prepared.baseVersion,

                candidate: {
                    id:
                        prepared.candidate.identity.id,

                    version:
                        prepared.candidate.identity.version,

                    generation:
                        prepared.candidate.lifecycle.generation,

                    actual:
                        prepared.candidate.lifecycle.actual,

                    path:
                        prepared.candidate.position.path,

                    supersedes:
                        prepared.candidate.lifecycle.supersedes,

                    hash:
                        prepared.candidate.identity.hash
                }
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
