// compiler/project/shell_source_validator.js
//
// Luascript source validator for ShellProposal.
//
// Pipeline:
//
//   ShellProposal.source
//          |
//          v
//       tokenize()
//          |
//          v
//     Parser(tokens)
//          |
//          v
//       Program AST
//          |
//          v
//     AST Validator
//          |
//          v
//   ValidatedShellSource
//
// This module does not mutate the repository.
//
// Important architectural rule:
//
// AI produces Luascript source.
// The Luascript compiler decides whether that source is valid.
//
// AI is therefore never trusted as a compiler.

const {
    tokenize
} = require("../lexer");

const {
    Parser
} = require("../parser");

class ShellSourceValidatorError extends Error {
    constructor(message, value = null) {
        super(message);
        this.name =
            "ShellSourceValidatorError";
        this.code =
            "LS017";
        this.value =
            value;
    }
}

function assertSource(source) {
    if (typeof source !== "string") {
        throw new ShellSourceValidatorError(
            "Shell proposal source must be a string.",
            source
        );
    }

    if (source.trim().length === 0) {
        throw new ShellSourceValidatorError(
            "Shell proposal source must not be empty."
        );
    }
}

function assertProposal(proposal) {
    if (
        !proposal ||
        typeof proposal !== "object"
    ) {
        throw new ShellSourceValidatorError(
            "Expected ShellProposal.",
            proposal
        );
    }

    if (
        typeof proposal.shellId !==
        "string"
    ) {
        throw new ShellSourceValidatorError(
            "ShellProposal.shellId must be a string.",
            proposal.shellId
        );
    }

    if (
        typeof proposal.operation !==
        "string"
    ) {
        throw new ShellSourceValidatorError(
            "ShellProposal.operation must be a string.",
            proposal.operation
        );
    }

    if (
        typeof proposal.baseVersion !==
        "number" ||
        !Number.isInteger(
            proposal.baseVersion
        )
    ) {
        throw new ShellSourceValidatorError(
            "ShellProposal.baseVersion must be an integer.",
            proposal.baseVersion
        );
    }

    if (
        typeof proposal.baseHash !==
        "string"
    ) {
        throw new ShellSourceValidatorError(
            "ShellProposal.baseHash must be a string.",
            proposal.baseHash
        );
    }
}

function lexSource(source) {
    assertSource(source);

    try {
        return tokenize(source);
    } catch (error) {
        throw new ShellSourceValidatorError(
            `Luascript lexical analysis failed: ${error.message}`,
            error
        );
    }
}

function parseTokens(tokens) {
    if (!Array.isArray(tokens)) {
        throw new ShellSourceValidatorError(
            "Lexer must return an array of tokens.",
            tokens
        );
    }

    let ast;

    try {
        const parser =
            new Parser(tokens);

        ast =
            parser.parse();
    } catch (error) {
        throw new ShellSourceValidatorError(
            `Luascript parse failed: ${error.message}`,
            error
        );
    }

    if (
        !ast ||
        typeof ast !== "object"
    ) {
        throw new ShellSourceValidatorError(
            "Parser did not return an AST."
        );
    }

    if (ast.type !== "Program") {
        throw new ShellSourceValidatorError(
            "Parser must return Program AST.",
            ast
        );
    }

    if (
        !Array.isArray(
            ast.declarations
        )
    ) {
        throw new ShellSourceValidatorError(
            "Program AST must contain declarations.",
            ast
        );
    }

    return ast;
}

function validateAST(ast, validator) {
    if (
        !ast ||
        ast.type !== "Program"
    ) {
        throw new ShellSourceValidatorError(
            "Expected Program AST.",
            ast
        );
    }

    /*
     * Validator is optional at this layer.
     *
     * The current Luascript compiler exposes
     * the validator independently, so we allow
     * the caller to inject it.
     */
    if (validator === null) {
        return false;
    }

    if (
        !validator ||
        typeof validator.validate !==
            "function"
    ) {
        throw new ShellSourceValidatorError(
            "Expected AST validator."
        );
    }

    try {
        validator.validate(ast);
    } catch (error) {
        throw new ShellSourceValidatorError(
            `Luascript AST validation failed: ${error.message}`,
            error
        );
    }

    return true;
}

function validateShellSource(
    proposal,
    validator = null
) {
    assertProposal(proposal);

    /*
     * DELETE has no source to parse.
     *
     * DELETE will be handled by the evolution
     * executor and therefore must not enter the
     * source-validation pipeline.
     */
    if (
        proposal.operation ===
        "DELETE"
    ) {
        throw new ShellSourceValidatorError(
            "DELETE proposal does not contain source."
        );
    }

    assertSource(
        proposal.source
    );

    const tokens =
        lexSource(
            proposal.source
        );

    const ast =
        parseTokens(tokens);

    const astValidated =
        validateAST(
            ast,
            validator
        );

    return {
        type:
            "ValidatedShellSource",

        schemaVersion:
            1,

        shellId:
            proposal.shellId,

        operation:
            proposal.operation,

        baseVersion:
            proposal.baseVersion,

        baseHash:
            proposal.baseHash,

        source:
            proposal.source,

        tokens,

        ast,

        astValidated
    };
}

class ShellSourceValidator {
    constructor(
        validator = null
    ) {
        this.validator =
            validator;
    }

    validate(proposal) {
        return validateShellSource(
            proposal,
            this.validator
        );
    }
}

module.exports = {
    ShellSourceValidatorError,
    ShellSourceValidator,
    validateShellSource,
    lexSource,
    parseTokens
};
