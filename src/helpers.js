import { format as formatDateFn, parseISO } from "date-fns";

/**
 * Built-in Handlebars helpers shipped with paperforge.
 * Users can add their own via `registerHelper(name, fn)` from the public API.
 */
export function registerBuiltInHelpers(Handlebars) {
  // ---------------------------------------------------------------------------
  // Comparison (block helpers)
  // ---------------------------------------------------------------------------
  function blockCompare(predicate) {
    return function (a, b, options) {
      if (predicate(a, b)) return options.fn(this);
      return options.inverse(this);
    };
  }
  Handlebars.registerHelper(
    "eq",
    blockCompare((a, b) => a === b),
  );
  Handlebars.registerHelper(
    "ne",
    blockCompare((a, b) => a !== b),
  );
  Handlebars.registerHelper(
    "gt",
    blockCompare((a, b) => toNumber(a) > toNumber(b)),
  );
  Handlebars.registerHelper(
    "gte",
    blockCompare((a, b) => toNumber(a) >= toNumber(b)),
  );
  Handlebars.registerHelper(
    "lt",
    blockCompare((a, b) => toNumber(a) < toNumber(b)),
  );
  Handlebars.registerHelper(
    "lte",
    blockCompare((a, b) => toNumber(a) <= toNumber(b)),
  );

  // ---------------------------------------------------------------------------
  // Boolean composition (block helpers)
  // ---------------------------------------------------------------------------
  Handlebars.registerHelper("and", function (...args) {
    const options = args.pop();
    return args.every(Boolean) ? options.fn(this) : options.inverse(this);
  });
  Handlebars.registerHelper("or", function (...args) {
    const options = args.pop();
    return args.some(Boolean) ? options.fn(this) : options.inverse(this);
  });
  Handlebars.registerHelper("not", function (value, options) {
    return !value ? options.fn(this) : options.inverse(this);
  });

  // ---------------------------------------------------------------------------
  // Math (inline helpers)
  // ---------------------------------------------------------------------------
  Handlebars.registerHelper("add", (a, b) => toNumber(a) + toNumber(b));
  Handlebars.registerHelper("sub", (a, b) => toNumber(a) - toNumber(b));
  Handlebars.registerHelper("mul", (a, b) => toNumber(a) * toNumber(b));
  Handlebars.registerHelper("div", (a, b) => {
    const divisor = toNumber(b);
    if (divisor === 0) return 0;
    return toNumber(a) / divisor;
  });

  // {{sum items}}                — sums numeric values
  // {{sum items "lineTotal"}}    — sums item[key] for each item
  // {{sum items "qty" "price"}}  — sums item[a] * item[b] for each item
  Handlebars.registerHelper("sum", function (list, ...args) {
    args.pop(); // drop Handlebars options
    const keyA = typeof args[0] === "string" ? args[0] : null;
    const keyB = typeof args[1] === "string" ? args[1] : null;
    if (!Array.isArray(list)) return 0;
    return list.reduce((total, item) => {
      if (keyA && keyB) {
        return total + toNumber(item?.[keyA]) * toNumber(item?.[keyB]);
      }
      if (keyA) return total + toNumber(item?.[keyA]);
      return total + toNumber(item);
    }, 0);
  });

  // ---------------------------------------------------------------------------
  // Date / currency / number / percent formatting
  // ---------------------------------------------------------------------------

  // {{formatDate value "yyyy-MM-dd"}} — accepts Date, ISO string, or epoch ms
  Handlebars.registerHelper("formatDate", function (value, pattern) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof pattern !== "string") pattern = "yyyy-MM-dd";
    let date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "number") {
      date = new Date(value);
    } else {
      date = parseISO(String(value));
    }
    if (Number.isNaN(date.getTime())) return "";
    return formatDateFn(date, pattern);
  });

  // {{currency value "USD"}} — uses Intl.NumberFormat
  Handlebars.registerHelper("currency", function (value, currency) {
    if (value === undefined || value === null || value === "") return "";
    if (typeof currency !== "string") currency = "USD";
    const numeric = toNumber(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numeric);
  });

  // {{number value 2}} — formats a number with thousand separators and N digits
  Handlebars.registerHelper("number", function (value, digits) {
    if (value === undefined || value === null || value === "") return "";
    const numeric = toNumber(value);
    const fractionDigits = Number.isInteger(digits) ? digits : 2;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(numeric);
  });

  // {{percent 0.19}} -> "19%"; {{percent 0.1234 1}} -> "12.3%"
  Handlebars.registerHelper("percent", function (value, digits) {
    if (value === undefined || value === null || value === "") return "";
    const numeric = toNumber(value);
    const fractionDigits = Number.isInteger(digits) ? digits : 0;
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(numeric);
  });

  // ---------------------------------------------------------------------------
  // String / fallback helpers
  // ---------------------------------------------------------------------------

  // {{json value}} — debug pretty-print
  Handlebars.registerHelper("json", function (value) {
    return new Handlebars.SafeString(
      `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`,
    );
  });

  Handlebars.registerHelper("lowercase", (s) =>
    typeof s === "string" ? s.toLowerCase() : "",
  );
  Handlebars.registerHelper("uppercase", (s) =>
    typeof s === "string" ? s.toUpperCase() : "",
  );
  Handlebars.registerHelper("capitalize", (s) => {
    if (typeof s !== "string" || s.length === 0) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  // {{default value "N/A"}} — returns fallback when value is null/undefined/""
  Handlebars.registerHelper("default", (value, fallback) => {
    if (value === undefined || value === null || value === "") return fallback;
    return value;
  });

  // {{truncate "long text..." 20}} — adds ellipsis if cut
  Handlebars.registerHelper("truncate", (value, length) => {
    if (typeof value !== "string") return "";
    const max = Number.isInteger(length) ? length : 80;
    if (value.length <= max) return value;
    return value.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
  });
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
