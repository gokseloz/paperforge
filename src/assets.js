import { promises as fs } from "node:fs";
import path from "node:path";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
};

/**
 * Inline local (relative-path) image references in the HTML as `data:` URIs.
 * Looks at both `<img src="...">` and CSS `url(...)` declarations.
 *
 * Skips anything that already starts with `data:`, `http://`, `https://`, `//`,
 * or `file:`. Logs a warning and leaves the original reference untouched if a
 * referenced file cannot be read.
 *
 * @param {string} html       The compiled HTML to transform.
 * @param {string} baseDir    The directory relative paths resolve against.
 * @returns {Promise<string>} The HTML with local images inlined.
 */
export async function inlineLocalAssets(html, baseDir) {
  if (!html || !baseDir) return html;

  // Cache files so we only read each one once even if referenced many times.
  const cache = new Map();

  const replacer = async (originalUrl) => {
    if (!isLocalRef(originalUrl)) return null;
    const decoded = decodeURI(originalUrl.split("?")[0].split("#")[0]);
    const absolute = path.resolve(baseDir, decoded);

    if (cache.has(absolute)) return cache.get(absolute);

    try {
      const buf = await fs.readFile(absolute);
      const mime = MIME_BY_EXT[path.extname(absolute).toLowerCase()];
      if (!mime) {
        cache.set(absolute, null);
        return null;
      }
      const dataUri = `data:${mime};base64,${buf.toString("base64")}`;
      cache.set(absolute, dataUri);
      return dataUri;
    } catch (err) {
      console.warn(
        `[paperforge] could not inline asset "${originalUrl}": ${err.message}`,
      );
      cache.set(absolute, null);
      return null;
    }
  };

  // Collect all matches first, run substitutions in parallel, then apply.
  const imgRe = /<img\b[^>]*\bsrc\s*=\s*("([^"]+)"|'([^']+)')[^>]*>/gi;
  const urlRe = /url\(\s*("([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi;

  const replacements = [];

  for (const match of html.matchAll(imgRe)) {
    const url = match[2] ?? match[3];
    replacements.push({ kind: "img", match: match[0], full: match[1], url });
  }
  for (const match of html.matchAll(urlRe)) {
    const url = match[2] ?? match[3] ?? match[4];
    replacements.push({ kind: "url", match: match[0], full: match[1], url });
  }

  const resolved = await Promise.all(
    replacements.map(async (r) => ({ ...r, dataUri: await replacer(r.url) })),
  );

  let out = html;
  for (const r of resolved) {
    if (!r.dataUri) continue;
    if (r.kind === "img") {
      const replaced = r.match.replace(r.full, `"${r.dataUri}"`);
      out = out.replace(r.match, replaced);
    } else {
      const replaced = `url("${r.dataUri}")`;
      out = out.replace(r.match, replaced);
    }
  }

  return out;
}

function isLocalRef(url) {
  if (!url) return false;
  if (url.startsWith("data:")) return false;
  if (url.startsWith("http://")) return false;
  if (url.startsWith("https://")) return false;
  if (url.startsWith("//")) return false;
  if (url.startsWith("file:")) return false;
  return true;
}
