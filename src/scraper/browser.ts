import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import type { Browser, Page } from "puppeteer";
import type { RawShot, Shot } from "../types";
import { normalizeShot } from "./normalize";

export interface BrowserScrapeOptions {
  disableSandbox: boolean;
  headless: boolean;
  executablePath: string | undefined;
}

let pluginsConfigured = false;

function setupPlugins(): void {
  if (pluginsConfigured) return;

  const ps = pluginStealth();
  ps.enabledEvasions.delete("user-agent-override");
  puppeteer.use(ps);
  puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

  pluginsConfigured = true;
}

function getLaunchOptions(
  options: BrowserScrapeOptions
): NonNullable<Parameters<typeof puppeteer.launch>[0]> {
  const args = ["--disable-dev-shm-usage", "--disable-gpu"];
  if (options.disableSandbox) {
    args.push("--no-sandbox", "--disable-setuid-sandbox");
  }

  const baseOptions = {
    headless: options.headless,
    args,
  };

  if (!options.executablePath) {
    return baseOptions;
  }

  return {
    ...baseOptions,
    executablePath: options.executablePath,
  };
}

async function extractShotsInBrowser(page: Page): Promise<RawShot[]> {
  return page.$$eval(".shot-thumbnail", (nodes) => {
    const readText = (el: Element | null): string => (el ? (el.textContent || "").trim() : "");
    const attr = (el: Element | null, name: string): string | null => (el ? el.getAttribute(name) : null);

    return nodes.map((node) => {
      const imgEl = node.querySelector("figure img");
      const rawImg =
        attr(imgEl, "src") || attr(imgEl, "data-src") || attr(imgEl, "srcset") || "";
      const firstPart = rawImg.split("&")[0] ?? "";
      const imgCandidate = firstPart.split(" ")[0] ?? "";
      const img = imgCandidate.length > 0 ? imgCandidate : null;
      const link = node.querySelector(".dribbble-link") as HTMLAnchorElement | null;
      const userUrl = node.querySelector(".user-information .url") as HTMLAnchorElement | null;
      const videoEl = node.querySelector(".video");

      return {
        id: node.getAttribute("data-thumbnail-id") ?? null,
        img,
        video: videoEl?.getAttribute("data-video-teaser-large") || null,
        url: link?.href || null,
        likes: readText(
          node.querySelector("[data-shot-like-count]") ||
            node.querySelector(".js-shot-likes-count")
        ),
        comments: readText(node.querySelector(".js-shot-comments-count")),
        viewsString: readText(node.querySelector(".js-shot-views-count")),
        title: readText(node.querySelector(".shot-title")),
        author: {
          name: readText(node.querySelector(".user-information .display-name")),
          url: userUrl?.href || "",
        },
      };
    });
  });
}

async function launchBrowser(
  launchOptions: NonNullable<Parameters<typeof puppeteer.launch>[0]>
): Promise<Browser> {
  try {
    return await puppeteer.launch(launchOptions);
  } catch (primaryError) {
    if (launchOptions.executablePath) throw primaryError;

    try {
      return await puppeteer.launch({
        ...launchOptions,
        channel: "chrome",
      });
    } catch (fallbackError) {
      const primaryMessage = primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `${primaryMessage} | Fallback Chrome launch failed: ${fallbackMessage}`
      );
    }
  }
}

export async function getTopFromBrowser(options: BrowserScrapeOptions): Promise<Shot[]> {
  setupPlugins();

  const launchOptions = getLaunchOptions(options);
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("https://dribbble.com/shots", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await Bun.sleep(800);

    const rawShots = await extractShotsInBrowser(page);
    return rawShots.map(normalizeShot).filter((shot): shot is Shot => shot !== null);
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}
