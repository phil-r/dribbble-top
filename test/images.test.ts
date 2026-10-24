import { describe, expect, spyOn, test } from "bun:test";
import puppeteer from "puppeteer-extra";
import { getConfig } from "../src/config";
import { getTopFromBrowser } from "../src/scraper/browser";
import { getTopFromHttpFallback } from "../src/scraper/fallback";
import type { Shot } from "../src/types";

const placeholder = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const images = [
  `src="${placeholder}" data-src="https://cdn.dribbble.com/lazy.png?format=webp&amp;resize=400x300"`,
  'src="https://cdn.dribbble.com/real.png?format=webp&amp;resize=400x300" data-src="https://cdn.dribbble.com/other.png"',
  `src="${placeholder}" srcset="https://cdn.dribbble.com/set.png?format=webp&amp;resize=400x300 400w, https://cdn.dribbble.com/large.png 800w"`,
  `src="${placeholder}" data-srcset="https://cdn.dribbble.com/lazy-set.png?format=webp&amp;resize=400x300 400w, https://cdn.dribbble.com/large.png 800w"`,
  `src="${placeholder}" data-src="${placeholder}" srcset="https://cdn.dribbble.com/fallback.png 1x"`,
  "",
  `src="${placeholder}"`,
];
const html = images.map((attrs, i) => `
  <div class="shot-thumbnail" data-thumbnail-id="${i + 1}">
    <figure>${attrs ? `<img ${attrs}>` : ""}</figure>
    <a class="dribbble-link" href="https://dribbble.com/shots/${i + 1}-example">Shot</a>
    <span data-shot-like-count>1.2k</span><span class="js-shot-comments-count">2M</span>
  </div>`).join("");

function expectImages(shots: Shot[]): void {
  expect(shots.map(({ id, img }) => ({ id, img }))).toEqual([
    { id: 1, img: "https://cdn.dribbble.com/lazy.png?format=webp" },
    { id: 2, img: "https://cdn.dribbble.com/real.png?format=webp" },
    { id: 3, img: "https://cdn.dribbble.com/set.png?format=webp" },
    { id: 4, img: "https://cdn.dribbble.com/lazy-set.png?format=webp" },
    { id: 5, img: "https://cdn.dribbble.com/fallback.png" },
  ]);
  expect(shots.every((shot) => shot.likes === 1200 && shot.comments === 2000000)).toBe(true);
}

describe("shot images", () => {
  test("HTTP fallback skips placeholders, preserves real src and handles lazy sets and missing images", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(html));
    try {
      expectImages(await getTopFromHttpFallback());
    } finally {
      fetchSpy.mockRestore();
    }
  });

  test("browser executes the serialized extractor against controlled HTML", async () => {
    // Intercept navigation, not $$eval: the production callback must work in Chromium.
    const config = getConfig();
    const options = {
      disableSandbox: config.puppeteerDisableSandbox,
      headless: true,
      executablePath: config.puppeteerExecutablePath,
    };
    const launchOptions = {
      headless: true,
      ...(options.executablePath ? { executablePath: options.executablePath } : {}),
      args: [
        "--disable-dev-shm-usage", "--disable-gpu",
        ...(options.disableSandbox ? ["--no-sandbox", "--disable-setuid-sandbox"] : []),
      ],
    };
    const browser = await puppeteer.launch(launchOptions).catch((error) => {
      if (options.executablePath) throw error;
      return puppeteer.launch({ ...launchOptions, channel: "chrome" });
    });
    try {
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        void (request.isNavigationRequest()
          ? request.respond({ status: 200, contentType: "text/html", body: html })
          : request.abort());
      });
      const pageSpy = spyOn(browser, "newPage").mockResolvedValue(page);
      try {
        const launchSpy = spyOn(puppeteer, "launch").mockResolvedValue(browser);
        try {
          expectImages(await getTopFromBrowser(options));
        } finally {
          launchSpy.mockRestore();
        }
      } finally {
        pageSpy.mockRestore();
      }
    } finally {
      await browser.close();
    }
  }, 30000);
});
