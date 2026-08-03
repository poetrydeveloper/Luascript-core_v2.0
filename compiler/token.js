// compiler/token.js

const TokenType = Object.freeze({
    EOF: "EOF",
    NEWLINE: "NEWLINE",

    IDENTIFIER: "IDENTIFIER",
    NUMBER: "NUMBER",
    STRING: "STRING",

    AND: "AND",
    BREAK: "BREAK",
    DO: "DO",
    ELSE: "ELSE",
    ELSEIF: "ELSEIF",
    END: "END",
    FALSE: "FALSE",
    FOR: "FOR",
    FUNCTION: "FUNCTION",
    IF: "IF",
    IN: "IN",
    LOCAL: "LOCAL",
    NIL: "NIL",
    NOT: "NOT",
    OR: "OR",
    REPEAT: "REPEAT",
    RETURN: "RETURN",
    THEN: "THEN",
    TRUE: "TRUE",
    UNTIL: "UNTIL",
    WHILE: "WHILE",

    CLASS: "CLASS",
    EXTENDS: "EXTENDS",
    CONSTRUCTOR: "CONSTRUCTOR",
    PUBLIC: "PUBLIC",
    PRIVATE: "PRIVATE",
    MUT: "MUT",
    SUPER: "SUPER",
    STRUCT: "STRUCT",

    AT: "AT",

    PLUS: "PLUS",
    MINUS: "MINUS",
    STAR: "STAR",
    SLASH: "SLASH",
    FLOOR_DIV: "FLOOR_DIV",
    MODULO: "MODULO",
    POWER: "POWER",

    EQUAL: "EQUAL",
    NOT_EQUAL: "NOT_EQUAL",
    LESS: "LESS",
    LESS_EQUAL: "LESS_EQUAL",
    GREATER: "GREATER",
    GREATER_EQUAL: "GREATER_EQUAL",

    CONCAT: "CONCAT",

    ASSIGN: "ASSIGN",

    LEFT_PAREN: "LEFT_PAREN",
    RIGHT_PAREN: "RIGHT_PAREN",

    LEFT_BRACE: "LEFT_BRACE",
    RIGHT_BRACE: "RIGHT_BRACE",

    LEFT_BRACKET: "LEFT_BRACKET",
    RIGHT_BRACKET: "RIGHT_BRACKET",

    COMMA: "COMMA",
    DOT: "DOT",
    COLON: "COLON",
    SEMICOLON: "SEMICOLON",

    DOUBLE_COLON: "DOUBLE_COLON",

    TERMINATION: "TERMINATION",

    COMMENT: "COMMENT",

    UNKNOWN: "UNKNOWN"
});

const KEYWORDS = Object.freeze({
    and: TokenType.AND,
    break: TokenType.BREAK,
    do: TokenType.DO,
    else: TokenType.ELSE,
    elseif: TokenType.ELSEIF,
    end: TokenType.END,
    false: TokenType.FALSE,
    for: TokenType.FOR,
    function: TokenType.FUNCTION,
    if: TokenType.IF,
    in: TokenType.IN,
    local: TokenType.LOCAL,
    nil: TokenType.NIL,
    not: TokenType.NOT,
    or: TokenType.OR,
    repeat: TokenType.REPEAT,
    return: TokenType.RETURN,
    then: TokenType.THEN,
    true: TokenType.TRUE,
    until: TokenType.UNTIL,
    while: TokenType.WHILE,

    class: TokenType.CLASS,
    extends: TokenType.EXTENDS,
    constructor: TokenType.CONSTRUCTOR,
    public: TokenType.PUBLIC,
    private: TokenType.PRIVATE,
    mut: TokenType.MUT,
    super: TokenType.SUPER,
    struct: TokenType.STRUCT
});

class SourcePosition {
    constructor(offset, line, column) {
        this.offset = offset;
        this.line = line;
        this.column = column;
    }

    toString() {
        return `${this.line}:${this.column}`;
    }
}

class Token {
    constructor(type, lexeme, literal = null, start = null, end = null) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.start = start;
        this.end = end || start;
    }

    toString() {
        return `${this.type} "${this.lexeme}"`;
    }
}

function createToken(
    type,
    lexeme,
    literal = null,
    start = null,
    end = null
) {
    return new Token(
        type,
        lexeme,
        literal,
        start,
        end || start
    );
}

function createPosition(offset, line, column) {
    return new SourcePosition(
        offset,
        line,
        column
    );
}

module.exports = {
    TokenType,
    KEYWORDS,
    SourcePosition,
    Token,
    createToken,
    createPosition
};
