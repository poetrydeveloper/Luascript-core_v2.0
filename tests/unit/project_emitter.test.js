// tests/unit/project_emitter.test.js

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const {
    ProjectEmitter,
    ProjectEmitterError
} = require("../../compiler/project/emitter");

const SNAPSHOT_HASH =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

try {
    const temporaryRoot =
        fs.mkdtempSync(
            path.join(
                os.tmpdir(),
                "luascript-project-emitter-"
            )
        );

    const outputDirectory =
        path.join(
            temporaryRoot,
            "roblox-project"
        );

    const compiledProject = {
        type: "CompiledProject",
        schemaVersion: 1,
        snapshotHash: SNAPSHOT_HASH,

        files: [
            {
                path: "systems/weapon.luau",
                shellId: "weapon-system",
                version: 2,
                generation: 2,
                code:
                    "local WeaponSystem = {}\\n" +
                    "WeaponSystem.__index = WeaponSystem\\n"
            },

            {
                path: "systems.luau",
                shellId: "systems",
                version: 1,
                generation: 1,
                code:
                    "local Systems = {}\\n" +
                    "Systems.__index = Systems\\n"
            }
        ]
    };

    const emitter =
        new ProjectEmitter();

    const result =
        emitter.emit(
            compiledProject,
            outputDirectory
        );

    assert.strictEqual(
        result.type,
        "EmittedProject"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.snapshotHash,
        SNAPSHOT_HASH
    );

    assert.strictEqual(
        result.outputDirectory,
        path.resolve(outputDirectory)
    );

    assert.deepStrictEqual(
        result.files.map(
            file => file.path
        ),
        [
            "systems.luau",
            "systems/weapon.luau"
        ]
    );

    const systemsFile =
        path.join(
            outputDirectory,
            "systems.luau"
        );

    const weaponFile =
        path.join(
            outputDirectory,
            "systems",
            "weapon.luau"
        );

    assert.strictEqual(
        fs.existsSync(systemsFile),
        true
    );

    assert.strictEqual(
        fs.existsSync(weaponFile),
        true
    );

    assert.strictEqual(
        fs.readFileSync(
            systemsFile,
            "utf8"
        ),
        compiledProject.files[1].code
    );

    assert.strictEqual(
        fs.readFileSync(
            weaponFile,
            "utf8"
        ),
        compiledProject.files[0].code
    );

    // Determinism:
    // emitting the same project again must
    // produce the same file contents and metadata.

    const resultAgain =
        emitter.emit(
            compiledProject,
            outputDirectory
        );

    assert.deepStrictEqual(
        resultAgain.files,
        result.files
    );

    assert.strictEqual(
        fs.readFileSync(
            systemsFile,
            "utf8"
        ),
        compiledProject.files[1].code
    );

    assert.strictEqual(
        fs.readFileSync(
            weaponFile,
            "utf8"
        ),
        compiledProject.files[0].code
    );

    // Path traversal must be rejected.

    assert.throws(
        () => {
            emitter.emit(
                {
                    type: "CompiledProject",
                    schemaVersion: 1,
                    snapshotHash:
                        SNAPSHOT_HASH,
                    files: [
                        {
                            path:
                                "../outside.luau",
                            shellId: "evil",
                            version: 1,
                            generation: 1,
                            code: "bad"
                        }
                    ]
                },
                outputDirectory
            );
        },
        error => {
            return (
                error instanceof ProjectEmitterError &&
                error.code === "LS012"
            );
        }
    );

    // Absolute paths must be rejected.

    assert.throws(
        () => {
            emitter.emit(
                {
                    type: "CompiledProject",
                    schemaVersion: 1,
                    snapshotHash:
                        SNAPSHOT_HASH,
                    files: [
                        {
                            path:
                                "/absolute.luau",
                            shellId: "evil",
                            version: 1,
                            generation: 1,
                            code: "bad"
                        }
                    ]
                },
                outputDirectory
            );
        },
        error => {
            return (
                error instanceof ProjectEmitterError &&
                error.code === "LS012"
            );
        }
    );

    fs.rmSync(
        temporaryRoot,
        {
            recursive: true,
            force: true
        }
    );

    console.log(
        "PROJECT EMITTER OK"
    );

    console.log(
        JSON.stringify(
            {
                type: result.type,
                snapshotHash:
                    result.snapshotHash,
                files: result.files
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT EMITTER FAILED"
    );

    console.error(error);

    process.exit(1);
}
