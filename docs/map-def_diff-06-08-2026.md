--- map-def.md (原始)


+++ map-def.md (修改后)
# luaScript Core v2.0 — Development Map (map-def.md)

**Версия документа:** 1.0.0
**Дата обновления:** 2026-08-04
**Статус проекта:** Alpha (Core Compiler in Progress)

---

## 📋 Оглавление

1. [Цель проекта](#1-цель-проекта)
2. [Архитектурные особенности](#2-архитектурные-особенности)
3. [Уровни зрелости (5 уровней)](#3-уровни-зрелости-5-уровней)
4. [Текущий статус разработки](#4-текущий-статус-разработки)
5. [Детальный roadmap по уровням](#5-детальный-roadmap-по-уровням)
6. [Модульная структура кода](#6-модульная-структура-кода)
7. [Стратегия тестирования](#7-стратегия-тестирования)
8. [Критические задачи до MVP](#8-критические-задачи-до-mvp)
9. [Definition of Done](#9-definition-of-done)

---

## 1. Цель проекта

### 1.1 Миссия

**luaScript** — внутренний DSL/язык для **детерминированной генерации Luau-кода для Roblox**.

> Позволить LLM создавать, изменять и рефакторить игровые системы через структурированные `.luas`-файлы, после чего детерминированно получать готовый Luau-проект.

### 1.2 Философия дизайна

```
LLM decides intent → Compiler decides syntax → Framework decides runtime → Roblox executes
```

### 1.3 Ключевые принципы

| Принцип | Описание |
|---------|----------|
| **Deterministic** | Одинаковый вход → одинаковый выход. Никаких случайных значений, времени, порядка файлов. |
| **LLM-oriented** | Предсказуемый синтаксис, явная структура, ограниченный типовой контракт. |
| **Profile-based** | Standard / Aura / Aura Matter профили компиляции. |
| **AST-first** | Lexer → Parser → AST → Validator → CodeGen. Никаких regex-замен. |
| **Shell-contract** | Каждый `.luas` файл содержит metadata + source code + termination token. |

---

## 2. Архитектурные особенности

### 2.1 Pipeline компиляции

```
Game Design Description
         ↓
       LLM (Designer + Architect)
         ↓
    Shells (.luas файлы)
         ↓
   luaScript-core компилятор
   ├── Lexer (tokens)
   ├── Parser (AST)
   ├── Validator (semantic checks)
   ├── Profile Validator (Aura/Matter rules)
   └── Code Generator (Luau)
         ↓
      Luau (.lua)
         ↓
   luaScriptWork (Aura/Matter)
         ↓
      Rojo → Roblox
```

### 2.2 Профили компиляции

| Профиль | Описание | Доступные API |
|---------|----------|---------------|
| **Standard** | Базовый luaScript без фреймворков | Чистый Luau |
| **Aura** | Интеграция с Aura framework | Aura contracts |
| **Aura Matter** | Aura + Matter ECS | Query, insert, remove, spawn, despawn |

### 2.3 Shell format

Каждый `.luas` файл содержит:

```lua
@ShellMeta({...})
@Perspective({...})
@Service({...})

class WeaponTimerSystem extends MatterSystem do

    public update(deltaTime: number): number do
        -- logic
    end

end

# AURA_END
```

**Компоненты shell:**
- Semantic metadata (decorators)
- Source code (class/struct declarations)
- Termination token (`# AURA_END`)

### 2.4 Языковые особенности luaScript 2.0

| Особенность | Статус | Описание |
|-------------|--------|----------|
| Immutable by default | ✅ | `local mut` для изменяемых bindings |
| Классы с `extends` | ✅ | `class Foo extends Bar do ... end` |
| Struct для типов | ✅ | Compile-time type declarations |
| No generics | ✅ | Намеренное ограничение |
| No void | ✅ | Методы без возврата не используют `void` |
| No any/unknown | ✅ | Запрещены escape-hatches |
| Union types | ✅ | `number \| string` |
| Optional types | ✅ | `string?` |
| Arrays | ✅ | `number[]` |
| Maps | ✅ | `{ [string]: number }` |
| Function types | ✅ | `(number, number) -> number` |
| `mut` modifier | ✅ | Rust-inspired mutable bindings |
| Private/Public | ✅ | Static contract (не runtime enforcement) |

---

## 3. Уровни зрелости (5 уровней)

Проект развивается по 5 уровням зрелости. Каждый уровень должен быть завершён перед переходом к следующему.

```
┌─────────────────────────────────────────────────────────────────┐
│                    УРОВЕНЬ 5: AURA / WEAVER                      │
│  Memgraph semantic index, AI tree engine, deployment            │
│                          ⬜ НЕ НАЧАТО (0%)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                   УРОВЕНЬ 4: SEMANTIC TREE                       │
│  Project tree spec, dependency graph, shell relations           │
│                          ⬜ НЕ НАЧАТО (0%)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                  УРОВЕНЬ 3: SHELL FORMAT                         │
│  Shell specification, semantic contract, metadata format        │
│                          ⬜ НЕ НАЧАТО (0%)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                УРОВЕНЬ 2: COMPILER INFRASTRUCTURE                │
│  Compiler API, diagnostics, unified compile() interface         │
│                     🟡 В ПРОЦЕССЕ (35%)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────────┐
│                   УРОВЕНЬ 1: LUASCRIPT CORE                      │
│  Lexer, Parser, AST, Validator, CodeGen, Grammar                │
│                     🟢 ГОТОВО (75%)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Текущий статус разработки

### 4.1 Общий прогресс

| Уровень | Название | Прогресс | Статус |
|---------|----------|----------|--------|
| **L1** | luaScript Core | 75% | 🟢 Почти готово |
| **L2** | Compiler Infrastructure | 35% | 🟡 В процессе |
| **L3** | Shell Format | 0% | ⬜ Не начато |
| **L4** | Semantic Tree | 0% | ⬜ Не начато |
| **L5** | AURA / Weaver | 0% | ⬜ Не начато |

### 4.2 Детальный статус компонентов L1

| Компонент | Файл | Строк | Статус | Тесты |
|-----------|------|-------|--------|-------|
| **Token Model** | `compiler/token.js` | 176 | ✅ Готово | ✅ |
| **Lexer** | `compiler/lexer.js` | 653 | ✅ Готово | ✅ |
| **Parser** | `compiler/parser.js` | 1295 | 🟡 Базовая версия | ✅ (частично) |
| **Validator** | `compiler/validator.js` | 472 | 🟡 Базовая версия | ✅ |
| **Code Generator** | `compiler/codegen.js` | 618 | 🟡 Базовая версия | ❌ |
| **Project Tree** | `compiler/project_tree.js` | 175 | ⬜ Заготовка | ❌ |

### 4.3 Статус тестов

```
============================================================
 TEST SUMMARY
============================================================

TOTAL:  46
OK:     45
FAILED: 1
------------------------------------------------------------

FAILED TESTS:
  - ai_task_gateway.test.js (ошибка валидации хеша)
```

**Покрытие по модулям:**

| Модуль | Unit тесты | Integration тесты | Golden тесты |
|--------|------------|-------------------|--------------|
| Lexer | ✅ | ❌ | ❌ |
| Parser | ✅ | ❌ | ❌ |
| Validator | ✅ | ❌ | ❌ |
| CodeGen | ❌ | ❌ | ❌ |
| Compiler API | ❌ | ❌ | ❌ |
| Project modules | ✅ | ❌ | ❌ |

### 4.4 Известные проблемы

| Проблема | Приоритет | Описание |
|----------|-----------|----------|
| **Parser: for-in statement** | 🔴 HIGH | WeaponTimerSystem использует `for ... in ... do`, требуется полная поддержка |
| **CodeGen: AST mismatch** | 🔴 HIGH | CodeGenerator ожидает Program AST, но получает напрямую от Parser |
| **Grammar coverage** | 🔴 HIGH | Отсутствуют: while, if/elseif/else, return, assignment, arrays, boolean expressions |
| **Diagnostics system** | 🟡 MEDIUM | Нет единой системы ошибок с кодами LS0xx |
| **Compiler API** | 🔴 HIGH | Нет унифицированного `compile(source, options)` интерфейса |

---

## 5. Детальный roadmap по уровням

### 🔵 УРОВЕНЬ 1: LUASCRIPT CORE (75% завершено)

**Цель:** Стабильный compiler pipeline от tokens до Luau.

#### 5.1.1 Завершённые компоненты ✅

- [x] **Token Model** (`compiler/token.js`)
  - TokenType enum
  - KEYWORDS map
  - SourcePosition class
  - Token class
  - Helper functions

- [x] **Lexer** (`compiler/lexer.js`)
  - Full tokenization
  - Comment handling
  - String/number literals
  - Operators
  - Keywords recognition
  - Error reporting (LS002)

- [x] **Parser (basic)** (`compiler/parser.js`)
  - Class declarations
  - Struct declarations
  - Decorators
  - Basic expressions
  - Error reporting (LS003)

- [x] **Validator (basic)** (`compiler/validator.js`)
  - Type checking
  - Mutability validation
  - Error reporting

#### 5.1.2 Компоненты в работе 🟡

- [ ] **Parser (full grammar)** — 60%
  - [x] Class/struct/decorators
  - [ ] `for-in` statements (критично для WeaponTimerSystem)
  - [ ] `while` loops
  - [ ] `if/elseif/else` chains
  - [ ] `return` statements
  - [ ] Assignment expressions
  - [ ] Function calls & member access (`.` and `:`)
  - [ ] Index expressions (`obj.field`, `arr[1]`)
  - [ ] Table literals (`{ key = value }`)
  - [ ] Boolean expressions (`and`, `or`, `not`)
  - [ ] Arithmetic expressions (полные)
  - [ ] Break/continue statements

- [ ] **Code Generator** — 50%
  - [x] Class emission
  - [x] Struct emission
  - [ ] For-in loops
  - [ ] While loops
  - [ ] If/elseif/else
  - [ ] Return statements
  - [ ] Assignments
  - [ ] Method calls
  - [ ] Table literals
  - [ ] Fix AST integration issue

- [ ] **Validator (full)** — 40%
  - [ ] Complete type inference
  - [ ] Aura profile validation
  - [ ] Matter profile validation
  - [ ] Network contract validation

#### 5.1.3 отсутствующие компоненты ⬜

- [ ] **AST Utilities** (`compiler/ast/utils.js`)
  - AST traversal
  - AST transformation
  - AST serialization/deserialization

- [ ] **Grammar Specification** (`docs/grammar.md`)
  - Formal BNF/EBNF grammar
  - Examples for each construct
  - Edge cases documentation

---

### 🟡 УРОВЕНЬ 2: COMPILER INFRASTRUCTURE (35% завершено)

**Цель:** Unified Compiler API, diagnostics, integration tests.

#### 5.2.1 Завершённые компоненты ✅

- [x] **Project Compiler** (`compiler/project/compiler.js`)
  - Basic compile interface
  - File resolution

- [x] **Project modules** (частично)
  - Context, State, Snapshot
  - Evolution flow
  - AI task gateways

#### 5.2.2 Компоненты в работе 🟡

- [ ] **Unified Compiler API** (`compiler/compiler.js`) — 30%
  - [ ] Export `compile(source, options)` function
  - [ ] Options: profile, emitAst, emitTokens
  - [ ] Return: `{ luau, ast, tokens, diagnostics }`
  - [ ] Error handling with codes

- [ ] **Diagnostics System** (`compiler/diagnostics.js`) — 20%
  - [ ] Diagnostic codes (LS001-LS099)
  - [ ] Severity levels (error, warning, info)
  - [ ] Source positions
  - [ ] Helpful messages with suggestions
  - [ ] Machine-readable format

- [ ] **Integration Tests** (`tests/integration/`) — 40%
  - [ ] Full pipeline tests (Lexer → CodeGen)
  - [ ] Golden tests for critical constructs
  - [ ] Profile-specific tests
  - [ ] Error case tests

#### 5.2.3 отсутствующие компоненты ⬜

- [ ] **Compiler CLI** (`bin/luas.js`)
  - `luas compile input.luas --output output.lua`
  - `luas validate input.luas`
  - `luas ast input.luas --format json`

- [ ] **Watch mode**
  - File watching
  - Incremental compilation

- [ ] **Performance benchmarks**
  - Compilation speed
  - Memory usage

---

### ⬜ УРОВЕНЬ 3: SHELL FORMAT (0% завершено)

**Цель:** Определить и реализовать Shell specification.

#### 5.3.1 Требуемые компоненты

- [ ] **Shell Specification** (`docs/shell_spec.md`)
  - Metadata format (@ShellMeta, @Perspective, @Service)
  - Semantic contract
  - Dependency format
  - Versioning strategy

- [ ] **Shell Parser** (`compiler/shell/parser.js`)
  - Extract metadata from .luas files
  - Validate metadata structure
  - Build shell manifest

- [ ] **Shell Repository** (`compiler/shell/repository.js`) — уже есть заготовка
  - Store/load shells
  - Dependency resolution
  - Version management

- [ ] **Shell Validator** (`compiler/shell/validator.js`) — уже есть заготовка
  - Validate metadata
  - Validate dependencies
  - Validate semantic contract

- [ ] **Shell Tests** (`tests/unit/shell_*.test.js`)
  - Metadata parsing
  - Dependency resolution
  - Validation rules

---

### ⬜ УРОВЕНЬ 4: SEMANTIC TREE (0% завершено)

**Цель:** Project tree structure, dependency graph, shell relations.

#### 5.4.1 Требуемые компоненты

- [ ] **Tree Specification** (`docs/tree_spec.md`)
  - Node/Leaf definitions
  - Relation types (depends_on, extends, implements)
  - Graph structure

- [ ] **Tree Builder** (`compiler/shell/tree/builder.js`)
  - Build tree from shells
  - Resolve dependencies
  - Detect cycles

- [ ] **Tree Validator** (`compiler/shell/tree/validator.js`)
  - Validate tree structure
  - Validate relations
  - Detect orphan nodes

- [ ] **Tree Serializer** (`compiler/shell/tree/serializer.js`)
  - JSON export
  - Graphviz export
  - Mermaid export

- [ ] **Tree Tests** (`tests/unit/tree_*.test.js`)

---

### ⬜ УРОВЕНЬ 5: AURA / WEAVER (0% завершено)

**Цель:** Memgraph semantic index, AI tree engine, deployment.

#### 5.5.1 Требуемые компоненты

- [ ] **Memgraph Integration** (`compiler/aura/memgraph.js`)
  - Connect to Memgraph
  - Store semantic index
  - Query relations

- [ ] **AI Tree Engine** (`compiler/aura/ai_engine.js`)
  - Navigate tree
  - Suggest changes
  - Refactor shells

- [ ] **Weaver** (`compiler/project/weaver.js`) — уже есть заготовка
  - Deploy compiled Luau
  - Manage Roblox project structure
  - Rojo integration

- [ ] **Deployment Pipeline**
  - CI/CD integration
  - Version tagging
  - Rollback support

---

## 6. Модульная структура кода

### 6.1 Текущая структура

```
/workspace
├── compiler/
│   ├── token.js              # ✅ 176 строк
│   ├── lexer.js              # ✅ 653 строки
│   ├── parser.js             # 🟡 1295 строк (требует декомпозиции)
│   ├── validator.js          # 🟡 472 строки
│   ├── codegen.js            # 🟡 618 строк
│   ├── compiler.js           # 🟡 217 строк
│   ├── project_tree.js       # ⬜ 175 строк
│   │
│   ├── ast/
│   │   └── serializer.js     # ✅ AST serialization
│   │
│   ├── project/              # Project-level modules
│   │   ├── compiler.js
│   │   ├── context.js
│   │   ├── state.js
│   │   ├── snapshot.js
│   │   ├── evolution.js
│   │   ├── weaver.js
│   │   └── ... (25+ файлов)
│   │
│   └── shell/
│       ├── schema.js
│       ├── serializer.js
│       ├── repository.js
│       └── tree/
│           └── index.js
│
├── docs/
│   ├── language_spec.md      # ✅ Полная спецификация языка
│   ├── architecture.md       # ✅ Архитектура
│   ├── compiler.md           # ✅ Compiler documentation
│   └── ... (4 других файла)
│
├── examples/
│   ├── WeaponTimerSystem.luas
│   ├── aura_matter_system.luas
│   ├── hello_world.luas
│   └── simple_class.luas
│
├── tests/
│   ├── unit/                 # 46 unit тестов
│   │   ├── lexer.test.js
│   │   ├── parser.test.js
│   │   ├── validator.test.js
│   │   └── ... (43 других)
│   │
│   └── integration/          # ⬜ Пусто
│
└── manifest/
    ├── luas_syntax_spec.json
    └── rules_matrix.json
```

### 6.2 Рекомендуемая модульная структура (файлы ≤200 строк)

#### Level 1: Core Compiler

```
compiler/
├── token.js                  # ✅ 176 строк (готово)
├── lexer.js                  # ⚠️  653 строки → разбить на:
│   ├── lexer.js              # Main class (~100 строк)
│   ├── lexer_scanners.js     # Scanner functions (~200 строк)
│   ├── lexer_tokens.js       # Token helpers (~150 строк)
│   └── lexer_errors.js       # Error classes (~100 строк)
│
├── parser/                   # 🟡 1295 строк → разбить на:
│   ├── parser.js             # Main class (~150 строк)
│   ├── parser_declarations.js # Class/struct/decorator (~300 строк)
│   ├── parser_statements.js  # If/for/while/return (~300 строк)
│   ├── parser_expressions.js # Expressions (~300 строк)
│   ├── parser_types.js       # Type annotations (~150 строк)
│   └── parser_errors.js      # Error classes (~100 строк)
│
├── validator/
│   ├── validator.js          # Main class (~150 строк)
│   ├── validator_types.js    # Type validation (~200 строк)
│   ├── validator_mutability.js # Mut checks (~150 строк)
│   └── validator_profiles.js # Aura/Matter profiles (~200 строк)
│
├── codegen/
│   ├── codegen.js            # Main class (~150 строк)
│   ├── codegen_classes.js    # Class emission (~200 строк)
│   ├── codegen_statements.js # Statement emission (~250 строк)
│   ├── codegen_expressions.js # Expression emission (~200 строк)
│   └── codegen_types.js      # Type emission (~150 строк)
│
├── ast/
│   ├── ast.js                # AST node definitions (~200 строк)
│   ├── ast_utils.js          # Traversal utilities (~150 строк)
│   └── ast_serializer.js     # JSON serialization (~150 строк)
│
├── diagnostics/
│   ├── diagnostics.js        # Main diagnostic engine (~150 строк)
│   ├── diagnostics_codes.js  # Error codes LS001-LS099 (~100 строк)
│   └── diagnostics_messages.js # Error messages (~200 строк)
│
└── compiler.js               # Unified API (~150 строк)
```

#### Level 2: Shell & Tree

```
compiler/shell/
├── shell_parser.js           # Parse .luas metadata (~150 строк)
├── shell_validator.js        # Validate shell contract (~200 строк)
├── shell_serializer.js       # Serialize/deserialize (~150 строк)
├── shell_repository.js       # Store/manage shells (~200 строк)
└── tree/
    ├── tree_builder.js       # Build dependency tree (~200 строк)
    ├── tree_validator.js     # Validate tree structure (~150 строк)
    └── tree_serializer.js    # Export tree formats (~150 строк)
```

### 6.3 Принципы модульности

1. **Файл ≤200 строк** — если больше, разбить на подмодули
2. **Один файл = одна ответственность** — не смешивать логику
3. **Явные импорты** — никаких скрытых зависимостей
4. **Тесты для каждого файла** — `file.test.js` рядом или в `tests/unit/`
5. **Документация для публичных API** — JSDoc комментарии

---

## 7. Стратегия тестирования

### 7.1 Уровни тестирования

```
┌─────────────────────────────────────────────────────┐
│              E2E / Golden Tests                      │
│  (WeaponTimerSystem.luas → weapon_timer_system.lua) │
└─────────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────────┐
│              Integration Tests                       │
│  (Lexer → Parser → Validator → CodeGen pipeline)    │
└─────────────────────────────────────────────────────┘
                        ↑
┌─────────────────────────────────────────────────────┐
│              Unit Tests                              │
│  (каждый файл кода → соответствующий .test.js)      │
└─────────────────────────────────────────────────────┘
```

### 7.2 Текущее покрытие

| Тип тестов | Количество | Покрытие | Статус |
|------------|------------|----------|--------|
| **Unit** | 46 | ~60% core modules | 🟡 Хорошо |
| **Integration** | 0 | 0% | ❌ Критично |
| **Golden** | 0 | 0% | ❌ Критично |
| **E2E** | 0 | 0% | ❌ Критично |

### 7.3 План покрытия тестами

#### Phase 1: Unit Tests (приоритет: сейчас)

| Файл кода | Тестовый файл | Статус |
|-----------|---------------|--------|
| `token.js` | `tests/unit/token.test.js` | ✅ |
| `lexer.js` | `tests/unit/lexer.test.js` | ✅ |
| `parser.js` | `tests/unit/parser.test.js` | ✅ (базовые) |
| `validator.js` | `tests/unit/validator.test.js` | ✅ |
| `codegen.js` | `tests/unit/codegen.test.js` | ❌ |
| `compiler.js` | `tests/unit/compiler.test.js` | ❌ |
| `diagnostics.js` | `tests/unit/diagnostics.test.js` | ❌ |

#### Phase 2: Integration Tests (приоритет: после Phase 1)

| Сценарий | Тестовый файл | Статус |
|----------|---------------|--------|
| Lexer → Parser | `tests/integration/lexer_parser.test.js` | ❌ |
| Parser → Validator | `tests/integration/parser_validator.test.js` | ❌ |
| Validator → CodeGen | `tests/integration/validator_codegen.test.js` | ❌ |
| Full pipeline | `tests/integration/full_pipeline.test.js` | ❌ |

#### Phase 3: Golden Tests (приоритет: перед релизом)

| Пример | Ожидаемый вывод | Статус |
|--------|----------------|--------|
| `examples/hello_world.luas` | `golden/hello_world.lua` | ❌ |
| `examples/simple_class.luas` | `golden/simple_class.lua` | ❌ |
| `examples/WeaponTimerSystem.luas` | `golden/weapon_timer_system.lua` | ❌ |

### 7.4 Формат unit тестов

Каждый unit тест следует структуре:

```javascript
// tests/unit/lexer.test.js

const assert = require("assert");
const { Lexer } = require("../../compiler/lexer");
const { TokenType } = require("../../compiler/token");

describe("Lexer", () => {
    describe("tokenize()", () => {
        it("should tokenize simple class declaration", () => {
            const source = `
class Foo extends Bar do
end
# AURA_END
            `;

            const lexer = new Lexer(source);
            const tokens = lexer.tokenize();

            assert.strictEqual(tokens[0].type, TokenType.CLASS);
            assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
            assert.strictEqual(tokens[1].lexeme, "Foo");
            // ...
        });

        it("should report error for invalid character", () => {
            const source = `class @Invalid do end # AURA_END`;
            const lexer = new Lexer(source);

            assert.throws(() => {
                lexer.tokenize();
            }, /LS002/);
        });
    });
});

console.log("All lexer tests passed!");
```

---

## 8. Критические задачи до MVP

### 🔴 PRIORITET 1: Завершить Level 1 (2-3 недели)

#### Неделя 1: Parser completion

- [ ] Исправить `for-in` statement parsing
  - Файл: `compiler/parser/parser_statements.js`
  - Тест: `tests/unit/parser_for_in.test.js`
  - Пример: WeaponTimerSystem.luas строка 10

- [ ] Добавить `while` loops
  - Файл: `compiler/parser/parser_statements.js`
  - Тест: `tests/unit/parser_while.test.js`

- [ ] Добавить `if/elseif/else` chains
  - Файл: `compiler/parser/parser_statements.js`
  - Тест: `tests/unit/parser_if.test.js`

- [ ] Добавить `return` statements
  - Файл: `compiler/parser/parser_statements.js`
  - Тест: `tests/unit/parser_return.test.js`

#### Неделя 2: CodeGen completion

- [ ] Исправить интеграцию Parser → CodeGen
  - Файл: `compiler/codegen.js` строка 39
  - Проблема: несоответствие AST формата

- [ ] Реализовать `for-in` emission
  - Файл: `compiler/codegen/codegen_statements.js`
  - Тест: `tests/unit/codegen_for_in.test.js`

- [ ] Реализовать `while` emission
  - Файл: `compiler/codegen/codegen_statements.js`
  - Тест: `tests/unit/codegen_while.test.js`

- [ ] Реализовать `if/elseif/else` emission
  - Файл: `compiler/codegen/codegen_statements.js`
  - Тест: `tests/unit/codegen_if.test.js`

#### Неделя 3: Compiler API & Diagnostics

- [ ] Создать `compiler/diagnostics/diagnostics.js`
  - Diagnostic engine
  - Коды ошибок LS001-LS099

- [ ] Создать `compiler/compiler.js` (unified API)
  - `compile(source, options)` функция
  - Return: `{ luau, ast, tokens, diagnostics }`

- [ ] Написать integration tests
  - `tests/integration/full_pipeline.test.js`
  - End-to-end тест для WeaponTimerSystem

### 🟡 PRIORITET 2: Начать Level 2 (1-2 недели)

- [ ] Определить Shell specification
  - Файл: `docs/shell_spec.md`

- [ ] Создать Shell parser
  - Файл: `compiler/shell/shell_parser.js`

- [ ] Добавить Shell tests
  - `tests/unit/shell_parser.test.js`

### ⬜ PRIORITET 3: Level 3-5 (после MVP)

- [ ] Tree specification
- [ ] Memgraph integration
- [ ] AI engine
- [ ] Weaver deployment

---

## 9. Definition of Done

### 9.1 MVP готов когда:

```
✅ examples/WeaponTimerSystem.luas
         ↓
    compile()
         ↓
   tokens → AST → validation → Luau
         ↓
✅ weapon_timer_system.lua (валидный, детерминированный)
```

**Без ручных исправлений!**

### 9.2 Критерии готовности Level 1

- [ ] Все grammar constructs распарсиваются
- [ ] Все grammar constructs генерируются в Luau
- [ ] WeaponTimerSystem.luas компилируется без ошибок
- [ ] Все unit тесты проходят (46+)
- [ ] Integration тесты проходят (10+)
- [ ] Golden тесты соответствуют ожидаемому выводу
- [ ] Diagnostics система работает с кодами LS0xx
- [ ] Compiler API экспортирует `compile()` функцию

### 9.3 Критерии готовности Level 2

- [ ] Shell specification определена
- [ ] Shell parser извлекает metadata
- [ ] Dependency resolution работает
- [ ] Project tree строится корректно

### 9.4 Критерии готовности Level 3-5

- [ ] Tree specification реализована
- [ ] Memgraph integration работает
- [ ] AI engine предлагает изменения
- [ ] Weaver деплоит в Roblox

---

## 📊 Сводка прогресса

```
Общий прогресс проекта: ████████░░░░░░░░░░░░ 35%

Level 1: Core Compiler     ███████████████░░░ 75%
Level 2: Infrastructure    ████░░░░░░░░░░░░░░ 35%
Level 3: Shell Format      ░░░░░░░░░░░░░░░░░░  0%
Level 4: Semantic Tree     ░░░░░░░░░░░░░░░░░░  0%
Level 5: AURA / Weaver     ░░░░░░░░░░░░░░░░░░  0%

Тесты:
  Unit:        ████████████████████░░ 45/46 passing (98%)
  Integration: ░░░░░░░░░░░░░░░░░░░░░░  0/10 passing ( 0%)
  Golden:      ░░░░░░░░░░░░░░░░░░░░░░  0/5  passing ( 0%)
```

---

## 🎯 Следующие шаги (прямо сейчас)

1. **Исправить Parser: for-in statement** (1-2 часа)
   - Файл: `compiler/parser.js` или `compiler/parser/parser_statements.js`
   - Тест: `tests/unit/parser_for_in.test.js`

2. **Исправить CodeGen: AST integration** (30 минут)
   - Файл: `compiler/codegen.js` строка 39

3. **Создать Compiler API** (2-3 часа)
   - Файл: `compiler/compiler.js`
   - Функция: `compile(source, options)`

4. **Написать Integration test** (1-2 часа)
   - Файл: `tests/integration/full_pipeline.test.js`
   - Сценарий: WeaponTimerSystem.luas → Luau

---

**Документ является живым и обновляется по мере развития проекта.**

Для вопросов и предложений обращайтесь к maintainer проекта.