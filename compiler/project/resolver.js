const {
    ProjectStateError,
    cloneProjectState
} = require("./state");

class ProjectResolverError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectResolverError";
        this.code = "LS009";
        this.value = value;
    }
}

class ProjectStateResolver {
    constructor(repository) {
        if (!repository || typeof repository.getVersion !== "function") {
            throw new ProjectResolverError(
                "Expected ShellRepository."
            );
        }

        this.repository = repository;
    }

    resolve(state) {
        if (!state || typeof state !== "object") {
            throw new ProjectResolverError(
                "Expected ProjectState.",
                state
            );
        }

        if (state.type !== "ProjectState") {
            throw new ProjectResolverError(
                "Expected ProjectState.",
                state
            );
        }

        const projectState =
            cloneProjectState(state);

        const shells = [];

        for (const node of projectState.nodes) {
            const shell =
                this.repository.getVersion(
                    node.shellId,
                    node.version
                );

            if (!shell) {
                throw new ProjectResolverError(
                    `Shell '${node.shellId}' version ${node.version} was not found.`,
                    node
                );
            }

            if (shell.identity.hash !== node.hash) {
                throw new ProjectResolverError(
                    `Shell '${node.shellId}' version ${node.version} hash mismatch.`,
                    {
                        expected: node.hash,
                        received: shell.identity.hash,
                        path: node.path
                    }
                );
            }

            if (shell.position.path !== node.path) {
                throw new ProjectResolverError(
                    `Shell '${node.shellId}' path mismatch.`,
                    {
                        expected: node.path,
                        received: shell.position.path
                    }
                );
            }

            shells.push(shell);
        }

        return {
            type: "ResolvedProject",
            schemaVersion: 1,
            snapshotHash: projectState.snapshotHash,
            shells
        };
    }
}

module.exports = {
    ProjectResolverError,
    ProjectStateResolver
};
