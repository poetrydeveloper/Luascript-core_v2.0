const {
    serializeShell,
    parseShell
} = require("./serializer");

const {
    hashAST
} = require("../ast/serializer");

class ShellRepositoryError extends Error {
    constructor(message, shell = null) {
        super(message);
        this.name = "ShellRepositoryError";
        this.code = "LS006";
        this.shell = shell;
    }
}

class ShellRepository {
    constructor() {
        this.shells = new Map();
    }

    create(shell) {
        this.assertShell(shell);

        const id = shell.identity.id;

        if (this.shells.has(id)) {
            throw new ShellRepositoryError(
                `Shell '${id}' already exists.`,
                shell
            );
        }

        const stored = this.clone(shell);

        stored.lifecycle.actual = true;
        stored.lifecycle.generation = 1;
        stored.identity.version = 1;
        stored.lifecycle.supersedes = null;

        stored.identity.hash = hashAST(
            stored.payload
        );

        this.shells.set(id, [
            stored
        ]);

        return this.clone(stored);
    }

    save(shell) {
        this.assertShell(shell);

        const id = shell.identity.id;
        const history = this.shells.get(id);

        if (!history) {
            return this.create(shell);
        }

        const previous = history[history.length - 1];

        const source = JSON.parse(
            JSON.stringify(shell)
        );

        source.identity.hash = hashAST(
            source.payload
        );

        const next = this.clone(source);

        next.identity.version =
            previous.identity.version + 1;

        next.lifecycle.generation =
            previous.lifecycle.generation + 1;

        next.lifecycle.supersedes =
            previous.identity.hash;

        next.lifecycle.actual = true;

        for (const version of history) {
            version.lifecycle.actual = false;
        }

        next.identity.hash = hashAST(
            next.payload
        );

        history.push(next);

        return this.clone(next);
    }

    get(id) {
        const history = this.shells.get(id);

        if (!history || history.length === 0) {
            return null;
        }

        const actual = history.find(
            shell => shell.lifecycle.actual === true
        );

        return actual
            ? this.clone(actual)
            : null;
    }

    getActual(id) {
        return this.get(id);
    }

    getVersion(id, version) {
        const history = this.shells.get(id);

        if (!history) {
            return null;
        }

        const shell = history.find(
            item => item.identity.version === version
        );

        return shell
            ? this.clone(shell)
            : null;
    }

    listVersions(id) {
        const history = this.shells.get(id);

        if (!history) {
            return [];
        }

        return history.map(
            shell => this.clone(shell)
        );
    }

    activate(id, version) {
        const history = this.shells.get(id);

        if (!history) {
            throw new ShellRepositoryError(
                `Shell '${id}' does not exist.`
            );
        }

        const target = history.find(
            shell => shell.identity.version === version
        );

        if (!target) {
            throw new ShellRepositoryError(
                `Version ${version} of shell '${id}' does not exist.`
            );
        }

        for (const shell of history) {
            shell.lifecycle.actual = false;
        }

        target.lifecycle.actual = true;

        return this.clone(target);
    }

    has(id) {
        return this.shells.has(id);
    }

    count(id) {
        const history = this.shells.get(id);

        return history
            ? history.length
            : 0;
    }

    clear() {
        this.shells.clear();
    }

    clone(shell) {
        return parseShell(
            serializeShell(shell)
        );
    }

    assertShell(shell) {
        if (!shell || typeof shell !== "object") {
            throw new ShellRepositoryError(
                "Expected Shell object.",
                shell
            );
        }

        if (shell.type !== "Shell") {
            throw new ShellRepositoryError(
                "Expected Shell object.",
                shell
            );
        }

        if (
            !shell.identity ||
            typeof shell.identity.id !== "string"
        ) {
            throw new ShellRepositoryError(
                "Shell identity.id is required.",
                shell
            );
        }

        if (
            !shell.lifecycle ||
            typeof shell.lifecycle !== "object"
        ) {
            throw new ShellRepositoryError(
                "Shell lifecycle is required.",
                shell
            );
        }
    }
}

module.exports = {
    ShellRepository,
    ShellRepositoryError
};
