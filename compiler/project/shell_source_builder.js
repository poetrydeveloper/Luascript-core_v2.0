// compiler/project/shell_source_builder.js
//
// Builds a Shell candidate from:
//
//   ValidatedShellProposal
//          +
//   ValidatedShellSource
//          |
//          v
//   PreparedShellProposal
//
// IMPORTANT:
//
// This builder NEVER commits anything to ShellRepository.
//
// It only:
// - reads the current Shell from repository
// - derives the next version/generation
// - builds a candidate Shell
// - preserves system-controlled identity/lifecycle fields
// - returns a PreparedShellProposal
//
// The executor/applier is responsible for committing the candidate.
//
// Pipeline:
//
// AI
//  |
//  v
// ShellProposal
//  |
//  v
// ShellProposalValidator
//  |
//  v
// ValidatedShellProposal
//  |
//  v
// ShellSourceValidator
//  |
//  v
// ValidatedShellSource
//  |
//  v
// ShellSourceBuilder
//  |
//  v
// PreparedShellProposal
//  |
//  v
// ShellProposalApplier / EvolutionExecutor
//  |
//  v
// ShellRepository
//

const {
    hashAST
} = require("../ast/serializer");

class ShellSourceBuilderError extends Error {
    constructor(message, value = null) {
        super(message);

        this.name =
            "ShellSourceBuilderError";

        this.code =
            "LS018";

        this.value =
            value;
    }
}

// ------------------------------------------------------------
// Repository contract
// ------------------------------------------------------------

function assertRepository(repository) {
    if (
        !repository ||
        typeof repository.get !== "function"
    ) {
        throw new ShellSourceBuilderError(
            "Expected ShellRepository.",
            repository
        );
    }
}

// ------------------------------------------------------------
// Validated proposal contract
// ------------------------------------------------------------

function assertValidatedShellProposal(
    proposal
) {
    if (
        !proposal ||
        typeof proposal !== "object"
    ) {
        throw new ShellSourceBuilderError(
            "Expected ValidatedShellProposal.",
            proposal
        );
    }

    if (
        proposal.type !==
        "ValidatedShellProposal"
    ) {
        throw new ShellSourceBuilderError(
            "Expected ValidatedShellProposal.",
            proposal
        );
    }

    if (
        proposal.schemaVersion !== 1
    ) {
        throw new ShellSourceBuilderError(
            "Unsupported ValidatedShellProposal schema version.",
            proposal.schemaVersion
        );
    }

    if (
        typeof proposal.shellId !==
        "string" ||
        proposal.shellId.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal.shellId must be a non-empty string.",
            proposal.shellId
        );
    }

    if (
        proposal.operation !== "CREATE" &&
        proposal.operation !== "UPDATE"
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal operation must be CREATE or UPDATE.",
            proposal.operation
        );
    }

    if (
        !Number.isInteger(
            proposal.baseVersion
        ) ||
        proposal.baseVersion < 1
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal.baseVersion must be a positive integer.",
            proposal.baseVersion
        );
    }

    if (
        typeof proposal.baseHash !==
        "string" ||
        proposal.baseHash.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal.baseHash must be a non-empty string.",
            proposal.baseHash
        );
    }

    if (
        typeof proposal.path !== "string" ||
        proposal.path.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal.path must be a non-empty string.",
            proposal.path
        );
    }

    if (
        !Number.isInteger(
            proposal.generation
        ) ||
        proposal.generation < 1
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal.generation must be a positive integer.",
            proposal.generation
        );
    }

    if (
        !proposal.proposal ||
        typeof proposal.proposal !== "object"
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellProposal.proposal must be an object.",
            proposal.proposal
        );
    }
}

// ------------------------------------------------------------
// Validated source contract
// ------------------------------------------------------------

function assertValidatedShellSource(
    source
) {
    if (
        !source ||
        typeof source !== "object"
    ) {
        throw new ShellSourceBuilderError(
            "Expected ValidatedShellSource.",
            source
        );
    }

    if (
        source.type !==
        "ValidatedShellSource"
    ) {
        throw new ShellSourceBuilderError(
            "Expected ValidatedShellSource.",
            source
        );
    }

    if (
        source.schemaVersion !== 1
    ) {
        throw new ShellSourceBuilderError(
            "Unsupported ValidatedShellSource schema version.",
            source.schemaVersion
        );
    }

    if (
        typeof source.shellId !==
        "string" ||
        source.shellId.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.shellId must be a non-empty string.",
            source.shellId
        );
    }

    if (
        source.operation !== "CREATE" &&
        source.operation !== "UPDATE"
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource operation must be CREATE or UPDATE.",
            source.operation
        );
    }

    if (
        !Number.isInteger(
            source.baseVersion
        ) ||
        source.baseVersion < 1
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.baseVersion must be a positive integer.",
            source.baseVersion
        );
    }

    if (
        typeof source.baseHash !==
        "string" ||
        source.baseHash.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.baseHash must be a non-empty string.",
            source.baseHash
        );
    }

    if (
        typeof source.source !==
        "string" ||
        source.source.trim().length === 0
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.source must be a non-empty string.",
            source.source
        );
    }

    if (
        !source.ast ||
        typeof source.ast !== "object" ||
        source.ast.type !== "Program"
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.ast must be a Program AST.",
            source.ast
        );
    }

    if (
        !Array.isArray(
            source.ast.declarations
        )
    ) {
        throw new ShellSourceBuilderError(
            "ValidatedShellSource.ast.declarations must be an array.",
            source.ast.declarations
        );
    }
}

// ------------------------------------------------------------
// Prepared proposal contract
// ------------------------------------------------------------

function assertPreparedShellProposal(
    value
) {
    if (
        !value ||
        typeof value !== "object"
    ) {
        throw new ShellSourceBuilderError(
            "Expected PreparedShellProposal.",
            value
        );
    }

    if (
        value.type !==
        "PreparedShellProposal"
    ) {
        throw new ShellSourceBuilderError(
            "Expected PreparedShellProposal.",
            value
        );
    }

    if (
        value.schemaVersion !== 1
    ) {
        throw new ShellSourceBuilderError(
            "Unsupported PreparedShellProposal schema version.",
            value.schemaVersion
        );
    }

    if (
        typeof value.shellId !==
        "string"
    ) {
        throw new ShellSourceBuilderError(
            "PreparedShellProposal.shellId must be a string.",
            value.shellId
        );
    }

    if (
        value.operation !== "CREATE" &&
        value.operation !== "UPDATE"
    ) {
        throw new ShellSourceBuilderError(
            "PreparedShellProposal operation must be CREATE or UPDATE.",
            value.operation
        );
    }

    if (
        !value.candidate ||
        typeof value.candidate !== "object" ||
        value.candidate.type !== "Shell"
    ) {
        throw new ShellSourceBuilderError(
            "PreparedShellProposal.candidate must be a Shell.",
            value.candidate
        );
    }
}

// ------------------------------------------------------------
// AST helpers
// ------------------------------------------------------------

function findClassDeclaration(
    ast
) {
    const declarations =
        ast?.declarations || [];

    const classes =
        declarations.filter(
            declaration =>
                declaration &&
                declaration.type ===
                    "ClassDeclaration"
        );

    if (
        classes.length !== 1
    ) {
        throw new ShellSourceBuilderError(
            "A Shell source must contain exactly one ClassDeclaration.",
            {
                classCount:
                    classes.length
            }
        );
    }

    return classes[0];
}

function deriveShellName(
    ast
) {
    const classDeclaration =
        findClassDeclaration(ast);

    if (
        typeof classDeclaration.name !==
            "string" ||
        classDeclaration.name.length === 0
    ) {
        throw new ShellSourceBuilderError(
            "Shell class must have a non-empty name."
        );
    }

    return classDeclaration.name;
}

// ------------------------------------------------------------
// Semantic metadata
//
// AI is allowed to provide semantic metadata.
// System-controlled fields are NOT taken from AI.
// ------------------------------------------------------------

function deriveSemantic(
    proposal,
    ast
) {
    const className =
        deriveShellName(ast);

    const semantic =
        proposal.proposal?.semantic ||
        proposal.semantic ||
        {};

    const name =
        typeof semantic.name === "string" &&
        semantic.name.length > 0
            ? semantic.name
            : className;

    const purpose =
        typeof semantic.purpose === "string" &&
        semantic.purpose.length > 0
            ? semantic.purpose
            : `Luascript Shell ${className}.`;

    const tags =
        Array.isArray(semantic.tags)
            ? semantic.tags.filter(
                tag =>
                    typeof tag ===
                        "string" &&
                    tag.length > 0
            )
            : ["luascript"];

    const description =
        typeof semantic.description ===
            "string" &&
        semantic.description.length > 0
            ? semantic.description
            : `Generated from Luascript source for ${className}.`;

    return {
        name,
        purpose,
        tags,
        description
    };
}

// ------------------------------------------------------------
// Current shell
// ------------------------------------------------------------

function getCurrentShell(
    repository,
    shellId
) {
    let shell;

    try {
        shell =
            repository.get(shellId);
    } catch (error) {
        throw new ShellSourceBuilderError(
            `Failed to read current Shell '${shellId}': ${error.message}`,
            error
        );
    }

    return shell || null;
}

// ------------------------------------------------------------
// Version / generation
// ------------------------------------------------------------

function deriveVersion(
    operation,
    proposal,
    baseShell
) {
    if (
        operation === "CREATE"
    ) {
        return 1;
    }

    if (!baseShell) {
        throw new ShellSourceBuilderError(
            `Cannot UPDATE unknown Shell '${proposal.shellId}'.`
        );
    }

    const currentVersion =
        baseShell.identity?.version;

    if (
        !Number.isInteger(
            currentVersion
        ) ||
        currentVersion < 1
    ) {
        throw new ShellSourceBuilderError(
            "Current Shell has invalid version.",
            currentVersion
        );
    }

    if (
        currentVersion !==
        proposal.baseVersion
    ) {
        throw new ShellSourceBuilderError(
            "Current Shell version does not match proposal baseVersion.",
            {
                currentVersion,
                proposalBaseVersion:
                    proposal.baseVersion
            }
        );
    }

    return currentVersion + 1;
}

function deriveGeneration(
    operation,
    baseShell,
    version
) {
    if (
        operation === "CREATE"
    ) {
        return 1;
    }

    if (!baseShell) {
        throw new ShellSourceBuilderError(
            "Cannot derive generation without base Shell."
        );
    }

    const currentGeneration =
        baseShell.lifecycle?.generation;

    if (
        !Number.isInteger(
            currentGeneration
        ) ||
        currentGeneration < 1
    ) {
        throw new ShellSourceBuilderError(
            "Current Shell has invalid generation.",
            currentGeneration
        );
    }

    return currentGeneration + 1;
}

// ------------------------------------------------------------
// Candidate construction
// ------------------------------------------------------------

function buildCandidate(
    validatedProposal,
    validatedSource,
    baseShell
) {
    const ast =
        validatedSource.ast;

    const shellId =
        validatedProposal.shellId;

    const operation =
        validatedProposal.operation;

    const version =
        deriveVersion(
            operation,
            validatedProposal,
            baseShell
        );

    const generation =
        deriveGeneration(
            operation,
            baseShell,
            version
        );

    const semantic =
        deriveSemantic(
            validatedProposal,
            ast
        );

    const path =
        operation === "UPDATE"
            ? baseShell.position.path
            : validatedProposal.path;

    const parent =
        operation === "UPDATE"
            ? baseShell.position.parent
            : deriveParentFromPath(
                path
            );

    const order =
        operation === "UPDATE"
            ? baseShell.position.order
            : 0;

    const hash =
        hashAST(ast);

    const supersedes =
        operation === "UPDATE"
            ? baseShell.identity.hash
            : null;

    return {
        type:
            "Shell",

        schemaVersion:
            1,

        identity: {
            id:
                shellId,

            hash,

            version
        },

        position: {
            path,

            parent,

            order
        },

        lifecycle: {
            actual:
                false,

            generation,

            createdAt:
                new Date().toISOString(),

            supersedes
        },

        semantic,

        payload:
            ast
    };
}

// ------------------------------------------------------------
// Path helpers
// ------------------------------------------------------------

function deriveParentFromPath(
    path
) {
    if (
        typeof path !== "string" ||
        path.length === 0
    ) {
        return null;
    }

    const parts =
        path.split(".");

    if (
        parts.length <= 1
    ) {
        return null;
    }

    return parts
        .slice(0, -1)
        .join(".");
}

// ------------------------------------------------------------
// Main builder
// ------------------------------------------------------------

function buildShell(
    repository,
    validatedProposal,
    validatedSource
) {
    assertRepository(
        repository
    );

    assertValidatedShellProposal(
        validatedProposal
    );

    assertValidatedShellSource(
        validatedSource
    );

    if (
        validatedProposal.shellId !==
        validatedSource.shellId
    ) {
        throw new ShellSourceBuilderError(
            "Proposal and source shellId must match.",
            {
                proposalShellId:
                    validatedProposal.shellId,

                sourceShellId:
                    validatedSource.shellId
            }
        );
    }

    if (
        validatedProposal.operation !==
        validatedSource.operation
    ) {
        throw new ShellSourceBuilderError(
            "Proposal and source operation must match.",
            {
                proposalOperation:
                    validatedProposal.operation,

                sourceOperation:
                    validatedSource.operation
            }
        );
    }

    if (
        validatedProposal.baseVersion !==
        validatedSource.baseVersion
    ) {
        throw new ShellSourceBuilderError(
            "Proposal and source baseVersion must match.",
            {
                proposalBaseVersion:
                    validatedProposal.baseVersion,

                sourceBaseVersion:
                    validatedSource.baseVersion
            }
        );
    }

    if (
        validatedProposal.baseHash !==
        validatedSource.baseHash
    ) {
        throw new ShellSourceBuilderError(
            "Proposal and source baseHash must match.",
            {
                proposalBaseHash:
                    validatedProposal.baseHash,

                sourceBaseHash:
                    validatedSource.baseHash
            }
        );
    }

    const baseShell =
        getCurrentShell(
            repository,
            validatedProposal.shellId
        );

    if (
        validatedProposal.operation ===
            "UPDATE" &&
        !baseShell
    ) {
        throw new ShellSourceBuilderError(
            `Cannot UPDATE unknown Shell '${validatedProposal.shellId}'.`
        );
    }

    if (
        validatedProposal.operation ===
            "CREATE" &&
        baseShell
    ) {
        throw new ShellSourceBuilderError(
            `Cannot CREATE existing Shell '${validatedProposal.shellId}'.`
        );
    }

    if (
        validatedProposal.operation ===
            "UPDATE"
    ) {
        if (
            baseShell.identity.version !==
            validatedProposal.baseVersion
        ) {
            throw new ShellSourceBuilderError(
                "Current Shell version does not match proposal.",
                {
                    current:
                        baseShell.identity.version,

                    proposal:
                        validatedProposal.baseVersion
                }
            );
        }

        if (
            baseShell.identity.hash !==
            validatedProposal.baseHash
        ) {
            throw new ShellSourceBuilderError(
                "Current Shell hash does not match proposal.",
                {
                    current:
                        baseShell.identity.hash,

                    proposal:
                        validatedProposal.baseHash
                }
            );
        }
    }

    const candidate =
        buildCandidate(
            validatedProposal,
            validatedSource,
            baseShell
        );

    return {
        type:
            "PreparedShellProposal",

        schemaVersion:
            1,

        shellId:
            validatedProposal.shellId,

        operation:
            validatedProposal.operation,

        baseVersion:
            validatedProposal.baseVersion,

        baseHash:
            validatedProposal.baseHash,

        path:
            candidate.position.path,

        generation:
            candidate.lifecycle.generation,

        candidate
    };
}

// ------------------------------------------------------------
// Public class
// ------------------------------------------------------------

class ShellSourceBuilder {
    constructor(
        repository
    ) {
        assertRepository(
            repository
        );

        this.repository =
            repository;
    }

    build(
        validatedProposal,
        validatedSource
    ) {
        return buildShell(
            this.repository,
            validatedProposal,
            validatedSource
        );
    }
}

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

module.exports = {
    ShellSourceBuilderError,

    assertRepository,

    assertValidatedShellProposal,

    assertValidatedShellSource,

    assertPreparedShellProposal,

    findClassDeclaration,

    deriveShellName,

    deriveSemantic,

    deriveParentFromPath,

    getCurrentShell,

    deriveVersion,

    deriveGeneration,

    buildCandidate,

    buildShell,

    ShellSourceBuilder
};