const assert = require("assert");

const {
    ProjectWeaver,
    shellPathToFilePath
} = require("../../compiler/project/weaver");

function shell(path, id, order = 0) {
    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id,
            hash:
                "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164",
            version: 1
        },

        position: {
            path,
            parent: null,
            order
        },

        lifecycle: {
            actual: true,
            generation: 1,
            createdAt: "2026-08-04T00:00:00.000Z",
            supersedes: null
        },

        semantic: {
            name: id,
            purpose: "Test shell.",
            tags: ["test"],
            description: "Test shell."
        },

        payload: {
            type: "Program",
            declarations: []
        }
    };
}

try {
    assert.strictEqual(
        shellPathToFilePath(
            "systems.weapon.timer"
        ),
        "systems/weapon/timer.luau"
    );

    const project = {
        type: "ResolvedProject",
        schemaVersion: 1,

        snapshotHash:
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

        shells: [
            shell(
                "systems.weapon.timer",
                "weapon-timer-system"
            ),

            shell(
                "systems",
                "systems"
            ),

            shell(
                "systems.weapon",
                "weapon-system"
            )
        ]
    };

    const weaver =
        new ProjectWeaver();

    const woven =
        weaver.weave(project);

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

    assert.strictEqual(
        woven.files[0].source,
        undefined
    );

    assert.strictEqual(
        woven.files[1].source,
        undefined
    );

    assert.strictEqual(
        woven.files[2].source,
        undefined
    );

    assert.strictEqual(
        woven.files[0].payload.type,
        "Program"
    );

    assert.strictEqual(
        woven.files[1].payload.type,
        "Program"
    );

    assert.strictEqual(
        woven.files[2].payload.type,
        "Program"
    );

    console.log(
        "PROJECT WEAVER OK"
    );

    console.log(
        JSON.stringify(
            {
                type: woven.type,
                snapshotHash:
                    woven.snapshotHash,
                files:
                    woven.files.map(
                        file => ({
                            path: file.path,
                            shellId: file.shellId,
                            version: file.version,
                            generation:
                                file.generation
                        })
                    )
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT WEAVER FAILED"
    );

    console.error(error);

    process.exit(1);
}
