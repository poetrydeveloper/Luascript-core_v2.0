// tests/unit/project_evolution_planner.test.js

const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const {
    ProjectTree
} = require("../../compiler/project_tree");

const {
    createProjectContext
} = require("../../compiler/project/context");

const {
    createEvolutionRequest
} = require("../../compiler/project/evolution");

const {
    planEvolution,
    serializeEvolutionPlan,
    parseEvolutionPlan,
    cloneEvolutionPlan,
    EvolutionPlannerError
} = require("../../compiler/project/evolution_planner");

function makeShell({
    id,
    path,
    parent,
    purpose
}) {
    const payload = {
        type: "Program",
        declarations: []
    };

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id,
            hash: hashAST(payload),
            version: 1
        },

        position: {
            path,
            parent,
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
            name: id,
            purpose,
            tags: [
                "test"
            ],
            description:
                `Test shell for ${id}.`
        },

        payload
    };
}

try {
    const repository =
        new ShellRepository();

    const systems =
        repository.create(
            makeShell({
                id: "systems",
                path: "systems",
                parent: null,
                purpose:
                    "Root systems."
            })
        );

    const weapon =
        repository.create(
            makeShell({
                id: "weapon-system",
                path: "systems.weapon",
                parent: "systems",
                purpose:
                    "Controls weapon behavior."
            })
        );

    const timer =
        repository.create(
            makeShell({
                id: "weapon-timer-system",
                path:
                    "systems.weapon.timer",
                parent:
                    "systems.weapon",
                purpose:
                    "Updates weapon cooldown."
            })
        );

    const tree =
        new ProjectTree();

    tree.addShell(systems);
    tree.addShell(weapon);
    tree.addShell(timer);

    const context =
        createProjectContext(tree);

    // ------------------------------------------------------------
    // Build an evolution request against the current snapshot.
    // ------------------------------------------------------------

    const request =
        createEvolutionRequest({
            baseSnapshotHash:
                context.project.snapshotHash,

            intent:
                "Add pistol support to the weapon system.",

            baseShells: [
                {
                    shellId:
                        "weapon-system",

                    version:
                        weapon.identity.version,

                    hash:
                        weapon.identity.hash,

                    path:
                        weapon.position.path
                }
            ],

            changes: [
                {
                    shellId:
                        "weapon-system",

                    operation:
                        "UPDATE",

                    baseVersion:
                        weapon.identity.version,

                    baseHash:
                        weapon.identity.hash,

                    reason:
                        "Weapon system must support pistol state."
                }
            ]
        });

    // ------------------------------------------------------------
    // Plan.
    // ------------------------------------------------------------

    const plan =
        planEvolution(
            context,
            request
        );

    assert.strictEqual(
        plan.type,
        "EvolutionPlan"
    );

    assert.strictEqual(
        plan.schemaVersion,
        1
    );

    assert.strictEqual(
        plan.baseSnapshotHash,
        context.project.snapshotHash
    );

    assert.strictEqual(
        plan.intent,
        request.intent
    );

    assert.deepStrictEqual(
        plan.affectedShells,
        [
            "systems.weapon"
        ]
    );

    assert.strictEqual(
        plan.changes.length,
        1
    );

    assert.strictEqual(
        plan.changes[0].shellId,
        "weapon-system"
    );

    assert.strictEqual(
        plan.changes[0].operation,
        "UPDATE"
    );

    assert.strictEqual(
        plan.changes[0].path,
        "systems.weapon"
    );

    assert.strictEqual(
        plan.changes[0].baseVersion,
        1
    );

    assert.strictEqual(
        plan.changes[0].baseHash,
        weapon.identity.hash
    );

    // ------------------------------------------------------------
    // Serialization round-trip.
    // ------------------------------------------------------------

    const serialized =
        serializeEvolutionPlan(
            plan
        );

    const parsed =
        parseEvolutionPlan(
            serialized
        );

    assert.deepStrictEqual(
        parsed,
        plan
    );

    const cloned =
        cloneEvolutionPlan(
            plan
        );

    assert.deepStrictEqual(
        cloned,
        plan
    );

    // ------------------------------------------------------------
    // CREATE plan.
    // ------------------------------------------------------------

    const createRequest =
        createEvolutionRequest({
            baseSnapshotHash:
                context.project.snapshotHash,

            intent:
                "Create pistol system.",

            baseShells: [],

            changes: [
                {
                    shellId:
                        "pistol-system",

                    operation:
                        "CREATE",

                    reason:
                        "Introduce pistol-specific state."
                }
            ]
        });

    const createPlan =
        planEvolution(
            context,
            createRequest
        );

    assert.strictEqual(
        createPlan.changes.length,
        1
    );

    assert.strictEqual(
        createPlan.changes[0].operation,
        "CREATE"
    );

    assert.strictEqual(
        createPlan.changes[0].shellId,
        "pistol-system"
    );

    // ------------------------------------------------------------
    // Stale ProjectContext must be rejected.
    // ------------------------------------------------------------

    const staleContext =
        JSON.parse(
            JSON.stringify(context)
        );

    staleContext.project.snapshotHash =
        "0000000000000000000000000000000000000000000000000000000000000000";

    assert.throws(
        () => {
            planEvolution(
                staleContext,
                request
            );
        },
        error => {
            return (
                error instanceof EvolutionPlannerError &&
                error.code === "LS013"
            );
        }
    );

    // ------------------------------------------------------------
    // Non-existing UPDATE target must be rejected.
    // ------------------------------------------------------------

    const invalidRequest =
        createEvolutionRequest({
            baseSnapshotHash:
                context.project.snapshotHash,

            intent:
                "Modify missing shell.",

            baseShells: [],

            changes: [
                {
                    shellId:
                        "missing-system",

                    operation:
                        "UPDATE",

                    baseVersion:
                        1,

                    baseHash:
                        weapon.identity.hash
                }
            ]
        });

    assert.throws(
        () => {
            planEvolution(
                context,
                invalidRequest
            );
        },
        error => {
            return (
                error instanceof EvolutionPlannerError &&
                error.code === "LS013"
            );
        }
    );

    console.log(
        "PROJECT EVOLUTION PLANNER OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    plan.type,

                snapshotHash:
                    plan.baseSnapshotHash,

                intent:
                    plan.intent,

                affectedShells:
                    plan.affectedShells,

                changes:
                    plan.changes.map(
                        change => ({
                            shellId:
                                change.shellId,

                            operation:
                                change.operation,

                            path:
                                change.path,

                            baseVersion:
                                change.baseVersion
                        })
                    )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EVOLUTION PLANNER FAILED"
    );

    console.error(error);

    process.exit(1);
}
