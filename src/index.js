import { promises as fs } from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import { compose } from "./compose.js";
import { inlineLocalAssets } from "./assets.js";
import { htmlToPdf } from "./pdf.js";

/**
 * High-level entry point: compose templates → inline assets → render PDF.
 *
 * @param {object}  opts
 * @param {string}  opts.templatesDir Path to the template folder.
 * @param {object}  [opts.data]       Data passed into Handlebars.
 * @param {object}  [opts.theme]      Runtime theme overrides (merged over theme.json).
 * @param {string}  [opts.output]     If set, write the resulting PDF here.
 * @param {string|object} [opts.format]   Paper format ("A4" | "Letter" | { width, height }).
 * @param {boolean} [opts.landscape] Landscape orientation.
 * @param {object}  [opts.margin]    e.g. { top: "20mm", bottom: "20mm" }.
 * @param {object}  [opts.pdfOptions] Extra Puppeteer pdf options (headerTemplate etc.).
 * @param {boolean} [opts.inlineAssets=true] Inline local image refs as data URIs.
 * @returns {Promise<Buffer>} The PDF as a Buffer.
 */
export async function render(opts) {
  const {
    templatesDir,
    data,
    theme,
    output,
    format,
    landscape,
    margin,
    pdfOptions = {},
    inlineAssets = true,
  } = opts ?? {};

  if (!templatesDir) {
    throw new Error("render: `templatesDir` is required");
  }

  const absTemplates = path.resolve(templatesDir);
  const { html: rawHtml } = await compose({
    templatesDir: absTemplates,
    data,
    theme,
  });

  const html = inlineAssets
    ? await inlineLocalAssets(rawHtml, absTemplates)
    : rawHtml;

  const mergedPdfOptions = {
    ...pdfOptions,
    ...(format !== undefined ? { format } : {}),
    ...(landscape !== undefined ? { landscape } : {}),
    ...(margin !== undefined ? { margin } : {}),
  };

  const buffer = await htmlToPdf(html, mergedPdfOptions);

  if (output) {
    const absOut = path.resolve(output);
    await fs.mkdir(path.dirname(absOut), { recursive: true });
    await fs.writeFile(absOut, buffer);
  }

  return buffer;
}

/**
 * Register a custom Handlebars helper that will be applied to subsequent
 * `compose`/`render` calls. Operates on the global Handlebars instance.
 */
export function registerHelper(name, fn) {
  Handlebars.registerHelper(name, fn);
}

export { compose } from "./compose.js";
export { htmlToPdf } from "./pdf.js";
export { inlineLocalAssets } from "./assets.js";
