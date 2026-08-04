const {
    ProjectSnapshotError,
    createProjectSnapshot,
    serializeProjectSnapshot,
    parseProjectSnapshot,
    hashProjectSnapshot
} = require("./snapshot");

class ProjectStateError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectStateError";
        this.code = "LS008";
        this.value = value;
    }
}

function assertProjectState(state) {
    if (!state || typeof state !== "object") {
        throw new ProjectStateError(
            "Expected ProjectState.",
            state
        );
    }

    if (state.type !== "ProjectState") {
        throw new ProjectStateError(
            "Expected ProjectState.",
            state
        );
    }

    if (
        !state.snapshot ||
        state.snapshot.type !== "ProjectSnapshot"
    ) {
        throw new ProjectStateError(
            "ProjectState.snapshot is required.",
            state
        );
    }

    if (
        typeof state.snapshotHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(state.snapshotHash)
    ) {
        throw new ProjectStateError(
            "ProjectState.snapshotHash must be a SHA-256 hexadecimal hash.",
            state.snapshotHash
        );
    }

    if (!Array.isArray(state.nodes)) {
        throw new ProjectStateError(
            "ProjectState.nodes must be an array.",
            state.nodes
        );
    }
}

function createProjectState(tree) {
    let snapshot;

    try {
        snapshot =
            createProjectSnapshot(tree);
    } catch (error) {
        if (error instanceof ProjectSnapshotError) {
            throw error;
        }

        throw new ProjectStateError(
            "Failed to create ProjectSnapshot.",
            error
        );
    }

    const snapshotHash =
        hashProjectSnapshot(snapshot);

    const nodes =
        snapshot.nodes.map(node => ({
            path: node.path,
            parent: node.parent,
            order: node.order,
            shellId: node.shellId,
            version: node.version,
            hash: node.hash
        }));

    return {
        type: "ProjectState",
        schemaVersion: 1,
        snapshot,
        snapshotHash,
        nodes
    };
}

function serializeProjectState(state) {
    assertProjectState(state);

    return JSON.stringify(
        state,
        null,
        2
    );
}

function parseProjectState(serialized) {
    if (typeof serialized !== "string") {
        throw new ProjectStateError(
            "Expected serialized ProjectState string.",
            serialized
        );
    }

    let state;

    try {
        state = JSON.parse(serialized);
    } catch (error) {
        throw new ProjectStateError(
            "Invalid serialized ProjectState JSON."
        );
    }

    assertProjectState(state);

    const calculatedHash =
        hashProjectSnapshot(state.snapshot);

    if (calculatedHash !== state.snapshotHash) {
        throw new ProjectStateError(
            "ProjectState snapshotHash does not match snapshot.",
            {
                expected: calculatedHash,
                received: state.snapshotHash
            }
        );
    }

    return state;
}

function cloneProjectState(state) {
    return parseProjectState(
        serializeProjectState(state)
    );
}

module.exports = {
    ProjectStateError,
    createProjectState,
    serializeProjectState,
    parseProjectState,
    cloneProjectState
};
