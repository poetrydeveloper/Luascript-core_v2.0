// tests/unit/project_inspector.test.js

const assert = require("assert");

const {
    ShellRepository
} = require("../../compiler/shell/repository");

const {
    hashAST
} = require("../../compiler/ast/serializer");

const {
    ProjectShellInspector,
    ProjectInspectorError
} = require("../../compiler/project/inspector");

function makeShell() {
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
                "Weapon behavior ECS system."
        },

        payload
    };
}

try {
    const repository =
        new ShellRepository();

    const shell =
        repository.create(
            makeShell()
        );

    const inspector =
        new ProjectShellInspector(
            repository
        );

    const request = {
        shellId:
            shell.identity.id,

        version:
            shell.identity.version,

        hash:
            shell.identity.hash
    };

    const inspected =
        inspector.inspect(
            request
        );

    assert.notStrictEqual(
        inspected,
        shell
    );

    assert.strictEqual(
        inspected.identity.id,
        "weapon-system"
    );

    assert.strictEqual(
        inspected.identity.version,
        1
    );

    assert.strictEqual(
        inspected.identity.hash,
        shell.identity.hash
    );

    assert.strictEqual(
        inspected.position.path,
        "systems.weapon"
    );

    assert.strictEqual(
        inspected.payload.type,
        "Program"
    );

    // ------------------------------------------------------------
    // Wrong hash must be rejected.
    // ------------------------------------------------------------

    assert.throws(
        () => {
            inspector.inspect({
                shellId:
                    shell.identity.id,

                version: 1,

                hash:
                    "0000000000000000000000000000000000000000000000000000000000000000"
            });
        },
        error => {
            return (
                error instanceof ProjectInspectorError &&
                error.code === "LS011"
            );
        }
    );

    // ------------------------------------------------------------
    // Unknown version must be rejected.
    // ------------------------------------------------------------

    assert.throws(
        () => {
            inspector.inspect({
                shellId:
                    shell.identity.id,

                version: 99,

                hash:
                    shell.identity.hash
            });
        },
        error => {
            return (
                error instanceof ProjectInspectorError &&
                error.code === "LS011"
            );
        }
    );

    // ------------------------------------------------------------
    // Multiple Shells.
    // ------------------------------------------------------------

    const inspectedMany =
        inspector.inspectMany([
            request,
            request
        ]);

    assert.strictEqual(
        inspectedMany.length,
        2
    );

    assert.strictEqual(
        inspectedMany[0].identity.id,
        "weapon-system"
    );

    assert.strictEqual(
        inspectedMany[1].identity.id,
        "weapon-system"
    );

    console.log(
        "PROJECT INSPECTOR OK"
    );

    console.log(
        JSON.stringify(
            {
                shell: {
                    id:
                        inspected.identity.id,

                    version:
                        inspected.identity.version,

                    path:
                        inspected.position.path,

                    hash:
                        inspected.identity.hash
                },

                verified:
                    true,

                multiple:
                    inspectedMany.length
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "PROJECT INSPECTOR FAILED"
    );

    console.error(error);

    process.exit(1);
}
