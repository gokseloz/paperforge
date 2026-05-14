import { format as formatDateFn, parseISO } from "date-fns";

/**
 * Built-in Handlebars helpers shipped with paperforge.
 * Users can add their own via `registerHelper(name, fn)` from the public API.
 */
export function registerBuiltInHelpers(Handlebars) {
  // {{#eq a b}}...{{else}}...{{/eq}} — equality block
  Handlebars.registerHelper("eq", function (a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

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
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numeric)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(numeric);
  });

  // {{json value}} — debug pretty-print
  Handlebars.registerHelper("json", function (value) {
    return new Handlebars.SafeString(
      `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`,
    );
  });

  // {{lowercase x}} / {{uppercase x}} / {{capitalize x}}
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
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
