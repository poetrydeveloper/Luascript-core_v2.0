const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const testsDir =
    path.join(
        __dirname,
        "unit"
    );

const files =
    fs.readdirSync(
        testsDir
    )
        .filter(
            file =>
                file.endsWith(".test.js")
        )
        .sort();

if (files.length === 0) {
    console.error(
        "NO UNIT TESTS FOUND"
    );

    process.exit(1);
}

const results = [];

console.log("");
console.log(
    "============================================================"
);
console.log(
    " LUASCRIPT UNIT TEST SUITE"
);
console.log(
    "============================================================"
);
console.log(
    `Tests found: ${files.length}`
);
console.log("");

for (const file of files) {
    const fullPath =
        path.join(
            testsDir,
            file
        );

    console.log(
        `RUN  ${file}`
    );

    const startedAt =
        Date.now();

    const result =
        spawnSync(
            process.execPath,
            [fullPath],
            {
                cwd:
                    path.join(
                        __dirname,
                        ".."
                    ),

                encoding:
                    "utf8"
            }
        );

    const duration =
        Date.now() -
        startedAt;

    const passed =
        result.status === 0;

    results.push({
        file,
        passed,
        duration,
        status:
            result.status
    });

    if (passed) {
        console.log(
            `PASS ${file} (${duration} ms)`
        );
    } else {
        console.log(
            `FAIL ${file} (${duration} ms)`
        );

        if (result.stdout) {
            console.log("");
            console.log(
                "--- stdout ---"
            );
            console.log(
                result.stdout.trim()
            );
        }

        if (result.stderr) {
            console.log("");
            console.log(
                "--- stderr ---"
            );
            console.log(
                result.stderr.trim()
            );
        }
    }

    console.log("");
}

const passedCount =
    results.filter(
        result =>
            result.passed
    ).length;

const failedCount =
    results.length -
    passedCount;

console.log(
    "============================================================"
);
console.log(
    " TEST SUMMARY"
);
console.log(
    "============================================================"
);

console.log(
    ""
);

console.log(
    "STATUS   TEST"
);
console.log(
    "------   -----------------------------------------------"
);

for (const result of results) {
    const status =
        result.passed
            ? "OK"
            : "FAIL";

    console.log(
        `${status.padEnd(8)} ${result.file}`
    );
}

console.log("");

console.log(
    "------------------------------------------------------------"
);

console.log(
    `TOTAL:  ${results.length}`
);

console.log(
    `OK:     ${passedCount}`
);

console.log(
    `FAILED: ${failedCount}`
);

console.log(
    "------------------------------------------------------------"
);

if (failedCount === 0) {
    console.log("");
    console.log(
        "ALL UNIT TESTS PASSED"
    );
    console.log("");

    process.exit(0);
}

console.log("");
console.log(
    "FAILED TESTS:"
);

for (const result of results) {
    if (!result.passed) {
        console.log(
            `  - ${result.file}`
        );
    }
}

console.log("");

process.exit(1);
