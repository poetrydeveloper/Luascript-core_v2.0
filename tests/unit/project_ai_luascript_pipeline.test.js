const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectSnapshot,
    hashProjectSnapshot
} = require("../../compiler/project/snapshot");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const {
    ShellProposalValidator
} = require("../../compiler/project/shell_proposal_validator");

const {
    ShellSourceValidator
} = require("../../compiler/project/shell_source_validator");

const {
    ShellSourceBuilder
} = require("../../compiler/project/shell_source_builder");

const {
    ProjectEvolutionExecutor
} = require("../../compiler/project/evolution_executor");

const {
    ShellProposalApplier
} = require("../../compiler/project/shell_proposal_applier");


/*
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

function makeBaseShell() {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",

        schemaVersion: 1,

        identity: {
            id: "weapon-system",
            hash: hashAST(payload),
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


function createPlan(tree) {
    const snapshot =
        createProjectSnapshot(
            tree
        );

    const snapshotHash =
        hashProjectSnapshot(
            snapshot
        );

    return {
        type:
            "EvolutionPlan",

        schemaVersion:
            1,

        snapshotHash,

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
                    1,

                baseHash:
                    tree.getShell(
                        "systems.weapon"
                    ).identity.hash
            }
        ]
    };
}


/*
 * ------------------------------------------------------------
 * Repository + ProjectTree
 * ------------------------------------------------------------
 */

const repository =
    new ShellRepository();

const tree =
    new ProjectTree();


/*
 * ------------------------------------------------------------
 * Initial Shell v1
 * ------------------------------------------------------------
 */

const baseShell =
    makeBaseShell();

const storedBaseShell =
    repository.create(
        baseShell
    );

tree.addShell(
    storedBaseShell
);

const baseHash =
    storedBaseShell.identity.hash;


/*
 * ------------------------------------------------------------
 * Plan
 * ------------------------------------------------------------
 */

const plan =
    createPlan(
        tree
    );


/*
 * ------------------------------------------------------------
 * AI Shell Proposal
 * ------------------------------------------------------------
 */

const source =
`class WeaponSystem extends System do
end
# AURA_END`;


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

    baseHash:
        storedBaseShell.identity.hash,

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
    storedBaseShell.identity.hash
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
    validatedSource.operation,
    "UPDATE"
);

assert.strictEqual(
    validatedSource.baseVersion,
    1
);

assert.strictEqual(
    validatedSource.baseHash,
    storedBaseShell.identity.hash
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

assert.ok(
    Array.isArray(
        validatedSource.tokens
    )
);

assert.ok(
    validatedSource.tokens.length > 0
);

assert.strictEqual(
    validatedSource.astValidated,
    false
);


/*
 * ------------------------------------------------------------
 * Stage 3
 *
 * Build candidate Shell
 *
 * IMPORTANT:
 * ShellSourceBuilder does NOT commit anything.
 * It only constructs a candidate.
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
    storedBaseShell.identity.hash
);

assert.strictEqual(
    prepared.path,
    "systems.weapon"
);

assert.strictEqual(
    prepared.generation,
    2
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

assert.strictEqual(
    prepared.candidate.position.path,
    "systems.weapon"
);

assert.strictEqual(
    prepared.candidate.position.parent,
    "systems"
);

assert.strictEqual(
    prepared.candidate.semantic.purpose,
    proposal.semantic.purpose
);

assert.deepStrictEqual(
    prepared.candidate.semantic.tags,
    proposal.semantic.tags
);


/*
 * ------------------------------------------------------------
 * Stage 4
 *
 * ProjectEvolutionExecutor
 *
 * Executor requires BOTH:
 *
 *   repository
 *   tree
 *
 * It is the mutation boundary.
 * ------------------------------------------------------------
 */

const executor =
    new ProjectEvolutionExecutor(
        repository,
        tree
    );


/*
 * ------------------------------------------------------------
 * Stage 5
 *
 * ShellProposalApplier
 * ------------------------------------------------------------
 */

const applier =
    new ShellProposalApplier(
        executor
    );


/*
 * ------------------------------------------------------------
 * Apply prepared candidate
 * ------------------------------------------------------------
 */

const result =
    applier.apply(
        prepared,
        plan
    );


/*
 * ------------------------------------------------------------
 * Evolution result
 * ------------------------------------------------------------
 */

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

assert.strictEqual(
    result.changes[0].shellId,
    "weapon-system"
);

assert.strictEqual(
    result.changes[0].version,
    2
);

assert.strictEqual(
    result.changes[0].generation,
    2
);


/*
 * ------------------------------------------------------------
 * Repository state after commit
 * ------------------------------------------------------------
 */

const currentShell =
    repository.get(
        "weapon-system"
    );

assert.ok(
    currentShell
);

assert.strictEqual(
    currentShell.identity.id,
    "weapon-system"
);

assert.strictEqual(
    currentShell.identity.version,
    2
);

assert.strictEqual(
    currentShell.lifecycle.generation,
    2
);

assert.strictEqual(
    currentShell.lifecycle.actual,
    true
);

assert.strictEqual(
    currentShell.lifecycle.supersedes,
    storedBaseShell.identity.hash
);


/*
 * ------------------------------------------------------------
 * ProjectTree state after commit
 * ------------------------------------------------------------
 */

const treeShell =
    tree.getShell(
        "systems.weapon"
    );

assert.ok(
    treeShell
);

assert.strictEqual(
    treeShell.identity.id,
    "weapon-system"
);

assert.strictEqual(
    treeShell.identity.version,
    2
);

assert.strictEqual(
    treeShell.lifecycle.generation,
    2
);

assert.strictEqual(
    treeShell.lifecycle.actual,
    true
);

assert.strictEqual(
    treeShell.lifecycle.supersedes,
    storedBaseShell.identity.hash
);


/*
 * ------------------------------------------------------------
 * Old repository version remains immutable/history.
 * ------------------------------------------------------------
 */

const oldVersion =
    repository.getVersion(
        "weapon-system",
        1
    );

assert.ok(
    oldVersion
);

assert.strictEqual(
    oldVersion.identity.version,
    1
);

assert.strictEqual(
    oldVersion.lifecycle.actual,
    false
);


/*
 * ------------------------------------------------------------
 * Snapshot after evolution
 * ------------------------------------------------------------
 */

const snapshotAfter =
    createProjectSnapshot(
        tree
    );

const snapshotAfterHash =
    hashProjectSnapshot(
        snapshotAfter
    );

assert.ok(
    typeof snapshotAfterHash ===
    "string"
);

assert.strictEqual(
    snapshotAfterHash.length,
    64
);


/*
 * ------------------------------------------------------------
 * Output
 * ------------------------------------------------------------
 */

console.log(
    "PROJECT AI LUASCRIPT PIPELINE OK"
);

console.log(
    JSON.stringify(
        {
            type:
                "ProjectAILuascriptPipelineResult",

            snapshotBefore:
                plan.snapshotHash,

            snapshotAfter:
                snapshotAfterHash,

            shellId:
                currentShell.identity.id,

            version:
                currentShell.identity.version,

            generation:
                currentShell.lifecycle.generation,

            sourceValidated:
                validatedSource.type,

            candidateBuilt:
                prepared.type,

            committed:
                currentShell.lifecycle.actual
        },
        null,
        2
    )
);
