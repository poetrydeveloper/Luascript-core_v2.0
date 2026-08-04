// tests/unit/project_compiler.test.js

const assert = require("assert");

const {
    ProjectCompiler,
    ProjectCompilerError
} = require("../../compiler/project/compiler");

const SNAPSHOT_HASH =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function makeWovenProject() {
    return {
        type: "WovenProject",
        schemaVersion: 1,
        snapshotHash: SNAPSHOT_HASH,

        files: [
            {
                path: "systems/weapon.luau",
                shellId: "weapon-system",
                version: 1,
                generation: 1,

                payload: {
                    type: "Program",

                    declarations: [
                        {
                            type: "ClassDeclaration",
                            name: "WeaponSystem",
                            members: []
                        }
                    ]
                }
            },

            {
                path: "systems.luau",
                shellId: "systems",
                version: 1,
                generation: 1,

                payload: {
                    type: "Program",

                    declarations: [
                        {
                            type: "ClassDeclaration",
                            name: "Systems",
                            members: []
                        }
                    ]
                }
            }
        ]
    };
}

try {
    const wovenProject =
        makeWovenProject();

    const compiler =
        new ProjectCompiler();

    const compiled =
        compiler.compile(
            wovenProject
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
        SNAPSHOT_HASH
    );

    assert.strictEqual(
        compiled.files.length,
        2
    );

    assert.deepStrictEqual(
        compiled.files.map(
            file => file.path
        ),
        [
            "systems.luau",
            "systems/weapon.luau"
        ]
    );

    const systems =
        compiled.files.find(
            file =>
                file.path === "systems.luau"
        );

    const weapon =
        compiled.files.find(
            file =>
                file.path === "systems/weapon.luau"
        );

    assert.strictEqual(
        systems.shellId,
        "systems"
    );

    assert.strictEqual(
        weapon.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        systems.version,
        1
    );

    assert.strictEqual(
        weapon.generation,
        1
    );

    assert.strictEqual(
        systems.code,
        [
            "local Systems = {}",
            "Systems.__index = Systems",
            ""
        ].join("\n")
    );

    assert.strictEqual(
        weapon.code,
        [
            "local WeaponSystem = {}",
            "WeaponSystem.__index = WeaponSystem",
            ""
        ].join("\n")
    );

    // Determinism:
    // compiling the exact same WovenProject twice
    // must produce byte-for-byte identical JSON-relevant output.

    const compiledAgain =
        compiler.compile(
            wovenProject
        );

    assert.deepStrictEqual(
        compiledAgain,
        compiled
    );

    // Snapshot identity must survive compilation.

    assert.strictEqual(
        compiled.snapshotHash,
        wovenProject.snapshotHash
    );

    // Invalid project must be rejected.

    assert.throws(
        () => {
            compiler.compile({
                type: "WrongProject",
                schemaVersion: 1,
                snapshotHash: SNAPSHOT_HASH,
                files: []
            });
        },
        error => {
            return (
                error instanceof ProjectCompilerError &&
                error.code === "LS011"
            );
        }
    );

    console.log(
        "PROJECT COMPILER OK"
    );

    console.log(
        JSON.stringify(
            {
                type: compiled.type,
                snapshotHash: compiled.snapshotHash,
                files: compiled.files.map(
                    file => ({
                        path: file.path,
                        shellId: file.shellId,
                        version: file.version,
                        generation: file.generation,
                        code: file.code
                    })
                )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT COMPILER FAILED"
    );

    console.error(error);

    process.exit(1);
}
