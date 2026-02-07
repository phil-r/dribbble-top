import { load } from "cheerio";
import type { RawShot, Shot } from "../types";
import { normalizeShot } from "./normalize";

async function extractShotsFromHtml(): Promise<RawShot[]> {
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
  const shots: RawShot[] = [];

  $(".shot-thumbnail").each((_, shotElement) => {
    const shot = $(shotElement);
    const img =
      shot.find("figure img").attr("src") ||
      shot.find("figure img").attr("data-src") ||
      shot.find("figure img").attr("srcset")?.split(" ")[0] ||
      null;

    shots.push({
      id: shot.attr("data-thumbnail-id") ?? null,
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

export async function getTopFromHttpFallback(): Promise<Shot[]> {
  const rawShots = await extractShotsFromHtml();
  return rawShots.map(normalizeShot).filter((shot): shot is Shot => shot !== null);
}
