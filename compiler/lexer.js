// compiler/lexer.js

const {
    TokenType,
    KEYWORDS,
    createToken,
    createPosition
} = require("./token");

class LexerError extends Error {
    constructor(message, position) {
        super(message);

        this.name = "LexerError";
        this.code = "LS002";
        this.position = position;

        this.line = position?.line ?? null;
        this.column = position?.column ?? null;
        this.offset = position?.offset ?? null;
    }
}

class Lexer {
    constructor(source) {
        if (typeof source !== "string") {
            throw new TypeError("Lexer expects source code as a string.");
        }

        this.source = source;
        this.length = source.length;

        this.current = 0;
        this.line = 1;
        this.column = 1;

        this.tokens = [];
    }

    tokenize() {
        while (!this.isAtEnd()) {
            this.scanToken();
        }

        const position = this.position();

        this.tokens.push(
            createToken(
                TokenType.EOF,
                "",
                null,
                position,
                position
            )
        );

        return this.tokens;
    }

    scanToken() {
        const start = this.position();
        const char = this.advance();

        switch (char) {
            case " ":
            case "\t":
            case "\r":
                return;

            case "\n":
                this.addToken(
                    TokenType.NEWLINE,
                    "\n",
                    null,
                    start
                );
                return;

            case "#":
                this.scanHashToken(start);
                return;

            case "-":
                if (this.match("-")) {
                    this.scanComment(start);
                } else {
                    this.addToken(
                        TokenType.MINUS,
                        "-",
                        null,
                        start
                    );
                }
                return;

            case "+":
                this.addToken(TokenType.PLUS, "+", null, start);
                return;

            case "*":
                this.addToken(TokenType.STAR, "*", null, start);
                return;

            case "/":
                if (this.match("/")) {
                    this.addToken(
                        TokenType.FLOOR_DIV,
                        "//",
                        null,
                        start
                    );
                } else {
                    this.addToken(
                        TokenType.SLASH,
                        "/",
                        null,
                        start
                    );
                }
                return;

            case "%":
                this.addToken(
                    TokenType.MODULO,
                    "%",
                    null,
                    start
                );
                return;

            case "^":
                this.addToken(
                    TokenType.POWER,
                    "^",
                    null,
                    start
                );
                return;

            case "=":
                if (this.match("=")) {
                    this.addToken(
                        TokenType.EQUAL,
                        "==",
                        null,
                        start
                    );
                } else {
                    this.addToken(
                        TokenType.ASSIGN,
                        "=",
                        null,
                        start
                    );
                }
                return;

            case "~":
                if (this.match("=")) {
                    this.addToken(
                        TokenType.NOT_EQUAL,
                        "~=",
                        null,
                        start
                    );
                } else {
                    this.error(
                        start,
                        "Unexpected character '~'."
                    );
                }
                return;

            case "<":
                if (this.match("=")) {
                    this.addToken(
                        TokenType.LESS_EQUAL,
                        "<=",
                        null,
                        start
                    );
                } else {
                    this.addToken(
                        TokenType.LESS,
                        "<",
                        null,
                        start
                    );
                }
                return;

            case ">":
                if (this.match("=")) {
                    this.addToken(
                        TokenType.GREATER_EQUAL,
                        ">=",
                        null,
                        start
                    );
                } else {
                    this.addToken(
                        TokenType.GREATER,
                        ">",
                        null,
                        start
                    );
                }
                return;

            case ".":
                if (this.match(".")) {
                    this.addToken(
                        TokenType.CONCAT,
                        "..",
                        null,
                        start
                    );
                } else {
                    this.addToken(
                        TokenType.DOT,
                        ".",
                        null,
                        start
                    );
                }
                return;

            case ":":
                if (this.match(":")) {
                    this.addToken(
                        TokenType.DOUBLE_COLON,
                        "::",
                        null,
                        start
                    );
                } else {
                    this.addToken(
                        TokenType.COLON,
                        ":",
                        null,
                        start
                    );
                }
                return;

            case "(":
                this.addToken(
                    TokenType.LEFT_PAREN,
                    "(",
                    null,
                    start
                );
                return;

            case ")":
                this.addToken(
                    TokenType.RIGHT_PAREN,
                    ")",
                    null,
                    start
                );
                return;

            case "{":
                this.addToken(
                    TokenType.LEFT_BRACE,
                    "{",
                    null,
                    start
                );
                return;

            case "}":
                this.addToken(
                    TokenType.RIGHT_BRACE,
                    "}",
                    null,
                    start
                );
                return;

            case "[":
                this.addToken(
                    TokenType.LEFT_BRACKET,
                    "[",
                    null,
                    start
                );
                return;

            case "]":
                this.addToken(
                    TokenType.RIGHT_BRACKET,
                    "]",
                    null,
                    start
                );
                return;

            case ",":
                this.addToken(
                    TokenType.COMMA,
                    ",",
                    null,
                    start
                );
                return;

            case ";":
                this.addToken(
                    TokenType.SEMICOLON,
                    ";",
                    null,
                    start
                );
                return;

            case "@":
                this.addToken(
                    TokenType.AT,
                    "@",
                    null,
                    start
                );
                return;

            case "\"":
                this.scanString("\"", start);
                return;

            case "'":
                this.scanString("'", start);
                return;

            default:
                if (this.isDigit(char)) {
                    this.scanNumber(start);
                    return;
                }

                if (this.isIdentifierStart(char)) {
                    this.scanIdentifier(start);
                    return;
                }

                this.error(
                    start,
                    `Unexpected character '${char}'.`
                );
        }
    }

    scanHashToken(start) {
        const remaining = this.source.slice(this.current);

        if (remaining.startsWith(" AURA_END")) {
            this.advanceCount(" AURA_END".length);

            this.addToken(
                TokenType.TERMINATION,
                "# AURA_END",
                null,
                start
            );

            return;
        }

        this.error(
            start,
            "Unexpected '#' token. Expected '# AURA_END'."
        );
    }

    scanComment(start) {
        while (
            !this.isAtEnd() &&
            this.peek() !== "\n"
        ) {
            this.advance();
        }

        const lexeme = this.source.slice(
            start.offset,
            this.current
        );

        this.addToken(
            TokenType.COMMENT,
            lexeme,
            null,
            start
        );
    }

    scanString(quote, start) {
        let value = "";

        while (!this.isAtEnd()) {
            const char = this.peek();

            if (char === quote) {
                this.advance();

                const lexeme = this.source.slice(
                    start.offset,
                    this.current
                );

                this.addToken(
                    TokenType.STRING,
                    lexeme,
                    value,
                    start
                );

                return;
            }

            if (char === "\\") {
                this.advance();

                if (this.isAtEnd()) {
                    break;
                }

                const escaped = this.advance();

                switch (escaped) {
                    case "n":
                        value += "\n";
                        break;

                    case "r":
                        value += "\r";
                        break;

                    case "t":
                        value += "\t";
                        break;

                    case "\\":
                        value += "\\";
                        break;

                    case "\"":
                        value += "\"";
                        break;

                    case "'":
                        value += "'";
                        break;

                    default:
                        value += escaped;
                        break;
                }

                continue;
            }

            if (char === "\n") {
                this.error(
                    start,
                    "Unterminated string literal."
                );
            }

            value += this.advance();
        }

        this.error(
            start,
            "Unterminated string literal."
        );
    }

    scanNumber(start) {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        if (
            this.peek() === "." &&
            this.isDigit(this.peekNext())
        ) {
            this.advance();

            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }

        const lexeme = this.source.slice(
            start.offset,
            this.current
        );

        const value = Number(lexeme);

        if (!Number.isFinite(value)) {
            this.error(
                start,
                `Invalid numeric literal '${lexeme}'.`
            );
        }

        this.addToken(
            TokenType.NUMBER,
            lexeme,
            value,
            start
        );
    }

    scanIdentifier(start) {
        while (this.isIdentifierPart(this.peek())) {
            this.advance();
        }

        const lexeme = this.source.slice(
            start.offset,
            this.current
        );

        const type =
            KEYWORDS[lexeme] || TokenType.IDENTIFIER;

        this.addToken(
            type,
            lexeme,
            null,
            start
        );
    }

    addToken(type, lexeme, literal, start) {
        const end = this.position();

        this.tokens.push(
            createToken(
                type,
                lexeme,
                literal,
                start,
                end
            )
        );
    }

    advance() {
        if (this.isAtEnd()) {
            return "\0";
        }

        const char = this.source[this.current];

        this.current++;

        if (char === "\n") {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }

        return char;
    }

    advanceCount(count) {
        for (let i = 0; i < count; i++) {
            this.advance();
        }
    }

    match(expected) {
        if (this.isAtEnd()) {
            return false;
        }

        if (this.source[this.current] !== expected) {
            return false;
        }

        this.advance();

        return true;
    }

    peek() {
        if (this.isAtEnd()) {
            return "\0";
        }

        return this.source[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.length) {
            return "\0";
        }

        return this.source[this.current + 1];
    }

    position() {
        return createPosition(
            this.current,
            this.line,
            this.column
        );
    }

    isAtEnd() {
        return this.current >= this.length;
    }

    isDigit(char) {
        return char >= "0" && char <= "9";
    }

    isIdentifierStart(char) {
        return (
            (char >= "a" && char <= "z") ||
            (char >= "A" && char <= "Z") ||
            char === "_"
        );
    }

    isIdentifierPart(char) {
        return (
            this.isIdentifierStart(char) ||
            this.isDigit(char)
        );
    }

    error(position, message) {
        throw new LexerError(
            message,
            position
        );
    }
}

function tokenize(source) {
    return new Lexer(source).tokenize();
}

module.exports = {
    Lexer,
    LexerError,
    tokenize
};
