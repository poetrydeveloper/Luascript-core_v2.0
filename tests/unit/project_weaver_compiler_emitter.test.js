// tests/unit/project_weaver_compiler_emitter.test.js

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
    ProjectWeaver
} = require(
    "../../compiler/project/weaver"
);

const {
    ProjectCompiler
} = require(
    "../../compiler/project/compiler"
);

const {
    ProjectEmitter
} = require(
    "../../compiler/project/emitter"
);

const HASH =
    "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164";

function makeShell(
    shellPath,
    shellId
) {
    return {
        type:
            "Shell",

        schemaVersion:
            1,

        identity: {
            id:
                shellId,

            hash:
                HASH,

            version:
                1
        },

        position: {
            path:
                shellPath,

            parent:
                null,

            order:
                0
        },

        lifecycle: {
            actual:
                true,

            generation:
                1,

            createdAt:
                "2026-08-04T00:00:00.000Z",

            supersedes:
                null
        },

        semantic: {
            name:
                shellId,

            purpose:
                "Test shell.",

            tags: [
                "test"
            ],

            description:
                "Test shell."
        },

        payload: {
            type:
                "Program",

            declarations: []
        }
    };
}

function makeResolvedProject() {
    return {
        type:
            "ResolvedProject",

        schemaVersion:
            1,

        snapshotHash:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        shells: [
            makeShell(
                "systems.weapon.timer",
                "weapon-timer-system"
            ),

            makeShell(
                "systems",
                "systems"
            ),

            makeShell(
                "systems.weapon",
                "weapon-system"
            )
        ]
    };
}

function run() {
    const project =
        makeResolvedProject();

    /*
     * --------------------------------------------------------
     * RESOLVED PROJECT
     * --------------------------------------------------------
     */

    assert.strictEqual(
        project.type,
        "ResolvedProject"
    );

    assert.strictEqual(
        project.shells.length,
        3
    );

    /*
     * --------------------------------------------------------
     * WEAVER
     * --------------------------------------------------------
     */

    const weaver =
        new ProjectWeaver();

    const woven =
        weaver.weave(
            project
        );

    assert.strictEqual(
        woven.type,
        "WovenProject"
    );

    assert.strictEqual(
        woven.schemaVersion,
        1
    );

    assert.strictEqual(
        woven.snapshotHash,
        project.snapshotHash
    );

    assert.strictEqual(
        woven.files.length,
        3
    );

    assert.deepStrictEqual(
        woven.files.map(
            file => file.path
        ),
        [
            "systems.luau",
            "systems/weapon.luau",
            "systems/weapon/timer.luau"
        ]
    );

    assert.deepStrictEqual(
        woven.files.map(
            file => file.shellId
        ),
        [
            "systems",
            "weapon-system",
            "weapon-timer-system"
        ]
    );

    for (
        const file of woven.files
    ) {
        assert.strictEqual(
            file.payload.type,
            "Program"
        );

        assert.ok(
            Array.isArray(
                file.payload.declarations
            )
        );
    }

    /*
     * Weaver must NOT compile.
     */

    assert.strictEqual(
        woven.files[0].source,
        undefined
    );

    /*
     * --------------------------------------------------------
     * COMPILER
     * --------------------------------------------------------
     */

    const compiler =
        new ProjectCompiler();

    const compiled =
        compiler.compile(
            woven
        );

    assert.strictEqual(
        compiled.type,
        "CompiledProject"
    );

    assert.strictEqual(
        compiled.schemaVersion,
        1
    );

    assert.strictEqual(
        compiled.snapshotHash,
        project.snapshotHash
    );

    assert.strictEqual(
        compiled.files.length,
        3
    );

    for (
        const file of compiled.files
    ) {
        assert.strictEqual(
            typeof file.code,
            "string"
        );

        assert.strictEqual(
            file.code,
            ""
        );
    }

    /*
     * --------------------------------------------------------
     * EMITTER
     * --------------------------------------------------------
     */

    const outputDirectory =
        fs.mkdtempSync(
            path.join(
                os.tmpdir(),
                "luascript-emitter-"
            )
        );

    try {
        const emitter =
            new ProjectEmitter();

        const emitted =
            emitter.emit(
                compiled,
                outputDirectory
            );

        assert.strictEqual(
            emitted.type,
            "EmittedProject"
        );

        assert.strictEqual(
            emitted.schemaVersion,
            1
        );

        assert.strictEqual(
            emitted.snapshotHash,
            project.snapshotHash
        );

        assert.strictEqual(
            emitted.outputDirectory,
            path.resolve(
                outputDirectory
            )
        );

        assert.strictEqual(
            emitted.files.length,
            3
        );

        for (
            const file of emitted.files
        ) {
            const target =
                path.join(
                    outputDirectory,
                    file.path
                );

            assert.ok(
                fs.existsSync(
                    target
                )
            );

            assert.strictEqual(
                fs.readFileSync(
                    target,
                    "utf8"
                ),
                ""
            );
        }

        /*
         * ----------------------------------------------------
         * PIPELINE INTEGRITY
         * ----------------------------------------------------
         */

        assert.deepStrictEqual(
            emitted.files.map(
                file => file.path
            ),
            [
                "systems.luau",
                "systems/weapon.luau",
                "systems/weapon/timer.luau"
            ]
        );

        assert.deepStrictEqual(
            emitted.files.map(
                file => file.shellId
            ),
            [
                "systems",
                "weapon-system",
                "weapon-timer-system"
            ]
        );

        console.log(
            "PROJECT WEAVER COMPILER EMITTER OK"
        );

        console.log(
            JSON.stringify(
                {
                    woven:
                        woven.type,

                    compiled:
                        compiled.type,

                    emitted:
                        emitted.type,

                    files:
                        emitted.files.length,

                    paths:
                        emitted.files.map(
                            file => file.path
                        )
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
        "PROJECT WEAVER COMPILER EMITTER FAILED"
    );

    console.error(
        error
    );

    process.exit(1);
}
