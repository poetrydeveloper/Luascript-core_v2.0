// compiler/project/shell_contract.js
//
// Shell Contract.
//
// Это формальная инструкция для AI о том, как устроен Shell.
//
// Важно:
// этот файл НЕ является заменой runtime validator.
//
// Runtime validator проверяет фактический Shell.
//
// Этот contract описывает AI:
// - что такое Shell;
// - какие поля обязательны;
// - что AI имеет право предлагать;
// - что AI не имеет права менять;
// - как создавать новую Shell;
// - как эволюционировать существующую Shell.
//
// Цель:
// слабый AI → строгое предложение → deterministic Core.

const SHELL_CONTRACT_VERSION = 1;

const SHELL_CONTRACT = Object.freeze({
    type: "ShellContract",
    schemaVersion: SHELL_CONTRACT_VERSION,

    identity: {
        description:
            "Stable identity of a Shell version.",

        fields: {
            id:
                "Stable Shell identifier.",

            version:
                "Monotonically increasing Shell version.",

            hash:
                "SHA-256 hash of the Shell payload."
        },

        aiRules: [
            "AI must not invent a new version for UPDATE.",
            "AI must not change an existing Shell id.",
            "AI must not change an existing Shell hash.",
            "AI may propose a new Shell id only for ADD."
        ]
    },

    position: {
        description:
            "Logical location of the Shell in ProjectTree.",

        fields: {
            path:
                "Dot-separated project path.",

            parent:
                "Parent Shell path or null.",

            order:
                "Deterministic sibling order."
        },

        aiRules: [
            "AI may propose a path for ADD.",
            "AI must not override the path of an existing Shell.",
            "The Core resolves and validates the final path.",
            "The Core owns tree topology."
        ]
    },

    lifecycle: {
        description:
            "Version and actual-state information.",

        fields: {
            actual:
                "Whether this Shell version is currently active.",

            generation:
                "Evolution generation.",

            createdAt:
                "Creation timestamp.",

            supersedes:
                "Hash of the previous Shell version."
        },

        aiRules: [
            "AI must not manipulate actual state.",
            "AI must not manipulate generation.",
            "AI must not manipulate supersedes.",
            "AI must not manipulate createdAt."
        ]
    },

    semantic: {
        description:
            "Human and AI-readable meaning of the Shell.",

        fields: {
            name:
                "Semantic name.",

            purpose:
                "What the Shell is responsible for.",

            tags:
                "Searchable semantic tags.",

            description:
                "Detailed semantic description."
        },

        aiRules: [
            "Semantic fields may be proposed by AI.",
            "Semantic changes must remain consistent with the payload.",
            "The validator remains authoritative."
        ]
    },

    payload: {
        description:
            "Luascript Program AST.",

        requiredType:
            "Program",

        aiRules: [
            "Payload must be a valid Luascript AST.",
            "AI must follow the published Luascript grammar.",
            "AI must not emit arbitrary Luau as Shell payload.",
            "AI must not bypass AST validation.",
            "Code generation is performed by the deterministic compiler."
        ]
    },

    evolution: {
        add: {
            required: [
                "shellId",
                "operation",
                "path",
                "proposal"
            ],

            operation:
                "ADD"
        },

        update: {
            required: [
                "shellId",
                "operation",
                "baseVersion",
                "proposal"
            ],

            operation:
                "UPDATE"
        },

        remove: {
            required: [
                "shellId",
                "operation",
                "baseVersion"
            ],

            operation:
                "REMOVE"
        }
    },

    forbidden: [
        "Direct ProjectTree mutation.",
        "Direct ShellRepository mutation.",
        "Version override.",
        "Snapshot override.",
        "Path override for existing Shell.",
        "Lifecycle override.",
        "Generation override.",
        "Hash override.",
        "Writing final Luau directly.",
        "Executing arbitrary code during planning."
    ]
});

function getShellContract() {
    return JSON.parse(
        JSON.stringify(
            SHELL_CONTRACT
        )
    );
}

function serializeShellContract() {
    return JSON.stringify(
        SHELL_CONTRACT,
        null,
        2
    );
}

function getAIShellInstructions() {
    return [
        "You operate on a versioned Shell-based project.",
        "You never mutate the project directly.",
        "You receive a ProjectContext before proposing changes.",
        "Every change must reference a Shell id.",
        "UPDATE and REMOVE require the observed baseVersion.",
        "ADD requires a proposed path.",
        "Never invent or override snapshotHash.",
        "Never invent or override an existing Shell path.",
        "Never assign version, generation, hash, actual, or supersedes.",
        "Shell payloads must be valid Luascript Program ASTs.",
        "The deterministic Core validates and applies your proposal.",
        "Final Luau is generated by the deterministic compiler.",
        "If the requested feature requires multiple Shells, propose all affected Shell changes.",
        "Prefer the smallest valid evolution that satisfies the intent."
    ];
}

module.exports = {
    SHELL_CONTRACT_VERSION,
    getShellContract,
    serializeShellContract,
    getAIShellInstructions
};
