# paperforge

[![npm version](https://img.shields.io/npm/v/paperforge.svg)](https://www.npmjs.com/package/paperforge)
[![CI](https://github.com/gokseloz/paperforge/actions/workflows/ci.yml/badge.svg)](https://github.com/gokseloz/paperforge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js Version](https://img.shields.io/node/v/paperforge.svg)](https://nodejs.org)

> Compose PDFs from **Handlebars templates**, an optional **JSON recipe**, and your data — with per-template theming. No SaaS, no lock-in, no DSL.

paperforge is a small Node.js library and CLI that turns a folder of templates into a PDF. The interesting bit isn't the HTML-to-PDF step (Puppeteer does that) — it's the **composition model**:

- A template folder declares its sections in a `recipe.json` array.
- Each section is a Handlebars partial that can be edited, swapped, or reordered without touching code.
- A `theme.json` (overridable at runtime) drives colors, fonts, and spacing — perfect for multi-tenant or white-label outputs.
- Your data is just JSON. Pipe it in, pass it from code, whatever fits.

The same template folder works from Node, from the CLI, in CI, or in a Lambda.

## Install

```bash
npm install paperforge
```

Requires **Node.js ≥ 20**. Puppeteer downloads a matching Chromium on install (~170 MB).

## Quickstart

Clone any example as your starting point:

```bash
npx degit gokseloz/paperforge/examples/invoice my-invoice
cd my-invoice
npx paperforge --templates . --data data.json --out invoice.pdf
```

Or use it from code:

```js
import { render } from "paperforge";

const pdf = await render({
  templatesDir: "./templates/invoice",
  data: { invoice: { number: "2026-0042" /* ... */ } },
  theme: { primaryColor: "#0a66c2" }, // overrides theme.json at runtime
  output: "./invoice.pdf",
  format: "A4",
  margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
});
// `pdf` is also returned as a Buffer.
```

## How a template folder is shaped

```
my-template/
  main.hbs         # required — the HTML entry point
  recipe.json      # optional — ordered list of partial names
  partials/        # optional — one .hbs file per recipe entry
    cover.hbs
    summary.hbs
    body.hbs
    appendix.hbs
  theme.json       # optional — design tokens accessible as {{theme.*}}
```

- **No `recipe.json`?** `main.hbs` is rendered directly. Good for invoices, single-page docs.
- **With `recipe.json`?** Each listed partial is registered under its name, and a convenience `{{> sections}}` partial renders them all in order. Good for multi-section reports.
- **Theme** is read from `theme.json` and shallow-merged with any `theme` you pass to `render()` — so you can swap a single color per call without forking the template.

## CLI

```text
paperforge --templates <dir> [options]

Options:
  --templates <dir>    Templates directory (required)
  --data <file>        JSON data file, or '-' for stdin
  --theme <file>       JSON theme overrides
  --out <file>         Output PDF path (writes to stdout if omitted)
  --format <value>     A4 | Letter | Legal | <width>x<height>  (default: A4)
  --landscape          Landscape orientation
  --margin <css>       CSS margin shorthand, e.g. "20mm" or "20mm 15mm"
```

Pipe JSON through stdin:

```bash
cat data.json | paperforge --templates ./examples/invoice --out invoice.pdf
```

## Built-in Handlebars helpers

| Helper       | Example                                       |
| ------------ | --------------------------------------------- |
| `eq`         | `{{#eq stage "adopt"}}...{{/eq}}`             |
| `formatDate` | `{{formatDate dueDate "MMM d, yyyy"}}`        |
| `currency`   | `{{currency total "EUR"}}`                    |
| `json`       | `{{json someObject}}` (debug)                 |
| `lowercase`  | `{{lowercase name}}`                          |
| `uppercase`  | `{{uppercase code}}`                          |
| `capitalize` | `{{capitalize status}}`                       |

Register your own:

```js
import { registerHelper } from "paperforge";

registerHelper("multiply", (a, b) => Number(a) * Number(b));
```

## Asset handling

Relative `<img src="...">` and CSS `url(...)` references are resolved against the templates directory and inlined as `data:` URIs before printing — so generated PDFs are self-contained and you don't need a running web server.

Remote URLs (`http://`, `https://`) are left untouched.

## Public API

```js
import {
  render,           // compose + inline + print, returns Buffer
  compose,          // just compose templates, returns { html, theme }
  htmlToPdf,        // just print HTML, returns Buffer
  inlineLocalAssets,// rewrite local refs as data URIs
  registerHelper,   // register a custom Handlebars helper
} from "paperforge";
```

## Examples

The [`examples/`](./examples) folder ships three working templates:

- **invoice** — single `main.hbs`, no recipe.
- **report** — multi-section with `recipe.json` + partials and a cover page.
- **resume** — sidebar layout, theme-heavy CSS.

Run them all:

```bash
npm install
npm test
ls out/
```

## License

MIT
