// tests/unit/project_evolution_pipeline.test.js

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

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
    EvolutionFlowGateway
} = require("../../compiler/project/evolution_flow_gateway");

const {
    ProjectWeaver
} = require("../../compiler/project/weaver");

const {
    ProjectCompiler
} = require("../../compiler/project/compiler");

const {
    ProjectEmitter
} = require("../../compiler/project/emitter");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const HASH_SOURCE =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

function makePayload() {
    return {
        type: "Program",
        declarations: []
    };
}

function makeShell(
    purpose,
    version = 1,
    actual = true,
    generation = 1,
    supersedes = null
) {
    const payload =
        makePayload();

    return {
        type:
            "Shell",

        schemaVersion:
            1,

        identity: {
            id:
                "weapon-system",

            hash:
                hashAST(
                    payload
                ),

            version
        },

        position: {
            path:
                "systems.weapon",

            parent:
                "systems",

            order:
                0
        },

        lifecycle: {
            actual,

            generation,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes
        },

        semantic: {
            name:
                "WeaponSystem",

            purpose,

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

function makeRequest(
    snapshotHash,
    baseHash
) {
    return {
        type:
            "EvolutionRequest",

        schemaVersion:
            1,

        baseSnapshotHash:
            snapshotHash,

        intent:
            "Add pistol support to the weapon system.",

        baseShells: [
            {
                shellId:
                    "weapon-system",

                version:
                    1,

                hash:
                    baseHash,

                path:
                    "systems.weapon"
            }
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

                baseHash,

                reason:
                    "Add pistol support."
            }
        ]
    };
}

function assertFileExists(
    filePath
) {
    assert.strictEqual(
        fs.existsSync(filePath),
        true,
        `Expected emitted file: ${filePath}`
    );
}

function run() {
    const repository =
        new ShellRepository();

    const tree =
        new ProjectTree();

    /*
     * --------------------------------------------------------
     * 1. Initial project
     * --------------------------------------------------------
     */

    const initialShell =
        repository.create(
            makeShell(
                "Controls weapon behavior."
            )
        );

    tree.addShell(
        initialShell
    );

    const snapshotBefore =
        createProjectSnapshot(
            tree
        );

    const snapshotHashBefore =
        hashProjectSnapshot(
            snapshotBefore
        );

    assert.strictEqual(
        typeof snapshotHashBefore,
        "string"
    );

    assert.strictEqual(
        snapshotHashBefore.length,
        64
    );

    /*
     * --------------------------------------------------------
     * 2. Evolution request
     * --------------------------------------------------------
     */

    const request =
        makeRequest(
            snapshotHashBefore,
            initialShell.identity.hash
        );

    /*
     * --------------------------------------------------------
     * 3. Candidate Shell
     * --------------------------------------------------------
     */

    const proposedShell =
        makeShell(
            "Controls weapon and pistol behavior.",
            2,
            false,
            2,
            initialShell.identity.hash
        );

    /*
     * --------------------------------------------------------
     * 4. Real project pipeline
     *
     * EvolutionRequest
     *     ↓
     * EvolutionFlow
     *     ↓
     * Planner
     *     ↓
     * Validator
     *     ↓
     * Executor
     *     ↓
     * Repository + ProjectTree
     *     ↓
     * Weaver
     *     ↓
     * Compiler
     *     ↓
     * Emitter
     *     ↓
     * filesystem
     * --------------------------------------------------------
     */

    const gateway =
        new EvolutionFlowGateway({
            repository,

            tree,

            weaver:
                new ProjectWeaver(),

            compiler:
                new ProjectCompiler(),

            emitter:
                new ProjectEmitter()
        });

    const outputDirectory =
        fs.mkdtempSync(
            path.join(
                os.tmpdir(),
                "luascript-evolution-"
            )
        );

    let result;

    try {
        result =
            gateway.run(
                request,
                [
                    proposedShell
                ],
                outputDirectory
            );

        /*
         * ----------------------------------------------------
         * 5. Gateway result
         * ----------------------------------------------------
         */

        assert.ok(
            result
        );

        assert.strictEqual(
            result.type,
            "EvolutionRunResult"
        );

        assert.strictEqual(
            result.schemaVersion,
            1
        );

        /*
         * ----------------------------------------------------
         * 6. Evolution result
         * ----------------------------------------------------
         */

        assert.ok(
            result.execution
        );

        assert.strictEqual(
            result.execution.type,
            "EvolutionResult"
        );

        assert.strictEqual(
            result.execution.changes.length,
            1
        );

        assert.strictEqual(
            result.execution.changes[0].shellId,
            "weapon-system"
        );

        assert.strictEqual(
            result.execution.changes[0].version,
            2
        );

        assert.strictEqual(
            result.execution.changes[0].generation,
            2
        );

        /*
         * ----------------------------------------------------
         * 7. Weaver result
         * ----------------------------------------------------
         */

        assert.ok(
            result.woven
        );

        assert.strictEqual(
            result.woven.type,
            "WovenProject"
        );

        assert.strictEqual(
            result.woven.files.length,
            1
        );

        assert.strictEqual(
            result.woven.files[0].path,
            "systems/weapon.luau"
        );

        assert.strictEqual(
            result.woven.files[0].shellId,
            "weapon-system"
        );

        assert.strictEqual(
            result.woven.files[0].version,
            2
        );

        assert.ok(
            result.woven.files[0].payload
        );

        /*
         * ----------------------------------------------------
         * 8. Compiler result
         * ----------------------------------------------------
         */

        assert.ok(
            result.compiled
        );

        assert.strictEqual(
            result.compiled.type,
            "CompiledProject"
        );

        assert.strictEqual(
            result.compiled.files.length,
            1
        );

        assert.strictEqual(
            result.compiled.files[0].path,
            "systems/weapon.luau"
        );

        assert.strictEqual(
            typeof result.compiled.files[0].code,
            "string"
        );

        /*
         * ----------------------------------------------------
         * 9. Emitter result
         * ----------------------------------------------------
         */

        assert.ok(
            result.emitted
        );

        assert.strictEqual(
            result.emitted.type,
            "EmittedProject"
        );

        assert.ok(
            Array.isArray(
                result.emitted.files
            )
        );

        /*
         * ----------------------------------------------------
         * 10. Real filesystem output
         * ----------------------------------------------------
         */

        const emittedFile =
            path.join(
                outputDirectory,
                "systems",
                "weapon.luau"
            );

        assertFileExists(
            emittedFile
        );

        const emittedSource =
            fs.readFileSync(
                emittedFile,
                "utf8"
            );

        assert.strictEqual(
            emittedSource,
            result.compiled.files[0].code
        );

        /*
         * ----------------------------------------------------
         * 11. ProjectTree must now contain version 2
         * ----------------------------------------------------
         */

        const updatedShell =
            tree.getShell(
                "systems.weapon"
            );

        assert.ok(
            updatedShell
        );

        assert.strictEqual(
            updatedShell.identity.id,
            "weapon-system"
        );

        assert.strictEqual(
            updatedShell.identity.version,
            2
        );

        assert.strictEqual(
            updatedShell.lifecycle.generation,
            2
        );

        /*
         * ----------------------------------------------------
         * 12. Repository must contain version 2
         * ----------------------------------------------------
         */

        const repositoryVersion =
            repository.getVersion(
                "weapon-system",
                2
            );

        assert.ok(
            repositoryVersion
        );

        assert.strictEqual(
            repositoryVersion.identity.version,
            2
        );

        /*
         * ----------------------------------------------------
         * 13. New snapshot must differ from old snapshot
         * ----------------------------------------------------
         */

        const snapshotAfter =
            createProjectSnapshot(
                tree
            );

        const snapshotHashAfter =
            hashProjectSnapshot(
                snapshotAfter
            );

        assert.strictEqual(
            typeof snapshotHashAfter,
            "string"
        );

        assert.strictEqual(
            snapshotHashAfter.length,
            64
        );

        assert.notStrictEqual(
            snapshotHashAfter,
            snapshotHashBefore
        );

        /*
         * ----------------------------------------------------
         * 14. Integrity chain
         * ----------------------------------------------------
         */

        assert.strictEqual(
            result.execution.snapshotHash,
            snapshotHashAfter
        );

        assert.strictEqual(
            result.woven.snapshotHash,
            snapshotHashAfter
        );

        assert.strictEqual(
            result.compiled.snapshotHash,
            snapshotHashAfter
        );

        /*
         * ----------------------------------------------------
         * 15. Final result
         * ----------------------------------------------------
         */

        console.log(
            "PROJECT EVOLUTION PIPELINE OK"
        );

        console.log(
            JSON.stringify(
                {
                    type:
                        result.type,

                    snapshotBefore:
                        snapshotHashBefore,

                    snapshotAfter:
                        snapshotHashAfter,

                    shellId:
                        updatedShell.identity.id,

                    version:
                        updatedShell.identity.version,

                    generation:
                        updatedShell.lifecycle.generation,

                    woven:
                        result.woven.type,

                    compiled:
                        result.compiled.type,

                    emitted:
                        result.emitted.type,

                    emittedFile
                },
                null,
                2
            )
        );
    } finally {
        fs.rmSync(
            outputDirectory,
            {
                recursive:
                    true,

                force:
                    true
            }
        );
    }
}

try {
    run();
} catch (error) {
    console.error(
        "PROJECT EVOLUTION PIPELINE FAILED"
    );

    console.error(
        error
    );

    process.exit(
        1
    );
}
