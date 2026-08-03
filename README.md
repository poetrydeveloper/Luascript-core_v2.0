# luaScript Core v2.0

**luaScript** — внутренний DSL/язык для детерминированной генерации Luau-кода для Roblox.

Проект создаётся как часть персонального AI-oriented pipeline для разработки Roblox-игр.

Главная цель языка — не заменить Luau и не стать универсальным языком программирования.

Главная цель:

> Позволить LLM создавать, изменять и рефакторить игровые системы через структурированные `.luas`-файлы, после чего детерминированно получать готовый Luau-проект.

---

## 1. Цель проекта

Архитектура проекта:

```text
Game Design Description
        │
        ▼
       LLM
        │
        ▼
Architecture / Shells
        │
        ▼
   luaScript (.luas)
        │
        ▼
      Lexer
        │
        ▼
      Parser
        │
        ▼
       AST
        │
        ▼
Semantic Analyzer
        │
        ├── Core validation
        ├── Roblox validation
        └── Aura/ECS validation
        │
        ▼
   Luau Generator
        │
        ▼
     .lua files
        │
        ▼
LuaScriptWork / Aura
        │
        ▼
      Rojo
        │
        ▼
      Roblox
```
