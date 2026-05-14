import { promises as fs } from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import { registerBuiltInHelpers } from "./helpers.js";

/**
 * Build a render context from a templates directory.
 *
 * Folder shape (all optional except main.hbs):
 *   templatesDir/
 *     main.hbs         (required)
 *     partials/*.hbs   (only used when recipe.json is present)
 *     recipe.json      (string[] of partial names, in order)
 *     theme.json       (object merged into render context as `theme`)
 *     styles.css       (optional, referenced from main.hbs)
 *
 * @param {object} opts
 * @param {string} opts.templatesDir Absolute path to the template folder.
 * @param {object} [opts.data]       JSON-serializable data passed into Handlebars.
 * @param {object} [opts.theme]      Runtime override merged on top of theme.json.
 * @param {object} [opts.handlebars] Optional preconfigured Handlebars instance.
 * @returns {Promise<{ html: string, theme: object }>}
 */
export async function compose({ templatesDir, data = {}, theme, handlebars }) {
  if (!templatesDir) {
    throw new Error("compose: `templatesDir` is required");
  }

  const Hb = handlebars ?? Handlebars.create();
  registerBuiltInHelpers(Hb);

  const mainPath = path.join(templatesDir, "main.hbs");
  const mainSource = await readFileOrThrow(
    mainPath,
    `Template entry point not found: ${mainPath}`,
  );

  const themeFromFile = await readOptionalJson(
    path.join(templatesDir, "theme.json"),
  );
  const mergedTheme = { ...(themeFromFile ?? {}), ...(theme ?? {}) };

  const recipe = await readOptionalJson(path.join(templatesDir, "recipe.json"));
  if (recipe !== null) {
    if (!Array.isArray(recipe)) {
      throw new Error(
        `recipe.json must be a JSON array of partial names (got ${typeof recipe})`,
      );
    }
    await registerRecipePartials(Hb, templatesDir, recipe);
  }

  const template = Hb.compile(mainSource, { noEscape: false });
  const html = template({
    ...data,
    theme: mergedTheme,
  });

  return { html, theme: mergedTheme };
}

async function registerRecipePartials(Hb, templatesDir, recipe) {
  const partialsDir = path.join(templatesDir, "partials");

  // Register each named partial.
  for (const name of recipe) {
    if (typeof name !== "string" || name.length === 0) {
      throw new Error(
        `recipe.json contains an invalid partial name: ${JSON.stringify(name)}`,
      );
    }
    const partialPath = path.join(partialsDir, `${name}.hbs`);
    const source = await readFileOrThrow(
      partialPath,
      `Partial "${name}" referenced in recipe.json not found at partials/${name}.hbs`,
    );
    Hb.registerPartial(name, source);
  }

  // Also register a convenience `sections` partial that renders every recipe
  // partial in order, so `main.hbs` can just write `{{> sections}}`.
  const sectionsSource = recipe.map((name) => `{{> ${name} }}`).join("\n");
  Hb.registerPartial("sections", sectionsSource);
}

async function readFileOrThrow(filePath, message) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err && err.code === "ENOENT") {
      throw new Error(message);
    }
    throw err;
  }
}

async function readOptionalJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse ${filePath}: ${err.message}`);
    }
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    throw err;
  }
}
