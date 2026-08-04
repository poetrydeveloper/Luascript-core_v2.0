// tests/unit/shell_source_validator.test.js

const assert = require("assert");

const {
    ShellSourceValidator
} = require(
    "../../compiler/project/shell_source_validator"
);

function makeProposal() {
    return {
        type:
            "ShellProposal",

        schemaVersion:
            1,

        shellId:
            "weapon-system",

        operation:
            "UPDATE",

        baseVersion:
            1,

        baseHash:
            "7774505a14864abb760030010afbfca513558f3321443d5a7a75032b90ba4164",

        source:
`class WeaponSystem extends System do
end
# AURA_END`
    };
}

try {
    const validator =
        new ShellSourceValidator();

    const proposal =
        makeProposal();

    const result =
        validator.validate(
            proposal
        );

    assert.strictEqual(
        result.type,
        "ValidatedShellSource"
    );

    assert.strictEqual(
        result.schemaVersion,
        1
    );

    assert.strictEqual(
        result.shellId,
        "weapon-system"
    );

    assert.strictEqual(
        result.operation,
        "UPDATE"
    );

    assert.strictEqual(
        result.baseVersion,
        1
    );

    assert.strictEqual(
        result.baseHash,
        proposal.baseHash
    );

    assert.strictEqual(
        result.source,
        proposal.source
    );

    assert.ok(
        Array.isArray(
            result.tokens
        )
    );

    assert.ok(
        result.tokens.length > 0
    );

    assert.strictEqual(
        result.ast.type,
        "Program"
    );

    assert.ok(
        Array.isArray(
            result.ast.declarations
        )
    );

    assert.strictEqual(
        result.ast.declarations.length,
        1
    );

    assert.strictEqual(
        result.ast.declarations[0].type,
        "ClassDeclaration"
    );

    assert.strictEqual(
        result.astValidated,
        false
    );

    /*
     * Empty source must be rejected.
     */
    assert.throws(
        () =>
            validator.validate({
                ...proposal,
                source: ""
            })
    );

    /*
     * Invalid syntax must be rejected by
     * the real Luascript lexer/parser.
     */
    assert.throws(
        () =>
            validator.validate({
                ...proposal,
                source:
`class WeaponSystem extends System do
end`
            })
    );

    /*
     * DELETE must not enter source validation.
     */
    assert.throws(
        () =>
            validator.validate({
                ...proposal,
                operation:
                    "DELETE",
                source:
                    proposal.source
            })
    );

    console.log(
        "SHELL SOURCE VALIDATOR OK"
    );

    console.log(
        JSON.stringify(
            {
                type:
                    result.type,

                shellId:
                    result.shellId,

                operation:
                    result.operation,

                baseVersion:
                    result.baseVersion,

                tokenCount:
                    result.tokens.length,

                astType:
                    result.ast.type,

                declarationCount:
                    result.ast.declarations.length,

                astValidated:
                    result.astValidated
            },
            null,
            2
        )
    );

} catch (error) {
    console.error(
        "SHELL SOURCE VALIDATOR FAILED"
    );

    console.error(error);

    process.exit(1);
}
