// compiler/lexer.js

/**

* luaScript Core 2.0
*
* Lexer:
*
* ```
  source text
  ```
* ```
       ↓
  ```
* ```
    tokens
  ```
*
* Lexer НЕ:
* * строит AST;
* * проверяет типы;
* * знает Matter/ECS;
* * генерирует Luau;
* * исправляет ошибки исходного кода.
    */

const {
TokenType,
KEYWORDS,
Token,
SourcePosition
} = require("./token");

/**

* Ошибка лексического анализа.
*
* LexerError содержит позицию, чтобы compiler мог показать
* человеку/LLM точное место проблемы.
  */
  class LexerError extends Error {
  constructor(message, line, column, offset) {
  super(message);

  ```
   this.name = "LexerError";
   this.code = "LS002";

   this.line = line;
   this.column = column;
   this.offset = offset;
  ```

  }
  }

/**

* luaScript Lexer.
  */
  class Lexer {
  constructor(source, options = {}) {
  if (typeof source !== "string") {
  throw new TypeError("Lexer source must be a string.");
  }

  ```
   this.source = source;
   this.length = source.length;

   this.current = 0;
   this.start = 0;

   this.line = 1;
   this.column = 1;

   this.tokenStartLine = 1;
   this.tokenStartColumn = 1;

   this.tokens = [];

   this.options = {
       includeComments: false,
       includeNewlines: true,
       requireTerminationToken: true,
       ...options
   };

   this.hasTerminationToken = false;
  ```

  }

  /**

  * Главный entry point.
  *
  * @returns {Token[]}
    */
    tokenize() {
    while (!this.isAtEnd()) {
    this.start = this.current;
    this.tokenStartLine = this.line;
    this.tokenStartColumn = this.column;

    ```
     this.scanToken();
    ```

    }

    if (
    this.options.requireTerminationToken &&
    !this.hasTerminationToken
    ) {
    this.error(
    "Missing termination token '# AURA_END'."
    );
    }

    const eofPosition = this.position();

    this.tokens.push(
    new Token(
    TokenType.EOF,
    "",
    null,
    eofPosition,
    eofPosition
    )
    );

    return this.tokens;
    }

  /**

  * Анализ одного lexical token.
    */
    scanToken() {
    const char = this.advance();

    switch (char) {
    // -------------------------------------------------
    // Whitespace
    // -------------------------------------------------

    ```
     case " ":
     case "\t":
     case "\r":
         return;

     case "\n":
         this.handleNewline();
         return;

     // -------------------------------------------------
     // Comments / termination token
     // -------------------------------------------------

     case "-":
         if (this.match("-")) {
             this.scanComment();
         } else {
             this.addToken(TokenType.MINUS);
         }
         return;

     case "#":
         this.scanHashDirective();
         return;

     // -------------------------------------------------
     // Decorators
     // -------------------------------------------------

     case "@":
         this.addToken(TokenType.AT);
         return;

     // -------------------------------------------------
     // Arithmetic
     // -------------------------------------------------

     case "+":
         this.addToken(TokenType.PLUS);
         return;

     case "*":
         this.addToken(TokenType.STAR);
         return;

     case "/":
         if (this.match("/")) {
             this.addToken(TokenType.FLOOR_DIV);
         } else {
             this.addToken(TokenType.SLASH);
         }
         return;

     case "%":
         this.addToken(TokenType.MODULO);
         return;

     case "^":
         this.addToken(TokenType.POWER);
         return;

     // -------------------------------------------------
     // Assignment / equality
     // -------------------------------------------------

     case "=":
         if (this.match("=")) {
             this.addToken(TokenType.EQUAL);
         } else {
             this.addToken(TokenType.ASSIGN);
         }
         return;

     case "~":
         if (this.match("=")) {
             this.addToken(TokenType.NOT_EQUAL);
         } else {
             this.addUnknown();
         }
         return;

     // -------------------------------------------------
     // Comparison
     // -------------------------------------------------

     case "<":
         if (this.match("=")) {
             this.addToken(TokenType.LESS_EQUAL);
         } else {
             this.addToken(TokenType.LESS);
         }
         return;

     case ">":
         if (this.match("=")) {
             this.addToken(TokenType.GREATER_EQUAL);
         } else {
             this.addToken(TokenType.GREATER);
         }
         return;

     // -------------------------------------------------
     // Concatenation
     // -------------------------------------------------

     case ".":
         if (this.match(".")) {
             this.addToken(TokenType.CONCAT);
         } else {
             this.addToken(TokenType.DOT);
         }
         return;

     // -------------------------------------------------
     // Parentheses
     // -------------------------------------------------

     case "(":
         this.addToken(TokenType.LEFT_PAREN);
         return;

     case ")":
         this.addToken(TokenType.RIGHT_PAREN);
         return;

     // -------------------------------------------------
     // Braces
     // -------------------------------------------------

     case "{":
         this.addToken(TokenType.LEFT_BRACE);
         return;

     case "}":
         this.addToken(TokenType.RIGHT_BRACE);
         return;

     // -------------------------------------------------
     // Brackets
     // -------------------------------------------------

     case "[":
         this.addToken(TokenType.LEFT_BRACKET);
         return;

     case "]":
         this.addToken(TokenType.RIGHT_BRACKET);
         return;

     // -------------------------------------------------
     // Punctuation
     // -------------------------------------------------

     case ",":
         this.addToken(TokenType.COMMA);
         return;

     case ":":
         if (this.match(":")) {
             this.addToken(TokenType.DOUBLE_COLON);
         } else {
             this.addToken(TokenType.COLON);
         }
         return;

     case ";":
         this.addToken(TokenType.SEMICOLON);
         return;

     // -------------------------------------------------
     // Strings
     // -------------------------------------------------

     case '"':
     case "'":
         this.scanString(char);
         return;

     // -------------------------------------------------
     // Numbers
     // -------------------------------------------------

     default:
         if (this.isDigit(char)) {
             this.scanNumber();
             return;
         }

         if (this.isIdentifierStart(char)) {
             this.scanIdentifier();
             return;
         }

         this.addUnknown();
    ```

    }
    }

  /**

  * Обрабатывает newline.
    */
    handleNewline() {
    if (!this.options.includeNewlines) {
    return;
    }

    this.addToken(TokenType.NEWLINE);
    }

  /**

  * Обрабатывает комментарий.
  *
  * Lua comment:
  *
  * ```
    -- comment
    ```
  *
  * Декораторы не имеют отношения к comments.
    */
    scanComment() {
    while (
    !this.isAtEnd() &&
    this.peek() !== "\n"
    ) {
    this.advance();
    }

    if (this.options.includeComments) {
    this.addToken(
    TokenType.COMMENT,
    this.source.substring(
    this.start + 2,
    this.current
    )
    );
    }
    }

  /**

  * Обрабатывает '#' и специальные directives.
  *
  * Сейчас поддерживается только:
  *
  * ```
    # AURA_END
    ```
  *
  * Любой другой '#' считается ошибкой.
    */
    scanHashDirective() {
    const directiveStart = this.current - 1;

    while (
    !this.isAtEnd() &&
    this.peek() !== "\n"
    ) {
    this.advance();
    }

    const text = this.source
    .substring(directiveStart, this.current)
    .trim();

    if (text === "# AURA_END") {
    if (this.hasTerminationToken) {
    this.error(
    "Duplicate termination token '# AURA_END'."
    );
    }

    ```
     this.hasTerminationToken = true;

     this.addToken(
         TokenType.TERMINATION,
         "# AURA_END"
     );

     return;
    ```

    }

    this.error(
    `Unknown directive '${text}'.`
    );
    }

  /**

  * Сканирует строковый literal.
  *
  * Поддерживаются:
  *
  * ```
    "hello"
    ```
  * ```
    'hello'
    ```
  *
  * Поддерживаются базовые escape sequences.
    */
    scanString(quote) {
    let value = "";

    while (!this.isAtEnd()) {
    const char = this.peek();

    ```
     if (char === quote) {
         this.advance();

         this.addToken(
             TokenType.STRING,
             value
         );

         return;
     }

     if (char === "\n") {
         this.error(
             "Unterminated string literal."
         );
     }

     if (char === "\\") {
         this.advance();

         if (this.isAtEnd()) {
             this.error(
                 "Unterminated string escape."
             );
         }

         value += this.readEscape();
         continue;
     }

     value += this.advance();
    ```

    }

    this.error(
    "Unterminated string literal."
    );
    }

  /**

  * Читает escape sequence.
    */
    readEscape() {
    const char = this.advance();

    switch (char) {
    case "n":
    return "\n";

    ```
     case "r":
         return "\r";

     case "t":
         return "\t";

     case "\\":
         return "\\";

     case '"':
         return '"';

     case "'":
         return "'";

     default:
         /**
          * Не пытаемся молча исправлять неизвестные escapes.
          *
          * Это важно для deterministic compilation.
          */
         this.error(
             `Unknown escape sequence '\\${char}'.`
         );
    ```

    }
    }

  /**

  * Сканирует number literal.
  *
  * MVP:
  *
  * ```
    10
    ```
  * ```
    10.5
    ```
  * ```
    0.5
    ```
  *
  * Hex/binary/numeric separators пока намеренно
  * не реализуются.
    */
    scanNumber() {
    while (this.isDigit(this.peek())) {
    this.advance();
    }

    if (
    this.peek() === "." &&
    this.isDigit(this.peekNext())
    ) {
    this.advance();

    ```
     while (this.isDigit(this.peek())) {
         this.advance();
     }
    ```

    }

    const lexeme = this.source.substring(
    this.start,
    this.current
    );

    const value = Number(lexeme);

    if (!Number.isFinite(value)) {
    this.error(
    `Invalid numeric literal '${lexeme}'.`
    );
    }

    this.addToken(
    TokenType.NUMBER,
    value
    );
    }

  /**

  * Сканирует identifier или keyword.
    */
    scanIdentifier() {
    while (
    this.isIdentifierPart(this.peek())
    ) {
    this.advance();
    }

    const text = this.source.substring(
    this.start,
    this.current
    );

    const keywordType = KEYWORDS[text];

    if (keywordType) {
    this.addToken(keywordType);
    return;
    }

    this.addToken(
    TokenType.IDENTIFIER
    );
    }

  /**

  * Добавляет token.
  *
  * literal отличается от lexeme:
  *
  * ```
    "100"
    ```
  *
  * может иметь:
  *
  * ```
    lexeme  = "100"
    ```
  * ```
    literal = 100
    ```

  */
  addToken(type, literal = null) {
  const lexeme = this.source.substring(
  this.start,
  this.current
  );

  ```
   const start = new SourcePosition(
       this.start,
       this.tokenStartLine,
       this.tokenStartColumn
   );

   const end = this.position();

   this.tokens.push(
       new Token(
           type,
           lexeme,
           literal,
           start,
           end
       )
   );
  ```

  }

  /**

  * Добавляет UNKNOWN token.
  *
  * В strict compiler mode неизвестные символы должны
  * приводить к ошибке, а не молча исчезать.
    */
    addUnknown() {
    const lexeme = this.source.substring(
    this.start,
    this.current
    );

    this.error(
    `Unexpected character '${lexeme}'.`
    );
    }

  /**

  * Читает следующий символ и двигает cursor.
    */
    advance() {
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

  /**

  * Проверяет следующий символ и двигает cursor,
  * если он совпадает с expected.
    */
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

  /**

  * Смотрит следующий символ без перемещения cursor.
    */
    peek() {
    if (this.isAtEnd()) {
    return "\0";
    }

    return this.source[this.current];
    }

  /**

  * Смотрит символ после следующего.
    */
    peekNext() {
    if (this.current + 1 >= this.length) {
    return "\0";
    }

    return this.source[this.current + 1];
    }

  /**

  * EOF.
    */
    isAtEnd() {
    return this.current >= this.length;
    }

  /**

  * Проверка цифры.
    */
    isDigit(char) {
    return char >= "0" && char <= "9";
    }

  /**

  * Начало identifier.
  *
  * luaScript identifier:
  *
  * ```
    a-z
    ```
  * ```
    A-Z
    ```
  * ```
    _
    ```
  *
  * После первого символа допускаются цифры.
    */
    isIdentifierStart(char) {
    return (
    (char >= "a" && char <= "z") ||
    (char >= "A" && char <= "Z") ||
    char === "_"
    );
    }

  /**

  * Остальная часть identifier.
    */
    isIdentifierPart(char) {
    return (
    this.isIdentifierStart(char) ||
    this.isDigit(char)
    );
    }

  /**

  * Текущая source position.
    */
    position() {
    return new SourcePosition(
    this.current,
    this.line,
    this.column
    );
    }

  /**

  * Формирует LexerError с текущей позицией token.
    */
    error(message) {
    throw new LexerError(
    message,
    this.tokenStartLine,
    this.tokenStartColumn,
    this.start
    );
    }
    }

module.exports = {
Lexer,
LexerError
};
