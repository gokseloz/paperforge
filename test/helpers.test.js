import { test } from "node:test";
import assert from "node:assert/strict";
import Handlebars from "handlebars";
import { registerBuiltInHelpers } from "../src/helpers.js";

function makeHb() {
  const hb = Handlebars.create();
  registerBuiltInHelpers(hb);
  return hb;
}

function render(template, data = {}) {
  return makeHb().compile(template)(data);
}

// --- comparison -------------------------------------------------------------

test("eq / ne", () => {
  assert.equal(render("{{#eq a b}}y{{else}}n{{/eq}}", { a: 1, b: 1 }), "y");
  assert.equal(render("{{#eq a b}}y{{else}}n{{/eq}}", { a: 1, b: 2 }), "n");
  assert.equal(render("{{#ne a b}}y{{else}}n{{/ne}}", { a: 1, b: 2 }), "y");
});

test("gt / gte / lt / lte coerce strings to numbers", () => {
  assert.equal(render("{{#gt a b}}y{{else}}n{{/gt}}", { a: "10", b: 2 }), "y");
  assert.equal(render("{{#lt a b}}y{{else}}n{{/lt}}", { a: 1, b: 2 }), "y");
  assert.equal(render("{{#gte a b}}y{{else}}n{{/gte}}", { a: 2, b: 2 }), "y");
  assert.equal(render("{{#lte a b}}y{{else}}n{{/lte}}", { a: 2, b: 2 }), "y");
});

// --- boolean composition ----------------------------------------------------

test("and / or / not", () => {
  assert.equal(
    render("{{#and a b}}y{{else}}n{{/and}}", { a: true, b: true }),
    "y",
  );
  assert.equal(
    render("{{#and a b}}y{{else}}n{{/and}}", { a: true, b: false }),
    "n",
  );
  assert.equal(
    render("{{#or a b}}y{{else}}n{{/or}}", { a: false, b: true }),
    "y",
  );
  assert.equal(render("{{#not a}}y{{else}}n{{/not}}", { a: false }), "y");
});

// --- math -------------------------------------------------------------------

test("add / sub / mul / div", () => {
  assert.equal(render("{{add 2 3}}"), "5");
  assert.equal(render("{{sub 10 4}}"), "6");
  assert.equal(render("{{mul 3 4}}"), "12");
  assert.equal(render("{{div 10 4}}"), "2.5");
  assert.equal(render("{{div 10 0}}"), "0");
});

test("sum over numeric array, key, and two keys", () => {
  const items = [
    { qty: 2, price: 10, total: 20 },
    { qty: 1, price: 5, total: 5 },
    { qty: 3, price: 4, total: 12 },
  ];
  assert.equal(render("{{sum nums}}", { nums: [1, 2, 3, 4] }), "10");
  assert.equal(render("{{sum items 'total'}}", { items }), "37");
  assert.equal(render("{{sum items 'qty' 'price'}}", { items }), "37");
  assert.equal(render("{{sum nothing}}", {}), "0");
});

// --- formatting -------------------------------------------------------------

test("currency formats USD by default", () => {
  assert.equal(render("{{currency 1234.5}}"), "$1,234.50");
  assert.equal(render("{{currency v 'EUR'}}", { v: 1234.5 }), "€1,234.50");
  assert.equal(render("{{currency v}}", { v: null }), "");
});

test("number formats with thousand separators", () => {
  assert.equal(render("{{number 1234.567}}"), "1,234.57");
  assert.equal(render("{{number 1234.567 0}}"), "1,235");
  assert.equal(render("{{number ''}}"), "");
});

test("percent default and custom digits", () => {
  assert.equal(render("{{percent 0.19}}"), "19%");
  assert.equal(render("{{percent 0.1234 1}}"), "12.3%");
});

test("formatDate handles ISO, Date, ms, and invalid", () => {
  assert.equal(render("{{formatDate v}}", { v: "2026-05-14" }), "2026-05-14");
  assert.equal(
    render("{{formatDate v 'dd/MM/yyyy'}}", { v: "2026-05-14" }),
    "14/05/2026",
  );
  assert.equal(render("{{formatDate v}}", { v: "" }), "");
  assert.equal(render("{{formatDate v}}", { v: "not-a-date" }), "");
});

// --- string / fallback ------------------------------------------------------

test("lowercase / uppercase / capitalize", () => {
  assert.equal(render("{{lowercase 'HELLO'}}"), "hello");
  assert.equal(render("{{uppercase 'hello'}}"), "HELLO");
  assert.equal(render("{{capitalize 'hello'}}"), "Hello");
  assert.equal(render("{{capitalize ''}}"), "");
});

test("default returns fallback for null / undefined / empty", () => {
  assert.equal(render("{{default v 'N/A'}}", {}), "N/A");
  assert.equal(render("{{default v 'N/A'}}", { v: "" }), "N/A");
  assert.equal(render("{{default v 'N/A'}}", { v: null }), "N/A");
  assert.equal(render("{{default v 'N/A'}}", { v: "ok" }), "ok");
});

test("truncate respects length and adds ellipsis", () => {
  assert.equal(render("{{truncate 'short' 20}}"), "short");
  assert.equal(render("{{truncate 'abcdefghij' 5}}"), "abcd…");
  assert.equal(render("{{truncate v 5}}", { v: 123 }), "");
});

test("json renders pretty <pre> block", () => {
  const out = render("{{json data}}", { data: { a: 1 } });
  assert.match(out, /<pre>/);
  assert.match(out, /"a": 1/);
});
