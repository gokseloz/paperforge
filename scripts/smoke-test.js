#!/usr/bin/env node
/**
 * Renders every example and asserts each output PDF is > 1 KB.
 * Used by `npm test` and by CI.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");

const examples = [
  { name: "invoice", landscape: false },
  { name: "report", landscape: false },
  { name: "resume", landscape: false },
];

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  let failed = 0;
  for (const ex of examples) {
    const templatesDir = path.join(root, "examples", ex.name);
    const data = JSON.parse(
      await fs.readFile(path.join(templatesDir, "data.json"), "utf8"),
    );
    const outFile = path.join(outDir, `${ex.name}.pdf`);

    const started = Date.now();
    const buf = await render({
      templatesDir,
      data,
      output: outFile,
      landscape: ex.landscape,
    });
    const elapsed = Date.now() - started;

    if (buf.length < 1024) {
      console.error(`✗ ${ex.name}: PDF suspiciously small (${buf.length} bytes)`);
      failed += 1;
    } else {
      console.log(
        `✓ ${ex.name}: ${(buf.length / 1024).toFixed(1)} KB in ${elapsed} ms`,
      );
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} example(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll examples rendered successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
