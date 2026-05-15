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

## Building your own template

The examples are starting points — most users will write their own. Here's a minimal "order confirmation" template inside an app:

```
my-shop/
├── package.json
├── pdf-templates/
│   └── order-confirmation/
│       ├── main.hbs
│       └── theme.json
└── src/
    └── routes/order.js
```

`pdf-templates/order-confirmation/main.hbs`:

```handlebars
<!doctype html>
<html>
  <head>
    <style>
      body { font-family: sans-serif; padding: 40px; color: #222; }
      h1 { color: {{theme.brand}}; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px; border-bottom: 1px solid #eee; }
      .right { text-align: right; }
    </style>
  </head>
  <body>
    <h1>Order #{{order.id}}</h1>
    <p>Hi {{customer.firstName}}, your order from
       {{formatDate order.createdAt "MMM d, yyyy"}}:</p>
    <table>
      <tr><th>Item</th><th>Qty</th><th class="right">Total</th></tr>
      {{#each order.items}}
        <tr>
          <td>{{name}}</td>
          <td>{{qty}}</td>
          <td class="right">{{currency (mul qty price) "EUR"}}</td>
        </tr>
      {{/each}}
    </table>
    <p class="right">
      <strong>Total: {{currency (sum order.items "qty" "price") "EUR"}}</strong>
    </p>
  </body>
</html>
```

`pdf-templates/order-confirmation/theme.json`:

```json
{ "brand": "#0066ff" }
```

`src/routes/order.js`:

```js
import { render } from "paperforge";

app.get("/orders/:id/pdf", async (req, res) => {
  const order = await db.order.findById(req.params.id);

  const pdf = await render({
    templatesDir: "./pdf-templates/order-confirmation",
    data: { order, customer: order.customer },
  });

  res.contentType("application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="order-${order.id}.pdf"`);
  res.send(pdf);
});
```

That's the full loop: a template folder you own, your data, `render()`, a PDF back. For multi-section documents (cover + summary + body + appendix), add a `recipe.json` and `partials/` — see [`examples/report`](./examples/report).

### Per-tenant / per-brand templates

For multi-tenant SaaS, keep one folder per tenant (or a `default/` fallback) and pick at runtime:

```js
const dir = fs.existsSync(`./pdf-templates/order/${tenant.slug}`)
  ? `./pdf-templates/order/${tenant.slug}`
  : "./pdf-templates/order/default";

const pdf = await render({ templatesDir: dir, data: { order } });
```

Or keep one template and override the theme per call:

```js
const pdf = await render({
  templatesDir: "./pdf-templates/order",
  data: { order },
  theme: { brand: tenant.brandColor },
});
```

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

**Comparison** (block helpers, support `{{else}}`):

| Helper | Example                                      |
| ------ | -------------------------------------------- |
| `eq`   | `{{#eq stage "adopt"}}…{{/eq}}`              |
| `ne`   | `{{#ne status "draft"}}…{{/ne}}`             |
| `gt`   | `{{#gt balance 0}}Pay now{{/gt}}`            |
| `gte`  | `{{#gte score 80}}Passed{{/gte}}`            |
| `lt`   | `{{#lt stock 5}}Low stock{{/lt}}`            |
| `lte`  | `{{#lte age 17}}Minor{{/lte}}`               |

**Boolean composition** (block helpers):

| Helper | Example                                                   |
| ------ | --------------------------------------------------------- |
| `and`  | `{{#and isPaid hasReceipt}}…{{/and}}`                     |
| `or`   | `{{#or isVip isFirstOrder}}…{{/or}}`                      |
| `not`  | `{{#not isCancelled}}…{{/not}}`                           |

**Math** (inline helpers — work great inside `{{#each}}`):

| Helper | Example                          | Result |
| ------ | -------------------------------- | ------ |
| `add`  | `{{add 2 3}}`                    | `5`    |
| `sub`  | `{{sub 10 4}}`                   | `6`    |
| `mul`  | `{{mul qty price}}`              | line total |
| `div`  | `{{div total count}}`            | average (returns `0` on divide-by-zero) |
| `sum`  | `{{sum items "lineTotal"}}` or `{{sum items "qty" "price"}}` | invoice subtotal |

**Formatting**:

| Helper       | Example                                     | Result        |
| ------------ | ------------------------------------------- | ------------- |
| `formatDate` | `{{formatDate dueDate "MMM d, yyyy"}}`      | `May 14, 2026` |
| `currency`   | `{{currency total "EUR"}}`                  | `€1,234.50`   |
| `number`     | `{{number 1234.567 2}}`                     | `1,234.57`    |
| `percent`    | `{{percent 0.19}}`                          | `19%`         |

**String / fallback**:

| Helper       | Example                                  |
| ------------ | ---------------------------------------- |
| `default`    | `{{default phone "N/A"}}`                |
| `truncate`   | `{{truncate description 80}}`            |
| `lowercase`  | `{{lowercase name}}`                     |
| `uppercase`  | `{{uppercase code}}`                     |
| `capitalize` | `{{capitalize status}}`                  |
| `json`       | `{{json someObject}}` (debug)            |

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
