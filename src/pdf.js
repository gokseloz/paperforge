import puppeteer from "puppeteer";

/**
 * Render HTML to a PDF Buffer using headless Chromium.
 *
 * @param {string} html
 * @param {object} [pdfOptions] Passed through to Puppeteer's `page.pdf()`.
 *   Common keys: `format` ("A4" | "Letter" | { width, height }), `landscape`,
 *   `margin`, `printBackground` (defaults to true), `displayHeaderFooter`,
 *   `headerTemplate`, `footerTemplate`.
 * @returns {Promise<Buffer>}
 */
export async function htmlToPdf(html, pdfOptions = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const { format, ...rest } = pdfOptions;
    const finalOptions = {
      printBackground: true,
      ...rest,
    };

    if (format && typeof format === "object") {
      // Custom width/height for slide-deck style outputs.
      if (format.width) finalOptions.width = format.width;
      if (format.height) finalOptions.height = format.height;
    } else if (typeof format === "string") {
      finalOptions.format = format;
    } else {
      finalOptions.format = "A4";
    }

    const pdf = await page.pdf(finalOptions);
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
