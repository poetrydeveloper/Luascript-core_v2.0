--- compiler/parser/parser-utils.js (原始)


+++ compiler/parser/parser-utils.js (修改后)
// compiler/parser/parser-utils.js
// Utility functions for luaScript 2.0 Parser

const { TokenType } = require("../token");

/**
 * Create location object from token
 */
function locationFrom(token) {
    if (!token?.start || !token?.end) {
        return null;
    }

    return {
        start: { ...token.start },
        end: { ...token.end }
    };
}

/**
 * Skip newline tokens
 */
function skipNewlines(tokens, currentRef) {
    while (
        currentRef.current < tokens.length &&
        tokens[currentRef.current].type === TokenType.NEWLINE
    ) {
        currentRef.current++;
    }
}

/**
 * Check if at end of token stream
 */
function isAtEnd(tokens, current) {
    return current >= tokens.length;
}

/**
 * Peek at current token
 */
function peek(tokens, current) {
    if (isAtEnd(tokens, current)) {
        return tokens[tokens.length - 1]; // EOF
    }
    return tokens[current];
}

/**
 * Get previous token
 */
function previous(tokens, current) {
    if (current <= 0) {
        return tokens[0];
    }
    return tokens[current - 1];
}

/**
 * Advance and return token
 */
function advance(tokens, currentRef) {
    if (!isAtEnd(tokens, currentRef.current)) {
        currentRef.current++;
    }
    return previous(tokens, currentRef.current);
}

/**
 * Check if current token matches type
 */
function check(tokens, current, type) {
    if (isAtEnd(tokens, current)) {
        return false;
    }
    return peek(tokens, current).type === type;
}

/**
 * Match and consume token(s)
 */
function match(tokens, currentRef, ...types) {
    let matched = false;
    for (const type of types) {
        if (check(tokens, currentRef.current, type)) {
            advance(tokens, currentRef);
            matched = true;
        }
    }
    return matched;
}

/**
 * Consume token or throw error
 */
function consume(tokens, currentRef, type, message, ParserError) {
    if (check(tokens, currentRef.current, type)) {
        return advance(tokens, currentRef);
    }
    const error = new ParserError(message, peek(tokens, currentRef.current));
    throw error;
}

module.exports = {
    locationFrom,
    skipNewlines,
    isAtEnd,
    peek,
    previous,
    advance,
    check,
    match,
    consume
};