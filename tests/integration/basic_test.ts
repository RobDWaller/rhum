import { asserts, colors } from "../../deps.ts";

/**
 * To be clear, we are making sure that when a user runs their tests using Bourbon, that everything works correctly,
 * and the output is correct
 */

Deno.test({
  name:
    "Integration | basic_test.ts | Tests correctly pass and display the correct output",
  async fn(): Promise<void> {
    const p = await Deno.run({
      cmd: ["deno", "test", "--allow-run", "example_tests/basic/tests_pass.ts"],
      stdout: "piped",
      stderr: "piped",
      env: { "NO_COLOR": "false" },
    });
    const status = await p.status();
    p.close();
    const stderr = new TextDecoder().decode(await p.stderrOutput());
    asserts.assertEquals(status.success, true);
    asserts.assertEquals(status.code, 0);
    /**
     * Due to the nature of this testing (running tests that run tests), the stderr is showing "Compiling .../.deno.ts.ts" -
     * there doesn't seem be a way around it (yet), so what we are doing is just asserting it only contains that line,
     * that way we can get these tests to work, and make sure no errors are thrown
     */
    const splitStderr = stderr.split("\n"); // ["compiling ...", ""]
    asserts.assertEquals(splitStderr.length, 2);
    asserts.assertEquals(splitStderr[1], "");
    /**
     * Because the timing for each test is dynamic, we can't really test it ("... ok (3ms)"), so strip all that out
     */
    let stdout = new TextDecoder("utf-8")
      .decode(await p.output())
      .replace(/\(\d+ms\)/g, ""); // (*ms)
    /**
     * There are also some odd empty lines at the end of the stdout... so we just strip those out
     */
    stdout = stdout.substring(0, stdout.indexOf("filtered out") + 12);
    const expectedResult = "running 22 tests\n" +
      // Test plan 1
      "test test_case_1a1 ...                        \n" +
      "test_plan_1\n" +
      "    test_suite_1a\n" +
      "        test_case_1a1 ... ok \n" +
      "test test_case_1a2 ...         test_case_1a2 ... ok \n" +
      "test test_case_1a3 ...         test_case_1a3 ... ok \n" +
      "test test_case_1b1 ...     test_suite_1b                       \n" +
      "        test_case_1b1 ... ok \n" +
      "test test_case_1b2 ...         test_case_1b2 ... ok \n" +
      "test test_case_1b3 ...         test_case_1b3 ... ok \n" +
      // Test plan 2
      "test test_case_2a1 ...                        \n" +
      "test_plan_2\n" +
      "    test_suite_2a\n" +
      "        test_case_2a1 ... ok \n" +
      "test test_case_2a2 ...         test_case_2a2 ... ok \n" +
      "test test_case_2a3 ...         test_case_2a3 ... ok \n" +
      "test test_case_2b1 ...     test_suite_2b                       \n" +
      "        test_case_2b1 ... ok \n" +
      "test test_case_2b2 ...         test_case_2b2 ... ok \n" +
      "test test_case_2c1 ...     test_suite_2c                       \n" +
      "        test_case_2c1 ... ok \n" +
      "test test_case_2c2 ...         test_case_2c2 ... ok \n" +
      "test test_case_2c3 ...         test_case_2c3 ... ok \n" +
      "test test_case_2d1 ...     test_suite_2d                       \n" +
      "        test_case_2d1 ... ok \n" +
      "test test_case_2d2 ...         test_case_2d2 ... ok \n" +
      // Test plan 3
      "test test_case_3a1 ...                        \n" +
      "test_plan_3\n" +
      "    test_suite_3a\n" +
      "        test_case_3a1 ... ok \n" +
      "test test_case_3a2 ...         test_case_3a2 ... ok \n" +
      "test test_case_3b1 ...     test_suite_3b                       \n" +
      "        test_case_3b1 ... ok \n" +
      "test test_case_3b2 ...         test_case_3b2 ... ok \n" +
      "test test_case_3c1 ...     test_suite_3c                       \n" +
      "        test_case_3c1 ... ok \n" +
      "test test_case_3c2 ...         test_case_3c2 ... ok \n" +
      "\n" +
      "test result: ok. 22 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out";
    asserts.assertEquals(stdout, expectedResult);
  },
});

Deno.test({
  name:
    "Integration | basic_test.ts | Tests correctly fail and display the correct output",
  async fn(): Promise<void> {
    const p = await Deno.run({
      cmd: ["deno", "test", "--allow-run", "example_tests/basic/tests_fail.ts"],
      stdout: "piped",
      stderr: "piped",
      env: { "NO_COLOR": "true" },
    });
    const status = await p.status();
    p.close();
    const stderr = new TextDecoder().decode(await p.stderrOutput());
    asserts.assertEquals(status.success, false);
    asserts.assertEquals(status.code, 1);
    /**
     * Due to the nature of this testing (running tests that run tests), the stderr is showing "Compiling .../.deno.ts.ts" -
     * there doesn't seem be a way around it (yet), so what we are doing is just asserting it only contains that line,
     * that way we can get these tests to work, and make sure no errors are thrown
     */
    const splitStderr = stderr.split("\n"); // ["compiling ...", ""]
    asserts.assertEquals(splitStderr.length, 2);
    asserts.assertEquals(splitStderr[1], "");
    /**
     * Because the timing for each test is dynamic, we can't really test it ("... ok (3ms)"), so strip all that out
     */
    let stdout = new TextDecoder("utf-8")
      .decode(await p.output())
      .replace(/\(\d+ms\)/g, ""); // (*ms)
    /**
     * There are also some odd empty lines at the end of the stdout... so we just strip those out
     */
    stdout = stdout.substring(0, stdout.indexOf("filtered out") + 12);
    /**
     * And because the stdout is of the following format:
     *
     *    running X tests
     *    ...
     *
     *    failures:
     *
     *    ...
     *
     *      ...
     *
     *      at Module.assertEquals(...)
     *
     * We can just break this up into segments, because we can't assert the filepaths in the error stack
     */
    let splitStdout = stdout.split("failures:"); // [0] = the test case results, [1] = the start of the failures
    const testCaseResults = splitStdout[0];
    const firstFailureResult =
      splitStdout[1].split("at Module.assertEquals")[0]; // Output of failing on first test
    const secondFailureResult =
      splitStdout[1].split("at Object.runTests")[1].split(
        "at Module.assertEquals",
      )[0];
    const expectedTestCaseResult = "running 22 tests\n" +
      // Test plan 1
      "test test_case_1a1 ...                        \n" +
      "test_plan_1\n" +
      "    test_suite_1a\n" +
      "        test_case_1a1 ... FAILED \n" +
      "test test_case_1a2 ...         test_case_1a2 ... ok \n" +
      "test test_case_1a3 ...         test_case_1a3 ... ok \n" +
      "test test_case_1b1 ...     test_suite_1b                       \n" +
      "        test_case_1b1 ... ok \n" +
      "test test_case_1b2 ...         test_case_1b2 ... ok \n" +
      "test test_case_1b3 ...         test_case_1b3 ... FAILED \n" +
      // Test plan 2
      "test test_case_2a1 ...                        \n" +
      "test_plan_2\n" +
      "    test_suite_2a\n" +
      "        test_case_2a1 ... ok \n" +
      "test test_case_2a2 ...         test_case_2a2 ... ok \n" +
      "test test_case_2a3 ...         test_case_2a3 ... ok \n" +
      "test test_case_2b1 ...     test_suite_2b                       \n" +
      "        test_case_2b1 ... ok \n" +
      "test test_case_2b2 ...         test_case_2b2 ... ok \n" +
      "test test_case_2c1 ...     test_suite_2c                       \n" +
      "        test_case_2c1 ... ok \n" +
      "test test_case_2c2 ...         test_case_2c2 ... ok \n" +
      "test test_case_2c3 ...         test_case_2c3 ... ok \n" +
      "test test_case_2d1 ...     test_suite_2d                       \n" +
      "        test_case_2d1 ... ok \n" +
      "test test_case_2d2 ...         test_case_2d2 ... ok \n" +
      // Test plan 3
      "test test_case_3a1 ...                        \n" +
      "test_plan_3\n" +
      "    test_suite_3a\n" +
      "        test_case_3a1 ... ok \n" +
      "test test_case_3a2 ...         test_case_3a2 ... ok \n" +
      "test test_case_3b1 ...     test_suite_3b                       \n" +
      "        test_case_3b1 ... ok \n" +
      "test test_case_3b2 ...         test_case_3b2 ... ok \n" +
      "test test_case_3c1 ...     test_suite_3c                       \n" +
      "        test_case_3c1 ... ok \n" +
      "test test_case_3c2 ...         test_case_3c2 ... ok \n" +
      "\n";
    asserts.assertEquals(testCaseResults, expectedTestCaseResult);
    asserts.assertEquals(
      firstFailureResult,
      "\n" +
        "\n" +
        "test_case_1a1\n" +
        "AssertionError: Values are not equal:\n" +
        "\n" +
        "\n" +
        "    [Diff] Actual / Expected\n" +
        "\n" +
        "\n" +
        "-   true\n" +
        "+   false\n" +
        "\n    ",
    );
    asserts.assertEquals(
      secondFailureResult,
      " ($deno$/testing.ts:358:20)\n" +
        "\n" +
        "test_case_1b3\n" +
        "AssertionError: Values are not equal:\n" +
        "\n" +
        "\n" +
        "    [Diff] Actual / Expected\n" +
        "\n" +
        "\n" +
        "-   true\n" +
        "+   false\n" +
        "\n    ",
    );
    asserts.assertEquals(
      stdout.indexOf(
        "test result: FAILED. 20 passed; 2 failed; 0 ignored; 0 measured; 0 filtered out",
      ) >= 0,
      true,
    );
  },
});
