class ProjectTreeError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ProjectTreeError";
        this.code = "LS007";
        this.value = value;
    }
}

class ProjectTree {
    constructor() {
        this.nodes = new Map();
    }

    addShell(shell) {
        this.assertShell(shell);

        const path = shell.position.path;

        if (this.nodes.has(path)) {
            throw new ProjectTreeError(
                `Shell path '${path}' already exists.`,
                shell
            );
        }

        this.nodes.set(path, shell);

        return shell;
    }

    replaceShell(shell) {
        this.assertShell(shell);

        const path = shell.position.path;

        if (!this.nodes.has(path)) {
            throw new ProjectTreeError(
                `Shell path '${path}' does not exist.`,
                shell
            );
        }

        this.nodes.set(path, shell);

        return shell;
    }

    upsertShell(shell) {
        this.assertShell(shell);

        const path = shell.position.path;

        this.nodes.set(path, shell);

        return shell;
    }

    getShell(path) {
        return this.nodes.get(path) || null;
    }

    hasShell(path) {
        return this.nodes.has(path);
    }

    removeShell(path) {
        const shell = this.nodes.get(path);

        if (!shell) {
            return null;
        }

        this.nodes.delete(path);

        return shell;
    }

    listShells() {
        return Array.from(this.nodes.values());
    }

    listPaths() {
        return Array.from(this.nodes.keys()).sort();
    }

    children(parentPath) {
        const prefix = parentPath
            ? `${parentPath}.`
            : "";

        return this.listShells()
            .filter(shell => {
                const path = shell.position.path;

                if (!path.startsWith(prefix)) {
                    return false;
                }

                const remainder =
                    path.slice(prefix.length);

                return (
                    remainder.length > 0 &&
                    !remainder.includes(".")
                );
            })
            .sort(
                (a, b) =>
                    a.position.order -
                    b.position.order
            );
    }

    roots() {
        return this.listShells()
            .filter(shell => {
                return !shell.position.parent;
            })
            .sort(
                (a, b) =>
                    a.position.order -
                    b.position.order
            );
    }

    size() {
        return this.nodes.size;
    }

    clear() {
        this.nodes.clear();
    }

    assertShell(shell) {
        if (!shell || typeof shell !== "object") {
            throw new ProjectTreeError(
                "Expected Shell object.",
                shell
            );
        }

        if (shell.type !== "Shell") {
            throw new ProjectTreeError(
                "Expected Shell object.",
                shell
            );
        }

        if (
            !shell.position ||
            typeof shell.position.path !== "string"
        ) {
            throw new ProjectTreeError(
                "Shell position.path is required.",
                shell
            );
        }

        if (
            !shell.position.parent &&
            shell.position.path.includes(".")
        ) {
            throw new ProjectTreeError(
                "Root Shell cannot contain a dotted path.",
                shell
            );
        }
    }
}

module.exports = {
    ProjectTree,
    ProjectTreeError
};
