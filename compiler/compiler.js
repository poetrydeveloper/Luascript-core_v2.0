// compiler/compiler.js

"use strict";

const fs = require("fs");

const { tokenize } = require("./lexer");
const { Parser } = require("./parser");
const { Validator } = require("./validator");
const { CodeGenerator } = require("./codegen");


class CompilerError extends Error {
    constructor(message, phase, cause = null) {
        super(message);

        this.name = "CompilerError";
        this.code = "LS001";
        this.phase = phase;
        this.cause = cause;
    }
}


class Compiler {
    constructor(options = {}) {
        this.options = {
            validate: options.validate !== false,
            sourceName: options.sourceName || "<source>",
            generator: options.generator || {},
            validator: options.validator || {}
        };
    }


    compile(source) {
        if (typeof source !== "string") {
            throw new TypeError(
                "Compiler.compile() expects source code as a string."
            );
        }

        const tokens = this.lex(source);

        const ast = this.parse(tokens);

        if (this.options.validate) {
            this.validate(ast);
        }

        const code = this.generate(ast);

        return {
            sourceName: this.options.sourceName,
            tokens,
            ast,
            code
        };
    }


    lex(source) {
        try {
            return tokenize(source);
        } catch (error) {
            throw this.wrapError(
                "Lexer failed.",
                "lexer",
                error
            );
        }
    }


    parse(tokens) {
        try {
            const parser = new Parser(tokens);

            return parser.parse();
        } catch (error) {
            throw this.wrapError(
                "Parser failed.",
                "parser",
                error
            );
        }
    }


    validate(ast) {
        try {
            const validator = new Validator(
                this.options.validator
            );

            if (typeof validator.validate !== "function") {
                throw new TypeError(
                    "Validator.validate() is not implemented."
                );
            }

            return validator.validate(ast);
        } catch (error) {
            throw this.wrapError(
                "Validator failed.",
                "validator",
                error
            );
        }
    }


    generate(ast) {
        try {
            const generator = new CodeGenerator(
                this.options.generator
            );

            if (typeof generator.generate !== "function") {
                throw new TypeError(
                    "CodeGenerator.generate() is not implemented."
                );
            }

            return generator.generate(ast);
        } catch (error) {
            throw this.wrapError(
                "Code generation failed.",
                "codegen",
                error
            );
        }
    }


    compileFile(filePath, options = {}) {
        if (typeof filePath !== "string") {
            throw new TypeError(
                "Compiler.compileFile() expects a file path."
            );
        }

        const source = fs.readFileSync(
            filePath,
            "utf8"
        );

        const compiler = new Compiler({
            ...this.options,
            ...options,
            sourceName: options.sourceName || filePath
        });

        return compiler.compile(source);
    }


    wrapError(message, phase, cause) {
        if (cause instanceof CompilerError) {
            return cause;
        }

        const error = new CompilerError(
            `${message} ${cause?.message || ""}`.trim(),
            phase,
            cause
        );

        if (cause) {
            if (cause.code) {
                error.originalCode = cause.code;
            }

            if (cause.line !== undefined) {
                error.line = cause.line;
            }

            if (cause.column !== undefined) {
                error.column = cause.column;
            }

            if (cause.offset !== undefined) {
                error.offset = cause.offset;
            }

            if (cause.token) {
                error.token = cause.token;
            }

            if (cause.node) {
                error.node = cause.node;
            }
        }

        return error;
    }
}


function compile(source, options = {}) {
    return new Compiler(options).compile(source);
}


function compileFile(filePath, options = {}) {
    return new Compiler(options).compileFile(
        filePath,
        options
    );
}


module.exports = {
    Compiler,
    CompilerError,
    compile,
    compileFile
};