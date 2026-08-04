// compiler/project/inspector.js
//
// Project Shell Inspector.
//
// Purpose:
// - expose selected Shells to an AI;
// - require an exact shell version;
// - verify the expected hash;
// - return a cloned Shell;
// - never mutate repository state.
//
// Flow:
//
// AIProjectContext
//       |
//       v
// shellId + version + hash
//       |
//       v
// ShellRepository
//       |
//       v
// verified Shell
//

class ProjectInspectorError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectInspectorError";
        this.code = "LS011";
        this.value = value;
    }
}

class ProjectShellInspector {
    constructor(repository) {
        if (
            !repository ||
            typeof repository.getVersion !== "function"
        ) {
            throw new ProjectInspectorError(
                "Expected ShellRepository."
            );
        }

        this.repository = repository;
    }

    inspect(request) {
        this.assertRequest(request);

        const shell =
            this.repository.getVersion(
                request.shellId,
                request.version
            );

        if (!shell) {
            throw new ProjectInspectorError(
                `Shell '${request.shellId}' version ${request.version} was not found.`,
                request
            );
        }

        if (
            shell.identity.hash !==
            request.hash
        ) {
            throw new ProjectInspectorError(
                `Shell '${request.shellId}' version ${request.version} hash mismatch.`,
                {
                    shellId: request.shellId,
                    version: request.version,
                    expected: request.hash,
                    received: shell.identity.hash
                }
            );
        }

        return shell;
    }

    inspectMany(requests) {
        if (!Array.isArray(requests)) {
            throw new ProjectInspectorError(
                "Expected an array of Shell inspection requests.",
                requests
            );
        }

        return requests.map(
            request => this.inspect(request)
        );
    }

    assertRequest(request) {
        if (
            !request ||
            typeof request !== "object"
        ) {
            throw new ProjectInspectorError(
                "Expected Shell inspection request.",
                request
            );
        }

        if (
            typeof request.shellId !== "string" ||
            request.shellId.length === 0
        ) {
            throw new ProjectInspectorError(
                "Shell inspection request.shellId is required.",
                request
            );
        }

        if (
            typeof request.version !== "number" ||
            !Number.isInteger(request.version) ||
            request.version < 1
        ) {
            throw new ProjectInspectorError(
                "Shell inspection request.version must be a positive integer.",
                request.version
            );
        }

        if (
            typeof request.hash !== "string" ||
            !/^[a-f0-9]{64}$/.test(request.hash)
        ) {
            throw new ProjectInspectorError(
                "Shell inspection request.hash must be a SHA-256 hexadecimal hash.",
                request.hash
            );
        }
    }
}

module.exports = {
    ProjectInspectorError,
    ProjectShellInspector
};
