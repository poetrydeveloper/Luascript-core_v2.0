class ShellTreeError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellTreeError";
        this.code = "LS007";
        this.value = value;
    }
}

class ShellTree {
    constructor() {
        this.nodes = new Map();
        this.children = new Map();
    }

    add(shell) {
        this.validateShell(shell);

        const path = shell.position.path;

        if (this.nodes.has(path)) {
            throw new ShellTreeError(
                `Shell path '${path}' already exists.`,
                shell
            );
        }

        const parent = shell.position.parent;

        if (parent !== null && parent !== undefined) {
            if (!this.nodes.has(parent)) {
                throw new ShellTreeError(
                    `Parent shell '${parent}' does not exist.`,
                    shell
                );
            }
        }

        this.nodes.set(path, shell);

        if (!this.children.has(parent)) {
            this.children.set(parent, []);
        }

        this.children
            .get(parent)
            .push(path);

        this.sortChildren(parent);

        return this.get(path);
    }

    replace(shell) {
        this.validateShell(shell);

        const path = shell.position.path;

        if (!this.nodes.has(path)) {
            return this.add(shell);
        }

        const previous = this.nodes.get(path);

        if (
            previous.position.parent !==
            shell.position.parent
        ) {
            throw new ShellTreeError(
                "Cannot change shell parent during replace.",
                shell
            );
        }

        this.nodes.set(path, shell);

        this.sortChildren(
            shell.position.parent
        );

        return this.get(path);
    }

    get(path) {
        const shell = this.nodes.get(path);

        if (!shell) {
            return null;
        }

        return this.clone(shell);
    }

    has(path) {
        return this.nodes.has(path);
    }

    getChildren(path = null) {
        const children = this.children.get(path) || [];

        return children
            .map(childPath => this.nodes.get(childPath))
            .filter(Boolean)
            .map(shell => this.clone(shell));
    }

    getRoots() {
        return this.getChildren(null);
    }

    getActual(path) {
        const shell = this.nodes.get(path);

        if (!shell) {
            return null;
        }

        if (
            !shell.lifecycle ||
            shell.lifecycle.actual !== true
        ) {
            return null;
        }

        return this.clone(shell);
    }

    listPaths() {
        return Array.from(this.nodes.keys()).sort();
    }

    size() {
        return this.nodes.size;
    }

    clear() {
        this.nodes.clear();
        this.children.clear();
    }

    sortChildren(parent) {
        const paths = this.children.get(parent);

        if (!paths) {
            return;
        }

        paths.sort((left, right) => {
            const a = this.nodes.get(left);
            const b = this.nodes.get(right);

            if (!a || !b) {
                return left.localeCompare(right);
            }

            const orderA = a.position.order ?? 0;
            const orderB = b.position.order ?? 0;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return left.localeCompare(right);
        });
    }

    clone(shell) {
        return JSON.parse(
            JSON.stringify(shell)
        );
    }

    validateShell(shell) {
        if (!shell || typeof shell !== "object") {
            throw new ShellTreeError(
                "Expected Shell object.",
                shell
            );
        }

        if (shell.type !== "Shell") {
            throw new ShellTreeError(
                "Expected Shell object.",
                shell
            );
        }

        if (
            !shell.position ||
            typeof shell.position.path !== "string"
        ) {
            throw new ShellTreeError(
                "Shell position.path is required.",
                shell
            );
        }

        if (
            shell.position.parent !== null &&
            shell.position.parent !== undefined &&
            typeof shell.position.parent !== "string"
        ) {
            throw new ShellTreeError(
                "Shell position.parent must be a string or null.",
                shell
            );
        }

        if (
            !Number.isInteger(shell.position.order)
        ) {
            throw new ShellTreeError(
                "Shell position.order must be an integer.",
                shell
            );
        }
    }
}

module.exports = {
    ShellTree,
    ShellTreeError
};
