// compiler/project/shell_source_builder.js
//
// Converts validated Luascript source into a new Shell.
//
// IMPORTANT:
//
// AI controls:
// - source
//
// System controls:
// - version
// - generation
// - hash
// - supersedes
// - lifecycle
// - identity
// - position
//
// This module does NOT mutate the repository.
//
// Pipeline:
//
// ShellProposal
//      |
//      v
// ShellProposalValidator
//      |
//      v
// ShellSourceValidator
//      |
//      v
// ValidatedShellSource
//      |
//      v
// ShellSourceBuilder
//      |
//      v
// Shell candidate
//
// The repository/evolution executor is responsible
// for committing the resulting Shell.

const {
    hashAST
} = require("../ast/serializer");

class ShellSourceBuilderError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name = "ShellSourceBuilderError";
        this.code = "LS018";
        this.value = value;
    }
}

function assertValidatedShellSource(value) {
    if (!value || typeof value !== "object") {
        throw new ShellSourceBuilderError(
            "Expected ValidatedShellSource.",
            value
        );
    }

    if (value.type !== "ValidatedShellSource") {
        throw new ShellSourceBuilderError(
            "Expected ValidatedShellSource.",
            value
        );
    }

    if (value.schemaVersion !== 1) {
        throw new ShellSourceBuilderError(
            "Unsupported ValidatedShellSource schema version.",
            value.schemaVersion
        );
    }

    if (
        typeof value.shellId !== "string" ||
        value.shellId.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.shellId must be a non-empty string.",
            value.shellId
        );
    }

    if (
        value.operation !== "CREATE" &&
        value.operation !== "UPDATE"
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource operation must be CREATE or UPDATE.",
            value.operation
        );
    }

    if (
        !Number.isInteger(value.baseVersion) ||
        value.baseVersion < 1
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.baseVersion must be a positive integer.",
            value.baseVersion
        );
    }

    if (
        !value.ast ||
        typeof value.ast !== "object" ||
        value.ast.type !== "Program"
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.ast must be a Program AST.",
            value.ast
        );
    }

    if (
        !Array.isArray(value.ast.declarations)
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.ast.declarations must be an array.",
            value.ast.declarations
        );
    }

    if (
        typeof value.source !== "string" ||
        value.source.trim().length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.source must be a non-empty string.",
            value.source
        );
    }
}

function findClassDeclaration(ast) {
    const declarations =
        ast.declarations || [];

    const classes =
        declarations.filter(
            declaration =>
                declaration &&
                declaration.type === "ClassDeclaration"
        );

    if (classes.length !== 1) {
        throw new ShellSourceBuilderError(
            "A Shell source must contain exactly one ClassDeclaration.",
            {
                classCount: classes.length
            }
        );
    }

    return classes[0];
}

function deriveShellName(ast) {
    const classDeclaration =
        findClassDeclaration(ast);

    if (
        typeof classDeclaration.name !== "string" ||
        classDeclaration.name.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "Shell class must have a non-empty name."
        );
    }

    return classDeclaration.name;
}

function derivePurpose(ast) {
    const classDeclaration =
        findClassDeclaration(ast);

    /*
     * The current language AST does not yet contain
     * a dedicated Shell purpose field.
     *
     * Therefore we use a deterministic placeholder
     * until the Shell metadata contract supports
     * an explicit purpose decorator.
     */
    return `Luascript Shell ${classDeclaration.name}.`;
}

function buildShell(validatedSource, options = {}) {
    assertValidatedShellSource(
        validatedSource
    );

    const ast =
        validatedSource.ast;

    const className =
        deriveShellName(ast);

    const shellId =
        validatedSource.shellId;

    const path =
        typeof options.path === "string"
            ? options.path
            : shellId;

    const parent =
        options.parent === undefined
            ? null
            : options.parent;

    const order =
        Number.isInteger(options.order)
            ? options.order
            : 0;

    const version =
        Number.isInteger(options.version)
            ? options.version
            : validatedSource.baseVersion + 1;

    const generation =
        Number.isInteger(options.generation)
            ? options.generation
            : version;

    const baseShell =
        options.baseShell || null;

    const supersedes =
        baseShell?.identity?.hash || null;

    const hash =
        hashAST(ast);

    return {
        type: "Shell",
        schemaVersion: 1,

        identity: {
            id: shellId,
            hash,
            version
        },

        position: {
            path,
            parent,
            order
        },

        lifecycle: {
            actual: false,
            generation,
            createdAt:
                options.createdAt ||
                new Date().toISOString(),
            supersedes
        },

        semantic: {
            name: className,
            purpose:
                typeof options.purpose === "string"
                    ? options.purpose
                    : derivePurpose(ast),

            tags:
                Array.isArray(options.tags)
                    ? [...options.tags]
                    : ["luascript"],

            description:
                typeof options.description === "string"
                    ? options.description
                    : `Generated from Luascript source for ${className}.`
        },

        payload: ast
    };
}

class ShellSourceBuilder {
    build(validatedSource, options = {}) {
        return buildShell(
            validatedSource,
            options
        );
    }
}

module.exports = {
    ShellSourceBuilderError,
    assertValidatedShellSource,
    findClassDeclaration,
    deriveShellName,
    derivePurpose,
    buildShell,
    ShellSourceBuilder
};
