# luaScript 2.0 — Language Specification

**Status:** Experimental
**Version:** 2.0.0
**Target:** Luau
**Platform:** Roblox
**Purpose:** Deterministic LLM-oriented development

---

## 1. Назначение языка

`luaScript` — это статически проверяемое надмножество Luau с ограниченным типовым контрактом.

Язык создан не как универсальная замена Luau, TypeScript или Rust.

Его основная задача:

1. позволить LLM генерировать код для Roblox в предсказуемом формате;
2. уменьшить количество синтаксических ошибок;
3. обеспечить детерминированную компиляцию;
4. позволить изменять игру через отдельные `.luas`-файлы;
5. отделить язык от конкретного runtime-фреймворка;
6. при необходимости подключать Aura и Matter ECS через профиль компиляции.

Целевая цепочка:

```text
LLM
  ↓
luaScript (.luas)
  ↓
Lexer
  ↓
Parser
  ↓
AST
  ↓
Validator
  ↓
Profile Validation
  ↓
Code Generator
  ↓
Luau
  ↓
Aura / Matter / Roblox project
```

---

# 2. Основной принцип

`luaScript` не является самостоятельным runtime-языком.

Он компилируется в Luau.

```text
luaScript source
      ↓
deterministic compiler
      ↓
Luau source
```

После компиляции в проекте Roblox не должно существовать необходимости интерпретировать `.luas`.

`.luas` является **исходным языком**, а `.lua` — результатом компиляции.

---

# 3. Профили компиляции

luaScript разделяется на три профиля.

## 3.1 Standard

Обычный luaScript без зависимости от Aura.

```text
luaScript
   ↓
Luau
```

В этом режиме нельзя использовать Aura/Matter API как обязательную часть языка.

---

## 3.2 Aura

luaScript с интеграцией Aura.

```text
luaScript
   ↓
Aura-aware validation
   ↓
Luau
```

В этом режиме доступны Aura-контракты.

---

## 3.3 Aura Matter

luaScript с Aura и Matter ECS.

```text
luaScript
   ↓
Aura validation
   ↓
Matter validation
   ↓
Luau
```

Именно этот профиль используется для систем Galaxy, работающих через Matter ECS.

---

# 4. Базовый синтаксис блоков

luaScript использует словесные блоки.

Для открытия блока используются:

```text
do
then
```

Для закрытия:

```text
end
```

Пример:

```lua
class ExampleSystem extends MatterSystem do

    public update(deltaTime: number): number do

        if deltaTime > 0 then
            print(deltaTime)
        end

    end

end

# AURA_END
```

Фигурные скобки не используются для обозначения блоков.

Нельзя:

```text
if condition {
}
```

Нельзя:

```text
class Foo {
}
```

Нельзя:

```text
function foo() {
}
```

---

# 5. Фигурные скобки и таблицы

Фигурные скобки запрещены только для управления блоками.

Они разрешены для Luau tables.

Например:

```lua
local weapon = {
    damage = 100,
    cooldown = 2
}
```

Разрешены также типы таблиц:

```lua
local weapon: {
    damage: number,
    cooldown: number
}
```

Таким образом:

```text
{ ... }
```

может означать table/type structure.

Но не block.

---

# 6. Комментарии

Однострочный комментарий:

```lua
-- comment
```

Комментарии не участвуют в семантическом анализе программы.

---

# 7. Завершение файла

Каждый `.luas` должен заканчиваться:

```text
# AURA_END
```

Токен должен находиться на последней непустой строке.

Пример:

```lua
class Example do

end

# AURA_END
```

Это не является Luau-синтаксисом.

Compiler удаляет этот маркер до генерации Luau.

---

# 8. Классы

luaScript предоставляет упрощённый class syntax.

```lua
class WeaponTimerSystem extends MatterSystem do

end
```

Формат:

```text
class ClassName extends BaseClass do
```

`extends` обязателен для class declaration версии 2.0.

Compiler преобразует класс в Luau-compatible table/metatable representation.

Концептуально:

```lua
local WeaponTimerSystem = {}

WeaponTimerSystem.__index = WeaponTimerSystem
```

---

# 9. Конструктор

Конструктор:

```lua
constructor(ctx: AuraContext) do

end
```

Compiler преобразует его в factory function.

Концептуальный результат:

```lua
function WeaponTimerSystem.new(ctx)
    local self = setmetatable({}, WeaponTimerSystem)

    return self
end
```

Конкретная реализация inheritance будет определяться code generator.

---

# 10. Методы

Публичный метод:

```lua
public update(deltaTime: number): number do

end
```

Приватный метод:

```lua
private calculateDamage(value: number): number do

end
```

Методы должны иметь return type.

Например:

```lua
public update(deltaTime: number): number do
    return deltaTime
end
```

Для методов, которые ничего не возвращают, в версии 2.0 не используется `void`.

Это намеренное решение.

---

# 11. `private`

`private` в luaScript не должен имитировать TypeScript private fields.

В версии 2.0 используется Luau-совместимая модель.

Публичный метод:

```lua
public update() do
end
```

Приватная логика:

```lua
private calculate() do
end
```

Compiler определяет соответствующее представление в generated Luau.

Настоящая runtime-изоляция private в Lua ограничена моделью языка.

Поэтому `private` является прежде всего **статическим контрактом compiler-а**.

---

# 12. `mut`

По умолчанию локальные bindings immutable.

```lua
local speed = 100
```

После этого:

```lua
speed = 150
```

является ошибкой compiler-а.

Для изменяемого binding используется:

```lua
local mut speed = 100

speed = 150
```

Это Rust-inspired модель.

---

# 13. Границы `mut`

`mut` относится к binding, а не ко всему объекту.

Например:

```lua
local data = {
    value = 10
}

data.value = 20
```

разрешено.

Не требуется:

```lua
local mut data
```

только потому, что изменяется поле таблицы.

Аналогично:

```lua
self.health = self.health - damage
```

разрешено.

`mut` не является системой ownership, borrowing или lifetime.

luaScript 2.0 не реализует Rust ownership model.

---

# 14. Типы

Базовые типы:

```text
number
string
boolean
nil
```

`void` не является типом luaScript 2.0.

---

# 15. Optional types

Разрешены optional types:

```lua
string?
```

Например:

```lua
local name: string? = nil
```

---

# 16. Union types

Разрешены union types:

```lua
number | string
```

Например:

```lua
local value: number | string = 10
```

---

# 17. Arrays

Разрешены массивы:

```lua
number[]
```

Например:

```lua
local positions: Vector3[]
```

---

# 18. Maps

Разрешены map/table types:

```lua
{ [string]: number }
```

Например:

```lua
local damageByWeapon: { [string]: number }
```

---

# 19. Function types

Function types разрешены.

Формат:

```text
(arguments) -> returnType
```

Пример:

```lua
local calculate: (number, number) -> number
```

---

# 20. Generics

Generics в luaScript 2.0 отсутствуют.

Не допускаются конструкции вида:

```text
<T>
<T, U>
```

или аналогичные generic declarations.

Причина:

* проект ориентирован на ограниченный детерминированный type contract;
* generics существенно усложняют parser;
* generics существенно усложняют validator;
* для текущих задач Galaxy/Aura/Matter они не являются необходимыми.

Generics могут быть добавлены в будущей major version.

---

# 21. Interfaces

`interface` не является частью luaScript 2.0.

Вместо него используется структурная типизация таблиц и `struct`.

---

# 22. Structural typing

Типовая модель luaScript 2.0 ориентирована на structural typing.

Если структура соответствует требуемому контракту, она может использоваться там, где этот контракт ожидается.

luaScript не реализует полноценную nominal type system.

---

# 23. `struct`

`struct` предназначен только для type declaration.

Пример:

```lua
struct WeaponState do
    damage: number
    cooldown: number
    isCharging: boolean
end
```

`struct` не создаёт runtime object.

Compiler преобразует его в Luau type declaration.

Концептуально:

```lua
type WeaponState = {
    damage: number,
    cooldown: number,
    isCharging: boolean
}
```

Таким образом:

```text
struct
   ↓
compile-time type
```

а не:

```text
struct
   ↓
runtime class
```

---

# 24. `any` и `unknown`

Запрещены:

```text
any
unknown
```

Также запрещены escape-hatches:

```text
as any
as unknown
```

Цель:

LLM не должна иметь возможности скрывать ошибки типов посредством универсального escape hatch.

Если compiler не понимает тип, это должно приводить к диагностике, а не к автоматическому превращению значения в `any`.

---

# 25. Ошибки

luaScript не использует:

```text
try
catch
finally
throw
```

Ошибки моделируются обычными значениями.

Например:

```lua
local result, err = dangerousOperation()

if err ~= nil then
    warn(err)
    return
end
```

Однако compiler **не требует `err` после каждого вызова**.

Error contract должен быть известен из API/type information.

Это позволяет не превращать язык в искусственную копию Go.

---

# 26. Roblox types

luaScript предназначен для Roblox и поэтому должен понимать Luau Roblox types.

Например:

```lua
Vector3
CFrame
Color3
Instance
Player
Model
Part
BasePart
TweenInfo
UDim2
```

Но список известных типов не является закрытым языковым whitelist.

Если Roblox/Luau добавляет новый тип, luaScript не должен требовать изменения грамматики языка только ради добавления имени типа.

Compiler должен разрешать разрешимые Luau/Roblox types.

---

# 27. Aura

Aura не является обязательной частью luaScript.

В стандартном профиле:

```lua
class MySystem extends MatterSystem do
```

не должен автоматически считаться валидным только потому, что `MatterSystem` существует в проекте.

Для этого нужен профиль:

```text
aura_matter
```

---

# 28. Matter ECS

Matter ECS является runtime/framework contract.

В Aura Matter profile доступны:

```text
query
insert
remove
spawn
despawn
```

а также ECS entities:

```text
entityId
targetEntityId
```

Пример:

```lua
class WeaponTimerSystem extends MatterSystem do

    public update(deltaTime: number): number do

        for entityId, weaponState in self.ctx.world:query(
            "WeaponStateComponent"
        ) do

        end

    end

end
```

Конкретный синтаксис query должен дополнительно проверяться parser/validator.

---

# 29. Component naming

Matter components должны иметь суффикс:

```text
Component
```

Например:

```text
WeaponStateComponent
HealthComponent
DamageComponent
CFrameComponent
```

Это является convention и частью Matter profile.

---

# 30. Network contracts

Network validation является отдельным profile contract.

Поддерживаются:

```text
fireServer
fireClient
fireAllClients
```

Payload должен состоять из разрешённых сериализуемых типов.

Например:

```text
number
string
boolean
Vector3
CFrame
table
```

Compiler должен проверять payload там, где network API contract известен.

---

# 31. Anonymous functions

В Standard profile anonymous functions разрешены.

Например:

```lua
local calculate = function(value)
    return value * 2
end
```

В Aura profiles anonymous functions запрещены.

Причина — не потому, что Lua их не поддерживает.

Причина — архитектурная.

Aura-код должен иметь более предсказуемую структуру для:

* LLM generation;
* static analysis;
* deterministic refactoring;
* semantic extraction;
* code graph construction.

---

# 32. Deterministic compilation

Compiler luaScript должен быть deterministic.

Для одинакового:

```text
source
+
compiler version
+
manifest version
+
profile
```

результат должен быть одинаковым.

Нельзя зависеть от:

* случайных значений;
* текущего времени;
* порядка обхода файлов ОС;
* нестабильного AST transformation;
* LLM decisions во время compilation.

---

# 33. LLM-oriented design

luaScript проектируется с учётом генерации кода LLM.

Главные требования:

```text
predictable syntax
explicit structure
limited type system
deterministic compilation
stable naming
profile-based framework integration
machine-readable metadata
```

LLM не должна самостоятельно решать:

```text
куда положить файл;
какой runtime pattern использовать;
как закрывать Lua blocks;
какие ECS hooks использовать.
```

Эти решения должны быть представлены контрактом языка, профилем и compiler-а.

---

# 34. Shell concept

В Aura-проекте `.luas` является shell.

Shell содержит:

```text
semantic metadata
+
source code
+
framework contract
```

Например:

```lua
@ShellMeta({
    id = "ecs_galaxy_weapon_timer_v50",
    status = "active",
    version = 1,
    context = "Weapon cooldown system",
    vocabularyContract = "Aura_Galaxy_Vocabulary_v8"
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

Metadata должна быть доступна compiler-у отдельно от AST программы.

---

# 35. Separation of concerns

Compiler должен разделять:

```text
Lexical syntax
      ↓
Parsing
      ↓
AST
      ↓
Language validation
      ↓
Profile validation
      ↓
Code generation
```

Не следует реализовывать все эти задачи в одном регулярном выражении или одном проходе по строкам.

---

# 36. Запрещённая архитектура compiler-а

Не рекомендуется:

```text
line-by-line regex
+
automatic insertion/removal of end
+
string replacement
+
immediate Lua output
```

Такой подход не является надёжным compiler architecture.

Особенно опасно автоматически добавлять `end`.

Compiler должен определить структуру программы через parser.

---

# 37. AST как источник истины

После parsing именно AST является источником истины.

Code generator не должен пытаться повторно понимать синтаксис исходного текста.

```text
.luas
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
Luau Generator
```

---

# 38. Ошибки compiler-а

Compiler должен сообщать:

```text
file
line
column
error code
message
```

Например:

```text
E102
WeaponTimerSystem.luas:14:9
Immutable binding 'counter' cannot be reassigned.
Declare it with 'local mut counter'.
```

LLM должна получать диагностическую информацию, достаточную для автоматического исправления shell.

---

# 39. Версионирование

Версия языка:

```text
2.0.0
```

не должна автоматически означать версию Aura или Matter.

Отдельно существуют:

```text
luaScript version
Aura version
Matter version
project version
shell version
```

Это предотвращает сильную связанность версий.

---

# 40. Основная архитектурная цель

Конечная цель проекта:

```text
Game Design Description
        ↓
LLM Architect
        ↓
Shells
        ↓
luaScript project
        ↓
Deterministic Compiler
        ↓
Luau project
        ↓
Aura / Matter structure
        ↓
Roblox project
```

LLM должна работать преимущественно с shell-уровнем.

При изменении игры желательно передавать LLM:

```text
existing shells
+
new task
```

а не весь сгенерированный Roblox project.

---

# 41. Главный принцип проекта

> Semantic intent belongs to the shell.
> Program structure belongs to luaScript.
> Framework integration belongs to profiles.
> Runtime behavior belongs to Luau/Aura/Matter.
> Compilation must be deterministic.

---

# 42. Статус спецификации

Версия `2.0.0` является базовой архитектурной спецификацией.

Она намеренно не определяет:

* generics;
* ownership;
* borrowing;
* полноценную nominal type system;
* runtime private enforcement;
* оптимизацию Luau;
* package manager;
* dependency resolver;
* автоматическую генерацию Roblox instances.

Эти функции не должны появляться в языке без отдельного архитектурного решения.
