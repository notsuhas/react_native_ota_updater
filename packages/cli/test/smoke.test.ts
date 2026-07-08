import { runCommand } from "@oclif/test";
import { expect } from "chai";

/**
 * Smoke test: verifies the CLI boots and its oclif core wiring is intact.
 * Uses `--version`, which oclif resolves from the package manifest and does
 * not depend on the compiled `dist/commands` output, so the test is
 * independent of build ordering.
 */
describe("cli", () => {
	it("reports its version without error", async () => {
		const { stdout, error } = await runCommand("--version");
		expect(error, error?.message).to.equal(undefined);
		expect(stdout).to.match(/\d+\.\d+\.\d+/);
	});
});
