#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Command } from "commander";
import { render } from "./index.js";

const program = new Command();

program
  .name("paperforge")
  .description(
    "Compose PDFs from Handlebars templates, a JSON recipe, and your data.",
  )
  .requiredOption("--templates <dir>", "Path to the templates directory")
  .option(
    "--data <file>",
    "Path to a JSON data file, or '-' to read JSON from stdin",
  )
  .option("--theme <file>", "Path to a JSON theme override file")
  .option("--out <file>", "Output PDF path (omit to write to stdout)")
  .option(
    "--format <value>",
    "Paper format: A4, Letter, Legal, ..., or '<width>x<height>' (e.g. 1280x720)",
    "A4",
  )
  .option("--landscape", "Landscape orientation")
  .option(
    "--margin <css>",
    "CSS margin shorthand (e.g. '20mm' or '20mm 15mm')",
  )
  .action(async (opts) => {
    try {
      const data = await loadData(opts.data);
      const theme = opts.theme ? await readJson(opts.theme) : undefined;
      const format = parseFormat(opts.format);
      const margin = opts.margin ? parseMargin(opts.margin) : undefined;

      const buffer = await render({
        templatesDir: opts.templates,
        data,
        theme,
        output: opts.out,
        format,
        landscape: Boolean(opts.landscape),
        margin,
      });

      if (!opts.out) {
        // Write binary PDF to stdout when no --out is provided.
        process.stdout.write(buffer);
      } else {
        console.error(`Wrote ${buffer.length} bytes to ${path.resolve(opts.out)}`);
      }
    } catch (err) {
      console.error(`paperforge: ${err.message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);

async function loadData(arg) {
  if (!arg || arg === "-") {
    // Read from stdin if it's piped; otherwise return empty data.
    if (process.stdin.isTTY) return {};
    return JSON.parse(await readStream(process.stdin));
  }
  return readJson(arg);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${err.message}`);
  }
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseFormat(value) {
  if (!value) return "A4";
  const dim = value.match(/^(\d+(?:\.\d+)?)(px|in|cm|mm)?x(\d+(?:\.\d+)?)(px|in|cm|mm)?$/i);
  if (dim) {
    const unit1 = dim[2] ?? "px";
    const unit2 = dim[4] ?? unit1;
    return { width: `${dim[1]}${unit1}`, height: `${dim[3]}${unit2}` };
  }
  return value;
}

function parseMargin(value) {
  const parts = value.trim().split(/\s+/);
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  }
  if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  }
  if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  }
  if (parts.length === 4) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  }
  throw new Error(`Invalid --margin value: "${value}"`);
}
