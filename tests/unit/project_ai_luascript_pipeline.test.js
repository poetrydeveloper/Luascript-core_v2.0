// tests/unit/project_ai_luascript_pipeline.test.js
//
// Real vertical pipeline:
//
// ShellProposal
//      ↓
// ShellProposalValidator
//      ↓
// ShellSourceValidator
//      ↓
// ShellSourceBuilder
//      ↓
// PreparedShellProposal
//      ↓
// ShellProposalApplier
//      ↓
// EvolutionExecutor
//
// The important point:
//
// ShellProposalValidator works against ShellRepository.
// ProjectTree is NOT used as a substitute for the repository.

const assert = require("assert");

const {
    ShellRepository
} = require(
    "../../compiler/shell/repository"
);

const {
    ShellProposalValidator
} = require(
    "../../compiler/project/shell_proposal_validator"
);

const {
    ShellSourceValidator
} = require(
    "../../compiler/project/shell_source_validator"
);

const {
    ShellSourceBuilder
} = require(
    "../../compiler/project/shell_source_builder"
);

const {
    ShellProposalApplier
} = require(
    "../../compiler/project/shell_proposal_applier"
);

const {
    EvolutionExecutor
} = require(
    "../../compiler/project/evolution_executor"
);

/*
 * ------------------------------------------------------------
 * Luascript source
 * ------------------------------------------------------------
 *
 * This is intentionally valid according to the REAL
 * Luascript parser.
 */

const source =
`class WeaponSystem extends System do
end
# AURA_END`;

/*
 * ------------------------------------------------------------
 * Shell factory
 * ------------------------------------------------------------
 */

function makeShell(
    id,
    path,
    parent,
    purpose
) {
    return {
        type:
            "Shell",

        schemaVersion:
            1,

        identity: {
            id,

            version:
                1,

            hash:
                "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164"
        },

        position: {
            path,

            parent,

            order:
                0
        },

        lifecycle: {
            generation:
                1,

            actual:
                true,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes:
                null
        },

        semantic: {
            name:
                id,

            purpose,

            tags: [
                "test"
            ],

            description:
                `Test shell for ${id}.`
        },

        payload: {
            type:
                "Program",

            declarations: []
        }
    };
}

/*
 * ------------------------------------------------------------
 * Repository
 * ------------------------------------------------------------
 */

const repository =
    new ShellRepository();

const systems =
    makeShell(
        "systems",
        "systems",
        null,
        "Root systems."
    );

const weapon =
    makeShell(
        "weapon-system",
        "systems.weapon",
        "systems",
        "Controls weapon behavior."
    );

repository.create(
    systems
);

const storedWeapon =
    repository.create(
        weapon
    );

/*
 * Repository.create() calculates the actual hash
 * from the payload.
 *
 * Therefore we must use the stored Shell's hash,
 * not the artificial hash above.
 */

const baseHash =
    storedWeapon.identity.hash;

/*
 * ------------------------------------------------------------
 * Evolution plan
 * ------------------------------------------------------------
 */

const plan = {
    type:
        "EvolutionPlan",

    schemaVersion:
        1,

    snapshotHash:
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

    intent:
        "Add pistol support to the weapon system.",

    affectedShells: [
        "systems.weapon"
    ],

    changes: [
        {
            shellId:
                "weapon-system",

            operation:
                "UPDATE",

            path:
                "systems.weapon",

            baseVersion:
                1
        }
    ]
};

/*
 * ------------------------------------------------------------
 * Shell proposal
 * ------------------------------------------------------------
 */

const proposal = {
    type:
        "ShellProposal",

    schemaVersion:
        1,

    shellId:
        "weapon-system",

    operation:
        "UPDATE",

    baseVersion:
        1,

    baseHash,

    semantic: {
        name:
            "weapon-system",

        purpose:
            "Add pistol support to weapon behavior.",

        tags: [
            "weapon",
            "pistol"
        ],

        description:
            "Weapon system supporting pistol behavior."
    },

    source
};

/*
 * ------------------------------------------------------------
 * Stage 1
 *
 * ShellProposalValidator
 * ------------------------------------------------------------
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
    validatedProposal.baseVersion,
    1
);

assert.strictEqual(
    validatedProposal.baseHash,
    baseHash
);

/*
 * ------------------------------------------------------------
 * Stage 2
 *
 * Real Luascript lexer + parser
 * ------------------------------------------------------------
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
    validatedSource.shellId,
    "weapon-system"
);

assert.strictEqual(
    validatedSource.ast.type,
    "Program"
);

assert.strictEqual(
    validatedSource.ast.declarations.length,
    1
);

assert.strictEqual(
    validatedSource.ast.declarations[0].type,
    "ClassDeclaration"
);

/*
 * ------------------------------------------------------------
 * Stage 3
 *
 * Build candidate Shell
 * ------------------------------------------------------------
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

assert.strictEqual(
    prepared.type,
    "PreparedShellProposal"
);

assert.strictEqual(
    prepared.shellId,
    "weapon-system"
);

assert.strictEqual(
    prepared.operation,
    "UPDATE"
);

assert.ok(
    prepared.candidate
);

assert.strictEqual(
    prepared.candidate.type,
    "Shell"
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
    prepared.candidate.lifecycle.generation,
    2
);

assert.strictEqual(
    prepared.candidate.lifecycle.actual,
    false
);

assert.strictEqual(
    prepared.candidate.lifecycle.supersedes,
    baseHash
);

/*
 * ------------------------------------------------------------
 * Stage 4
 *
 * EvolutionExecutor
 * ------------------------------------------------------------
 */

const executor =
    new EvolutionExecutor(
        repository
    );

/*
 * ------------------------------------------------------------
 * Stage 5
 *
 * Apply candidate
 * ------------------------------------------------------------
 */

const applier =
    new ShellProposalApplier(
        executor
    );

const result =
    applier.apply(
        prepared,
        plan
    );

assert.strictEqual(
    result.type,
    "EvolutionResult"
);

assert.strictEqual(
    result.schemaVersion,
    1
);

assert.strictEqual(
    result.intent,
    plan.intent
);

assert.strictEqual(
    result.changes.length,
    1
);

const change =
    result.changes[0];

assert.strictEqual(
    change.shellId,
    "weapon-system"
);

assert.strictEqual(
    change.path,
    "systems.weapon"
);

assert.strictEqual(
    change.version,
    2
);

assert.strictEqual(
    change.generation,
    2
);

assert.strictEqual(
    change.supersedes,
    baseHash
);

/*
 * ------------------------------------------------------------
 * Stage 6
 *
 * Verify repository state.
 * ------------------------------------------------------------
 */

const actual =
    repository.get(
        "weapon-system"
    );

assert.ok(
    actual
);

assert.strictEqual(
    actual.identity.id,
    "weapon-system"
);

assert.strictEqual(
    actual.identity.version,
    2
);

assert.strictEqual(
    actual.lifecycle.generation,
    2
);

assert.strictEqual(
    actual.lifecycle.actual,
    true
);

assert.strictEqual(
    actual.lifecycle.supersedes,
    baseHash
);

/*
 * ------------------------------------------------------------
 * Verify history.
 * ------------------------------------------------------------
 */

const history =
    repository.history(
        "weapon-system"
    );

assert.strictEqual(
    history.length,
    2
);

assert.strictEqual(
    history[0].identity.version,
    1
);

assert.strictEqual(
    history[1].identity.version,
    2
);

assert.strictEqual(
    history[0].lifecycle.actual,
    false
);

assert.strictEqual(
    history[1].lifecycle.actual,
    true
);

/*
 * ------------------------------------------------------------
 * Final
 * ------------------------------------------------------------
 */

console.log(
    "PROJECT AI LUASCRIPT PIPELINE OK"
);

console.log(
    JSON.stringify(
        {
            stages: [
                "shell-proposal-validator",
                "shell-source-validator",
                "shell-source-builder",
                "shell-proposal-applier",
                "evolution-executor"
            ],

            shell: {
                id:
                    actual.identity.id,

                path:
                    actual.position.path,

                version:
                    actual.identity.version,

                generation:
                    actual.lifecycle.generation,

                actual:
                    actual.lifecycle.actual,

                supersedes:
                    actual.lifecycle.supersedes
            },

            historyVersions:
                history.map(
                    shell =>
                        shell.identity.version
                )
        },
        null,
        2
    )
);

