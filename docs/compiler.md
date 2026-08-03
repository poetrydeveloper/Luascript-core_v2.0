# luaScript Core — Compiler Specification

**Version:** 2.0.0
**Status:** Architecture / MVP
**Target:** Luau
**Source:** `.luas`

---

# 1. Назначение компилятора

`luaScript Compiler` преобразует исходный код:

```text
.luas
```

в валидный:

```text
Luau
```

Основное требование:

> Одинаковый вход при одинаковой версии компилятора, спецификации и профиле должен давать одинаковый результат.

Компилятор не использует LLM во время сборки.

---

# 2. Compiler Pipeline

Основной pipeline:

```text
.luas source
    │
    ▼
┌─────────────┐
│    Lexer    │
└──────┬──────┘
       │
       ▼
    Tokens
       │
       ▼
┌─────────────┐
│    Parser   │
└──────┬──────┘
       │
       ▼
      AST
       │
       ▼
┌────────────────┐
│ Syntax Validator│
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Semantic/Type  │
│    Validator   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Profile Validator│
└───────┬────────┘
        │
        ▼
       AST
        │
        ▼
┌────────────────┐
│  Code Generator│
└───────┬────────┘
        │
        ▼
      Luau
```

---

# 3. Compiler Components

## 3.1 Lexer

File:

```text
compiler/lexer.js
```

Ответственность:

* читать исходный текст;
* распознавать токены;
* сохранять позиции токенов;
* различать keywords;
* различать identifiers;
* распознавать literals;
* распознавать operators;
* распознавать punctuation;
* пропускать whitespace;
* обрабатывать комментарии.

Lexer не должен:

* строить AST;
* проверять типы;
* знать Aura;
* знать Matter;
* генерировать Luau.

---

# 4. Parser

File:

```text
compiler/parser.js
```

Parser преобразует последовательность tokens в AST.

Parser отвечает за:

* grammar;
* declarations;
* expressions;
* statements;
* blocks;
* classes;
* methods;
* constructors;
* structs;
* type annotations;
* decorators.

Parser не должен:

* генерировать Luau;
* выполнять программу;
* обращаться к Roblox;
* обращаться к Matter runtime.

---

# 5. AST

AST является главным промежуточным представлением компилятора.

Пример:

```text
Program
│
├── Decorator
│   └── ShellMeta
│
├── Decorator
│   └── Perspective
│
├── Decorator
│   └── Service
│
└── ClassDeclaration
    │
    ├── name
    ├── extends
    │
    ├── ConstructorDeclaration
    │
    └── MethodDeclaration
```

После создания AST дальнейшие compiler passes работают с AST.

Нельзя повторно разбирать исходный текст регулярными выражениями.

---

# 6. Validator

File:

```text
compiler/validator.js
```

Validator выполняет статические проверки.

Минимальные проверки:

```text
syntax correctness
type correctness
immutability
declaration correctness
scope correctness
return correctness
struct correctness
class correctness
```

Ошибки должны сообщать:

```text
filename
line
column
error code
message
```

Пример:

```text
WeaponTimerSystem.luas:18:9
LS201
Cannot assign to immutable variable 'speed'.
Use 'mut' when declaring a mutable local.
```

---

# 7. Code Generator

File:

```text
compiler/codegen.js
```

Code Generator получает валидный AST.

Он генерирует Luau.

Принцип:

```text
AST → Luau
```

а не:

```text
source text → regular expressions → Luau
```

---

# 8. Compiler Orchestrator

File:

```text
compiler/compiler.js
```

`compiler.js` является orchestration layer.

Он должен:

1. загрузить manifest;
2. загрузить compiler configuration;
3. найти `.luas`;
4. прочитать source;
5. вызвать lexer;
6. вызвать parser;
7. вызвать validator;
8. вызвать profile validator;
9. вызвать code generator;
10. записать `.lua`;
11. вывести diagnostics.

Он не должен содержать полноценную grammar implementation.

---

# 9. Manifest

Основная спецификация:

```text
manifest/luas_syntax_spec.json
```

Она описывает:

* language version;
* decorators;
* keywords;
* types;
* class rules;
* struct rules;
* mutability;
* profiles;
* safety constraints.

Manifest является declarative configuration.

---

# 10. Rules Matrix

File:

```text
manifest/rules_matrix.json
```

Rules Matrix содержит ограничения языка.

Важно:

`rules_matrix.json` не должен превращаться в замену parser/validator.

Например, regex:

```text
"class ..."
```

не должен использоваться для полноценного parsing.

Regex допустим для:

* простых lexical checks;
* naming conventions;
* отдельных validation rules.

Структура программы должна определяться parser + AST.

---

# 11. Language Profiles

luaScript Core поддерживает профильную модель.

Базовый профиль:

```text
standard
```

Aura/Matter профиль:

```text
aura_matter
```

Архитектурно:

```text
luaScript
   │
   ├── standard
   │
   └── aura_matter
```

---

# 12. Standard Profile

Standard profile предназначен для обычного luaScript-кода.

Он не требует:

```text
AuraContext
MatterSystem
Matter World
ECS components
Aura runtime
```

Можно писать обычные классы и функции языка.

Пример:

```lua
class Weapon do

    constructor() do
    end

    public fire(): void do
        print("fire")
    end

end

# AURA_END
```

---

# 13. Aura Matter Profile

Aura profile активирует дополнительные контракты.

Например:

```lua
class WeaponTimerSystem extends MatterSystem do
```

может быть разрешён только в:

```text
aura_matter
```

профиле.

Также становятся доступны framework contracts:

```text
AuraContext
MatterSystem
world.query
world.insert
world.remove
world.spawn
world.despawn
```

---

# 14. Почему Profile важен

Без profile system язык быстро превращается в:

```text
luaScript = Aura DSL
```

Это архитектурно неправильно.

Правильная модель:

```text
Language
    +
Profile
```

Например:

```text
luaScript + standard
luaScript + aura_matter
```

---

# 15. Source Model

Каждый `.luas` является самостоятельной compilation unit.

Минимальная структура:

```text
metadata
+
declarations
+
statements
+
# AURA_END
```

---

# 16. Termination Token

Файл должен завершаться:

```text
# AURA_END
```

Termination token является обязательным для shell-файлов.

Compiler должен выдавать ошибку, если token отсутствует.

Например:

```text
LS001 Missing termination token '# AURA_END'
```

---

# 17. Comments

Lua-style comments:

```lua
-- comment
```

поддерживаются.

Termination token:

```text
# AURA_END
```

является специальной compiler directive.

Он не является обычным Luau comment.

Code Generator не должен включать его в generated output.

---

# 18. Decorators

Поддерживаются:

```text
@ShellMeta
@Perspective
@Service
```

Decorators являются metadata.

Они не должны попадать в итоговый Luau как executable code.

Пример:

```lua
@ShellMeta({
    id = "example",
    status = "active",
    version = 1
})
```

после compilation может полностью исчезнуть из generated source.

Однако metadata должна быть доступна compiler passes.

---

# 19. Classes

luaScript поддерживает class syntax:

```lua
class WeaponSystem extends MatterSystem do

end
```

Compiler преобразует class declaration в Luau-compatible representation.

Концептуально:

```lua
local WeaponSystem = {}
WeaponSystem.__index = WeaponSystem
```

Фактическая генерация определяется Code Generator.

---

# 20. Constructor

Source:

```lua
constructor() do
end
```

представляет constructor класса.

Target:

```lua
function WeaponSystem.new(...)
    local self = setmetatable({}, WeaponSystem)
    ...
    return self
end
```

Constructor является частью AST.

---

# 21. Methods

Source:

```lua
public update(deltaTime: number): void do

end
```

представляет method declaration.

Для public method:

```lua
function WeaponSystem:update(deltaTime)

end
```

Private semantics не должны реализовываться через случайное удаление/переименование метода.

Это отдельный semantic rule.

---

# 22. Struct

luaScript 2.0 поддерживает:

```lua
struct WeaponState
    nextTimer: number
    isCharging: boolean
end
```

Struct не создаёт runtime object автоматически.

Концептуальный target:

```lua
type WeaponState = {
    nextTimer: number,
    isCharging: boolean,
}
```

Таким образом:

```text
struct
```

является type-level construct.

---

# 23. Struct ограничения

В MVP:

* no runtime constructor;
* no methods;
* no inheritance;
* no generics;
* no runtime metadata.

Struct предназначен для описания shape данных.

---

# 24. Types

MVP поддерживает:

```text
number
string
boolean
nil
```

Roblox/Luau types предоставляются профилем и type environment.

Примеры:

```text
Vector3
CFrame
Instance
Player
```

Список не должен быть навечно зашит в parser.

Parser должен распознавать type identifiers.

Validator решает, существует ли конкретный тип.

---

# 25. Generic Types

Generics в luaScript 2.0 MVP отсутствуют.

Не поддерживаются:

```text
<T>
<T, U>
Array<T>
Map<K, V>
```

Причина:

Generics увеличивают сложность:

* parser;
* AST;
* type checker;
* diagnostics;
* code generation;
* LLM generation.

Они будут рассмотрены после стабилизации базовой type system.

---

# 26. Mutability

По умолчанию local binding immutable.

Пример:

```lua
local speed = 100
```

следующая операция:

```lua
speed = 150
```

является ошибкой.

Для mutable binding:

```lua
local mut speed = 100
```

после этого:

```lua
speed = 150
```

разрешено.

---

# 27. Mutability Model

Важно различать:

```text
binding mutation
```

и:

```text
object mutation
```

Например:

```lua
local weapon = {}
weapon.cooldown = 10
```

не обязательно означает reassignment переменной `weapon`.

Поэтому compiler должен иметь отдельную модель:

```text
Binding
Object
Field
```

Не следует пытаться реализовать Rust ownership system.

---

# 28. Rust-inspired, not Rust-compatible

luaScript использует только отдельные идеи Rust.

Например:

```text
immutable by default
explicit mutability
```

Но luaScript не реализует:

```text
ownership
borrow checker
lifetimes
traits
move semantics
```

Это принципиальное ограничение.

---

# 29. Error Handling

luaScript 2.0 не поддерживает:

```text
try
catch
throw
```

Go-style error handling не должен автоматически распространяться на весь Lua API.

Правильнее:

```text
language-level error model
+
library-specific return contracts
```

Если API возвращает:

```lua
result, err
```

compiler может проверять соответствующий contract.

Но нельзя предполагать, что каждая Luau-функция возвращает error tuple.

---

# 30. `void`

`void` не является runtime Luau value.

В luaScript:

```lua
function foo(): void
```

означает:

> функция не имеет полезного возвращаемого значения.

Code Generator удаляет `void` type annotation при генерации Luau.

---

# 31. Anonymous Functions

В standard profile anonymous functions разрешены, если они соответствуют грамматике Luau.

Например:

```lua
local callback = function()
    print("hello")
end
```

В Aura profile они могут быть запрещены policy validator, если это необходимо для deterministic shell architecture.

Это не grammar restriction.

То есть:

```text
Lexer: разрешает
Parser: разрешает
Profile Validator: может запретить
```

---

# 32. Forbidden Type Escapes

Запрещаются:

```text
any
unknown
as any
as unknown
```

Причина:

Они уничтожают пользу статической проверки.

Вместо:

```text
escape hatch
```

необходимо:

```text
explicit type
```

или:

```text
well-defined union
```

---

# 33. Roblox Types

Compiler не должен ограничиваться маленьким hardcoded списком Roblox classes.

Например:

```text
Vector3
CFrame
Part
Model
Player
```

являются только частью Roblox API.

Архитектурно правильнее:

```text
luaScript Core
      +
Roblox type environment
```

Это позволяет расширять Roblox API без изменения grammar.

---

# 34. Runtime Framework Types

Aura types также должны предоставляться environment/profile.

Например:

```text
MatterSystem
AuraContext
World
WeaponStateComponent
```

не являются базовыми языковыми типами.

Они являются framework symbols.

---

# 35. Compiler Environment

Conceptually:

```text
Compiler Environment
│
├── Language Types
│
├── Roblox Types
│
├── Profile Types
│
└── Project Types
```

Это позволит позже подключить:

```text
Roblox API
Aura API
Galaxy components
```

без переписывания lexer/parser.

---

# 36. Diagnostics

Compiler errors должны иметь стабильные codes.

Например:

```text
LS001 Missing termination token
LS002 Unexpected token
LS003 Expected token
LS101 Unknown type
LS102 Invalid assignment
LS103 Immutable reassignment
LS201 Invalid class declaration
LS202 Invalid method declaration
LS301 Unknown framework symbol
LS302 Profile violation
LS401 Code generation failure
```

Error codes должны быть стабильными между patch releases, если возможно.

---

# 37. No Silent Recovery

Compiler не должен молча исправлять исходный код.

Например, если отсутствует:

```lua
end
```

compiler не должен автоматически добавлять его.

Он должен сообщить:

```text
LS003 Expected 'end'
```

Причина:

автоматическое исправление возвращает нас к проблеме, ради которой создавался luaScript.

---

# 38. Deterministic Error Recovery

Parser может выполнять ограниченное error recovery для отображения нескольких ошибок за один запуск.

Но recovery не должен изменять source.

Например:

```text
source
 ↓
parser
 ↓
diagnostics
```

а не:

```text
source
 ↓
auto-fix
 ↓
different source
 ↓
compile
```

---

# 39. Code Generation Rules

Code Generator должен быть максимально простым.

Он должен:

```text
read AST
emit Luau
```

Не должен:

```text
guess developer intent
repair syntax
call LLM
query external services
```

---

# 40. Source Maps

После MVP желательно добавить source mapping:

```text
generated.lua line 42
        ↓
WeaponTimerSystem.luas line 18
```

Это необходимо для debugging Roblox runtime errors.

В первой версии можно оставить архитектурный interface без реализации.

---

# 41. Generated Code

Generated Luau должен быть:

* валидным Luau;
* deterministic;
* readable;
* stable;
* без лишней магии.

По возможности compiler не должен генерировать огромные runtime wrappers.

---

# 42. Compiler Output

Рекомендуемая структура:

```text
build/
├── server/
├── client/
├── shared/
└── manifest/
```

Однако конечную структуру Roblox проекта определяет `luaScriptWork`.

Core compiler должен уметь генерировать compilation artifacts, не становясь Roblox project manager.

---

# 43. Testing Strategy

Compiler тестируется на четырёх уровнях:

```text
tests/
├── unit/
│   ├── lexer
│   ├── parser
│   └── validator
│
├── integration/
│   └── compiler
│
├── fixtures/
│   ├── valid
│   └── invalid
│
└── snapshots/
```

---

# 44. Lexer Tests

Проверяются:

```text
keywords
identifiers
numbers
strings
operators
punctuation
comments
decorators
termination token
```

---

# 45. Parser Tests

Проверяются:

```text
class
extends
constructor
methods
struct
if
for
while
local
mut
return
expressions
```

---

# 46. Validator Tests

Проверяются:

```text
immutable reassignment
unknown types
invalid declarations
invalid profile usage
invalid structs
invalid decorators
```

---

# 47. Integration Tests

Integration test:

```text
.luas
 ↓
Lexer
 ↓
Parser
 ↓
Validator
 ↓
Codegen
 ↓
.lua
```

Затем проверяется generated output.

---

# 48. Golden Tests

Для критически важных language constructs рекомендуется использовать golden files.

Например:

```text
tests/fixtures/class_basic.luas
tests/fixtures/class_basic.expected.lua
```

Тест проверяет:

```text
compiler(input)
==
expected output
```

Это особенно важно для deterministic compiler.

---

# 49. Compiler Versioning

Версия compiler:

```text
MAJOR.MINOR.PATCH
```

Изменения:

```text
MAJOR
```

ломают language compatibility.

```text
MINOR
```

добавляет обратно совместимые возможности.

```text
PATCH
```

исправляет bugs без изменения language contract.

---

# 50. Manifest Versioning

Language version:

```text
2.0.0
```

отделяется от:

```text
compiler version
```

и:

```text
profile version
```

Пример:

```text
luaScript language: 2.0
compiler: 2.1.3
Aura profile: 1.4
```

---

# 51. Compatibility

Compiler должен явно знать:

```text
language version
profile version
```

Если source требует несовместимую версию:

```text
LS501 Unsupported language version
```

---

# 52. Security

Compiler должен считать source недоверенным input.

Он не должен:

* выполнять исходный Luau;
* выполнять shell commands из `.luas`;
* загружать произвольный JavaScript;
* выполнять decorators;
* обращаться к сети.

Compilation должна быть максимально sandbox-independent.

---

# 53. File Limits

Compiler может ограничивать:

```text
maximum source file size
maximum identifier length
maximum AST depth
maximum diagnostics
```

Это защищает compiler от случайного или вредоносного pathological input.

---

# 54. No Regex Compiler

Критическое правило:

> Регулярные выражения не являются parser-ом luaScript.

Запрещённый архитектурный подход:

```text
regex
 ↓
replace
 ↓
replace
 ↓
replace
 ↓
Luau
```

Правильный:

```text
characters
 ↓
tokens
 ↓
AST
 ↓
semantic validation
 ↓
Luau
```

---

# 55. Почему это особенно важно для LLM

LLM может генерировать:

```text
nested if
nested for
functions
classes
structs
expressions
```

Regex-based compiler плохо масштабируется на такие структуры.

AST compiler позволяет работать с:

```text
tree structure
```

а не количеством `end`.

---

# 56. Основной принцип luaScript 2.0

Главная задача языка:

> Сделать структуру программы однозначной для LLM и компилятора.

Не задача:

> Сделать новый универсальный язык программирования со всеми возможностями TypeScript/Rust/Go.

Поэтому язык должен оставаться небольшим.

---

# 57. Current Implementation Order

Разработка должна идти в таком порядке:

```text
1. Lexer
2. Token model
3. Parser
4. AST
5. Syntax diagnostics
6. Validator
7. Type environment
8. Profile system
9. Code Generator
10. Integration compiler
11. Golden tests
12. Aura/Matter profile
```

---

# 58. Current Next Step

Первым реализуется Lexer.

Минимальный lexer должен поддерживать только реально необходимые конструкции luaScript 2.0.

Нельзя сразу реализовывать весь Luau.

Сначала:

```text
keywords
identifiers
numbers
strings
comments
operators
punctuation
decorators
type separators
termination token
```

После прохождения lexer tests можно переходить к parser.

---

# 59. Architectural Rule

Каждая новая возможность проходит через четыре вопроса:

```text
1. Это действительно нужно LLM?
2. Это необходимо для Roblox?
3. Это можно выразить существующим Lua/Luau?
4. Усложняет ли это AST/compiler?
```

Если feature не даёт существенной выгоды, она откладывается.

---

# 60. Final Compiler Contract

Целевой контракт:

```text
INPUT:
    valid luaScript source

PROCESS:
    tokenize
    parse
    validate
    generate

OUTPUT:
    deterministic valid Luau

FAILURE:
    deterministic diagnostics

NON-GOALS:
    auto-repair
    LLM reasoning
    runtime execution
    framework implementation
    Roblox deployment
```

Это является базовым compiler contract luaScript Core 2.0.
