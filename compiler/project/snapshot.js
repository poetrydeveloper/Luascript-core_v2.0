const crypto = require("crypto");

class ProjectSnapshotError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectSnapshotError";
        this.code = "LS007";
        this.value = value;
    }
}

function assertProjectTree(tree) {
    if (!tree || typeof tree !== "object") {
        throw new ProjectSnapshotError(
            "Expected ProjectTree object.",
            tree
        );
    }

    if (!(tree.nodes instanceof Map)) {
        throw new ProjectSnapshotError(
            "ProjectTree.nodes must be a Map.",
            tree
        );
    }
}

function assertProjectSnapshot(snapshot) {
    if (
        !snapshot ||
        typeof snapshot !== "object"
    ) {
        throw new ProjectSnapshotError(
            "Expected ProjectSnapshot.",
            snapshot
        );
    }

    if (snapshot.type !== "ProjectSnapshot") {
        throw new ProjectSnapshotError(
            "Expected ProjectSnapshot.",
            snapshot
        );
    }

    if (snapshot.schemaVersion !== 1) {
        throw new ProjectSnapshotError(
            "Unsupported ProjectSnapshot schema version.",
            snapshot.schemaVersion
        );
    }

    if (!Array.isArray(snapshot.nodes)) {
        throw new ProjectSnapshotError(
            "ProjectSnapshot.nodes must be an array.",
            snapshot.nodes
        );
    }

    for (const node of snapshot.nodes) {
        if (!node || typeof node !== "object") {
            throw new ProjectSnapshotError(
                "ProjectSnapshot node must be an object.",
                node
            );
        }

        if (typeof node.path !== "string") {
            throw new ProjectSnapshotError(
                "ProjectSnapshot node.path is required.",
                node
            );
        }

        if (typeof node.shellId !== "string") {
            throw new ProjectSnapshotError(
                "ProjectSnapshot node.shellId is required.",
                node
            );
        }

        if (
            typeof node.version !== "number" ||
            !Number.isInteger(node.version)
        ) {
            throw new ProjectSnapshotError(
                "ProjectSnapshot node.version must be an integer.",
                node
            );
        }

        if (
            typeof node.hash !== "string" ||
            !/^[a-f0-9]{64}$/.test(node.hash)
        ) {
            throw new ProjectSnapshotError(
                "ProjectSnapshot node.hash must be a SHA-256 hexadecimal hash.",
                node.hash
            );
        }
    }
}

function sortNodes(nodes) {
    return [...nodes].sort((a, b) => {
        if (a.path < b.path) {
            return -1;
        }

        if (a.path > b.path) {
            return 1;
        }

        if (a.order < b.order) {
            return -1;
        }

        if (a.order > b.order) {
            return 1;
        }

        return 0;
    });
}

function createProjectSnapshot(tree) {
    assertProjectTree(tree);

    const actualNodes = [];

    for (const node of tree.nodes.values()) {
        if (!node || typeof node !== "object") {
            continue;
        }

        if (
            !node.lifecycle ||
            node.lifecycle.actual !== true
        ) {
            continue;
        }

        actualNodes.push({
            path: node.position.path,
            parent: node.position.parent,
            order: node.position.order,
            shellId: node.identity.id,
            version: node.identity.version,
            hash: node.identity.hash
        });
    }

    const ordered = sortNodes(actualNodes);

    return {
        type: "ProjectSnapshot",
        schemaVersion: 1,
        nodes: ordered
    };
}

function serializeProjectSnapshot(snapshot) {
    assertProjectSnapshot(snapshot);

    return JSON.stringify(
        snapshot,
        null,
        2
    );
}

function parseProjectSnapshot(serialized) {
    if (typeof serialized !== "string") {
        throw new ProjectSnapshotError(
            "Expected serialized ProjectSnapshot string.",
            serialized
        );
    }

    let snapshot;

    try {
        snapshot = JSON.parse(serialized);
    } catch (error) {
        throw new ProjectSnapshotError(
            "Invalid serialized ProjectSnapshot JSON."
        );
    }

    assertProjectSnapshot(snapshot);

    return snapshot;
}

function hashProjectSnapshot(snapshot) {
    const serialized =
        serializeProjectSnapshot(snapshot);

    return crypto
        .createHash("sha256")
        .update(serialized, "utf8")
        .digest("hex");
}

function cloneProjectSnapshot(snapshot) {
    return parseProjectSnapshot(
        serializeProjectSnapshot(snapshot)
    );
}

module.exports = {
    ProjectSnapshotError,
    createProjectSnapshot,
    serializeProjectSnapshot,
    parseProjectSnapshot,
    hashProjectSnapshot,
    cloneProjectSnapshot
};
