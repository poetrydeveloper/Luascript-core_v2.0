# luaScript Core — System Architecture

**Version:** 2.0.0
**Status:** Experimental
**Target:** Roblox / Luau
**Architecture:** LLM → Shells → luaScript → Deterministic Compiler → Luau

---

# 1. Назначение системы

`luaScript-core` — это компилятор и спецификация языка `luaScript`.

Проект предназначен для создания Roblox-игр через LLM-ориентированный архитектурный pipeline.

Главная идея:

> LLM работает не непосредственно с конечным Roblox-проектом, а с семантически определёнными исходными shell-файлами.

Shell является управляемой единицей архитектуры.

---

# 2. Полная архитектура

Основной pipeline:

```text
┌───────────────────────────┐
│      Game Design          │
│       Description         │
│           GDD             │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│       LLM — GDD            │
│      Interpreter           │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│      LLM — Architect       │
│                           │
│ Creates Shells             │
│ Defines dependencies       │
│ Defines semantics          │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│       luaScript            │
│        Project             │
│                           │
│ *.luas                     │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│      luaScript-core        │
│                           │
│ Lexer                      │
│ Parser                     │
│ AST                        │
│ Validator                  │
│ Profile Validator          │
│ Code Generator             │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│          Luau              │
│       *.lua / *.luau       │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│     luaScriptWork          │
│                           │
│ Aura / Matter / project    │
│ organization               │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│         Roblox             │
│       Rojo / Studio        │
└───────────────────────────┘
```

---

# 3. Главное архитектурное разделение

Система состоит из нескольких независимых уровней.

```text
Semantic Layer
      ↓
Shell Layer
      ↓
Language Layer
      ↓
Compiler Layer
      ↓
Framework Layer
      ↓
Runtime Layer
```

Каждый слой имеет собственную ответственность.

---

# 4. Semantic Layer

Semantic Layer описывает, **что должна делать игра**.

Источник:

```text
GDD
```

Например:

```text
Galaxy has spaceships.
Ships have weapons.
Weapons have cooldowns.
Projectiles can collide with interceptors.
```

GDD не должен содержать конкретный Luau-код.

---

# 5. LLM GDD Role

LLM в роли Game Designer преобразует пользовательскую задачу в структурированное описание игры.

Пример:

```text
Game:
    Galaxy

Systems:
    Weapons
    Projectiles
    Collision
    Health

Entities:
    Ship
    Turret
    PlasmaBolt
    Interceptor
```

Этот слой не должен самостоятельно определять конкретные файлы Lua.

---

# 6. LLM Architect Role

Следующая роль LLM — Architect.

Она преобразует GDD в Shell Architecture.

Например:

```text
Galaxy
│
├── WeaponTimerSystem.luas
├── CollisionSystem.luas
├── WeaponSystem.luas
├── HealthSystem.luas
└── ProjectileSystem.luas
```

Architect определяет:

* какие системы существуют;
* какие компоненты читаются;
* какие компоненты изменяются;
* зависимости;
* runtime profile;
* execution side;
* semantic metadata.

---

# 7. Shell

Shell — основная единица управляемого кода.

Shell содержит:

```text
metadata
+
semantic contract
+
luaScript source
```

Пример:

```lua
@ShellMeta({
    id = "ecs_galaxy_weapon_timer",
    status = "active",
    version = 1,
    context = "Weapon cooldown system",
    vocabularyContract = "Aura_Galaxy"
})

@Perspective({
    subject = "WeaponTimerSystem",
    action = "Updates",
    object = "WeaponStateComponent",
    reads = {"WeaponStateComponent"},
    mutates = {"WeaponStateComponent"}
})

@Service({
    flameworkPattern = "MatterSystem",
    executionSide = "Server"
})

class WeaponTimerSystem extends MatterSystem do

end

# AURA_END
```

---

# 8. Почему Shell является важным объектом

Shell позволяет LLM работать с частью проекта.

Например пользователь говорит:

```text
"Добавь перегрев оружия."
```

LLM может получить:

```text
WeaponSystem.luas
WeaponTimerSystem.luas
WeaponStateComponent.luas
```

и изменить только необходимые shell.

Не требуется передавать весь Roblox project.

---

# 9. Refactoring Model

Рефакторинг выполняется на уровне shell.

```text
Existing Shells
      +
Task
      ↓
LLM
      ↓
Modified Shells
      ↓
Compiler
      ↓
Updated Roblox project
```

Это является одним из главных назначений luaScript.

---

# 10. Feature Development Model

Новая функция должна проходить:

```text
Requirement
      ↓
Semantic change
      ↓
Shell change
      ↓
Validation
      ↓
Compilation
      ↓
Runtime
```

LLM не должна вручную редактировать сгенерированные `.lua` файлы.

---

# 11. luaScript Language Layer

luaScript является промежуточным source language.

Он решает:

* синтаксис;
* типы;
* classes;
* structs;
* mutability;
* metadata;
* статическую проверку;
* profile contracts.

Он не отвечает за:

* Roblox deployment;
* Rojo;
* Matter runtime;
* конкретную структуру игры;
* создание Instances.

---

# 12. luaScript Core

`luaScript-core` отвечает только за язык и компиляцию.

Основные компоненты:

```text
manifest/
    luas_syntax_spec.json
    rules_matrix.json

compiler/
    lexer.js
    parser.js
    validator.js
    codegen.js
    compiler.js
```

Pipeline:

```text
Source
  ↓
Lexer
  ↓
Tokens
  ↓
Parser
  ↓
AST
  ↓
Validator
  ↓
Profile Validator
  ↓
Code Generator
  ↓
Luau
```

---

# 13. Lexer

Lexer преобразует source text в tokens.

Например:

```lua
class WeaponSystem extends MatterSystem do
```

становится примерно:

```text
CLASS
IDENTIFIER(WeaponSystem)
EXTENDS
IDENTIFIER(MatterSystem)
DO
```

Lexer не должен понимать бизнес-логику.

Он отвечает только за лексическую структуру.

---

# 14. Parser

Parser преобразует tokens в AST.

Например:

```text
ClassDeclaration
│
├── name: WeaponSystem
├── base: MatterSystem
└── body
```

Parser отвечает за грамматику.

---

# 15. AST

AST является главным внутренним представлением программы.

Пример:

```text
Program
│
├── Metadata
├── ClassDeclaration
│   ├── Constructor
│   └── MethodDeclaration
│
└── Termination
```

После создания AST исходный текст больше не должен использоваться как источник структурной информации.

---

# 16. Validator

Validator проверяет язык.

Например:

```text
immutable reassignment
unknown type
invalid class declaration
invalid return type
invalid struct
invalid syntax contract
```

Validator не должен генерировать Luau.

---

# 17. Profile Validator

Profile Validator проверяет framework-specific constraints.

Например:

```text
standard
```

не разрешает:

```text
MatterSystem
AuraContext
world.query
```

если они не подключены соответствующим образом.

А:

```text
aura_matter
```

разрешает их.

Это позволяет не превращать Aura в обязательную часть языка.

---

# 18. Code Generator

Code Generator получает AST.

Он не анализирует исходный текст повторно.

```text
AST
 ↓
Code Generator
 ↓
Luau
```

Пример:

```lua
class WeaponSystem extends MatterSystem do
```

может преобразовываться в:

```lua
local WeaponSystem = {}
WeaponSystem.__index = WeaponSystem
```

и далее генерироваться остальная структура.

---

# 19. Determinism

Compiler должен быть deterministic.

Для:

```text
same source
+
same compiler version
+
same manifest
+
same profile
```

должен получаться:

```text
same output
```

Это фундаментальное требование.

---

# 20. Почему нельзя использовать LLM для compilation

LLM может:

```text
generate
refactor
architect
explain
```

Но compiler должен:

```text
parse
validate
transform
generate
```

LLM не должна участвовать в deterministic compilation.

Иначе pipeline теряет воспроизводимость.

---

# 21. Aura

Aura является framework layer.

Aura не является обязательной частью luaScript.

Архитектура:

```text
luaScript
    │
    ├── Standard
    │
    └── Aura
          │
          └── Matter
```

Aura предоставляет runtime contracts.

---

# 22. Matter

Matter является ECS runtime.

В контексте luaScript:

```text
MatterSystem
```

является framework contract.

Например:

```lua
class CollisionSystem extends MatterSystem do
```

означает, что shell требует:

```text
aura_matter profile
```

---

# 23. luaScriptWork

`luaScriptWork` является отдельным проектом/слоем.

Его ответственность:

```text
generated Luau
      ↓
framework/project structure
      ↓
Aura
      ↓
Matter
      ↓
Roblox project
```

luaScript-core не должен становиться монолитом, который знает:

```text
все папки Roblox
все Matter systems
все Rojo mappings
все Galaxy components
```

Это задача luaScriptWork.

---

# 24. Разделение Core и Work

```text
luaScript-core
────────────────────────
Language
Lexer
Parser
AST
Validator
Codegen
Manifest
Language tooling


luaScriptWork
────────────────────────
Aura
Matter
Roblox project
Project templates
Rojo
Framework conventions
Runtime integration
Deployment
```

Это критически важное разделение.

---

# 25. Почему нельзя смешивать Core и Aura

Если Core будет знать всё про Aura, появится:

```text
luaScript
=
Aura DSL
```

Тогда невозможно будет использовать язык независимо.

Правильнее:

```text
language
+
profile
```

---

# 26. Roblox Output

Финальный runtime target:

```text
Luau
```

Roblox project может быть организован через luaScriptWork.

Например:

```text
src/
├── server/
│   ├── systems/
│   └── components/
│
├── client/
│   ├── systems/
│   └── controllers/
│
└── shared/
    └── components/
```

Конкретная структура не должна быть жёстко встроена в language grammar.

---

# 27. Rojo

Rojo является deployment/build infrastructure.

Conceptually:

```text
luaScript
   ↓
Luau
   ↓
luaScriptWork project
   ↓
Rojo
   ↓
Roblox
```

Rojo не является частью языка.

---

# 28. Database Layer

Предыдущая архитектура предполагала:

```text
Shell
 ↓
Base64
 ↓
Database tree
 ↓
Code reconstruction
```

В новой архитектуре это не является обязательным.

Базовый pipeline:

```text
Shell
 ↓
luaScript
 ↓
Compiler
 ↓
Luau
```

Если в будущем потребуется database representation, она должна быть отдельным storage layer.

---

# 29. Почему Base64 не является архитектурным слоем

Base64 — encoding, а не архитектурная модель.

Он не должен использоваться как:

```text
compiler intermediate representation
```

AST является правильным промежуточным representation внутри compiler-а.

Если требуется хранить AST в БД, можно использовать сериализованный AST/IR.

---

# 30. Database as Source of Truth

В будущем возможно:

```text
Shell
 ↓
Parser
 ↓
AST
 ↓
Serialized AST
 ↓
Database
```

и обратно:

```text
Database
 ↓
AST
 ↓
Code Generator
 ↓
Luau
```

Но это отдельная функция.

Она не должна усложнять основной compiler pipeline.

---

# 31. Semantic Graph

Aura metadata позволяет строить semantic graph.

Например:

```text
WeaponTimerSystem
        │
        ├── reads
        │     ├── WeaponStateComponent
        │     └── ArchetypeComponent
        │
        └── mutates
              └── WeaponStateComponent
```

Это может использоваться:

* LLM Architect;
* dependency analysis;
* refactoring;
* impact analysis;
* validation;
* project documentation.

---

# 32. Refactoring через Semantic Graph

Если пользователь меняет:

```text
WeaponStateComponent
```

система может определить:

```text
WeaponTimerSystem
WeaponSystem
CollisionSystem
HUDSystem
```

как потенциально затронутые shell.

Это значительно лучше, чем просить LLM искать изменения во всём Roblox project.

---

# 33. Shell ID

Каждый shell должен иметь стабильный ID.

Например:

```text
ecs_galaxy_weapon_timer_v50
```

ID должен быть стабильнее filename.

Filename может измениться.

ID должен использоваться для:

* tracking;
* versioning;
* database;
* dependency graph;
* refactoring;
* history.

---

# 34. Shell Version

Shell version:

```text
version = 1
```

не должна совпадать с version языка.

Например:

```text
luaScript = 2.0.0
shell = 8
Aura = 5
Matter = project-defined
```

Это независимые version domains.

---

# 35. Migration

Старые AuraShell files не должны автоматически считаться luaScript 2.0.

Старый формат:

```text
AuraShell(
    ...
    render = function(ctx)
        Query(...)
        Guard_if(...)
    end
)
```

является legacy DSL.

Migration:

```text
Legacy AuraShell
       ↓
Migration Tool / LLM
       ↓
luaScript 2.0 Shell
```

---

# 36. Legacy code

Старые Galaxy shells сохраняются как migration corpus.

Они полезны для:

```text
regression tests
migration tests
semantic comparison
compiler tests
```

Но не являются нормативным источником syntax 2.0.

---

# 37. Target Architecture

Целевая архитектура проекта:

```text
                 ┌──────────────┐
                 │     GDD      │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ LLM Designer │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ LLM Architect│
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │    Shells    │
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │  luaScript   │
                 └──────┬───────┘
                        ↓
              ┌─────────────────────┐
              │  luaScript Compiler  │
              └──────────┬──────────┘
                         ↓
                     ┌───────┐
                     │ Luau  │
                     └───┬───┘
                         ↓
                 ┌──────────────┐
                 │ luaScriptWork│
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ Aura / Matter│
                 └──────┬───────┘
                        ↓
                 ┌──────────────┐
                 │ Roblox/Rojo  │
                 └──────────────┘
```

---

# 38. Основной архитектурный принцип

Проект должен следовать правилу:

> **LLM decides intent. Compiler decides syntax. Framework decides runtime. Roblox executes the result.**

Иными словами:

```text
LLM
    → What should exist?

luaScript
    → How is it expressed?

Compiler
    → Is it valid and how is it transformed?

Aura/Matter
    → How does the system run?

Roblox
    → Where does it execute?
```

---

# 39. Что НЕ является целью luaScript Core

Проект не должен становиться:

* полноценным game engine;
* заменой Roblox;
* заменой Luau;
* универсальным ECS;
* заменой Rojo;
* database engine;
* LLM runtime;
* universal build system;
* TypeScript compiler.

---

# 40. MVP

Минимально жизнеспособная версия luaScript 2.0 должна уметь:

```text
1. Parse .luas
2. Build AST
3. Validate syntax
4. Validate types
5. Validate mutability
6. Validate profile
7. Compile class
8. Compile struct
9. Compile methods
10. Generate valid Luau
11. Produce deterministic output
12. Produce useful diagnostics
```

Не требуется в MVP:

```text
generics
ownership
database
LLM runtime
automatic project generation
Rojo integration
advanced optimization
```

---

# 41. Definition of Done

luaScript Core 2.0 считается базово работоспособным, когда:

```text
hello_world.luas
        ↓
lexer
        ↓
parser
        ↓
AST
        ↓
validator
        ↓
codegen
        ↓
hello_world.lua
```

проходит без ручного исправления.

После этого:

```text
Aura Matter shell
        ↓
profile validation
        ↓
Luau
```

также должен компилироваться детерминированно.

---

# 42. Главный критерий качества

Главный критерий не количество возможностей языка.

Главный критерий:

> Может ли LLM многократно изменять shell-файлы, а compiler каждый раз детерминированно получать из них корректный Roblox Luau project?

Если нет — новая возможность языка не должна добавляться только ради удобства.

---

# 43. Технический приоритет

Приоритеты разработки:

```text
1. Correctness
2. Determinism
3. Diagnostics
4. Maintainability
5. LLM friendliness
6. Performance
7. Language features
```

Новые features не должны нарушать первые пять пунктов.

---

# 44. Архитектурное правило против техдолга

Любая новая функция должна сначала отвечать на вопросы:

```text
Does it belong to language?
Does it belong to compiler?
Does it belong to profile?
Does it belong to Aura?
Does it belong to Matter?
Does it belong to luaScriptWork?
Does it belong to Roblox?
```

Если функция не имеет однозначного владельца, её реализация должна быть отложена до архитектурного решения.

---

# 45. Current Status

Версия 2.0 находится на стадии формирования compiler contract.

Уже определены:

```text
language specification
profiles
type philosophy
mutability model
struct model
Aura separation
Matter separation
compiler pipeline
deterministic compilation model
```

Следующий технический этап:

```text
Lexer
```

После стабилизации lexer:

```text
Parser
→ AST
→ Validator
→ Code Generator
```

Legacy Galaxy shells используются как тестовый и migration corpus.
