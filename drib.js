import puppeteer from "puppeteer-extra";
import pluginStealth from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { load } from "cheerio";

const ps = pluginStealth();
// Avoid plugin behavior that is known to conflict with some Chromium builds.
ps.enabledEvasions.delete("user-agent-override");
puppeteer.use(ps);
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

function parseCount(value) {
  if (!value) return 0;
  const parsed = parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIdFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(/\/shots\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function toAbsoluteUrl(url) {
  if (!url) return null;
  try {
    return new URL(url, "https://dribbble.com").href;
  } catch {
    return null;
  }
}

export function normalizeShot(rawShot) {
  if (!rawShot || typeof rawShot !== "object") return null;

  const id = parseCount(rawShot.id) || parseIdFromUrl(rawShot.url);
  const img = rawShot.img || null;
  const url = toAbsoluteUrl(rawShot.url);

  if (!id || !img || !url) return null;

  return {
    id,
    img,
    video: rawShot.video || null,
    url,
    likes: parseCount(rawShot.likes),
    comments: parseCount(rawShot.comments),
    viewsString: rawShot.viewsString || "0",
    title: rawShot.title || "",
    author: {
      name: rawShot.author?.name || "",
      url: toAbsoluteUrl(rawShot.author?.url) || "",
    },
  };
}

function getLaunchOptions() {
  const args = ["--disable-dev-shm-usage", "--disable-gpu"];
  const disableSandbox =
    process.env.PUPPETEER_DISABLE_SANDBOX === "1" || process.platform === "linux";
  if (disableSandbox) {
    args.push("--no-sandbox", "--disable-setuid-sandbox");
  }

  return {
    headless: process.env.PUPPETEER_HEADLESS === "false" ? false : true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args,
  };
}

async function extractShotsInBrowser(page) {
  return page.$$eval(".shot-thumbnail", (nodes) => {
    const readText = (el) => (el ? (el.textContent || "").trim() : "");
    const attr = (el, name) => (el ? el.getAttribute(name) : null);

    return nodes.map((node) => {
      const imgEl = node.querySelector("figure img");
      const rawImg =
        attr(imgEl, "src") || attr(imgEl, "data-src") || attr(imgEl, "srcset") || "";
      const img = rawImg ? rawImg.split("&")[0].split(" ")[0] : null;
      const link = node.querySelector(".dribbble-link");
      const userUrl = node.querySelector(".user-information .url");

      return {
        id: node.getAttribute("data-thumbnail-id"),
        img,
        video: node.querySelector(".video")?.dataset?.videoTeaserLarge || null,
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

async function extractShotsFromHtml() {
  const response = await fetch("https://dribbble.com/shots", {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Dribbble responded with status ${response.status}`);
  }

  const html = await response.text();
  const $ = load(html);
  const shots = [];

  $(".shot-thumbnail").each((_, shotEl) => {
    const shot = $(shotEl);
    const img =
      shot.find("figure img").attr("src") ||
      shot.find("figure img").attr("data-src") ||
      shot.find("figure img").attr("srcset")?.split(" ")[0] ||
      null;

    shots.push({
      id: shot.attr("data-thumbnail-id"),
      img: img ? img.split("&")[0] : null,
      video: shot.find(".video").attr("data-video-teaser-large") || null,
      url: shot.find(".dribbble-link").attr("href") || null,
      likes:
        shot.find("[data-shot-like-count]").first().text().trim() ||
        shot.find(".js-shot-likes-count").first().text().trim(),
      comments: shot.find(".js-shot-comments-count").text().trim(),
      viewsString: shot.find(".js-shot-views-count").text().trim(),
      title: shot.find(".shot-title").text().trim(),
      author: {
        name: shot.find(".user-information .display-name").text().trim(),
        url: shot.find(".user-information .url").attr("href") || "",
      },
    });
  });

  return shots;
}

async function launchBrowser() {
  const launchOptions = getLaunchOptions();
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
      throw new Error(
        `${primaryError.message} | Fallback Chrome launch failed: ${fallbackError.message}`
      );
    }
  }
}

async function getTopFromBrowser() {
  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto("https://dribbble.com/shots", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Dribbble lazily loads thumbnails once they enter the viewport.
    await page.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
    await new Promise((resolve) => setTimeout(resolve, 800));

    const rawShots = await extractShotsInBrowser(page);
    return rawShots.map(normalizeShot).filter(Boolean);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

async function getTopFromHttpFallback() {
  const rawShots = await extractShotsFromHtml();
  return rawShots.map(normalizeShot).filter(Boolean);
}

export async function getTop() {
  try {
    const browserShots = await getTopFromBrowser();
    if (browserShots.length > 0) return browserShots;
  } catch (browserError) {
    try {
      const fallbackShots = await getTopFromHttpFallback();
      if (fallbackShots.length > 0) return fallbackShots;
    } catch (fallbackError) {
      throw new Error(
        `Failed to scrape Dribbble shots. Browser error: ${browserError.message}. HTTP fallback error: ${fallbackError.message}`
      );
    }
  }

  throw new Error("Failed to scrape Dribbble shots: no shots found");
}
